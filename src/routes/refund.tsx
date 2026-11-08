import { createFileRoute, Link } from "@tanstack/react-router";
import { RefreshCw, DollarSign, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/refund")({
  head: () => ({
    meta: [
      { title: "Refund Policy — Dedicated Ultimatum Appointed Associates" },
      { name: "description", content: "Refund Policy and appointment fee deposit terms for DUAA services." },
    ],
  }),
  component: RefundPage,
});

function RefundPage() {
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
            <RefreshCw className="h-4 w-4" /> Billing & Guarantee
          </div>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl text-foreground">
            Refund & Cancellation Policy
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Clear guidelines regarding deposits, payments, and cancellations
          </p>
        </div>

        <div className="space-y-6 text-sm text-foreground/90 leading-relaxed border rounded-xl p-6 sm:p-8 bg-card shadow-sm">
          <section className="space-y-2">
            <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-emerald-500" /> Appointment Fee (TTD $110)
            </h2>
            <p>
              Every booking booked through DUAA includes a non-negotiable TTD $110 appointment confirmation fee. This deposit locks your assigned technician or crew into our schedule.
            </p>
            <p className="text-muted-foreground">
              When the associate arrives on-site and executes the agreed service, this entire TTD $110 is directly applied as a credit towards your final labor invoice.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">Cancellation Windows</h2>
            <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
              <li><strong>Notice greater than 24 hours:</strong> If you cancel or reschedule more than 24 hours before your scheduled window, your TTD $110 deposit is fully refundable or transferable.</li>
              <li><strong>Notice under 24 hours / Crew Dispatched:</strong> If cancelled within 24 hours of the appointment or after travel dispatch, the TTD $110 deposit is non-refundable to cover crew fuel and reserved scheduling.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">Workmanship & Disputes</h2>
            <p>
              If a repair or maintenance task falls short of the agreed scope, notify our management within 48 hours via our{" "}
              <Link to="/feedback" className="text-primary underline">
                Reviews & Complaints portal
              </Link>
              . We will dispatch a senior associate to inspect and rectify the issue without additional diagnostic fees.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
