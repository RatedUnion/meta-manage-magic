import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/data-deletion")({
  head: () => ({ meta: [
    { title: "Data Deletion Requests — DUAA" },
    { name: "description", content: "Contact DUAA to request deletion of your personal data." },
    { property: "og:title", content: "Data Deletion Requests — DUAA" },
    { property: "og:description", content: "Request review and deletion of your DUAA contact and service records." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: () => <main className="mx-auto min-h-screen max-w-3xl space-y-6 px-6 py-12"><Link to="/" className="text-primary underline">Back to DUAA</Link><h1 className="text-3xl font-semibold">Request data deletion</h1><p>Email <a className="text-primary underline" href="mailto:unionrated@gmail.com?subject=Data%20deletion%20request">unionrated@gmail.com</a> with the contact details used for your booking or callback reminder and which records you want reviewed.</p><p>Do not send passwords, card numbers or identity documents. DUAA may need to verify your request and retain records required for legal or accounting obligations.</p><Link to="/privacy" className="text-primary underline">Privacy Policy</Link></main>,
});