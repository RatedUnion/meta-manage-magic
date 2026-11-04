import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { ArrowLeft, Bot, MapPin, Phone, Search, Sparkles, UserCheck, Wrench } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ASSISTANT_ROSTER, getRosterAccess, runAssistantTask } from "@/lib/assistants.functions";

export const Route = createFileRoute("/_authenticated/roster")({
  component: RosterPage,
  head: () => ({ meta: [{ title: "Technician Dispatch Roster — DUAA" }] }),
});

type Status = "Available" | "On-Call" | "Booked";
type Member = { id: string; name: string; role: string; specialty: string; area: string; status: Status; phone: string; serviceFit: string; projectedLoad: number; notes: string };
type Draft = Omit<Member, "id">;
const STORAGE_PREFIX = "duaa-roster-v1";
const DEFAULT_ROSTER: Member[] = [
  { id: "alpha", name: "Field Unit Alpha", role: "Mobile Mechanic", specialty: "OBD & Brakes", area: "San Fernando & South", status: "On-Call", phone: "+1 868-763-1106", serviceFit: "Vehicle diagnostics and brake work", projectedLoad: 2, notes: "Confirm availability before dispatch." },
  { id: "beta", name: "Field Unit Beta", role: "Commercial Electrician", specialty: "Commercial & Automotive Electrical", area: "Port of Spain & East-West Corridor", status: "Booked", phone: "+1 868-763-1106", serviceFit: "Electrical faults for commercial and automotive jobs", projectedLoad: 3, notes: "Confirm availability before assigning new work." },
  { id: "gamma", name: "Field Unit Gamma", role: "Grounds Technician", specialty: "Grounds, Landscape & Floral Care", area: "Central Trinidad & Diego Martin", status: "Available", phone: "+1 868-763-1106", serviceFit: "Grounds maintenance, landscaping, and floral care", projectedLoad: 1, notes: "Suitable for landscaping tasks." },
];
const emptyDraft = (): Draft => ({ name: "", role: "Technician", specialty: "", area: "", status: "Available", phone: "", serviceFit: "", projectedLoad: 0, notes: "" });
const FILTERS = ["All", "Available", "On-Call", "Booked"] as const;

function offlineSuggestions(roster: Member[], task: string) {
  const terms = task.toLowerCase().split(/[^a-z0-9]+/).filter((term) => term.length > 2);
  return [...roster].map((member) => {
    const text = `${member.role} ${member.specialty} ${member.area} ${member.serviceFit}`.toLowerCase();
    const matches = terms.reduce((score, term) => score + Number(text.includes(term)), 0);
    const availability = member.status === "Available" ? 3 : member.status === "On-Call" ? 2 : 0;
    return { member, score: matches * 4 + availability - member.projectedLoad };
  }).sort((a, b) => b.score - a.score).slice(0, 3).map(({ member }, index) => `${index === 0 ? "Top match" : "Alternative"}: ${member.name} (${member.role}), ${member.specialty}, coverage ${member.area}; status ${member.status}, projected load ${member.projectedLoad}. Verify availability before dispatch.`);
}

