import mechanicImg from "@/assets/service-mechanic.jpg";
import electricianImg from "@/assets/service-electrician.jpg";
import bookingImg from "@/assets/service-booking.jpg";
import classesImg from "@/assets/service-classes.jpg";
import deliveryImg from "@/assets/service-delivery.jpg";
import reservationsImg from "@/assets/service-reservations.jpg";

export type SpecRow = {
  item: string;
  scope: string;
  turnaround: string;
  rate: string;
  notes: string;
};

export type ServiceDetail = {
  slug: string;
  code: string;
  title: string;
  icon: "wrench" | "zap" | "calendar" | "graduation" | "truck" | "clipboard";
  tagline: string;
  desc: string;
  image: string;
  intro: string;
  structure: { heading: string; body: string }[];
  requirements: string[];
  specs: SpecRow[];
};

export const SERVICES: ServiceDetail[] = [
  {
    slug: "mobile-mechanic",
    code: "MEC",
    title: "Mobile Mechanic",
    icon: "wrench",
    tagline: "Repairs, OEM parts, diagnostics — at your location.",
    desc: "Repairs, OEM parts installation, diagnostics and maintenance — we come to you.",
    image: mechanicImg,
    intro:
      "A fully equipped workshop that travels. We diagnose with scan tools, fit genuine OEM parts, and hand back a written report with every job reference logged.",
    structure: [
      { heading: "1. Intake", body: "Share vehicle make, model, year, mileage and symptoms. Photos or a short clip speed this up considerably." },
      { heading: "2. Diagnostic", body: "OBD-II scan, live data review, visual and road-test inspection. You get the fault codes in plain language." },
      { heading: "3. Quote & parts", body: "Itemised quote with OEM part numbers and lead time. No work starts before you approve it." },
      { heading: "4. On-site repair", body: "Work carried out at your home, office or roadside, with parts and labour warranty stated up front." },
      { heading: "5. Handover", body: "Post-repair test, service record and reference number issued for your file." },
    ],
    requirements: [
      "Vehicle registration, make, model and year",
      "Level, shaded space of roughly 3m x 5m",
      "Access to the key and, where relevant, wheel-lock adapter",
      "Photos of any leak, warning light or damaged component",
    ],
    specs: [
      { item: "OBD-II diagnostic scan", scope: "Fault code read, clear and live data", turnaround: "45 min", rate: "From TTD 250", notes: "Credited against repair" },
      { item: "Brake service", scope: "Pads, rotors, fluid bleed", turnaround: "2-3 hrs", rate: "Quote on inspection", notes: "OEM or OE-equivalent" },
      { item: "Battery & charging", scope: "Load test, alternator output, replace", turnaround: "60 min", rate: "From TTD 300", notes: "Old battery removed" },
      { item: "Oil & filter service", scope: "Engine oil, filter, fluid top-up", turnaround: "60 min", rate: "From TTD 400", notes: "Grade per manufacturer" },
      { item: "Suspension inspection", scope: "Bushings, shocks, alignment check", turnaround: "90 min", rate: "From TTD 350", notes: "Report included" },
      { item: "OEM parts sourcing", scope: "Part number match & supply", turnaround: "1-7 days", rate: "Cost + handling", notes: "Lead time confirmed at quote" },
    ],
  },
  {
    slug: "electrician",
    code: "ELE",
    title: "Electrician",
    icon: "zap",
    tagline: "Building and automotive electrical, done safely.",
    desc: "Building and automotive electrical work, troubleshooting and safe installs.",
    image: electricianImg,
    intro:
      "Domestic, commercial and automotive electrical work — from a nuisance breaker trip to a full circuit installation, tested and documented before we leave.",
    structure: [
      { heading: "1. Assessment", body: "Describe the fault or the install. We confirm supply type, load and access requirements." },
      { heading: "2. Safe isolation", body: "Circuits isolated and proved dead before any work begins. Non-negotiable." },
      { heading: "3. Fault finding", body: "Insulation resistance, continuity and load testing to locate the true cause, not the symptom." },
      { heading: "4. Install / repair", body: "Correct cable sizing, protection and terminations to recognised wiring standards." },
      { heading: "5. Test & certify", body: "Functional test, results recorded, and a job reference issued with the summary." },
    ],
    requirements: [
      "Property or vehicle address and access window",
      "Panel or fuse box location and photo where possible",
      "Description of what trips, fails or overheats",
      "Confirmation of supply: 115V / 230V, single or three phase",
    ],
    specs: [
      { item: "Fault finding", scope: "Trace and isolate circuit fault", turnaround: "1-2 hrs", rate: "From TTD 400", notes: "Report included" },
      { item: "Outlet / switch install", scope: "New point, cable run, test", turnaround: "1-2 hrs", rate: "From TTD 300", notes: "Per point" },
      { item: "Panel upgrade", scope: "Breakers, busbar, labelling", turnaround: "1 day", rate: "Quote on survey", notes: "Survey required" },
      { item: "Lighting installation", scope: "Fixtures, dimmers, exterior", turnaround: "2-4 hrs", rate: "From TTD 350", notes: "Fixtures client-supplied" },
      { item: "Automotive electrical", scope: "Wiring, alternators, accessories", turnaround: "2-5 hrs", rate: "From TTD 450", notes: "Fused and loomed" },
      { item: "Safety inspection", scope: "Bonding, earthing, RCD test", turnaround: "2 hrs", rate: "From TTD 500", notes: "Written results" },
    ],
  },
  {
    slug: "online-booking",
    code: "BKG",
    title: "Online Booking",
    icon: "calendar",
    tagline: "Reserve a slot in under two minutes.",
    desc: "Reserve your slot from anywhere, any time — confirmed in minutes.",
    image: bookingImg,
    intro:
      "One booking flow for every service we offer. Choose the work, pick a date and time, attach photos, and receive a reference number instantly.",
    structure: [
      { heading: "1. Choose a service", body: "Six categories, each mapped to the right technician and toolkit." },
      { heading: "2. Pick date & time", body: "Live availability, Monday to Saturday. Sundays are reserved for emergencies only." },
      { heading: "3. Attach detail", body: "Up to five photos of the fault, part or site so we arrive prepared." },
      { heading: "4. Confirm", body: "Name, phone and email verified, then a reference number is issued on screen." },
      { heading: "5. Reminder", body: "We reconfirm the day before and message you when the technician is en route." },
    ],
    requirements: [
      "Full name and a reachable phone number",
      "Email address for the written confirmation",
      "Service address or meeting point",
      "Photos of the issue where applicable",
    ],
    specs: [
      { item: "Standard booking", scope: "Any listed service", turnaround: "Instant", rate: "No fee", notes: "Reference issued" },
      { item: "Same-day slot", scope: "Subject to availability", turnaround: "Under 4 hrs", rate: "Priority rate", notes: "Call to confirm" },
      { item: "Reschedule", scope: "Move date or time", turnaround: "Instant", rate: "Free up to 12 hrs prior", notes: "Once per booking" },
      { item: "Cancellation", scope: "Cancel a confirmed slot", turnaround: "Instant", rate: "Free up to 12 hrs prior", notes: "Late cancels may be charged" },
      { item: "Multi-visit job", scope: "Recurring or staged work", turnaround: "Planned", rate: "Quoted", notes: "Schedule agreed in writing" },
    ],
  },
  {
    slug: "online-classes",
    code: "CLS",
    title: "Online Classes",
    icon: "graduation",
    tagline: "Live and on-demand technical instruction.",
    desc: "Live and on-demand sessions built around real learning outcomes.",
    image: classesImg,
    intro:
      "Practical, camera-first sessions on vehicle maintenance, electrical safety and workshop fundamentals. Small groups, recorded, with notes you keep.",
    structure: [
      { heading: "1. Select a track", body: "Vehicle basics, diagnostics, electrical safety, or a bespoke syllabus for your team." },
      { heading: "2. Placement", body: "A short pre-call sets the level so nobody is bored or lost." },
      { heading: "3. Live session", body: "60 to 90 minutes, camera on the work, questions welcomed throughout." },
      { heading: "4. Materials", body: "Slides, checklists and the recording released within 24 hours." },
      { heading: "5. Assessment", body: "Optional practical check and a certificate of completion with a reference number." },
    ],
    requirements: [
      "Stable internet connection, 5 Mbps or better",
      "Device with camera and microphone",
      "Preferred track and experience level",
      "For teams: headcount and time zone",
    ],
    specs: [
      { item: "Single live class", scope: "One 90-minute session", turnaround: "Scheduled", rate: "From TTD 200", notes: "Recording included" },
      { item: "Four-week track", scope: "Four live sessions + notes", turnaround: "4 weeks", rate: "From TTD 700", notes: "Small group" },
      { item: "Private tuition", scope: "One-to-one, tailored", turnaround: "By arrangement", rate: "From TTD 400/hr", notes: "Flexible hours" },
      { item: "Team workshop", scope: "Up to 12 participants", turnaround: "Half or full day", rate: "Quoted", notes: "Certificates issued" },
      { item: "On-demand library", scope: "Recorded modules", turnaround: "Instant access", rate: "From TTD 150", notes: "12-month access" },
    ],
  },
  {
    slug: "delivery",
    code: "DEL",
    title: "Delivery",
    icon: "truck",
    tagline: "Tracked delivery across the twin islands.",
    desc: "Reliable, tracked delivery across the twin islands.",
    image: deliveryImg,
    intro:
      "Parts, documents and parcels moved with a tracked reference from pickup to signature. Same-day options across the north-west corridor.",
    structure: [
      { heading: "1. Book the run", body: "Pickup and drop-off addresses, contact names, and the window that suits you." },
      { heading: "2. Collection", body: "Item checked, photographed and labelled with its reference and barcode." },
      { heading: "3. In transit", body: "Status updates by message at collection, en route and on arrival." },
      { heading: "4. Delivery", body: "Handed to the named recipient with a signature and photo confirmation." },
      { heading: "5. Proof", body: "Delivery record retained and sent to you against the same reference." },
    ],
    requirements: [
      "Pickup and delivery address with contact numbers",
      "Parcel dimensions and approximate weight",
      "Declared value for anything fragile or high value",
      "Preferred collection window",
    ],
    specs: [
      { item: "Standard parcel", scope: "Up to 10 kg, within POS", turnaround: "Same day", rate: "From TTD 60", notes: "Tracked" },
      { item: "Islandwide", scope: "Up to 10 kg, T&T", turnaround: "1-2 days", rate: "From TTD 120", notes: "Zone dependent" },
      { item: "Express run", scope: "Direct, no consolidation", turnaround: "Under 3 hrs", rate: "From TTD 200", notes: "Subject to traffic" },
      { item: "Parts collection", scope: "Supplier pickup on your behalf", turnaround: "Same day", rate: "From TTD 100", notes: "Invoice matched" },
      { item: "Documents", scope: "Sealed envelope, signature", turnaround: "Same day", rate: "From TTD 50", notes: "Chain of custody logged" },
    ],
  },
  {
    slug: "reservations",
    code: "RES",
    title: "Reservations",
    icon: "clipboard",
    tagline: "Landscaping, exterior decor, gardens & reserved slots.",
    desc: "Landscaping, exterior decor, garden and floral maintenance — plus effortless reservations with clear communication.",
    image: reservationsImg,
    intro:
      "Green spaces and reserved slots handled end to end. We design and install landscaping, dress exteriors with decor, keep gardens and florals maintained, and hold the table, venue or technician slot — one reference covers the whole arrangement.",
    structure: [
      { heading: "1. Site brief", body: "Photos or a walk-through of the space, its size, and what you want it to look and feel like — or the venue, date and party size you need held." },
      { heading: "2. Plan & options", body: "A shortlist of planting schemes, decor setups, maintenance schedules or venues, with cost and availability in one message." },
      { heading: "3. Hold & schedule", body: "We place the hold, order plants and materials, and confirm terms, deposits and cut-off dates in writing." },
      { heading: "4. Install & confirm", body: "Landscaping or decor installed on the agreed day; reservations locked with a reference number you can quote to anyone." },
      { heading: "5. Aftercare", body: "Recurring garden and floral maintenance, plus changes, additions and cancellations handled against the same reference." },
    ],
    requirements: [
      "Property address and photos of the outdoor space",
      "Approximate square footage or bed dimensions",
      "Style preference and budget range",
      "For reservations: date, time window and party size",
      "Any accessibility, watering or sunlight constraints",
    ],
    specs: [
      { item: "Landscaping design & install", scope: "Planting beds, lawns, edges, mulch", turnaround: "3-7 days", rate: "Quoted per site", notes: "Plan approved first" },
      { item: "Garden maintenance visit", scope: "Weeding, pruning, trimming, clean-up", turnaround: "2-4 hrs", rate: "From TTD 250", notes: "Monthly plans available" },
      { item: "Floral & plant care", scope: "Beds, planters, seasonal refresh", turnaround: "1-3 hrs", rate: "From TTD 180", notes: "Plants at cost + handling" },
      { item: "Exterior decor setup", scope: "Lighting, planters, staging, dressing", turnaround: "3-6 hrs", rate: "From TTD 300", notes: "Event or permanent" },
      { item: "Standard reservation", scope: "Single venue, one date", turnaround: "Within 24 hrs", rate: "From TTD 100", notes: "Reference issued" },
      { item: "Group booking", scope: "10+ guests", turnaround: "1-3 days", rate: "From TTD 250", notes: "Deposit may apply" },
    ],
  },
];

export function getService(slug: string) {
  return SERVICES.find((s) => s.slug === slug);
}

/** Deterministic, SSR-safe reference number for a service pane. */
export function serviceReference(code: string) {
  let hash = 7;
  for (const ch of code) hash = (hash * 31 + ch.charCodeAt(0)) % 9973;
  return `DUA-${code}-${String(hash).padStart(4, "0")}`;
}

export const FACEBOOK_URL = "https://facebook.com/org.tt";
export const DISCORD_URL = "https://discord.gg/nCh28K3";
