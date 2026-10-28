export interface PromotionalScript {
  id: string;
  title: string;
  category: "automotive" | "electrical" | "maintenance" | "seasonal" | "social";
  channel: "WhatsApp" | "Instagram" | "SMS" | "Radio" | "Email";
  priceTTD: number;
  preview: string;
  fullScript: string;
  tags: string[];
}

export const MARKETPLACE_SCRIPTS: PromotionalScript[] = [
  {
    id: "rainy-season-mechanic",
    title: "Rainy Season Fleet & Brake Diagnostic Blast",
    category: "automotive",
    channel: "WhatsApp",
    priceTTD: 300,
    preview: "Heavy rains across Trinidad? Ensure brakes, wipers, and tires are road-safe with on-site mobile diagnostics.",
    fullScript:
      "🌧️ Flash Floods & Slippery Roads Ahead in T&T! Don't get stranded with worn brake pads or bad alternator charging. Dedicated Ultimatum Appointed Associates brings the workshop directly to you. Book our OBD-II + safety diagnostic combo from just TTD $400. Need vehicle transport or flatbed towing? Booked separately at special combo rates! Call/WhatsApp: +1 868-763-1106 or book online at meta-manage-magic.lovable.app/book.",
    tags: ["automotive", "rainy season", "fleet", "mechanic", "towing"],
  },
  {
    id: "generator-surge-electrician",
    title: "T&TEC Surge Protection & Generator Transfer Switch",
    category: "electrical",
    channel: "Instagram",
    priceTTD: 350,
    preview: "Protect your commercial equipment and household appliances from frequent power fluctuations and outages.",
    fullScript:
      "⚡ Frequent T&TEC grid drops killing your AC compressors and computers? Our licensed industrial & automotive electricians install certified whole-property surge arrestors and auto/manual generator transfer switches. Domestic quotes from $400 TTD, commercial installations starting at $1,200 TTD. Package combos with free GFCI testing available! Message us now or schedule an on-site audit at meta-manage-magic.lovable.app.",
    tags: ["electrician", "surge protection", "generator", "commercial"],
  },
  {
    id: "divali-christmas-grounds",
    title: "Festive Season Grounds Prep & Decorative Setup",
    category: "seasonal",
    channel: "SMS",
    priceTTD: 330,
    preview: "Get your residential compound or commercial storefront immaculate for Divali and Christmas festivities.",
    fullScript:
      "✨ Transform your outdoor space this festive season. DUAA covers exterior decorative illumination, hedge trimming, power washing, and lush garden maintenance. Certified domestic quotes starting at $400 TTD. Ask about our Total Grounds Restoration Combo with zero debris disposal fees! WhatsApp 868-763-1106.",
    tags: ["reservations", "landscaping", "christmas", "divali", "combos"],
  },
];