function RosterPage() {
  const checkAccess = useServerFn(getRosterAccess);
  const executeAssistant = useServerFn(runAssistantTask);
  const [canManage, setCanManage] = useState<boolean | null>(null);
  const [roster, setRoster] = useState<Member[]>([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [editing, setEditing] = useState<string | null>(null);
  const [storageKey, setStorageKey] = useState("");
  const [task, setTask] = useState("Assign a mechanic to a brake job in San Fernando");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [suggestionMode, setSuggestionMode] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    void checkAccess().then((access) => {
      if (!active) return;
      setCanManage(access.canManage);
      if (!access.canManage) return;
      const key = `${STORAGE_PREFIX}:${access.userId}`;
      setStorageKey(key);
      try {
        const saved = window.localStorage.getItem(key);
        const parsed: unknown = saved ? JSON.parse(saved) : null;
        setRoster(Array.isArray(parsed) ? parsed as Member[] : DEFAULT_ROSTER);
      } catch {
        setRoster(DEFAULT_ROSTER);
      }
    }).catch(() => { if (active) setCanManage(false); });
    return () => { active = false; };
  }, [checkAccess]);

  useEffect(() => {
    if (!storageKey || canManage !== true) return;
    try { window.localStorage.setItem(storageKey, JSON.stringify(roster)); } catch { /* Offline storage may be unavailable. */ }
  }, [canManage, roster, storageKey]);

  const visibleRoster = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return roster.filter((member) => (filter === "All" || member.status === filter) && (!needle || [member.name, member.role, member.specialty, member.area, member.status, member.serviceFit].join(" ").toLowerCase().includes(needle)));
  }, [filter, query, roster]);

  const saveMember = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canManage) return;
    if (!draft.name.trim() || !draft.specialty.trim() || !draft.area.trim()) { toast.error("Name, specialty, and coverage area are required."); return; }
    const member: Member = { ...draft, id: editing ?? crypto.randomUUID(), name: draft.name.trim(), role: draft.role.trim() || "Technician", specialty: draft.specialty.trim(), area: draft.area.trim(), phone: draft.phone.trim(), serviceFit: draft.serviceFit.trim(), notes: draft.notes.trim(), projectedLoad: Math.max(0, Math.floor(draft.projectedLoad)) };
    setRoster((current) => editing ? current.map((item) => item.id === editing ? member : item) : [member, ...current]);
    setDraft(emptyDraft()); setEditing(null); toast.success("Roster saved on this owner account.");
  };

  const requestSuggestions = async () => {
    if (!canManage || task.trim().length < 2) return;
    setBusy(true);
    try {
      const bot = ASSISTANT_ROSTER.find((item) => item.id === "nexus") ?? ASSISTANT_ROSTER[0];
      const result = await executeAssistant({ data: { botId: bot.id, prompt: `Project a roster for this task: ${task.trim()}. Make recommendations only; do not make changes or dispatch anyone.`, contextData: { roster, task: task.trim() } } });
      setSuggestions([result.summary, ...result.recommendations]); setSuggestionMode("AI Assistant Orchestration Engine");
    } catch {
      setSuggestions(offlineSuggestions(roster, task)); setSuggestionMode("Offline local suggestions");
      toast.message("AI service unavailable; showing offline matching suggestions.");
    } finally { setBusy(false); }
  };

  if (canManage === null) return <main className="p-8 text-sm text-muted-foreground">Checking roster access…</main>;
  if (!canManage) return <main className="min-h-screen p-6"><Card className="mx-auto mt-12 max-w-xl"><CardHeader><CardTitle>Roster access restricted</CardTitle></CardHeader><CardContent><p className="text-sm text-muted-foreground">The roster and dispatch projections are available to the owner account only. Contact the owner if you need an assignment.</p><Button className="mt-4" variant="outline" asChild><Link to="/bookings">Return to bookings</Link></Button></CardContent></Card></main>;

  return (
    <main className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex items-center gap-3"><Button variant="outline" size="sm" asChild><Link to="/bookings"><ArrowLeft className="mr-2 h-4 w-4" />Back</Link></Button><div><h1 className="text-2xl font-bold">Crew Dispatch & Technician Roster</h1><p className="text-sm text-muted-foreground">Owner-only roster management with AI-assisted, offline-capable projections.</p></div></header>
        <section className="grid gap-4 lg:grid-cols-2">
          <Card><CardHeader><CardTitle>{editing ? "Edit roster member" : "Add roster member"}</CardTitle></CardHeader><CardContent><form onSubmit={saveMember} className="grid gap-2 sm:grid-cols-2">
            <Input aria-label="Name" placeholder="Name" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
            <Input aria-label="Role" placeholder="Role" value={draft.role} onChange={(e) => setDraft({ ...draft, role: e.target.value })} />
            <Input aria-label="Specialty" placeholder="Specialty" value={draft.specialty} onChange={(e) => setDraft({ ...draft, specialty: e.target.value })} />
            <Input aria-label="Coverage area" placeholder="Coverage area" value={draft.area} onChange={(e) => setDraft({ ...draft, area: e.target.value })} />
            <select aria-label="Status" value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value as Status })} className="h-10 rounded-md border border-input bg-background px-3 text-sm"><option>Available</option><option>On-Call</option><option>Booked</option></select>
            <Input aria-label="Phone" placeholder="Phone" value={draft.phone} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} />
            <Input aria-label="Best-fit tasks" placeholder="Best-fit tasks" value={draft.serviceFit} onChange={(e) => setDraft({ ...draft, serviceFit: e.target.value })} />
            <Input aria-label="Projected load" type="number" min="0" value={draft.projectedLoad} onChange={(e) => setDraft({ ...draft, projectedLoad: Number(e.target.value) || 0 })} />
            <Textarea aria-label="Operational notes" placeholder="Operational notes" value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} className="sm:col-span-2" />
            <div className="flex gap-2 sm:col-span-2"><Button type="submit">{editing ? "Save changes" : "Add member"}</Button>{editing && <Button type="button" variant="outline" onClick={() => { setEditing(null); setDraft(emptyDraft()); }}>Cancel</Button>}</div>
          </form></CardContent></Card>
          <Card><CardHeader><CardTitle className="flex items-center gap-2"><Bot className="h-5 w-5" />AI Assistant Orchestration Engine</CardTitle><p className="text-sm text-muted-foreground">Task-specific suggestions; AI does not change the roster or dispatch crew.</p></CardHeader><CardContent className="space-y-3"><Textarea aria-label="Task projection" value={task} onChange={(e) => setTask(e.target.value)} rows={3} /><Button onClick={requestSuggestions} disabled={busy}><Sparkles className="mr-2 h-4 w-4" />{busy ? "Analyzing…" : "Generate projections"}</Button>{suggestionMode && <Badge variant="outline">{suggestionMode}</Badge>}{suggestions.map((item, index) => <p key={`${index}-${item}`} className="rounded border p-3 text-sm">{item}</p>)}<p className="text-xs text-muted-foreground">Offline suggestions are generated locally from roster role, coverage, availability, and projected load.</p></CardContent></Card>
        </section>
        <section className="space-y-3"><div className="relative max-w-xl"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input aria-label="Search roster" placeholder="Search crew, service, area, or status" value={query} onChange={(e) => setQuery(e.target.value)} className="pl-9" /></div><div className="flex flex-wrap gap-2">{FILTERS.map((item) => <Button key={item} size="sm" variant={filter === item ? "default" : "outline"} onClick={() => setFilter(item)}>{item}</Button>)}</div></section>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{visibleRoster.map((member) => <Card key={member.id}><CardHeader><div className="flex items-start justify-between gap-2"><CardTitle className="flex items-center gap-2 text-base"><UserCheck className="h-4 w-4 text-primary" />{member.name}</CardTitle><Badge variant={member.status === "Available" ? "outline" : "default"}>{member.status}</Badge></div></CardHeader><CardContent className="space-y-3 text-sm"><p><Wrench className="mr-2 inline h-4 w-4" />{member.role} · {member.specialty}</p><p><MapPin className="mr-2 inline h-4 w-4" />{member.area}</p><p><Phone className="mr-2 inline h-4 w-4" />{member.phone}</p><p>{member.serviceFit}</p><p className="text-muted-foreground">Projected load: {member.projectedLoad} · {member.notes}</p><div className="flex gap-2"><Button size="sm" variant="outline" onClick={() => { const { id, ...values } = member; setEditing(id); setDraft(values); }}>Edit</Button><Button size="sm" variant="destructive" onClick={() => setRoster((current) => current.filter((item) => item.id !== member.id))}>Delete</Button></div></CardContent></Card>)}</div>
        {visibleRoster.length === 0 && <p className="rounded border border-dashed p-6 text-center text-sm text-muted-foreground">No roster matches.</p>}
        <p className="text-xs text-muted-foreground">Roster data is saved in this browser under the owner account and is not synchronized to other devices or clients.</p>
      </div>
    </main>
  );
}
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { ArrowLeft, Bot, MapPin, Phone, Search, Sparkles, UserCheck, Wrench } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ASSISTANT_ROSTER, getRosterAccess, runAssistantTask } from "@/lib/assistants.functions";

