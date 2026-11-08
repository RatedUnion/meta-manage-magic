import { createFileRoute, Link } from "@tanstack/react-router";
import { Shield, Lock, FileText, CheckCircle2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — Dedicated Ultimatum Appointed Associates" },
      { name: "description", content: "Privacy Policy and data practices for Dedicated Ultimatum Appointed Associates (DUAA) in Trinidad & Tobago." },
      { property: "og:title", content: "Privacy Policy — DUAA" },
      { property: "og:description", content: "Data protection and privacy practices in compliance with Trinidad & Tobago data regulations." },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
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
            <Shield className="h-4 w-4" /> Compliance & Legal
          </div>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl text-foreground">
            Privacy Policy
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Effective Date: October 2026 · Trinidad & Tobago Jurisdiction
          </p>
        </div>

        <div className="space-y-6 text-sm text-foreground/90 leading-relaxed border rounded-xl p-6 sm:p-8 bg-card shadow-sm">
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" /> 1. Commitment to Data Minimization
            </h2>
            <p>
              Dedicated Ultimatum Appointed Associates ("DUAA", "we", "us") collects strictly the information necessary to fulfill operational service requests across Trinidad & Tobago (mobile mechanic repairs, electrical works, transport/towing, and reservations/landscaping).
            </p>
            <p>
              We only collect: contact details (Full Name, Phone number, Email address), site service location, vehicle or equipment diagnostic descriptions, and optionally uploaded photos or files required to scope the project.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Lock className="h-4 w-4 text-emerald-500" /> 2. Data Storage & Third-Party SDK Audit
            </h2>
            <p>
              Your data is stored within encrypted relational storage hosted on our secure cloud backend. Row-Level Security (RLS) ensures that unauthenticated public callers cannot read your personal service histories.
            </p>
            <p>
              Our application adheres to a strict third-party SDK audit:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
              <li><strong>Open-Meteo Weather API:</strong> Fetches local atmospheric coordinates to calculate dispatch safety. No personal data is sent.</li>
              <li><strong>Meta Graph API (Facebook):</strong> Used strictly by authorized administrators to post verified promo scripts with explicit approval.</li>
              <li><strong>No Third-Party Ad Trackers:</strong> We do not run external tracking pixels or data brokers.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <FileText className="h-4 w-4 text-emerald-500" /> 3. Data Retention & Deletion Rights
            </h2>
            <p>
              Under the Trinidad & Tobago Data Protection Act (DPA 2011) and international privacy frameworks, you retain full rights to request an export or complete erasure of your contact details and job history.
            </p>
            <p>
              To request immediate data deletion, visit our{" "}
              <Link to="/data-deletion" className="text-primary underline hover:opacity-80">
                Data Deletion Instructions
              </Link>{" "}
              or email our Data Controller directly at{" "}
              <a href="mailto:unionrated@gmail.com" className="text-primary underline">
                unionrated@gmail.com
              </a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
