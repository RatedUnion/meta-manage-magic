import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import {
  ArrowLeft,
  Calendar,
  ClipboardList,
  GraduationCap,
  Truck,
  Wrench,
  Zap,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CodeTag } from "@/components/CodeTag";
import { SpecSheet } from "@/components/SpecSheet";
import { getService, serviceReference, SERVICES, PRICING_TIERS, PRICING_NOTE } from "@/data/services";

const SITE = "https://meta-manage-magic.lovable.app";

const ICONS = {
  wrench: Wrench,
  zap: Zap,
  calendar: Calendar,
  graduation: GraduationCap,
  truck: Truck,
  clipboard: ClipboardList,
} as const;

export const Route = createFileRoute("/services/$slug")({
  loader: ({ params }) => {
    const service = getService(params.slug);
    if (!service) throw notFound();
    return { service };
  },
  head: ({ params, loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: "Service not found — Dedicated Ultimatum" }, { name: "robots", content: "noindex" }] };
    }
    const s = loaderData.service;
    const title = `${s.title} — Dedicated Ultimatum Appointed Associates`;
    const description = `${s.tagline} ${s.desc}`.slice(0, 155);
    const url = `${SITE}/services/${params.slug}`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "article" },
        { property: "og:url", content: url },
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Service",
            name: s.title,
            description,
            serviceType: s.title,
            areaServed: "Trinidad and Tobago",
            provider: { "@type": "Organization", name: "Dedicated Ultimatum Appointed Associates", telephone: "+1 868-763-1106" },
            url,
          }),
        },
      ],
    };
  },
  notFoundComponent: ServiceNotFound,
  component: ServicePage,
});

function ServiceNotFound() {
  return (
    <main className="mx-auto grid min-h-screen max-w-2xl place-items-center px-6 text-center">
      <div>
        <h1 className="text-2xl font-semibold">Service pane not found</h1>
        <p className="mt-2 text-muted-foreground">That reference doesn’t match any of our six services.</p>
        <Link to="/" className="mt-6 inline-block">
          <Button>Back to home</Button>
        </Link>
      </div>
    </main>
  );
}

function ServicePage() {
  const { service } = Route.useLoaderData();
  const Icon = ICONS[service.icon];
  const reference = serviceReference(service.code);
  const others = SERVICES.filter((s) => s.slug !== service.slug);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Home
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

      <article className="mx-auto max-w-5xl px-6 py-10">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
            <Icon className="h-5 w-5" />
          </span>
          <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            {service.code} · {reference}
          </span>
        </div>

        <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">{service.title}</h1>
        <p className="mt-2 text-lg text-muted-foreground">{service.tagline}</p>

        <figure className="mt-8 overflow-hidden rounded-3xl border border-border">
          <img
            src={service.image}
            alt={`${service.title} — Dedicated Ultimatum Appointed Associates`}
            className="h-64 w-full object-cover sm:h-96"
            loading="lazy"
          />
        </figure>

        <p className="mt-8 max-w-3xl text-base leading-relaxed text-muted-foreground">{service.intro}</p>

        <section className="mt-10">
          <h2 className="text-xl font-semibold tracking-tight">Recommended structure</h2>
          <ol className="mt-4 grid gap-4 sm:grid-cols-2">
            {service.structure.map((step) => (
              <li key={step.heading} className="rounded-2xl border border-border bg-card p-5">
                <h3 className="text-sm font-semibold">{step.heading}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{step.body}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="mt-10 grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-5">
            <h2 className="text-xl font-semibold tracking-tight">What we need from you</h2>
            <ul className="mt-4 space-y-2">
              {service.requirements.map((req) => (
                <li key={req} className="flex gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                  <span>{req}</span>
                </li>
              ))}
            </ul>
          </div>
          <CodeTag value={`${SITE}/services/${service.slug}`} reference={reference} />
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-semibold tracking-tight">Pricing</h2>
          <p className="mt-2 text-sm text-muted-foreground">{PRICING_NOTE}</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {PRICING_TIERS.map((tier) => (
              <div key={tier.label} className="rounded-2xl border border-accent/50 bg-accent/10 p-5">
                <p className="text-xs uppercase tracking-widest text-muted-foreground">{tier.label}</p>
                <p className="mt-1 text-xl font-semibold tracking-tight">{tier.headline}</p>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{tier.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-10">
          <SpecSheet title={service.title} reference={reference} rows={service.specs} />
        </section>

        <section className="mt-10 flex flex-wrap gap-3">
          <Link to="/book">
            <Button>Book {service.title.toLowerCase()}</Button>
          </Link>
          <a href="tel:+18687631106">
            <Button variant="outline">Call +1 868-763-1106</Button>
          </a>
        </section>

        <section className="mt-12 border-t border-border pt-8">
          <h2 className="text-sm uppercase tracking-widest text-muted-foreground">Other services</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {others.map((s) => (
              <Link
                key={s.slug}
                to="/services/$slug"
                params={{ slug: s.slug }}
                className="rounded-full border border-border px-4 py-1.5 text-sm transition hover:bg-secondary"
              >
                {s.title}
              </Link>
            ))}
          </div>
        </section>
      </article>
    </main>
  );
}