export const Route = createFileRoute("/_authenticated/roster")({
  component: RosterPage,
  head: () => ({ meta: [{ title: "Technician Dispatch Roster — DUAA" }] }),
});

type Status = "Available" | "On-Call" | "Booked";
type Member = { id: string; name: string; role: string; specialty: string; area: string; status: Status; phone: string; serviceFit: string; projectedLoad: number; notes: string };
type Draft = Omit<Member, "id">;
const STORAGE_PREFIX = "duaa-roster-v1";
const DEFAULT_ROSTER: Member[] = [
  { id: "alpha", name: "Field Unit Alpha", role: "Mobile Mechanic", specialty: "OBD & Brakes", area: "San Fernando & South", status: "On-Call", phone: "+1 868-763-1106", serviceFit: "Vehicle diagnostics and brake work", projectedLoad: 2, notes: "Confirm availability before dispatch." },
  { id: "beta", name: "Field Unit Beta", role: "Commercial Electrician", specialty: "Commercial & Automotive Electrical", area: "Port of Spain & East-West Corridor", status: "Booked", phone: "+1 868-763-1106", serviceFit: "Electrical faults for commercial and automotive jobs", projectedLoad: 3, notes: "Confirm availability before assigning new work." },
  { id: "gamma", name: "Field Unit Gamma", role: "Grounds Technician", specialty: "Grounds, Landscape & Floral Care", area: "Central Trinidad & Diego Martin", status: "Available", phone: "+1 868-763-1106", serviceFit: "Grounds maintenance, landscaping, and floral care", projectedLoad: 1, notes: "Suitable for landscaping tasks." },
];
const emptyDraft = (): Draft => ({ name: "", role: "Technician", specialty: "", area: "", status: "Available", phone: "", serviceFit: "", projectedLoad: 0, notes: "" });
const FILTERS = ["All", "Available", "On-Call", "Booked"] as const;

