import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  ArrowLeft,
  Bot,
  Clock3,
  MapPin,
  Phone,
  Save,
  Search,
  Sparkles,
  Trash2,
  UserCheck,
  Wrench,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  ASSISTANT_ROSTER,
  runAssistantTask,
} from "@/lib/assistants.functions";

export const Route = createFileRoute("/_authenticated/roster")({
  component: RosterPage,
  head: () => ({ meta: [{ title: "Technician Dispatch Roster — DUAA" }] }),
});

type RosterStatus = "Available" | "On-Call" | "Booked";
type RosterMember = {
  id: string;
  name: string;
  role: string;
  specialty: string;
  area: string;
  status: RosterStatus;
  phone: string;
  serviceFit: string;
  projectedLoad: number;
  notes: string;
};
type RosterDraft = Omit<RosterMember, "id">;

const STORAGE_KEY = "duaa-roster-v1";
const DEFAULT_ROSTER: RosterMember[] = [
  { id: "alpha", name: "Field Unit Alpha", role: "Mobile Mechanic", specialty: "OBD & Brakes", area: "San Fernando & South", status: "On-Call", phone: "+1 868-763-1106", serviceFit: "Vehicle diagnostics and brake work", projectedLoad: 2, notes: "Best fit for brake and suspension jobs in south Trinidad." },
  { id: "beta", name: "Field Unit Beta", role: "Commercial Electrician", specialty: "Commercial & Automotive Electrical", area: "Port of Spain & East-West Corridor", status: "Booked", phone: "+1 868-763-1106", serviceFit: "Electrical faults for commercial and automotive jobs", projectedLoad: 3, notes: "Confirm availability before assigning new work." },
  { id: "gamma", name: "Field Unit Gamma", role: "Grounds Technician", specialty: "Grounds, Landscape & Floral Care", area: "Central Trinidad & Diego Martin", status: "Available", phone: "+1 868-763-1106", serviceFit: "Grounds maintenance, landscaping, and floral care", projectedLoad: 1, notes: "Good for exterior prep and landscaping tasks." },
];
const STATUS_FILTERS = ["All", "Available", "On-Call", "Booked"] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];
const emptyDraft = (): RosterDraft => ({ name: "", role: "Technician", specialty: "", area: "", status: "Available", phone: "", serviceFit: "", projectedLoad: 0, notes: "" });

function loadRoster(): RosterMember[] {
  if (typeof window === "undefined") return DEFAULT_ROSTER;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return DEFAULT_ROSTER;
    const parsed: unknown = JSON.parse(stored);
    return Array.isArray(parsed) ? (parsed as RosterMember[]) : DEFAULT_ROSTER;
  } catch {
    return DEFAULT_ROSTER;
  }
}

function offlineSuggestions(roster: RosterMember[], task: string): string[] {
  const terms = task.toLowerCase().split(/[^a-z0-9]+/).filter((term) => term.length > 2);
  const ranked = roster.map((member) => {
    const text = `${member.role} ${member.specialty} ${member.area} ${member.serviceFit} ${member.notes}`.toLowerCase();
    const fit = terms.reduce((score, term) => score + (text.includes(term) ? 1 : 0), 0);
    const availability = member.status === "Available" ? 3 : member.status === "On-Call" ? 2 : 0;
    return { member, score: fit * 4 + availability - member.projectedLoad };
  }).sort((a, b) => b.score - a.score).slice(0, 3);
  if (!ranked.length) return ["No roster members are available. Add a crew profile before dispatching."];
  return ranked.map(({ member }, index) => `${index === 0 ? "Top match" : "Alternative"}: ${member.name} — ${member.role} (${member.specialty}), coverage: ${member.area}; status: ${member.status}; projected load: ${member.projectedLoad}. Verify availability and task fit before dispatch.`);
}

