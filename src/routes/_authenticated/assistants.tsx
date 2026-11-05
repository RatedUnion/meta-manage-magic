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
        {viewOnly && <p className="rounded-md border bg-muted/40 p-3 text-sm text-muted-foreground">Affiliate preview is read-only; task dispatch is disabled.</p>}
        <div className="grid gap-6 md:grid-cols-3">
          <section className="space-y-3"><h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Specialist profiles</h2>{ASSISTANT_ROSTER.map((bot) => <button type="button" key={bot.id} onClick={() => { setSelectedBot(bot); setResult(null); }} className="block w-full text-left"><Card className={`transition-colors ${selectedBot.id === bot.id ? "border-primary bg-primary/5" : "hover:bg-muted/50"}`}><CardHeader className="p-4"><div className="flex items-center justify-between gap-2"><CardTitle className="flex items-center gap-2 text-base"><Bot className="h-4 w-4 text-primary" />{bot.name}</CardTitle><Badge variant="outline">{bot.role}</Badge></div><p className="mt-2 text-xs text-muted-foreground">{bot.specialty}</p></CardHeader></Card></button>)}</section>
          <section className="space-y-4 md:col-span-2"><Card><CardHeader><CardTitle className="flex items-center gap-2"><Terminal className="h-5 w-5 text-primary" />Task for {selectedBot.name}</CardTitle></CardHeader><CardContent className="space-y-4"><Textarea maxLength={1000} placeholder={`Describe the task, symptoms, service area, and constraints for ${selectedBot.name}…`} value={prompt} onChange={(event) => setPrompt(event.target.value)} rows={5} /><p className="text-right text-xs text-muted-foreground">{prompt.length}/1000</p><Button onClick={() => void handleRun()} disabled={isLoading || viewOnly || prompt.trim().length < 2}><Play className="mr-2 h-4 w-4" />{isLoading ? "Preparing assessment…" : "Run assessment"}</Button></CardContent></Card>
            {result && <Card className="border-primary/40"><CardHeader><CardTitle className="flex items-center gap-2 text-base text-primary"><CheckCircle2 className="h-4 w-4 text-emerald-500" />Assessment · {result.bot}</CardTitle><p className="text-xs text-muted-foreground">{new Date(result.timestamp).toLocaleString()}</p></CardHeader><CardContent className="space-y-3 text-sm"><p className="font-semibold">{result.summary}</p>{result.recommendations.length ? <ul className="list-disc space-y-1 pl-5 text-muted-foreground">{result.recommendations.map((recommendation, index) => <li key={`${index}-${recommendation}`}>{recommendation}</li>)}</ul> : <p className="text-muted-foreground">No recommendations returned.</p>}</CardContent></Card>}
          </section>
        </div>
      </div>
    </main>
  );
}