function offlineSuggestions(roster: Member[], task: string) {
  const terms = task.toLowerCase().split(/[^a-z0-9]+/).filter((term) => term.length > 2);
  return [...roster].map((member) => {
    const text = `${member.role} ${member.specialty} ${member.area} ${member.serviceFit}`.toLowerCase();
    const matches = terms.reduce((score, term) => score + Number(text.includes(term)), 0);
    const availability = member.status === "Available" ? 3 : member.status === "On-Call" ? 2 : 0;
    return { member, score: matches * 4 + availability - member.projectedLoad };
  }).sort((a, b) => b.score - a.score).slice(0, 3).map(({ member }, index) => `${index === 0 ? "Top match" : "Alternative"}: ${member.name} (${member.role}), ${member.specialty}, coverage ${member.area}; status ${member.status}, projected load ${member.projectedLoad}. Verify availability before dispatch.`);
}

function RosterPage() {
  const checkAccess = useServerFn(getRosterAccess);
  const executeAssistant = useServerFn(runAssistantTask);
  const [canManage, setCanManage] = useState<boolean | null>(null);
  const [roster, setRoster] = useState<Member[]>([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [editing, setEditing] = useState<string | null>(null);
  const [storageKey, setStorageKey] = useState("");
  const [task, setTask] = useState("Assign a mechanic to a brake job in San Fernando");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [suggestionMode, setSuggestionMode] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    void checkAccess().then((access) => {
      if (!active) return;
      setCanManage(access.canManage);
      if (!access.canManage) return;
      const key = `${STORAGE_PREFIX}:${access.userId}`;
      setStorageKey(key);
      try {
        const saved = window.localStorage.getItem(key);
        const parsed: unknown = saved ? JSON.parse(saved) : null;
        setRoster(Array.isArray(parsed) ? parsed as Member[] : DEFAULT_ROSTER);
      } catch {
        setRoster(DEFAULT_ROSTER);
      }
    }).catch(() => { if (active) setCanManage(false); });
    return () => { active = false; };
  }, [checkAccess]);

  useEffect(() => {
    if (!storageKey || canManage !== true) return;
    try { window.localStorage.setItem(storageKey, JSON.stringify(roster)); } catch { /* Offline storage may be unavailable. */ }
  }, [canManage, roster, storageKey]);

  const visibleRoster = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return roster.filter((member) => (filter === "All" || member.status === filter) && (!needle || [member.name, member.role, member.specialty, member.area, member.status, member.serviceFit].join(" ").toLowerCase().includes(needle)));
  }, [filter, query, roster]);

  const saveMember = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canManage) return;
    if (!draft.name.trim() || !draft.specialty.trim() || !draft.area.trim()) { toast.error("Name, specialty, and coverage area are required."); return; }
    const member: Member = { ...draft, id: editing ?? crypto.randomUUID(), name: draft.name.trim(), role: draft.role.trim() || "Technician", specialty: draft.specialty.trim(), area: draft.area.trim(), phone: draft.phone.trim(), serviceFit: draft.serviceFit.trim(), notes: draft.notes.trim(), projectedLoad: Math.max(0, Math.floor(draft.projectedLoad)) };
    setRoster((current) => editing ? current.map((item) => item.id === editing ? member : item) : [member, ...current]);
    setDraft(emptyDraft()); setEditing(null); toast.success("Roster saved on this owner account.");
  };

  const requestSuggestions = async () => {
    if (!canManage || task.trim().length < 2) return;
    setBusy(true);
    try {
      const bot = ASSISTANT_ROSTER.find((item) => item.id === "nexus") ?? ASSISTANT_ROSTER[0];
      const result = await executeAssistant({ data: { botId: bot.id, prompt: `Project a roster for this task: ${task.trim()}. Make recommendations only; do not make changes or dispatch anyone.`, contextData: { roster, task: task.trim() } } });
      setSuggestions([result.summary, ...result.recommendations]); setSuggestionMode("AI Assistant Orchestration Engine");
    } catch {
      setSuggestions(offlineSuggestions(roster, task)); setSuggestionMode("Offline local suggestions");
      toast.message("AI service unavailable; showing offline matching suggestions.");
    } finally { setBusy(false); }
  };

  if (canManage === null) return <main className="p-8 text-sm text-muted-foreground">Checking roster access…</main>;
  if (!canManage) return <main className="min-h-screen p-6"><Card className="mx-auto mt-12 max-w-xl"><CardHeader><CardTitle>Roster access restricted</CardTitle></CardHeader><CardContent><p className="text-sm text-muted-foreground">The roster and dispatch projections are available to the owner account only. Contact the owner if you need an assignment.</p><Button className="mt-4" variant="outline" asChild><Link to="/bookings">Return to bookings</Link></Button></CardContent></Card></main>;

  return (
    <main className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex items-center gap-3"><Button variant="outline" size="sm" asChild><Link to="/bookings"><ArrowLeft className="mr-2 h-4 w-4" />Back</Link></Button><div><h1 className="text-2xl font-bold">Crew Dispatch & Technician Roster</h1><p className="text-sm text-muted-foreground">Owner-only roster management with AI-assisted, offline-capable projections.</p></div></header>
        <section className="grid gap-4 lg:grid-cols-2">
          <Card><CardHeader><CardTitle>{editing ? "Edit roster member" : "Add roster member"}</CardTitle></CardHeader><CardContent><form onSubmit={saveMember} className="grid gap-2 sm:grid-cols-2">
            <Input aria-label="Name" placeholder="Name" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
            <Input aria-label="Role" placeholder="Role" value={draft.role} onChange={(e) => setDraft({ ...draft, role: e.target.value })} />
            <Input aria-label="Specialty" placeholder="Specialty" value={draft.specialty} onChange={(e) => setDraft({ ...draft, specialty: e.target.value })} />
            <Input aria-label="Coverage area" placeholder="Coverage area" value={draft.area} onChange={(e) => setDraft({ ...draft, area: e.target.value })} />
            <select aria-label="Status" value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value as Status })} className="h-10 rounded-md border border-input bg-background px-3 text-sm"><option>Available</option><option>On-Call</option><option>Booked</option></select>
            <Input aria-label="Phone" placeholder="Phone" value={draft.phone} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} />
            <Input aria-label="Best-fit tasks" placeholder="Best-fit tasks" value={draft.serviceFit} onChange={(e) => setDraft({ ...draft, serviceFit: e.target.value })} />
            <Input aria-label="Projected load" type="number" min="0" value={draft.projectedLoad} onChange={(e) => setDraft({ ...draft, projectedLoad: Number(e.target.value) || 0 })} />
            <Textarea aria-label="Operational notes" placeholder="Operational notes" value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} className="sm:col-span-2" />
            <div className="flex gap-2 sm:col-span-2"><Button type="submit">{editing ? "Save changes" : "Add member"}</Button>{editing && <Button type="button" variant="outline" onClick={() => { setEditing(null); setDraft(emptyDraft()); }}>Cancel</Button>}</div>
          </form></CardContent></Card>
          <Card><CardHeader><CardTitle className="flex items-center gap-2"><Bot className="h-5 w-5" />AI Assistant Orchestration Engine</CardTitle><p className="text-sm text-muted-foreground">Task-specific suggestions; AI does not change the roster or dispatch crew.</p></CardHeader><CardContent className="space-y-3"><Textarea aria-label="Task projection" value={task} onChange={(e) => setTask(e.target.value)} rows={3} /><Button onClick={requestSuggestions} disabled={busy}><Sparkles className="mr-2 h-4 w-4" />{busy ? "Analyzing…" : "Generate projections"}</Button>{suggestionMode && <Badge variant="outline">{suggestionMode}</Badge>}{suggestions.map((item, index) => <p key={`${index}-${item}`} className="rounded border p-3 text-sm">{item}</p>)}<p className="text-xs text-muted-foreground">Offline suggestions are generated locally from roster role, coverage, availability, and projected load.</p></CardContent></Card>
        </section>
        <section className="space-y-3"><div className="relative max-w-xl"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input aria-label="Search roster" placeholder="Search crew, service, area, or status" value={query} onChange={(e) => setQuery(e.target.value)} className="pl-9" /></div><div className="flex flex-wrap gap-2">{FILTERS.map((item) => <Button key={item} size="sm" variant={filter === item ? "default" : "outline"} onClick={() => setFilter(item)}>{item}</Button>)}</div></section>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{visibleRoster.map((member) => <Card key={member.id}><CardHeader><div className="flex items-start justify-between gap-2"><CardTitle className="flex items-center gap-2 text-base"><UserCheck className="h-4 w-4 text-primary" />{member.name}</CardTitle><Badge variant={member.status === "Available" ? "outline" : "default"}>{member.status}</Badge></div></CardHeader><CardContent className="space-y-3 text-sm"><p><Wrench className="mr-2 inline h-4 w-4" />{member.role} · {member.specialty}</p><p><MapPin className="mr-2 inline h-4 w-4" />{member.area}</p><p><Phone className="mr-2 inline h-4 w-4" />{member.phone}</p><p>{member.serviceFit}</p><p className="text-muted-foreground">Projected load: {member.projectedLoad} · {member.notes}</p><div className="flex gap-2"><Button size="sm" variant="outline" onClick={() => { const { id, ...values } = member; setEditing(id); setDraft(values); }}>Edit</Button><Button size="sm" variant="destructive" onClick={() => setRoster((current) => current.filter((item) => item.id !== member.id))}>Delete</Button></div></CardContent></Card>)}</div>
        {visibleRoster.length === 0 && <p className="rounded border border-dashed p-6 text-center text-sm text-muted-foreground">No roster matches.</p>}
        <p className="text-xs text-muted-foreground">Roster data is saved in this browser under the owner account and is not synchronized to other devices or clients.</p>
      </div>
    </main>
  );
}
