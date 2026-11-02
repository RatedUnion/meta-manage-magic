import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import {
  ArrowLeft,
  Bot,
  CheckCircle2,
  FileText,
  MessageSquare,
  Mic,
  MicOff,
  Phone,
  PhoneCall,
  PhoneForwarded,
  PhoneIncoming,
  PhoneOff,
  Radio,
  Send,
  Volume2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  initiateVoiceCall,
  sendSmsNotification,
  type CallRecord,
  type SmsMessage,
} from "@/lib/voice-sms.functions";

export const Route = createFileRoute("/_authenticated/voice-sms")({
  component: VoiceSmsPage,
  head: () => ({ meta: [{ title: "VoIP & SMS AI Engine — DUAA" }] }),
});

function VoiceSmsPage() {
  const triggerCall = useServerFn(initiateVoiceCall);
  const triggerSms = useServerFn(sendSmsNotification);

  // Softphone state
  const [dialNumber, setDialNumber] = useState("+1 868-");
  const [activeCall, setActiveCall] = useState<CallRecord | null>(null);
  const [isCalling, setIsCalling] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // SMS state
  const [smsPhone, setSmsPhone] = useState("+1 868-");
  const [smsText, setSmsText] = useState("");
  const [selectedCall, setSelectedCall] = useState<CallRecord | null>(null);

  // Call Logs & Messages state
  const [calls, setCalls] = useState<CallRecord[]>([
    {
      id: "call-1",
      contactName: "Marcus Hernandez",
      phoneNumber: "+1 868-682-4192",
      direction: "inbound",
      durationSeconds: 142,
      status: "completed",
      timestamp: "Today at 10:14 AM",
      sentiment: "positive",
      summary: "Customer confirmed domestic alternator replacement. Quoted base TTD $400 + $110 fee.",
      transcript: [
        { speaker: "Customer", text: "Good morning, my battery isn't holding charge in San Fernando." },
        { speaker: "Agent", text: "Good morning! Dee from DUAA here. Domestic mobile diagnostics start from TTD $400 plus our standard $110 appointment fee." },
        { speaker: "Customer", text: "Understood. Can we book for tomorrow afternoon?" },
        { speaker: "Agent", text: "Certainly. Booking confirmed for 1:30 PM tomorrow." },
      ],
    },
    {
      id: "call-2",
      contactName: "Point Lisas Industrial Supplies",
      phoneNumber: "+1 868-744-8831",
      direction: "outbound",
      durationSeconds: 215,
      status: "completed",
      timestamp: "Yesterday at 3:45 PM",
      sentiment: "urgent",
      summary: "Commercial backup generator transfer switch quarterly inspection reminder.",
      transcript: [
        { speaker: "Agent", text: "Calling from DUAA regarding your facility emergency transfer switch inspection." },
        { speaker: "Customer", text: "Yes, we need a 2-man crew on site before rainy season peak." },
        { speaker: "Agent", text: "Confirmed. Commercial rates start at minimal TTD $1,200 with 2 technicians included." },
      ],
    },
  ]);

  const [smsList, setSmsList] = useState<SmsMessage[]>([
    {
      id: "sms-1",
      recipientPhone: "+1 868-763-1106",
      recipientName: "Field Unit Alpha",
      messageText: "Dispatched to Couva: Domestic brake check & OBD-II scan. Ref DUA-84192.",
      status: "delivered",
      timestamp: "Today at 09:30 AM",
      campaignTag: "Dispatch",
    },
  ]);

  const handleMakeCall = async () => {
    if (!dialNumber || dialNumber.length < 8) {
      toast.error("Please enter a valid Trinidad & Tobago phone number (+1 868-XXXXXXX)");
      return;
    }

    setIsCalling(true);
    try {
      const res = await triggerCall({
        data: {
          phoneNumber: dialNumber,
          contactName: "Direct Customer Outreach",
          campaignContext: "Live Dashboard Softphone",
        },
      });

      if (res?.call) {
        setActiveCall(res.call);
        setCalls((prev) => [res.call, ...prev]);
        toast.success(`Connected live call to ${dialNumber}`);
      }
    } catch (e) {
      toast.error("VoIP gateway dial failed: " + (e instanceof Error ? e.message : "Network error"));
    } finally {
      setIsCalling(false);
    }
  };

  const handleHangUp = () => {
    setActiveCall(null);
    toast.info("Call ended. Audio transcript saved.");
  };

  const handleSendSms = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!smsPhone || !smsText.trim()) {
      toast.error("Phone number and message text are required");
      return;
    }

    try {
      const res = await triggerSms({
        data: {
          recipientPhone: smsPhone,
          messageText: smsText.trim(),
          campaignTag: "Direct SMS",
        },
      });

      if (res?.sms) {
        setSmsList((prev) => [res.sms, ...prev]);
        setSmsText("");
        toast.success(`SMS dispatched to ${smsPhone}`);
      }
    } catch (e) {
      toast.error("SMS dispatch failed: " + (e instanceof Error ? e.message : "Error"));
    }
  };

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-6xl px-4 py-8">
        {/* Navigation & Header */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Link
                to="/bookings"
                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to Bookings
              </Link>
            </div>
            <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
              VoIP & SMS AI Engine
            </h1>
            <p className="text-xs text-muted-foreground sm:text-sm">
              Inbound & outbound live call interface, AI receptionist transcripts, and SMS dispatch.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
              <Radio className="h-3.5 w-3.5 animate-pulse" />
              Dee Voice: Live on +1 868-763-1106
            </span>
          </div>
        </div>

        {/* Active Call Banner */}
        {activeCall && (
          <div className="mb-6 flex items-center justify-between rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-emerald-500 text-white animate-pulse">
                <PhoneCall className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                  Live Call in Progress: {activeCall.phoneNumber}
                </p>
                <p className="text-xs text-muted-foreground">
                  AI Realtime Audio Stream Active · WebRTC Low Latency (Deepgram + GPT-4o)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsMuted((v) => !v)}
                className="gap-1.5 text-xs"
              >
                {isMuted ? <MicOff className="h-3.5 w-3.5 text-destructive" /> : <Mic className="h-3.5 w-3.5" />}
                {isMuted ? "Unmute" : "Mute"}
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleHangUp}
                className="gap-1.5 text-xs"
              >
                <PhoneOff className="h-3.5 w-3.5" />
                Hang Up
              </Button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left Column: Softphone Dialer */}
          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <Phone className="h-4 w-4 text-primary" />
                Softphone Dialer
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Phone Number</label>
                <Input
                  value={dialNumber}
                  onChange={(e) => setDialNumber(e.target.value)}
                  placeholder="+1 868-XXX-XXXX"
                  className="mt-1 font-mono text-sm"
                />
              </div>

              {/* Keypad Buttons */}
              <div className="grid grid-cols-3 gap-2">
                {["1", "2", "3", "4", "5", "6", "7", "8", "9", "*", "0", "#"].map((key) => (
                  <Button
                    key={key}
                    type="button"
                    variant="outline"
                    onClick={() => setDialNumber((prev) => prev + key)}
                    className="h-10 text-sm font-semibold"
                  >
                    {key}
                  </Button>
                ))}
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  onClick={handleMakeCall}
                  disabled={isCalling || !!activeCall}
                  className="flex-1 gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <PhoneCall className="h-4 w-4" />
                  {isCalling ? "Dialing..." : "Start AI Call"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setDialNumber("+1 868-")}
                  className="text-xs"
                >
                  Clear
                </Button>
              </div>

              <div className="rounded-lg border border-border/80 bg-secondary/30 p-2.5 text-xs text-muted-foreground">
                <p className="font-medium text-foreground">AI Voice Receptionist Protocol:</p>
                <p className="mt-1 text-[11px]">
                  Outbound calls announce DUAA, confirm client location, and quote domestic base $400 or commercial min $1,200 plus mandatory $110 fee.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Right Columns: Call History & Transcripts */}
          <div className="space-y-6 lg:col-span-2">
            <Card className="border-border">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-base font-semibold">
                  <span className="flex items-center gap-2">
                    <Volume2 className="h-4 w-4 text-primary" />
                    Live Call Logs & Transcripts
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {calls.length} Recorded Calls
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  {calls.map((c) => (
                    <div
                      key={c.id}
                      onClick={() => setSelectedCall(c)}
                      className={`cursor-pointer rounded-xl border p-3.5 transition ${
                        selectedCall?.id === c.id
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-border/80 hover:bg-secondary/40"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {c.direction === "inbound" ? (
                            <PhoneIncoming className="h-4 w-4 text-emerald-500" />
                          ) : (
                            <PhoneForwarded className="h-4 w-4 text-blue-500" />
                          )}
                          <span className="text-sm font-semibold">{c.contactName}</span>
                          <span className="font-mono text-xs text-muted-foreground">{c.phoneNumber}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">{c.durationSeconds}s</span>
                          <Badge variant="secondary" className="capitalize text-[10px]">
                            {c.sentiment}
                          </Badge>
                        </div>
                      </div>

                      <p className="mt-1.5 text-xs text-muted-foreground line-clamp-1">{c.summary}</p>
                    </div>
                  ))}
                </div>

                {/* Selected Transcript Drawer */}
                {selectedCall && (
                  <div className="mt-4 rounded-xl border border-border bg-card p-4 space-y-3">
                    <div className="flex items-center justify-between border-b border-border pb-2">
                      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Transcript Inspection: {selectedCall.contactName}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedCall(null)}
                        className="h-6 text-xs text-muted-foreground"
                      >
                        Close
                      </Button>
                    </div>

                    <div className="space-y-2 max-h-52 overflow-y-auto pr-1 text-xs">
                      {selectedCall.transcript.map((line, idx) => (
                        <div
                          key={idx}
                          className={`rounded-lg p-2 ${
                            line.speaker === "Agent"
                              ? "bg-primary/10 text-primary-foreground/90 ml-4 border border-primary/20"
                              : "bg-secondary text-foreground mr-4 border border-border"
                          }`}
                        >
                          <strong className="block text-[10px] text-muted-foreground mb-0.5">
                            {line.speaker === "Agent" ? "Dee (AI Voice Agent)" : "Customer"}
                          </strong>
                          {line.text}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* SMS Dispatch Section */}
            <Card className="border-border">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                  <MessageSquare className="h-4 w-4 text-primary" />
                  SMS Campaign & Notification Dispatcher
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <form onSubmit={handleSendSms} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Recipient Number</label>
                      <Input
                        value={smsPhone}
                        onChange={(e) => setSmsPhone(e.target.value)}
                        placeholder="+1 868-XXX-XXXX"
                        className="mt-1 font-mono text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Quick Template</label>
                      <select
                        onChange={(e) => setSmsText(e.target.value)}
                        className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-xs"
                      >
                        <option value="">Select a template...</option>
                        <option value="DUAA Booking Confirmation: Technician dispatched. Diagnostic base TTD $400 + $110 fee. Ref DUA-CONF">
                          Booking Confirmation & Pricing
                        </option>
                        <option value="🌧️ T&T Wet Season Alert: Commercial generator & transfer switch safety inspection booking available. Min TTD $1,200.">
                          Rainy Season Commercial Campaign
                        </option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Message Body</label>
                    <textarea
                      value={smsText}
                      onChange={(e) => setSmsText(e.target.value)}
                      rows={2}
                      placeholder="Type SMS notification or promotional blast..."
                      className="mt-1 w-full rounded-md border border-input bg-background p-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                  </div>

                  <Button type="submit" size="sm" className="gap-2">
                    <Send className="h-3.5 w-3.5" />
                    Send Live SMS
                  </Button>
                </form>

                {/* SMS Dispatched Feed */}
                <div className="space-y-1.5 pt-2 border-t border-border">
                  <span className="text-[11px] font-medium text-muted-foreground">Recent SMS Dispatches:</span>
                  {smsList.map((m) => (
                    <div
                      key={m.id}
                      className="flex items-center justify-between rounded-lg border border-border/70 bg-secondary/20 p-2 text-xs"
                    >
                      <div>
                        <span className="font-mono text-[11px] text-primary">{m.recipientPhone}</span>
                        <p className="text-[11px] text-muted-foreground">{m.messageText}</p>
                      </div>
                      <Badge variant="outline" className="text-[10px] text-emerald-600">
                        {m.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}
