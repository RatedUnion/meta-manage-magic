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

export type ServicePerk = {
  id: string;
  name: string;
  description: string;
  valueTTD: number;
};

export type ServiceCombo = {
  id: string;
  name: string;
  serviceSlug: string;
  description: string;
  basePriceTTD: number;
  discountedPriceTTD: number;
  perksIncluded: string[];
  suggestedAddon?: string;
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
    tagline: "Repairs, OEM parts, diagnostics & on-site recovery — at your location.",
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
      { item: "OBD-II diagnostic scan", scope: "Fault code read, clear and live data", turnaround: "45 min", rate: "From TTD 400", notes: "Credited against repair" },
      { item: "Brake service", scope: "Pads, rotors, fluid bleed", turnaround: "2-3 hrs", rate: "From TTD 450", notes: "OEM or OE-equivalent" },
      { item: "Battery & charging", scope: "Load test, alternator output, replace", turnaround: "60 min", rate: "From TTD 450", notes: "Old battery removed" },
      { item: "Oil & filter service", scope: "Engine oil, filter, fluid top-up", turnaround: "60 min", rate: "From TTD 550", notes: "Grade per manufacturer" },
      { item: "Suspension inspection", scope: "Bushings, shocks, alignment check", turnaround: "90 min", rate: "From TTD 500", notes: "Report included" },
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
      { item: "Fault finding", scope: "Trace and isolate circuit fault", turnaround: "1-2 hrs", rate: "From TTD 550", notes: "Report included" },
      { item: "Outlet / switch install", scope: "New point, cable run, test", turnaround: "1-2 hrs", rate: "From TTD 450", notes: "Per point" },
      { item: "Panel upgrade", scope: "Breakers, busbar, labelling", turnaround: "1 day", rate: "Quote on survey", notes: "Survey required" },
      { item: "Lighting installation", scope: "Fixtures, dimmers, exterior", turnaround: "2-4 hrs", rate: "From TTD 500", notes: "Fixtures client-supplied" },
      { item: "Automotive electrical", scope: "Wiring, alternators, accessories", turnaround: "2-5 hrs", rate: "From TTD 600", notes: "Fused and loomed" },
      { item: "Safety inspection", scope: "Bonding, earthing, RCD test", turnaround: "2 hrs", rate: "From TTD 650", notes: "Written results" },
    ],
  },
  {
    slug: "online-booking",
    code: "BKG",
    title: "Online Booking Consultation",
    icon: "calendar",
    tagline: "Reserve a slot and scope your project in under two minutes.",
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
      { item: "Single live class", scope: "One 90-minute session", turnaround: "Scheduled", rate: "From TTD 350", notes: "Recording included" },
      { item: "Four-week track", scope: "Four live sessions + notes", turnaround: "4 weeks", rate: "From TTD 850", notes: "Small group" },
      { item: "Private tuition", scope: "One-to-one, tailored", turnaround: "By arrangement", rate: "From TTD 550/hr", notes: "Flexible hours" },
      { item: "Team workshop", scope: "Up to 12 participants", turnaround: "Half or full day", rate: "Quoted", notes: "Certificates issued" },
      { item: "On-demand library", scope: "Recorded modules", turnaround: "Instant access", rate: "From TTD 300", notes: "12-month access" },
    ],
  },
  {
    slug: "delivery",
    code: "DEL",
    title: "Transport & Towing",
    icon: "truck",
    tagline: "Dedicated equipment transport, flatbed towing & parcel logistics.",
    desc: "Sold separately: vehicle towing, plant & equipment transport, and tracked twin-island deliveries.",
    image: deliveryImg,
    intro:
      "Dedicated transport and towing sold separately from repair services. Whether you require flatbed towing for a breakdown, parts haulage from suppliers, or scheduled cargo moves across Trinidad & Tobago, our logistics fleet operates with strict chain-of-custody logging.",
    structure: [
      { heading: "1. Dispatch request", body: "Pickup and destination points, vehicle or cargo specs, and urgency level." },
      { heading: "2. Fleet assignment", body: "Flatbed wrecker, cargo van, or dispatch runner allocated with equipment suited to the load." },
      { heading: "3. Rigging & load check", body: "Condition recorded with high-res photos and safe winching or tie-down before moving." },
      { heading: "4. Live tracking", body: "Continuous status alerts from pickup through arrival." },
      { heading: "5. Destination handover", body: "Signature confirmation, offload inspection, and reference documentation provided." },
    ],
    requirements: [
      "Exact pickup and delivery/drop-off coordinates",
      "Vehicle make/model or cargo dimensions and tonnage",
      "Operational status (e.g. rolling, steering, locked wheels)",
      "Contact names and active numbers at both ends",
    ],
    specs: [
      { item: "Flatbed wrecker towing (local)", scope: "Within Port of Spain & environs", turnaround: "Under 90 min", rate: "From TTD 450", notes: "Winching included" },
      { item: "Long-distance vehicle transport", scope: "Cross-island (POS to San Fernando / Mayaro)", turnaround: "Scheduled", rate: "From TTD 750", notes: "Secured wheel straps" },
      { item: "Heavy equipment & machinery transport", scope: "Skid steers, generators, tillers", turnaround: "Same/next day", rate: "From TTD 900", notes: "Ramped flatbed" },
      { item: "Express parts haulage", scope: "Direct supplier-to-site courier", turnaround: "Under 2 hrs", rate: "From TTD 300", notes: "Invoice matching" },
      { item: "Standard parcel courier", scope: "Up to 10 kg doorstep delivery", turnaround: "Same day", rate: "From TTD 210", notes: "Barcode tracking" },
    ],
  },
  {
    slug: "reservations",
    code: "RES",
    title: "Landscaping & Garden Decor",
    icon: "clipboard",
    tagline: "Lawn cutting, plant pruning, arrangements, plant rental, maintenance and waste removal.",
    desc: "Lawn cutting, plant pruning, garden arrangement, plant rental, garden maintenance, and waste removal for outdoor spaces.",
    image: reservationsImg,
    intro:
      "Green spaces and outdoor presentation handled end to end. We provide lawn cutting, plant pruning, plant arrangements, plant rental, garden maintenance, and waste removal so your space stays neat, attractive, and ready for use.",
    structure: [
      { heading: "1. Site brief", body: "Share your space, preferred style, access details, and the service you need — lawn, pruning, decor, plant rental, maintenance or cleanup." },
      { heading: "2. Plan & options", body: "We suggest the right mix of plants, layout, decor, schedule and cost so you know exactly what is included." },
      { heading: "3. Book & schedule", body: "We confirm the visit date, service window, plant or decor needs, and any recurring garden maintenance plan." },
      { heading: "4. Install & maintain", body: "Our team handles lawn cutting, trimming, arranging, planting, maintenance and tidy-up on the agreed date." },
      { heading: "5. Cleanup & aftercare", body: "We remove waste, refresh the space, and keep it maintained with recurring service plans if requested." },
    ],
    requirements: [
      "Property address and photos of the outdoor space",
      "Approximate area size, lawn or garden dimensions",
      "Style preference and budget range",
      "Which services you need: lawn cutting, pruning, arrangement, plant rental, maintenance, or waste removal",
      "Access details, watering or sunlight constraints, and preferred schedule",
    ],
    specs: [
      { item: "Lawn cutting & edging", scope: "Grass trimming, borders and finishing", turnaround: "2-4 hrs", rate: "From TTD 400", notes: "Per visit" },
      { item: "Plant pruning & shaping", scope: "Shrubs, hedges, stems and foliage", turnaround: "1-3 hrs", rate: "From TTD 350", notes: "Seasonal plans available" },
      { item: "Plant arrangement & decor setup", scope: "Planters, floral styling, placement", turnaround: "2-6 hrs", rate: "From TTD 450", notes: "Event or permanent styling" },
      { item: "Plant rental & seasonal display", scope: "Decor plants, feature pots, temporary styling", turnaround: "1-3 days", rate: "Quoted", notes: "Rental and setup included" },
      { item: "Garden maintenance", scope: "Weeding, trimming, cleaning and upkeep", turnaround: "2-4 hrs", rate: "From TTD 400", notes: "Monthly plans available" },
      { item: "Waste removal & cleanup", scope: "Debris, green waste and tidy-up", turnaround: "Same day", rate: "From TTD 330", notes: "Disposal included" },
    ],
  },
];

