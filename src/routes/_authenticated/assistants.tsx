import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Bot,
  CheckCircle2,
  Play,
  Terminal,
  FileSearch,
  Plus,
  ShieldAlert,
  AlertTriangle,
  Clock,
  DollarSign,
  Building2,
  Trash2,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  ASSISTANT_ROSTER,
  runAssistantTask,
  evaluateTenderOpportunity,
  DEFAULT_SCOUTED_TENDERS,
  type AssistantBot,
  type TenderOpportunity,
} from "@/lib/assistants.functions";
import { useViewMode } from "@/lib/view-mode";
import { NexusCommanderPanel } from "@/components/NexusCommanderPanel";

export const Route = createFileRoute("/_authenticated/assistants")({
  component: AssistantsPage,
  head: () => ({ meta: [{ title: "AI Assistant Workbench & Tender Scouts — DUAA" }, { name: "robots", content: "noindex" }] }),
});

type AssistantResult = {
  success: boolean;
  bot: string;
  role: string;
  timestamp: string;
  summary: string;
  recommendations: string[];
};

const TENDERS_STORAGE_KEY = "duaa_scouted_tenders_v1";

function AssistantsPage() {
  const executeBot = useServerFn(runAssistantTask);
  const { viewOnly } = useViewMode();
  const [selectedBot, setSelectedBot] = useState<AssistantBot>(ASSISTANT_ROSTER[1]); // Default to GearMaster Dee
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AssistantResult | null>(null);

  // Scouted Opportunities State with LocalStorage Persistence
  const [tenders, setTenders] = useState<TenderOpportunity[]>(() => {
    if (typeof window === "undefined") return DEFAULT_SCOUTED_TENDERS;
    try {
      const stored = localStorage.getItem(TENDERS_STORAGE_KEY);
      return stored ? JSON.parse(stored) : DEFAULT_SCOUTED_TENDERS;
    } catch {
      return DEFAULT_SCOUTED_TENDERS;
    }
  });

  const [isTenderModalOpen, setIsTenderModalOpen] = useState(false);
  const [tenderForm, setTenderForm] = useState({
    title: "",
    issuingAgency: "T&TEC Public Tenders",
    portalSource: "Office of Procurement Regulation (OPR)",
    scoutedByBotId: "volt",
    deadline: "",
    estimatedValueTTD: "",
    scopeSummary: "",
  });

  useEffect(() => {
    try {
      localStorage.setItem(TENDERS_STORAGE_KEY, JSON.stringify(tenders));
    } catch {
      // Ignore storage errors in restricted contexts
    }
  }, [tenders]);

  const handleRunTask = async () => {
    const task = prompt.trim();
    if (viewOnly) return toast.info("Exit affiliate preview to run an assistant task.");
    if (task.length < 2) return toast.error("Enter a task or question first.");
    setIsLoading(true);
    try {
      const response = await executeBot({ data: { botId: selectedBot.id, prompt: task } });
      setResult(response as AssistantResult);
      toast.success(`${selectedBot.name} returned an operational assessment`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Assistant task failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenTenderModal = (bot?: AssistantBot) => {
    const targetBot = bot || selectedBot;
    setTenderForm({
      title: "",
      issuingAgency: targetBot.portalFocus[0] || "OPR Procurement Depository",
      portalSource: targetBot.portalFocus[0] || "Public Tender Board",
      scoutedByBotId: targetBot.id,
      deadline: new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0],
      estimatedValueTTD: "25000",
      scopeSummary: "",
    });
    setIsTenderModalOpen(true);
  };

  const handleManualTenderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenderForm.title.trim() || !tenderForm.scopeSummary.trim()) {
      toast.error("Please supply a tender title and scope summary.");
      return;
    }

    const scoutBot = ASSISTANT_ROSTER.find((b) => b.id === tenderForm.scoutedByBotId) || selectedBot;

    // Send through Nexus Commander filter
    const evaluated = evaluateTenderOpportunity({
      title: tenderForm.title.trim(),
      issuingAgency: tenderForm.issuingAgency.trim(),
      portalSource: tenderForm.portalSource.trim(),
      scoutedByBotId: scoutBot.id,
      scoutedByBotName: scoutBot.name,
      deadline: tenderForm.deadline || "TBD",
      estimatedValueTTD: Number(tenderForm.estimatedValueTTD) || 0,
      scopeSummary: tenderForm.scopeSummary.trim(),
    });

    setTenders((prev) => [evaluated, ...prev]);
    setIsTenderModalOpen(false);

    if (evaluated.nexusFilterStatus === "Qualified") {
      toast.success(`Nexus Commander QUALIFIED the opportunity (${evaluated.nexusScore}% score)`);
    } else if (evaluated.nexusFilterStatus === "Margin Disqualified") {
      toast.error(`Nexus Commander rejected tender (below TTD $1,200 commercial floor)`);
    } else {
      toast.info(`Tender logged under Nexus Commander review`);
    }
  };

  const handleDeleteTender = (id: string) => {
    setTenders((prev) => prev.filter((t) => t.id !== id));
    toast.success("Opportunity removed from Nexus queue");
  };

  return (
    <main className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" asChild>
              <Link to="/bookings">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Bookings
              </Link>
            </Button>
            <div>
              <h1 className="flex items-center gap-2 text-2xl font-bold">
                <Bot className="h-6 w-6 text-primary" />
                AI Assistant Workbench & Tender Scouts
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Domain-specific bots scout T&T public portals and funnel RFPs to Nexus Commander for filtration.
              </p>
            </div>
          </div>
          {!viewOnly && (
            <Button onClick={() => handleOpenTenderModal()} size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Manual Tender Input
            </Button>
          )}
        </header>

        {/* Central Nexus Commander Audit Overview */}
        <NexusCommanderPanel />

        {/* Section 1: Scouted Tender Opportunities Funneled to Nexus */}
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="flex items-center gap-2 text-lg font-bold">
                <FileSearch className="h-5 w-5 text-primary" />
                Public Tender & Industrial RFP Pipeline
              </h2>
              <p className="text-xs text-muted-foreground">
                Filtered and scored by Nexus Commander against DUAA commercial capacity and margin floors.
              </p>
            </div>
            <Badge variant="outline">{tenders.length} Active Opportunities</Badge>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {tenders.map((tender) => (
              <Card key={tender.id} className="relative flex flex-col justify-between border-border/80">
                <CardHeader className="p-4 pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <Badge variant="secondary" className="text-[11px]">
                      Scouted by {tender.scoutedByBotName}
                    </Badge>
                    <Badge
                      variant={
                        tender.nexusFilterStatus === "Qualified"
                          ? "default"
                          : tender.nexusFilterStatus === "Margin Disqualified"
                          ? "destructive"
                          : "outline"
                      }
                      className="text-[11px]"
                    >
                      {tender.nexusFilterStatus} ({tender.nexusScore}%)
                    </Badge>
                  </div>
                  <CardTitle className="mt-2 line-clamp-2 text-sm font-semibold">
                    {tender.title}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-1.5 text-xs">
                    <Building2 className="h-3 w-3 shrink-0" />
                    {tender.issuingAgency}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-3 p-4 pt-1 text-xs">
                  <div className="flex items-center justify-between rounded bg-muted/40 p-2 text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" /> Closes: {tender.deadline}
                    </span>
                    <span className="flex items-center gap-1 font-semibold text-foreground">
                      <DollarSign className="h-3 w-3 text-primary" />
                      {tender.estimatedValueTTD > 0
                        ? `TTD $${tender.estimatedValueTTD.toLocaleString()}`
                        : "Scope Pricing"}
                    </span>
                  </div>

                  <p className="line-clamp-3 text-muted-foreground">{tender.scopeSummary}</p>

                  <div className="rounded-md border border-primary/20 bg-primary/5 p-2 text-xs">
                    <div className="flex items-center gap-1 font-semibold text-primary">
                      <Sparkles className="h-3.5 w-3.5" />
                      Nexus Directive:
                    </div>
                    <p className="mt-1 text-muted-foreground">{tender.nexusDirective}</p>
                  </div>

                  {!viewOnly && (
                    <div className="flex justify-end pt-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs text-muted-foreground hover:text-destructive"
                        onClick={() => handleDeleteTender(tender.id)}
                      >
                        <Trash2 className="mr-1 h-3.5 w-3.5" />
                        Archive
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Section 2: Specialist Profiles & Direct Task Dispatch */}
        <section className="space-y-4 pt-4 border-t">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Specialist Profiles & Portal Scout Assignments
          </h2>

          <div className="grid gap-6 md:grid-cols-3">
            {/* Bot List */}
            <div className="space-y-3">
              {ASSISTANT_ROSTER.map((bot) => (
                <button
                  type="button"
                  key={bot.id}
                  onClick={() => {
                    setSelectedBot(bot);
                    setResult(null);
                  }}
                  className="block w-full text-left"
                >
                  <Card
                    className={`transition-colors ${
                      selectedBot.id === bot.id ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                    }`}
                  >
                    <CardHeader className="p-4">
                      <div className="flex items-center justify-between gap-2">
                        <CardTitle className="flex items-center gap-2 text-sm">
                          <Bot className="h-4 w-4 text-primary" />
                          {bot.name}
                        </CardTitle>
                        <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Active
                        </span>
                      </div>
                      <p className="mt-1 text-xs font-medium text-foreground">{bot.role}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{bot.tenderDomain}</p>
                    </CardHeader>
                  </Card>
                </button>
              ))}
            </div>

            {/* Selected Bot Details & Task Execution */}
            <div className="space-y-4 md:col-span-2">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Terminal className="h-5 w-5 text-primary" />
                      {selectedBot.name} Console
                    </CardTitle>
                    {!viewOnly && (
                      <Button size="sm" variant="outline" onClick={() => handleOpenTenderModal(selectedBot)}>
                        <Plus className="mr-1.5 h-3.5 w-3.5" />
                        Scout Tender for {selectedBot.name.split(" ")[0]}
                      </Button>
                    )}
                  </div>
                  <CardDescription className="text-xs">
                    Target Portals: {selectedBot.portalFocus.join(" · ")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    maxLength={1000}
                    placeholder={`Describe a technical triage task, pricing inquiry, or tender specification for ${selectedBot.name}...`}
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    rows={4}
                  />
                  <div className="flex justify-end">
                    <Button onClick={handleRunTask} disabled={isLoading || viewOnly}>
                      <Play className="mr-2 h-4 w-4" />
                      {isLoading ? "Running Assessment…" : "Dispatch Task"}
                    </Button>
                  </div>

                  {result && (
                    <div className="rounded-lg border bg-muted/20 p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="flex items-center gap-2 text-sm font-semibold text-primary">
                          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                          Assessment from {result.bot}
                        </h4>
                        <span className="text-xs text-muted-foreground">
                          {new Date(result.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-xs font-medium text-foreground">{result.summary}</p>
                      <ul className="list-disc pl-5 space-y-1 text-xs text-muted-foreground">
                        {result.recommendations.map((rec, i) => (
                          <li key={i}>{rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </div>

      {/* Manual Tender Opportunity Input Modal */}
      <Dialog open={isTenderModalOpen} onOpenChange={setIsTenderModalOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Input Public Tender / Industrial RFP</DialogTitle>
            <DialogDescription>
              Assign a specialist scout bot and funnel the opportunity to Nexus Commander for automated filtration.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleManualTenderSubmit} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Tender / RFP Title</Label>
              <Input
                value={tenderForm.title}
                onChange={(e) => setTenderForm({ ...tenderForm, title: e.target.value })}
                placeholder="e.g. Commercial Fleet Maintenance Services"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Assigned Scout Bot</Label>
                <Select
                  value={tenderForm.scoutedByBotId}
                  onValueChange={(val) => setTenderForm({ ...tenderForm, scoutedByBotId: val })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Scout" />
                  </SelectTrigger>
                  <SelectContent>
                    {ASSISTANT_ROSTER.filter((b) => b.id !== "nexus").map((bot) => (
                      <SelectItem key={bot.id} value={bot.id}>
                        {bot.name} ({bot.role})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Issuing Agency</Label>
                <Input
                  value={tenderForm.issuingAgency}
                  onChange={(e) => setTenderForm({ ...tenderForm, issuingAgency: e.target.value })}
                  placeholder="e.g. T&TEC, MOWT, NGC, OPR"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Procurement Portal / Link</Label>
                <Input
                  value={tenderForm.portalSource}
                  onChange={(e) => setTenderForm({ ...tenderForm, portalSource: e.target.value })}
                  placeholder="e.g. OPR Depository Ref #4810"
                />
              </div>

              <div className="space-y-1.5">
                <Label>Submission Deadline</Label>
                <Input
                  type="date"
                  value={tenderForm.deadline}
                  onChange={(e) => setTenderForm({ ...tenderForm, deadline: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Estimated Value (TTD)</Label>
              <Input
                type="number"
                min="0"
                value={tenderForm.estimatedValueTTD}
                onChange={(e) => setTenderForm({ ...tenderForm, estimatedValueTTD: e.target.value })}
                placeholder="e.g. 45000 (Min TTD $1,200 for commercial qualification)"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Scope Summary & Requirements</Label>
              <Textarea
                rows={3}
                value={tenderForm.scopeSummary}
                onChange={(e) => setTenderForm({ ...tenderForm, scopeSummary: e.target.value })}
                placeholder="Describe equipment needed, site location, required certifications (e.g. OSHA/EID), and deliverables..."
                required
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsTenderModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Send to Nexus Commander</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </main>
  );
}
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { ArrowLeft, Bot, CheckCircle2, Play, Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ASSISTANT_ROSTER, runAssistantTask, type AssistantBot } from "@/lib/assistants.functions";
import { useViewMode } from "@/lib/view-mode";
import { NexusCommanderPanel } from "@/components/NexusCommanderPanel";

export const Route = createFileRoute("/_authenticated/assistants")({
  component: AssistantsPage,
  head: () => ({ meta: [{ title: "AI Assistant Workbench — DUAA" }, { name: "robots", content: "noindex" }] }),
});

type AssistantResult = { success: boolean; bot: string; role: string; timestamp: string; summary: string; recommendations: string[] };

function AssistantsPage() {
  const executeBot = useServerFn(runAssistantTask);
  const { viewOnly } = useViewMode();
  const [selectedBot, setSelectedBot] = useState<AssistantBot>(ASSISTANT_ROSTER[0]);
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AssistantResult | null>(null);

  const handleRun = async () => {
    const task = prompt.trim();
    if (viewOnly) return toast.info("Exit affiliate preview to run an assistant task.");
    if (task.length < 2) return toast.error("Enter a task or question first.");
    setIsLoading(true);
    try {
      const response = await executeBot({ data: { botId: selectedBot.id, prompt: task } });
      setResult(response as AssistantResult);
      toast.success(`${selectedBot.name} returned a task assessment`);
    } catch (error) { toast.error(error instanceof Error ? error.message : "Assistant task failed"); }
    finally { setIsLoading(false); }
  };

  return (
    <main className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-wrap items-center gap-4"><Button variant="outline" size="sm" asChild><Link to="/bookings"><ArrowLeft className="mr-2 h-4 w-4" />Bookings</Link></Button><div><h1 className="flex items-center gap-2 text-2xl font-bold"><Bot className="h-6 w-6 text-primary" />AI assistant workbench</h1><p className="mt-1 text-sm text-muted-foreground">Choose a specialist profile and request an operational assessment.</p></div></header>
        <div className="rounded-lg border border-sky-500/30 bg-sky-500/5 p-3 text-sm text-muted-foreground">Assistant assessments are decision support, not live dispatch or a substitute for technician verification. Confirm pricing, safety, and availability with staff before acting.</div>
        <NexusCommanderPanel />
        {viewOnly && <p className="rounded-md border bg-muted/40 p-3 text-sm text-muted-foreground">Affiliate preview is read-only; task dispatch is disabled.</p>}
        <div className="grid gap-6 md:grid-cols-3">
          <section className="space-y-3"><h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Specialist profiles</h2>{ASSISTANT_ROSTER.map((bot) => <button type="button" key={bot.id} onClick={() => { setSelectedBot(bot); setResult(null); }} className="block w-full text-left"><Card className={`transition-colors ${selectedBot.id === bot.id ? "border-primary bg-primary/5" : "hover:bg-muted/50"}`}><CardHeader className="p-4"><div className="flex items-center justify-between gap-2"><CardTitle className="flex items-center gap-2 text-base"><Bot className="h-4 w-4 text-primary" />{bot.name}</CardTitle><span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-primary animate-pulse" aria-hidden />Online</span></div><p className="mt-2 text-xs text-muted-foreground">{bot.specialty}</p></CardHeader></Card></button>)}</section>
          <section className="space-y-4 md:col-span-2"><Card><CardHeader><CardTitle className="flex items-center gap-2"><Terminal className="h-5 w-5 text-primary" />Task for {selectedBot.name}</CardTitle></CardHeader><CardContent className="space-y-4"><Textarea maxLength={1000} placeholder={`Describe the task, symptoms, service area, and constraints for ${selectedBot.name}…`} value={prompt} onChange={(event) => setPrompt(event.target.value)} rows={5} /><p className="text-right text-xs text-muted-foreground">{prompt.length}/1000</p><Button onClick={() => void handleRun()} disabled={isLoading || viewOnly || prompt.trim().length < 2}><Play className="mr-2 h-4 w-4" />{isLoading ? "Preparing assessment…" : "Run assessment"}</Button></CardContent></Card>
            {result && <Card className="border-primary/40"><CardHeader><CardTitle className="flex items-center gap-2 text-base text-primary"><CheckCircle2 className="h-4 w-4 text-emerald-500" />Assessment · {result.bot}</CardTitle><p className="text-xs text-muted-foreground">{new Date(result.timestamp).toLocaleString()}</p></CardHeader><CardContent className="space-y-3 text-sm"><p className="font-semibold">{result.summary}</p>{result.recommendations.length ? <ul className="list-disc space-y-1 pl-5 text-muted-foreground">{result.recommendations.map((recommendation, index) => <li key={`${index}-${recommendation}`}>{recommendation}</li>)}</ul> : <p className="text-muted-foreground">No recommendations returned.</p>}</CardContent></Card>}
          </section>
        </div>
      </div>
    </main>
  );
}
