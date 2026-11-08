import { createFileRoute, Link } from "@tanstack/react-router";
import { Scale, AlertCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service — Dedicated Ultimatum Appointed Associates" },
      { name: "description", content: "Terms of Service and operational criteria for DUAA mobile services in Trinidad & Tobago." },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-8">
        <div>
          <Button variant="ghost" size="sm" asChild className="mb-4">
            <Link to="/">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
            </Link>
          </Button>
          <div className="flex items-center gap-2 text-primary font-mono text-sm uppercase tracking-wider">
            <Scale className="h-4 w-4" /> Operational Agreement
          </div>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl text-foreground">
            Terms of Service
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Last Updated: October 2026 · Dedicated Ultimatum Appointed Associates
          </p>
        </div>

        <div className="space-y-6 text-sm text-foreground/90 leading-relaxed border rounded-xl p-6 sm:p-8 bg-card shadow-sm">
          <section className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">1. Service Scope & Operational Area</h2>
            <p>
              DUAA provides on-site mobile mechanic services, certified automotive & building electrical works, transport/towing, and reservations (landscaping, exterior decor, garden/floral maintenance) throughout Trinidad & Tobago.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">2. Transparent Pricing & No Hidden Fees</h2>
            <p>
              All projects adhere to our verified pricing schedule:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
              <li><strong>Domestic Services:</strong> Base labor starts from TTD $400.</li>
              <li><strong>Commercial Projects:</strong> Minimum rate starts at TTD $1,200, covering a 1 to 2-person specialized crew.</li>
              <li><strong>Transport & Towing:</strong> Sold and quoted separately according to vehicle weight and transit distance.</li>
              <li><strong>Appointment Fee:</strong> Every booking requires a non-negotiable deposit of TTD $110, credited towards final labor upon job completion.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">3. Site Access & Safety</h2>
            <p>
              Clients must ensure safe and legal access to the vehicle, structure, or grounds where work is to be performed. Our associates reserve the right to suspend operations if on-site electrical hazards, severe weather, or uncontained domestic animals compromise crew safety.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">4. No Unsupported Claims</h2>
            <p>
              All diagnostics, repair schedules, and component installations are scoped to OEM specifications. We make no false or speculative claims regarding repairs that require specialized workshop heavy machinery outside mobile scope.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