/** Suggestive selling combo bundles with bundled perks */
export const SERVICE_COMBOS: ServiceCombo[] = [
  {
    id: "combo-mechanic-towing",
    name: "Roadside Rescue & Diagnostic Combo",
    serviceSlug: "mobile-mechanic",
    description: "Full OBD-II diagnostic scan + flatbed transport/towing to your garage or our workshop.",
    basePriceTTD: 850,
    discountedPriceTTD: 720,
    perksIncluded: [
      "Complimentary battery load & alternator test",
      "Priority same-day dispatch window",
      "Written digital fault report",
    ],
    suggestedAddon: "Brake service or battery replacement",
  },
  {
    id: "combo-electrical-surge",
    name: "Complete Home Surge & Circuit Safety Bundle",
    serviceSlug: "electrician",
    description: "Whole-home panel safety inspection + surge arrestor installation and earthing audit.",
    basePriceTTD: 1100,
    discountedPriceTTD: 950,
    perksIncluded: [
      "Free thermal scan of main panel breakers",
      "Complimentary testing of all bathroom/kitchen GFCI outlets",
      "Official certificate of electrical compliance",
    ],
    suggestedAddon: "Generator transfer switch prep",
  },
  {
    id: "combo-garden-curb-appeal",
    name: "Total Grounds Restoration & Green Waste Haul",
    serviceSlug: "reservations",
    description: "Lawn cutting, precision edge trimming, hedge pruning, plus complete debris removal.",
    basePriceTTD: 1080,
    discountedPriceTTD: 890,
    perksIncluded: [
      "Complimentary organic weed barrier treatment",
      "Zero green-waste disposal fees",
      "Free follow-up inspection within 30 days",
    ],
    suggestedAddon: "Decorative planter installation",
  },
  {
    id: "combo-fleet-transport",
    name: "Fleet Transport & Multi-Vehicle Inspection Pack",
    serviceSlug: "delivery",
    description: "Dedicated flatbed towing run + multi-point roadworthiness check for commercial clients.",
    basePriceTTD: 1450,
    discountedPriceTTD: 1250,
    perksIncluded: [
      "Dedicated two-technician crew",
      "Direct supplier parts pickup voucher included",
      "Priority 24/7 emergency dispatch line",
    ],
  },
];

