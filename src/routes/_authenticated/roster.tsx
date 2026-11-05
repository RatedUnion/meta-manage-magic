import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowLeft, MapPin, Phone, Search, UserCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useViewMode } from "@/lib/view-mode";

export const Route = createFileRoute("/_authenticated/roster")({
  component: RosterPage,
  head: () => ({ meta: [{ title: "Crew & Service-Area Roster — DUAA" }] }),
});

const TECHNICIANS = [
  { name: "Field Unit Alpha", specialty: "Mobile mechanic · OBD diagnostics & brakes", area: "San Fernando & South Trinidad", status: "On-call", phone: "+1 868-763-1106" },
  { name: "Field Unit Beta", specialty: "Commercial & automotive electrical", area: "Port of Spain & East-West Corridor", status: "Booked", phone: "+1 868-763-1106" },
  { name: "Field Unit Gamma", specialty: "Grounds, landscaping & floral care", area: "Central Trinidad & Diego Martin", status: "Available", phone: "+1 868-763-1106" },
  { name: "Twin-Island Coordination", specialty: "Delivery, towing & service enquiries", area: "Trinidad & Tobago · confirm trip availability", status: "Contact to confirm", phone: "+1 868-763-1106" },
] as const;

function RosterPage() {
  const { viewOnly } = useViewMode();
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return TECHNICIANS;
    return TECHNICIANS.filter((tech) => `${tech.name} ${tech.specialty} ${tech.area} ${tech.status}`.toLowerCase().includes(term));
  }, [query]);

  return (
    <main className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" asChild><Link to="/bookings"><ArrowLeft className="mr-2 h-4 w-4" />Bookings</Link></Button>
            <div>
              <h1 className="text-2xl font-bold">Crew & service-area roster</h1>
              <p className="mt-1 text-sm text-muted-foreground">Dispatch reference for Trinidad & Tobago.</p>
            </div>
          </div>
          <Button size="sm" variant="outline" asChild><a href="tel:+18687631106"><Phone className="mr-2 h-4 w-4" />Confirm availability</a></Button>
        </header>

        <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-sm text-muted-foreground">
          Roster information is a dispatch reference, not live GPS or availability data. Call to confirm crew, coverage, and timing before promising a dispatch.
        </div>

        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Filter by crew, specialty, area, or status" className="pl-9" />
        </div>

        {filtered.length ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {filtered.map((tech) => (
              <Card key={tech.name}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <CardTitle className="flex items-center gap-2 text-base"><UserCheck className="h-4 w-4 text-primary" />{tech.name}</CardTitle>
                    <Badge variant={tech.status === "Available" ? "outline" : "secondary"}>{tech.status}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <p className="font-medium">{tech.specialty}</p>
                  <p className="flex items-start gap-2 text-muted-foreground"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />{tech.area}</p>
                  <a href={`tel:${tech.phone.replace(/\s/g, "")}`} className="inline-flex items-center gap-2 text-primary underline-offset-4 hover:underline"><Phone className="h-4 w-4" />{tech.phone}</a>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">No roster entries match “{query}”.</p>}
        {viewOnly && <p className="text-xs text-muted-foreground">Affiliate view is read-only.</p>}
      </div>
    </main>
  );
}
