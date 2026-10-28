import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Bot, Play, CheckCircle2, ArrowLeft, Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ASSISTANT_ROSTER, runAssistantTask, type AssistantBot } from "@/lib/assistants.functions";

export const Route = createFileRoute("/_authenticated/assistants")({
  component: AssistantsPage,
  head: () => ({
    meta: [{ title: "AI Multi-Bot Control Room — DUAA" }],
  }),
});

function AssistantsPage() {
  const executeBot = useServerFn(runAssistantTask);
  const [selectedBot, setSelectedBot] = useState<AssistantBot>(ASSISTANT_ROSTER[0]);
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleRun = async () => {
    if (!prompt.trim()) return toast.error("Please enter a command or prompt");
    setIsLoading(true);
    try {
      const res = await executeBot({ data: { botId: selectedBot.id, prompt } });
      setResult(res);
      toast.success(`${selectedBot.name} completed assessment`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Execution failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link to="/bookings"><ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard</Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">AI Assistant Orchestration Engine</h1>
            <p className="text-sm text-muted-foreground">Autonomous sub-bots coordinating tasks across Trinidad & Tobago</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Specialist Bots</h2>
            {ASSISTANT_ROSTER.map((bot) => (
              <Card
                key={bot.id}
                onClick={() => setSelectedBot(bot)}
                className={`cursor-pointer transition-colors ${selectedBot.id === bot.id ? "border-primary bg-primary/5" : "hover:bg-muted/50"}`}
              >
                <CardHeader className="p-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Bot className="w-4 h-4 text-primary" /> {bot.name}
                    </CardTitle>
                    <Badge variant="outline">{bot.role}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{bot.specialty}</p>
                </CardHeader>
              </Card>
            ))}
          </div>

          <div className="md:col-span-2 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Terminal className="w-5 h-5 text-primary" />
                  Command {selectedBot.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder={`Describe a situation or task for ${selectedBot.name}... (e.g. "Assess 3 fleet diesel engines with low oil pressure in Point Lisas")`}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={4}
                />
                <Button onClick={handleRun} disabled={isLoading} className="w-full sm:w-auto">
                  <Play className="w-4 h-4 mr-2" /> {isLoading ? "Analyzing..." : "Dispatch Instruction"}
                </Button>
              </CardContent>
            </Card>

            {result && (
              <Card className="border-primary/40 bg-card">
                <CardHeader>
                  <CardTitle className="text-sm font-medium flex items-center gap-2 text-primary">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Assessment Result ({result.bot})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p className="font-semibold">{result.summary}</p>
                  <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                    {result.recommendations.map((rec: string, i: number) => (
                      <li key={i}>{rec}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
