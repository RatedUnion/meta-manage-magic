import { createFileRoute, Link } from "@tanstack/react-router";
import { UserCheck, Phone, MapPin, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/roster")({
  component: RosterPage,
  head: () => ({ meta: [{ title: "Technician Dispatch Roster — DUAA" }] }),
});

const TECHNICIANS = [
  { name: "Field Unit Alpha", specialty: "Mobile Mechanic (OBD & Brakes)", area: "San Fernando & South", status: "On-Call", phone: "+1 868-763-1106" },
  { name: "Field Unit Beta", specialty: "Commercial & Automotive Electrician", area: "Port of Spain & East-West Corridor", status: "Booked", phone: "+1 868-763-1106" },
  { name: "Field Unit Gamma", specialty: "Grounds, Landscape & Floral Care", area: "Central Trinidad & Diego Martin", status: "Available", phone: "+1 868-763-1106" },
];

function RosterPage() {
  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" asChild>
            <Link to="/bookings"><ArrowLeft className="w-4 h-4 mr-2" /> Back</Link>
          </Button>
          <h1 className="text-2xl font-bold">Crew Dispatch & Technician Roster</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {TECHNICIANS.map((tech, idx) => (
            <Card key={idx}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-primary" /> {tech.name}
                  </CardTitle>
                  <Badge variant={tech.status === "Available" ? "outline" : "default"}>{tech.status}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p className="text-foreground font-medium">{tech.specialty}</p>
                <p className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-primary" /> {tech.area}</p>
                <p className="flex items-center gap-1.5"><Phone className="w-4 h-4 text-primary" /> {tech.phone}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