/** Selectable individual perks & privileges for customers */
export const OPTIONAL_PERKS: ServicePerk[] = [
  {
    id: "perk-priority-dispatch",
    name: "Priority Dispatch Privilege",
    description: "Guarantees technician arrival within an expedited 90-minute arrival window.",
    valueTTD: 150,
  },
  {
    id: "perk-extended-warranty",
    name: "90-Day Extended Labor Warranty",
    description: "Triples our standard 30-day labor guarantee on installations and electrical/mechanic repairs.",
    valueTTD: 180,
  },
  {
    id: "perk-digital-logbook",
    name: "Archived Inspection Certificate & Video Log",
    description: "High-definition recorded video walk-through of the repair/site with cloud storage access.",
    valueTTD: 120,
  },
  {
    id: "perk-green-waste-waiver",
    name: "Unlimited Debris & Heavy Waste Haulage",
    description: "Full disposal and tipping fee coverage for heavy garden clippings or discarded parts.",
    valueTTD: 140,
  },
];

export function getService(slug: string) {
  return SERVICES.find((s) => s.slug === slug);
}

export function serviceReference(code: string) {
  let hash = 7;
  for (const ch of code) hash = (hash * 31 + ch.charCodeAt(0)) % 9973;
  return `DUA-${code}-${String(hash).padStart(4, "0")}`;
}

export const FACEBOOK_URL = "https://facebook.com/org.tt";
export const DISCORD_URL = "https://discord.gg/nCh28K3";

/** Site-wide pricing tiers — updated with $150 base price increase */
export const PRICING_TIERS = [
  {
    label: "Domestic",
    headline: "From TTD 400",
    body: "Homes and private residences — valued by the volume of work on your agenda, with base tasks starting from TTD 400.",
  },
  {
    label: "Commercial",
    headline: "Minimum TTD 1,200",
    body: "All commercial locations start at a minimum of TTD 1,200, which includes 1 — no more than 2 — people for the task.",
  },
] as const;

export const PRICING_NOTE =
  "All services are valued by the volume or agenda. Negotiations are welcomed for tailored budgets or fewer perks.";