function RosterPage() {
  const executeAssistant = useServerFn(runAssistantTask);
  const [roster, setRoster] = useState<RosterMember[]>(loadRoster);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");
  const [draft, setDraft] = useState<RosterDraft>(emptyDraft);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [task, setTask] = useState("Assign a mechanic to a brake job in San Fernando before 15:00");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [suggestionMode, setSuggestionMode] = useState<"idle" | "AI orchestration" | "offline fallback">("idle");
  const [suggesting, setSuggesting] = useState(false);

  useEffect(() => {
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(roster)); } catch { /* Offline storage may be unavailable. */ }
  }, [roster]);

  const filteredRoster = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return roster.filter((member) =>
      (statusFilter === "All" || member.status === statusFilter) &&
      (!needle || [member.name, member.role, member.specialty, member.area, member.status, member.serviceFit, member.notes].join(" ").toLowerCase().includes(needle)),
    );
  }, [roster, query, statusFilter]);

  const saveMember = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!draft.name.trim() || !draft.specialty.trim() || !draft.area.trim()) {
      toast.error("Name, specialty, and coverage area are required.");
      return;
    }
    const member: RosterMember = { ...draft, id: editingId ?? crypto.randomUUID(), name: draft.name.trim(), role: draft.role.trim() || "Technician", specialty: draft.specialty.trim(), area: draft.area.trim(), phone: draft.phone.trim(), serviceFit: draft.serviceFit.trim(), notes: draft.notes.trim(), projectedLoad: Math.max(0, Math.floor(draft.projectedLoad)) };
    setRoster((current) => editingId ? current.map((item) => item.id === editingId ? member : item) : [member, ...current]);
    setDraft(emptyDraft());
    setEditingId(null);
    toast.success(editingId ? "Roster member updated." : "Roster member added.");
  };

  const editMember = (member: RosterMember) => {
    const { id, ...values } = member;
    setEditingId(id);
    setDraft(values);
  };

  const runSuggestions = async () => {
    if (task.trim().length < 2) { toast.error("Describe the task first."); return; }
    setSuggesting(true);
    try {
      const bot = ASSISTANT_ROSTER.find((item) => item.id === "nexus") ?? ASSISTANT_ROSTER[0];
      const result = await executeAssistant({ data: { botId: bot.id, prompt: `Roster dispatch projection for task: ${task.trim()}. Use roster context to suggest precise candidates and changes. Do not assign automatically; state uncertainty and conflicts.`, contextData: { roster, task: task.trim(), operation: "roster-projection" } } });
      setSuggestions([result.summary, ...result.recommendations]);
      setSuggestionMode("AI orchestration");
    } catch {
      setSuggestions(offlineSuggestions(roster, task));
      setSuggestionMode("offline fallback");
      toast.message("AI service unavailable; showing local offline suggestions.");
    } finally {
      setSuggesting(false);
    }
  };

  const applyStatusSuggestion = (member: RosterMember) => {
    if (member.status === "Booked") { toast.error("Booked crew cannot be automatically marked on-call."); return; }
    setRoster((current) => current.map((item) => item.id === member.id ? { ...item, status: "On-Call", projectedLoad: item.projectedLoad + 1 } : item));
    toast.success("Draft roster change applied locally. Confirm it with your dispatcher.");
  };

  return (
    <main className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-wrap items-center gap-3">
          <Button variant="outline" size="sm" asChild><Link to="/bookings"><ArrowLeft className="mr-2 h-4 w-4" /> Back</Link></Button>
          <div><h1 className="text-2xl font-bold">Crew Dispatch & Technician Roster</h1><p className="mt-1 text-sm text-muted-foreground">Edit crew records and review task-specific projections. AI suggestions never dispatch automatically.</p></div>
        </header>

        <section className="grid gap-4 lg:grid-cols-2">
          <Card><CardHeader><CardTitle>{editingId ? "Edit roster member" : "Add roster member"}</CardTitle></CardHeader><CardContent>
            <form onSubmit={saveMember} className="grid gap-3 sm:grid-cols-2">
              <Input aria-label="Name" placeholder="Name" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
              <Input aria-label="Role" placeholder="Role" value={draft.role} onChange={(e) => setDraft({ ...draft, role: e.target.value })} />
              <Input aria-label="Specialty" placeholder="Specialty" value={draft.specialty} onChange={(e) => setDraft({ ...draft, specialty: e.target.value })} />
              <Input aria-label="Coverage area" placeholder="Coverage area" value={draft.area} onChange={(e) => setDraft({ ...draft, area: e.target.value })} />
              <select aria-label="Status" value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value as RosterStatus })} className="h-10 rounded-md border border-input bg-background px-3 text-sm"><option>Available</option><option>On-Call</option><option>Booked</option></select>
              <Input aria-label="Phone" placeholder="Phone" value={draft.phone} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} />
              <Input aria-label="Best-fit tasks" placeholder="Best-fit tasks" value={draft.serviceFit} onChange={(e) => setDraft({ ...draft, serviceFit: e.target.value })} />
              <Input aria-label="Projected active tasks" type="number" min="0" step="1" value={draft.projectedLoad} onChange={(e) => setDraft({ ...draft, projectedLoad: Number(e.target.value) || 0 })} />
              <Textarea aria-label="Operational notes" placeholder="Operational notes" rows={3} className="sm:col-span-2" value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} />
              <div className="flex gap-2 sm:col-span-2"><Button type="submit"><Save className="mr-2 h-4 w-4" />{editingId ? "Save changes" : "Add member"}</Button>{editingId && <Button type="button" variant="outline" onClick={() => { setEditingId(null); setDraft(emptyDraft()); }}>Cancel</Button>}</div>
            </form>
          </CardContent></Card>

          <Card><CardHeader><CardTitle className="flex items-center gap-2"><Bot className="h-5 w-5 text-primary" />AI Assistant Orchestration Engine</CardTitle><p className="text-sm text-muted-foreground">Generate a task-specific projection from the current roster. If the service is unreachable, use local offline matching.</p></CardHeader><CardContent className="space-y-3">
            <Textarea aria-label="Dispatch task" value={task} onChange={(e) => setTask(e.target.value)} rows={3} />
            <Button type="button" onClick={runSuggestions} disabled={suggesting}><Sparkles className="mr-2 h-4 w-4" />{suggesting ? "Analyzing…" : "Suggest roster changes"}</Button>
            {suggestionMode !== "idle" && <Badge variant="outline">{suggestionMode}</Badge>}
            {suggestions.length > 0 && <ul className="space-y-2 text-sm">{suggestions.map((item, index) => <li key={`${index}-${item}`} className="rounded-md border p-3">{item}</li>)}</ul>}
            <p className="text-xs text-muted-foreground">Suggestions are advisory. Review availability and approve edits yourself; changes are stored on this device until synchronized.</p>
          </CardContent></Card>
        </section>

        <section className="space-y-3" aria-label="Roster search and filters">
          <div className="relative max-w-xl"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search crew, service, location, or status" aria-label="Search roster" className="pl-9" /></div>
          <div className="flex flex-wrap gap-2">{STATUS_FILTERS.map((status) => <Button key={status} type="button" size="sm" variant={statusFilter === status ? "default" : "outline"} aria-pressed={statusFilter === status} onClick={() => setStatusFilter(status)}>{status}</Button>)}</div>
        </section>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{filteredRoster.map((member) => <Card key={member.id}>
          <CardHeader><div className="flex items-start justify-between gap-2"><CardTitle className="flex items-center gap-2 text-base"><UserCheck className="h-4 w-4 text-primary" />{member.name}</CardTitle><Badge variant={member.status === "Available" ? "outline" : "default"}>{member.status}</Badge></div></CardHeader>
          <CardContent className="space-y-3 text-sm"><p><Wrench className="mr-2 inline h-4 w-4 text-primary" />{member.role} · {member.specialty}</p><p><MapPin className="mr-2 inline h-4 w-4 text-primary" />{member.area}</p><p><Phone className="mr-2 inline h-4 w-4 text-primary" />{member.phone || "No phone listed"}</p><p><Clock3 className="mr-2 inline h-4 w-4 text-primary" />Projected load: {member.projectedLoad}</p><p className="text-muted-foreground">{member.serviceFit}</p>{member.notes && <p className="text-muted-foreground">{member.notes}</p>}
            <div className="flex flex-wrap gap-2"><Button size="sm" variant="outline" onClick={() => editMember(member)}>Edit</Button><Button size="sm" variant="outline" onClick={() => applyStatusSuggestion(member)}>Apply on-call change</Button><Button size="sm" variant="destructive" onClick={() => { setRoster((current) => current.filter((item) => item.id !== member.id)); if (editingId === member.id) { setEditingId(null); setDraft(emptyDraft()); } }}>Delete</Button></div>
          </CardContent>
        </Card>)}</div>
        {filteredRoster.length === 0 && <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">No crew match the search and availability filter.</div>}
        <p className="text-xs text-muted-foreground">Roster edits persist in this browser for offline use. They are not yet synchronized to a shared server or database.</p>
      </div>
    </main>
  );
}
