import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  Clock3,
  MapPin,
  Phone,
  Search,
  UserCheck,
  Wrench,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/_authenticated/roster")({
  component: RosterPage,
  head: () => ({ meta: [{ title: "Technician Dispatch Roster — DUAA" }] }),
});

const TECHNICIANS = [
  {
    name: "Field Unit Alpha",
    specialty: "Mobile Mechanic (OBD & Brakes)",
    area: "San Fernando & South",
    status: "On-Call",
    phone: "+1 868-763-1106",
    serviceFit: "Vehicle diagnostics and brake work",
  },
  {
    name: "Field Unit Beta",
    specialty: "Commercial & Automotive Electrician",
    area: "Port of Spain & East-West Corridor",
    status: "Booked",
    phone: "+1 868-763-1106",
    serviceFit: "Electrical faults for commercial and automotive jobs",
  },
  {
    name: "Field Unit Gamma",
    specialty: "Grounds, Landscape & Floral Care",
    area: "Central Trinidad & Diego Martin",
    status: "Available",
    phone: "+1 868-763-1106",
    serviceFit: "Grounds maintenance, landscaping, and floral care",
  },
] as const;

const STATUS_FILTERS = ["All", "Available", "On-Call", "Booked"] as const;

type StatusFilter = (typeof STATUS_FILTERS)[number];

function RosterPage() {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");

  const filteredTechnicians = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return TECHNICIANS.filter((tech) => {
      const matchesStatus = statusFilter === "All" || tech.status === statusFilter;
      const matchesQuery =
        !needle ||
        [tech.name, tech.specialty, tech.area, tech.status, tech.serviceFit]
          .join(" ")
          .toLowerCase()
          .includes(needle);
      return matchesStatus && matchesQuery;
    });
  }, [query, statusFilter]);

  return (
    <main className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="outline" size="sm" asChild>
            <Link to="/bookings">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Crew Dispatch & Technician Roster</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Find the right crew, service coverage, and dispatch details for each job.
            </p>
          </div>
        </div>

        <section aria-label="Roster filters" className="space-y-3">
          <div className="relative max-w-xl">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search crew, service, location, or status"
              aria-label="Search roster"
              className="pl-9"
            />
          </div>
          <div className="flex flex-wrap gap-2" aria-label="Filter by availability">
            {STATUS_FILTERS.map((status) => (
              <Button
                key={status}
                type="button"
                size="sm"
                variant={statusFilter === status ? "default" : "outline"}
                aria-pressed={statusFilter === status}
                onClick={() => setStatusFilter(status)}
              >
                {status}
              </Button>
            ))}
          </div>
        </section>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredTechnicians.map((tech) => (
            <Card key={tech.name}>
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <UserCheck className="h-4 w-4 shrink-0 text-primary" />
                    {tech.name}
                  </CardTitle>
                  <Badge variant={tech.status === "Available" ? "outline" : "default"}>
                    {tech.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <dl className="space-y-3">
                  <div>
                    <dt className="flex items-center gap-2 font-medium text-foreground">
                      <Wrench className="h-4 w-4 text-primary" /> What
                    </dt>
                    <dd className="mt-1 pl-6 text-muted-foreground">{tech.specialty}</dd>
                  </div>
                  <div>
                    <dt className="flex items-center gap-2 font-medium text-foreground">
                      <MapPin className="h-4 w-4 text-primary" /> Where
                    </dt>
                    <dd className="mt-1 pl-6 text-muted-foreground">
                      <span className="block">Coverage: {tech.area}</span>
                      <span className="block">Job site: Confirm from booking</span>
                    </dd>
                  </div>
                  <div>
                    <dt className="font-medium text-foreground">Why this crew</dt>
                    <dd className="mt-1 text-muted-foreground">{tech.serviceFit}</dd>
                  </div>
                  <div>
                    <dt className="flex items-center gap-2 font-medium text-foreground">
                      <Phone className="h-4 w-4 text-primary" /> How to dispatch
                    </dt>
                    <dd className="mt-1 pl-6 text-muted-foreground">
                      <a className="hover:text-foreground" href={`tel:${tech.phone}`}>
                        {tech.phone}
                      </a>
                    </dd>
                  </div>
                  <div>
                    <dt className="flex items-center gap-2 font-medium text-foreground">
                      <Clock3 className="h-4 w-4 text-primary" /> Dispatch duration
                    </dt>
                    <dd className="mt-1 pl-6 text-muted-foreground">
                      Confirm based on the booking and job scope
                    </dd>
                  </div>
                </dl>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredTechnicians.length === 0 && (
          <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
            No crew match this search and availability filter.
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          Job site and dispatch duration are confirmed for each booking; no site or time estimate is assigned in this roster.
        </p>
      </div>
    </main>
  );
}
