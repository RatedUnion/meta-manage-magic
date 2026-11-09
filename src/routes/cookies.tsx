import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/cookies")({
  head: () => ({ meta: [
    { title: "Cookie Policy — DUAA" },
    { name: "description", content: "DUAA's essential cookies and saved site preferences." },
    { property: "og:title", content: "Cookie Policy — DUAA" },
    { property: "og:description", content: "Essential authentication and site preference storage for DUAA." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: () => <main className="mx-auto min-h-screen max-w-3xl space-y-6 px-6 py-12"><Link to="/" className="text-primary underline">Back to DUAA</Link><h1 className="text-3xl font-semibold">Cookie Policy</h1><p>DUAA uses essential browser storage for staff sign-in and site preferences, including cookie choices and the owner’s view-mode preference.</p><p>You can clear saved preferences through your browser settings. Clearing authentication storage will sign you out.</p><Link to="/privacy" className="text-primary underline">Privacy Policy</Link></main>,
});