import { createFileRoute } from "@tanstack/react-router";
import { Calendar, GraduationCap, Truck, ClipboardList, Phone, Mail, MapPin, Users, ArrowRight } from "lucide-react";
import heroImage from "@/assets/hero-trinidad.jpg";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      {
        property: "og:image",
        content:
          "https://id-preview--ec505fba-f8b5-455f-aa0d-4a8ee19005e2.lovable.app/og-image.jpg",
      },
    ],
  }),
});

const services = [
  { icon: Calendar, title: "Online Booking", desc: "Reserve your slot from anywhere, any time — confirmed in minutes." },
  { icon: GraduationCap, title: "Online Classes", desc: "Live and on-demand sessions built around real learning outcomes." },
  { icon: Truck, title: "Delivery", desc: "Reliable, tracked delivery across the twin islands." },
  { icon: ClipboardList, title: "Reservations", desc: "Effortless reservations with clear, honest communication." },
];

const locations = [
  "Downtown", "Port of Spain", "Newtown", "Cocorite", "Chaguanas", "San Fernando",
];

function Index() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* NAV */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <a href="#top" className="flex items-center gap-2 font-semibold tracking-tight">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground text-sm">D</span>
            <span className="hidden sm:inline">Dedicated Ultimatum</span>
          </a>
          <nav className="hidden gap-8 text-sm text-muted-foreground md:flex">
            <a href="#services" className="hover:text-foreground">Services</a>
            <a href="#about" className="hover:text-foreground">About</a>
            <a href="#locations" className="hover:text-foreground">Locations</a>
            <a href="#contact" className="hover:text-foreground">Contact</a>
          </nav>
          <a href="#contact">
            <Button size="sm">Get in touch</Button>
          </a>
        </div>
      </header>

      {/* HERO */}
      <section id="top" className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={heroImage}
            alt="Trinidad and Tobago coastline at golden hour"
            width={1920}
            height={1280}
            className="h-full w-full object-cover"
          />
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(135deg, oklch(0.2 0.05 255 / 0.85), oklch(0.28 0.07 255 / 0.7))" }}
          />
        </div>
        <div className="relative mx-auto max-w-6xl px-6 py-28 md:py-40">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary-foreground/20 bg-primary-foreground/10 px-3 py-1 text-xs uppercase tracking-widest text-primary-foreground/90 backdrop-blur">
            Virtual · Trinidad & Tobago
          </p>
          <h1 className="max-w-3xl text-4xl font-semibold leading-[1.05] tracking-tight text-primary-foreground sm:text-5xl md:text-6xl">
            Dedicated. Appointed. <span className="text-accent">Delivered.</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-primary-foreground/80">
            Dedicated Ultimatum Appointed Associates — booking, classes, delivery and
            reservations for people who value follow-through. Serving the twin islands, virtually.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <a href="#contact">
              <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
                Book a call <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </a>
            <a href="#services">
              <Button size="lg" variant="outline" className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground">
                Explore services
              </Button>
            </a>
          </div>
          <div className="mt-16 flex flex-wrap items-center gap-x-8 gap-y-3 text-sm text-primary-foreground/70">
            <span className="flex items-center gap-2"><Users className="h-4 w-4" /> 118 followers</span>
            <span className="hidden h-1 w-1 rounded-full bg-primary-foreground/30 sm:inline-block" />
            <span>Online booking · Classes · Delivery · Reservations</span>
          </div>
        </div>
      </section>

      {/* ABOUT / QUOTES */}
      <section id="about" className="mx-auto max-w-6xl px-6 py-24">
        <div className="grid gap-16 md:grid-cols-12">
          <div className="md:col-span-4">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">About</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
              Curiosity first. Craft always.
            </h2>
          </div>
          <div className="md:col-span-8 md:pl-8">
            <p className="text-lg leading-relaxed text-muted-foreground">
              We're a small, virtual practice grounded in one idea: show up, do the work, and be
              accountable for the outcome. Whether you're booking a class, scheduling a delivery,
              or reserving a slot — you get people who take the appointment seriously.
            </p>
            <div className="mt-10 space-y-8 border-l-2 border-accent pl-6">
              <blockquote>
                <p className="text-xl italic text-foreground">
                  "I have no special talents. I am only passionately curious."
                </p>
                <footer className="mt-2 text-sm text-muted-foreground">— Albert Einstein</footer>
              </blockquote>
              <blockquote>
                <p className="text-xl italic text-foreground">
                  "If I have seen further it is by standing on the shoulders of giants."
                </p>
                <footer className="mt-2 text-sm text-muted-foreground">— Sir Isaac Newton</footer>
              </blockquote>
            </div>
          </div>
        </div>
      </section>

      {/* SERVICES */}
      <section id="services" className="border-y border-border bg-secondary/50">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground">Services</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
                Four ways we work with you
              </h2>
            </div>
            <p className="max-w-md text-muted-foreground">
              Everything is delivered virtually — no waiting rooms, no missed slots, no fine print.
            </p>
          </div>

          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {services.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="group rounded-2xl border border-border bg-card p-6 transition hover:-translate-y-0.5 hover:border-accent hover:shadow-[var(--shadow-soft)]"
              >
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary text-primary-foreground">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 text-lg font-semibold tracking-tight">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* LOCATIONS */}
      <section id="locations" className="mx-auto max-w-6xl px-6 py-24">
        <div className="grid gap-12 md:grid-cols-12">
          <div className="md:col-span-5">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Where we serve</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
              Across Trinidad & Tobago
            </h2>
            <p className="mt-4 text-muted-foreground">
              Virtual by default, local by choice. We coordinate with clients in every major
              town on the island.
            </p>
          </div>
          <div className="md:col-span-7">
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {locations.map((loc) => (
                <li
                  key={loc}
                  className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-3 text-sm"
                >
                  <MapPin className="h-4 w-4 text-accent" />
                  <span>{loc}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section id="contact" className="relative overflow-hidden">
        <div className="absolute inset-0" style={{ background: "var(--gradient-hero)" }} />
        <div className="relative mx-auto max-w-6xl px-6 py-24 text-primary-foreground">
          <div className="grid gap-12 md:grid-cols-2 md:items-center">
            <div>
              <p className="text-xs uppercase tracking-widest text-primary-foreground/70">Contact</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
                Ready when you are.
              </h2>
              <p className="mt-4 max-w-md text-primary-foreground/80">
                Send a message or call directly. We answer within one business day —
                usually much sooner.
              </p>
            </div>
            <div className="space-y-4">
              <a
                href="tel:+18687631106"
                className="flex items-center justify-between gap-4 rounded-xl border border-primary-foreground/20 bg-primary-foreground/5 px-5 py-4 backdrop-blur transition hover:bg-primary-foreground/10"
              >
                <span className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-accent" />
                  <span>
                    <span className="block text-xs uppercase tracking-wider text-primary-foreground/60">Phone</span>
                    <span className="text-lg font-medium">+1 868-763-1106</span>
                  </span>
                </span>
                <ArrowRight className="h-4 w-4 opacity-60" />
              </a>
              <a
                href="mailto:delegated@live.com"
                className="flex items-center justify-between gap-4 rounded-xl border border-primary-foreground/20 bg-primary-foreground/5 px-5 py-4 backdrop-blur transition hover:bg-primary-foreground/10"
              >
                <span className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-accent" />
                  <span>
                    <span className="block text-xs uppercase tracking-wider text-primary-foreground/60">Email</span>
                    <span className="text-lg font-medium">delegated@live.com</span>
                  </span>
                </span>
                <ArrowRight className="h-4 w-4 opacity-60" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-border bg-background">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-10 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} Dedicated Ultimatum Appointed Associates</p>
          <p>Virtual services · Trinidad & Tobago</p>
        </div>
      </footer>
    </main>
  );
}
