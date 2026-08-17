import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import {
  Calendar,
  ClipboardList,
  GraduationCap,
  Truck,
  Wrench,
  Zap,
  ArrowRight,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SERVICES, serviceReference } from "@/data/services";

const SITE = "https://meta-manage-magic.lovable.app";

const ICONS = {
  wrench: Wrench,
  zap: Zap,
  calendar: Calendar,
  graduation: GraduationCap,
  truck: Truck,
  clipboard: ClipboardList,
} as const;

type SpecialtySlug = "online-booking" | "online-classes" | "delivery" | "reservations";

const SPECIALTY_FILTERS: { slug: SpecialtySlug; label: string }[] = [
  { slug: "online-booking", label: "Online booking" },
  { slug: "online-classes", label: "Online classes" },
  { slug: "delivery", label: "Delivery" },
  { slug: "reservations", label: "Reservations" },
];

const searchSchema = z.object({
  specialty: fallback(z.string(), "").default(""),
});

export const Route = createFileRoute("/services/")({
  validateSearch: zodValidator(searchSchema),
  head: () => {
    const title = "Services — Dedicated Ultimatum Appointed Associates";
    const description =
      "Browse all six service panes: mobile mechanic, electrician, online booking, online classes, delivery and reservations across Trinidad & Tobago.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { property: "og:url", content: `${SITE}/services/` },
      ],
      links: [{ rel: "canonical", href: `${SITE}/services/` }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ItemList",
            itemListElement: SERVICES.map((s, i) => ({
              "@type": "ListItem",
              position: i + 1,
              url: `${SITE}/services/${s.slug}`,
              name: s.title,
              description: s.tagline,
            })),
          }),
        },
      ],
    };
  },
  component: ServicesIndexPage,
});

function ServicesIndexPage() {
  const { specialty } = Route.useSearch();
  const navigate = useNavigate({ from: "/services/" });

  const filteredServices = specialty
    ? SERVICES.filter((s) => s.slug === specialty)
    : SERVICES;

  const activeSpecialty = SPECIALTY_FILTERS.find((f) => f.slug === specialty);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground text-sm">D</span>
            <span className="hidden sm:inline">Dedicated Ultimatum</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link to="/pay">
              <Button size="sm" variant="ghost">Pay</Button>
            </Link>
            <Link to="/book">
              <Button size="sm">Book now</Button>
            </Link>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-16 md:py-24">
        <div className="max-w-2xl">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Service directory</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight md:text-5xl">
            Six ways we can help
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Every service has its own pane with recommended structure, requirements, a scannable reference tag, and a downloadable build sheet.
          </p>
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-2">
          {SPECIALTY_FILTERS.map((filter) => {
            const isActive = specialty === filter.slug;
            return (
              <button
                key={filter.slug}
                type="button"
                onClick={() =>
                  navigate({
                    search: (prev) => ({
                      ...prev,
                      specialty: isActive ? "" : filter.slug,
                    }),
                  })
                }
                className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${
                  isActive
                    ? "border-accent bg-accent text-accent-foreground"
                    : "border-border bg-card text-muted-foreground hover:border-accent hover:text-foreground"
                }`}
              >
                {filter.label}
              </button>
            );
          })}
          {activeSpecialty && (
            <button
              type="button"
              onClick={() => navigate({ search: (prev) => ({ ...prev, specialty: "" }) })}
              className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-medium text-muted-foreground transition hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" /> Clear
            </button>
          )}
        </div>

        <p className="mt-4 text-sm text-muted-foreground">
          {filteredServices.length} {filteredServices.length === 1 ? "result" : "results"}
          {activeSpecialty && ` for “${activeSpecialty.label}”`}
        </p>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredServices.map((service) => {
            const Icon = ICONS[service.icon];
            const reference = serviceReference(service.code);
            return (
              <Link
                key={service.slug}
                to="/services/$slug"
                params={{ slug: service.slug }}
                className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition hover:-translate-y-0.5 hover:border-accent hover:shadow-[var(--shadow-soft)]"
              >
                <div className="relative aspect-[16/10] overflow-hidden">
                  <img
                    src={service.image}
                    alt={`${service.title} — Dedicated Ultimatum Appointed Associates`}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute left-4 top-4 grid h-9 w-9 place-items-center rounded-lg bg-background/90 text-foreground shadow-sm">
                    <Icon className="h-4 w-4" />
                  </div>
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold tracking-tight">{service.title}</h2>
                    <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      {reference}
                    </span>
                  </div>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                    {service.tagline}
                  </p>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-accent">
                    Open pane <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>

        {filteredServices.length === 0 && (
          <div className="mt-10 rounded-2xl border border-dashed border-border p-10 text-center">
            <p className="text-muted-foreground">No services match this filter.</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => navigate({ search: (prev) => ({ ...prev, specialty: "" }) })}
            >
              Show all services
            </Button>
          </div>
        )}
      </section>
    </main>
  );
}
