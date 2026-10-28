import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import {
  AlertCircle,
  Bot,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  History,
  MessageCircle,
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

const SUGGESTIONS = [
  "My car won't start — what will you check?",
  "What is the starting price for domestic work?",
  "Is towing included with repairs or separate?",
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
  const [showCorrectionMenu, setShowCorrectionMenu] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const transport = useMemo(() => new DefaultChatTransport({ api: "/api/chat" }), []);
  const { messages, sendMessage, status, setMessages } = useChat({
    transport,
    onError: (error) =>
      toast.error("The assistant is unavailable right now", { description: error.message }),
  });

  const busy = status === "submitted" || status === "streaming";

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!busy) inputRef.current?.focus();
  }, [busy]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, status]);

  const send = (text: string) => {
    const value = text.trim();
    if (!value || busy) return;
    setInput("");
    setShowCorrectionMenu(false);
    void sendMessage({ text: value });
  };

  // Roll back the latest assistant + user turn
  const handleRollback = () => {
    if (messages.length === 0 || busy) return;
    const lastUserIdx = [...messages].reverse().findIndex((m) => m.role === "user");
    if (lastUserIdx === -1) {
      setMessages([]);
    } else {
      const cutIdx = messages.length - 1 - lastUserIdx;
      setMessages(messages.slice(0, cutIdx));
    }
    toast.info("Previous turn undone. Ready for updated query.");
  };

  // Self-correct the last response against the live update ledger
  const handleSelfCorrectLast = () => {
    if (messages.length === 0 || busy) return;
    const prompt =
      "Emergent Self-Check: Please review your previous answer against the DUAA October 2026 updates (Domestic $400 base, Commercial $1,200 min, $110 booking fee, Towing sold separately). If there were any mistakes or outdated pricing, state the correction explicitly and provide the updated facts.";
    send(prompt);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close assistant" : "Chat with Dee"}
        className="fixed bottom-5 right-5 z-50 grid h-14 w-14 place-items-center rounded-full bg-primary text-primary-foreground shadow-xl transition hover:scale-105 hover:opacity-95"
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>

      {open && (
        <div className="fixed bottom-24 right-4 z-50 flex h-[76vh] max-h-[640px] w-[calc(100vw-2rem)] max-w-md flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl backdrop-blur-md">
          {/* Header */}
          <div className="border-b border-border bg-card/90 px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary/15 text-primary">
                  <Bot className="h-5 w-5" />
                </span>
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-semibold leading-tight">Dee · Emergent AI</p>
                    <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                      Live Sync
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">Self-correcting business assistant</p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {messages.length > 0 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={handleRollback}
                    disabled={busy}
                    title="Undo last message / rollback"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  >
                    <Undo2 className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowLedger((prev) => !prev)}
                  title="Toggle live update policy ledger"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                >
                  <Sparkles className="h-4 w-4 text-amber-500" />
                </Button>
              </div>
            </div>

            {/* Expandable Live Policy Ledger */}
            {showLedger && (
              <div className="mt-3 rounded-xl border border-border/70 bg-secondary/60 p-2.5 text-xs">
                <div className="flex items-center justify-between font-medium text-foreground">
                  <span className="flex items-center gap-1.5 text-primary">
                    <ShieldAlert className="h-3.5 w-3.5" />
                    Active Business Policy Ledger
                  </span>
                  <span className="text-[10px] text-muted-foreground">v2.4 Oct 2026</span>
                </div>
                <div className="mt-2 space-y-1 text-[11px] text-muted-foreground">
                  <p>• <strong className="text-foreground">Domestic:</strong> Base from TTD 400</p>
                  <p>• <strong className="text-foreground">Commercial:</strong> Min TTD 1,200 (1–2 crew)</p>
                  <p>• <strong className="text-foreground">Appointment Fee:</strong> TTD 110 (mandatory)</p>
                  <p>• <strong className="text-foreground">Towing:</strong> Sold separately (flatbed $450+, haul $750+)</p>
                  <p>• <strong className="text-foreground">Combos & Perks:</strong> Suggestive packages & perks active</p>
                </div>
              </div>
            )}
          </div>

          {/* Messages Body */}
          <div ref={scrollRef} className="flex-1 space-y-3.5 overflow-y-auto px-4 py-4 text-sm">
            {messages.length === 0 && (
              <div className="space-y-4">
                <div className="rounded-xl border border-border/60 bg-secondary/30 p-3.5 text-xs text-muted-foreground">
                  <p className="font-medium text-foreground">Greetings from Dee at DUAA</p>
                  <p className="mt-1 leading-relaxed">
                    I am trained on our full technical scope and active policies. If I ever state an outdated rate or mistake from recent updates, click <strong>"Verify & Correct"</strong> to trigger an instant self-correction.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                    Quick inquiries
                  </p>
                  <div className="flex flex-col gap-1.5">
                    {SUGGESTIONS.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => send(s)}
                        className="rounded-lg border border-border bg-card/60 px-3 py-2 text-left text-xs text-muted-foreground transition hover:border-primary/50 hover:bg-secondary hover:text-foreground"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {messages.map((message, i) => {
              const text = message.parts
                .map((part) => (part.type === "text" ? part.text : ""))
                .join("");
              if (!text) return null;

              const isUser = message.role === "user";
              const isCorrectionPrompt =
                text.includes("Emergent Self-Check") || text.includes("Correction:");

              return (
                <div key={message.id || i} className="group relative space-y-1">
                  {isCorrectionPrompt && isUser && (
                    <div className="flex items-center gap-1 text-[10px] text-amber-500">
                      <AlertCircle className="h-3 w-3" />
                      <span>Correction Triggered</span>
                    </div>
                  )}

                  <div
                    className={cn(
                      "max-w-[88%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed sm:text-sm",
                      isUser
                        ? "ml-auto bg-primary text-primary-foreground"
                        : "bg-secondary text-foreground",
                    )}
                  >
                    {text}
                  </div>

                  {/* Emergent Action Bar on Assistant Messages */}
                  {!isUser && i === messages.length - 1 && !busy && (
                    <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-muted-foreground">
                      <button
                        type="button"
                        onClick={handleSelfCorrectLast}
                        className="inline-flex items-center gap-1 rounded-md border border-border/80 bg-background/80 px-2 py-0.5 hover:border-amber-500/50 hover:text-amber-500 transition"
                      >
                        <RefreshCw className="h-3 w-3" />
                        Verify & Correct
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowCorrectionMenu((v) => !v)}
                        className="inline-flex items-center gap-1 rounded-md border border-border/80 bg-background/80 px-2 py-0.5 hover:border-primary/50 hover:text-primary transition"
                      >
                        Flag Mistake
                        {showCorrectionMenu ? (
                          <ChevronUp className="h-3 w-3" />
                        ) : (
                          <ChevronDown className="h-3 w-3" />
                        )}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Quick Correction Options Menu */}
            {showCorrectionMenu && (
              <div className="rounded-xl border border-amber-500/40 bg-amber-500/5 p-3 space-y-2">
                <p className="text-[11px] font-medium text-amber-600 dark:text-amber-400">
                  Select a correction to apply immediately:
                </p>
                <div className="flex flex-col gap-1.5">
                  {CORRECTION_TEMPLATES.map((tmpl) => (
                    <button
                      key={tmpl}
                      type="button"
                      onClick={() => send(tmpl)}
                      className="text-left rounded-lg border border-border bg-card/80 px-2.5 py-1.5 text-xs text-foreground hover:border-primary transition"
                    >
                      {tmpl}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Thinking / Streaming Indicator */}
            {busy && (
              <div className="flex items-center gap-2 rounded-2xl bg-secondary px-3.5 py-2.5 text-xs text-muted-foreground w-fit">
                <span className="flex gap-1">
                  {[0, 150, 300].map((delay) => (
                    <span
                      key={delay}
                      className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary"
                      style={{ animationDelay: `${delay}ms` }}
                    />
                  ))}
                </span>
                <span>Self-checking live updates...</span>
              </div>
            )}
          </div>

          {/* Input Footer */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="flex items-center gap-2 border-t border-border bg-card px-3 py-2.5"
          >
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question or state a correction..."
              className="h-9 text-xs sm:text-sm"
            />
            <Button
              type="submit"
              size="icon"
              disabled={busy || !input.trim()}
              className="h-9 w-9 shrink-0"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      )}
    </>
  );
}
