import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import {
  AlertCircle,
  Bot,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  FileText,
  History,
  MessageCircle,
  Paperclip,
  RefreshCw,
  Send,
  ShieldAlert,
  Sparkles,
  Undo2,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "@tanstack/react-router";

const KIMI_SUGGESTIONS = [
  "Calculate my booking estimate with the $110 fee",
  "Which combo package saves money on repairs & towing?",
  "What mechanical diagnostics do you cover on-site?",
];

const CORRECTION_TEMPLATES = [
  "Verify this quote against our latest October 2026 updates.",
  "Correction: Domestic starts at $400, not $250. Please revise.",
  "Note: Transport & Towing is sold separately. Re-calculate.",
  "Include the non-negotiable $110 appointment fee in this estimate.",
];

export function ChatBot() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [showLedger, setShowLedger] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [userSession, setUserSession] = useState<unknown>(null);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setUserSession(data.session));
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserSession(session);
    });
    return () => authListener.subscription.unsubscribe();
  }, []);

  const transport = useMemo(
    () => new DefaultChatTransport({ api: "/api/chat" }),
    [],
  );

  const { messages, sendMessage, status, setMessages, error } = useChat({
    transport,
    onError: (err) => {
      toast.error(err.message || "Kimi AI is currently unavailable.");
    },
  });

  const isLoading = status === "streaming" || status === "submitted";

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (textToSend?: string) => {
    const query = (textToSend ?? input).trim();
    if (!query && !attachedFile) return;

    if (!userSession) {
      toast.info("Please sign in to chat with Kimi AI.");
      return;
    }

    let fullPrompt = query;
    if (attachedFile) {
      fullPrompt = `[Attached Document/Photo: ${attachedFile.name} (${Math.round(attachedFile.size / 1024)} KB)]\n${query || "Please analyze this file for my booking inquiry."}`;
      setAttachedFile(null);
    }

    setInput("");
    await sendMessage({ text: fullPrompt });
  };

  const handleApplyCorrection = (correctionText: string) => {
    void handleSend(correctionText);
  };

  const handleRollback = () => {
    if (messages.length >= 2) {
      setMessages(messages.slice(0, -2));
      toast.success("Previous turn rolled back.");
    }
  };

  const handleVerifyLedger = async () => {
    if (!messages.length) {
      toast.info("Start a chat first before running an audit.");
      return;
    }
    setIsVerifying(true);
    await handleSend("Please perform an internal audit: verify your previous reply against the latest DUAA October 2026 Pricing Ledger ($400 domestic base, $1,200 commercial, $110 fee, towing sold separately) and report any self-corrections.");
    setIsVerifying(false);
  };

  return (
    <>
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2 print:hidden">
        {!open && (
          <div className="hidden sm:flex items-center gap-1.5 rounded-full border border-primary/20 bg-background/95 px-3 py-1 shadow-md text-xs font-medium text-foreground backdrop-blur">
            <Sparkles className="h-3.5 w-3.5 text-primary animate-pulse" />
            <span>Kimi AI UI · Booking & Dispatch</span>
          </div>
        )}

        <Button
          onClick={() => setOpen(!open)}
          size="lg"
          className="h-14 w-14 rounded-full shadow-2xl p-0 relative bg-primary hover:bg-primary/90 text-primary-foreground"
          aria-label={open ? "Close Kimi assistant" : "Chat with Kimi AI"}
        >
          {open ? <X className="h-6 w-6" /> : <Bot className="h-7 w-7" />}
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-background"></span>
          </span>
        </Button>
      </div>

      {open && (
        <div className="fixed bottom-24 right-4 z-50 w-[95vw] sm:w-[440px] max-h-[82vh] h-[640px] flex flex-col rounded-2xl border bg-background shadow-2xl overflow-hidden print:hidden animate-in slide-in-from-bottom-5">
          {/* Header */}
          <div className="flex items-center justify-between border-b bg-muted/40 px-4 py-3">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-semibold leading-tight">Kimi AI UI</p>
                <p className="text-[11px] text-muted-foreground">DUAA Booking & Operational Engine</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                onClick={() => setShowLedger(!showLedger)}
                title="View Live Pricing Ledger"
              >
                <History className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Pricing Ledger Banner */}
          {showLedger && (
            <div className="border-b bg-muted/70 p-3 text-xs space-y-1.5 animate-in slide-in-from-top-2">
              <div className="flex items-center justify-between font-semibold text-foreground">
                <span className="flex items-center gap-1">
                  <ShieldAlert className="h-3.5 w-3.5 text-amber-500" />
                  Live Policy & Rates Ledger
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 px-2 text-[10px]"
                  onClick={() => setShowLedger(false)}
                >
                  Hide
                </Button>
              </div>
              <p className="text-muted-foreground">
                • Domestic base: <strong>TTD $400</strong> · Commercial min: <strong>TTD $1,200</strong>
              </p>
              <p className="text-muted-foreground">
                • Appointment fee: <strong>$110 non-negotiable</strong>
              </p>
              <p className="text-muted-foreground">
                • Transport & Towing: <strong>Sold separately</strong> (Wrecker from $450)
              </p>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 text-sm">
            {messages.length === 0 ? (
              <div className="space-y-4 py-4">
                <div className="rounded-xl border border-primary/10 bg-primary/5 p-4">
                  <p className="font-medium text-foreground flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4 text-primary" />
                    Kimi AI Booking Specialist
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                    Hello! I can review your mechanical or electrical fault, structure your Build Sheet estimate, and verify appointment scheduling.
                  </p>
                  <div className="mt-3 flex gap-2">
                    <Button asChild size="sm" variant="outline" className="h-7 text-xs">
                      <Link to="/book">Open Booking Sheet</Link>
                    </Button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-muted-foreground">Quick Booking Prompts:</p>
                  <div className="flex flex-col gap-1.5">
                    {KIMI_SUGGESTIONS.map((suggestion) => (
                      <button
                        key={suggestion}
                        onClick={() => void handleSend(suggestion)}
                        className="rounded-lg border bg-card px-3 py-2 text-left text-xs text-foreground transition-colors hover:bg-muted"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              messages.map((m) => (
                <div
                  key={m.id}
                  className={cn(
                    "flex flex-col max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm leading-relaxed",
                    m.role === "user"
                      ? "ml-auto bg-primary text-primary-foreground rounded-br-none"
                      : "mr-auto bg-muted/80 text-foreground rounded-bl-none border"
                  )}
                >
                  <p className="whitespace-pre-wrap">{m.parts
                      .map((p) => (p.type === "text" ? p.text : ""))
                      .join("")}</p>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input & Controls */}
          <div className="border-t bg-background p-3 space-y-2">
            {attachedFile && (
              <div className="flex items-center justify-between rounded-lg bg-muted px-2.5 py-1 text-xs">
                <span className="truncate max-w-[280px]">📎 {attachedFile.name}</span>
                <button
                  type="button"
                  onClick={() => setAttachedFile(null)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            <div className="flex items-center gap-1.5">
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*,.pdf,.doc,.docx"
                onChange={(e) => {
                  if (e.target.files?.[0]) setAttachedFile(e.target.files[0]);
                }}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-9 w-9 shrink-0 text-muted-foreground"
                onClick={() => fileInputRef.current?.click()}
                title="Attach photo or fault document"
              >
                <Paperclip className="h-4 w-4" />
              </Button>
              <Input
                placeholder="Ask Kimi about bookings, scope, or pricing..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void handleSend();
                  }
                }}
                className="h-9 text-xs sm:text-sm"
              />
              <Button
                onClick={() => void handleSend()}
                disabled={isLoading || (!input.trim() && !attachedFile)}
                size="icon"
                className="h-9 w-9 shrink-0"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
