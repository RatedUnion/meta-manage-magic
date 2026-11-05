/** Browser-only helpers for appointed QR flyers attached to Facebook posts. */
export const SITE_URL = "https://meta-manage-magic.lovable.app";

export const CAMPAIGN_LOCATIONS = {
  Trinidad: [
    "Trinidad & Tobago (island-wide)",
    "Port of Spain",
    "Diego Martin",
    "St. James",
    "Maraval",
    "Chaguanas",
    "Couva",
    "Point Lisas",
    "San Fernando",
    "Princes Town",
    "Penal",
    "Debe",
    "Siparia",
    "Point Fortin",
    "La Brea",
    "Cedros",
    "Arima",
    "Tunapuna",
    "St. Joseph",
    "Curepe",
    "Arouca",
    "Piarco",
    "Sangre Grande",
    "Toco",
    "Rio Claro",
    "Mayaro",
  ],
  Tobago: [
    "Scarborough",
    "Crown Point",
    "Canaan",
    "Roxborough",
    "Speyside",
    "Charlotteville",
    "Parlatuvier",
  ],
} as const;

const CATEGORY_SLUG: Record<string, string> = {
  automotive: "mobile-mechanic",
  electrical: "electrician",
  maintenance: "reservations",
  seasonal: "reservations",
  social: "online-booking",
};

/** Matches a promo script category to its service pane URL. */
export function serviceUrlFor(category?: string) {
  const slug = category ? CATEGORY_SLUG[category] : undefined;
  return slug ? `${SITE_URL}/services/${slug}` : `${SITE_URL}/book`;
}

/** Google Maps search link for the selected campaign service area. */
export function mapUrlFor(location: string) {
  const query = location.includes("Trinidad & Tobago") ? location : `${location}, Trinidad and Tobago`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export function referenceFor(url: string) {
  let h = 0;
  for (const c of url + new Date().toISOString().slice(0, 10)) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return `DUAA-${h.toString(36).toUpperCase().slice(0, 6)}`;
}

/** Draws a branded flyer with a QR code and returns a PNG data URL. */
export async function renderQrFlyer(url: string, title: string, reference: string, location = "Trinidad & Tobago") {
  const QRCode = (await import("qrcode")).default;
  const qr = await QRCode.toDataURL(url, { margin: 1, width: 640 });
  const img = new Image();
  img.src = qr;
  await img.decode();

  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1080;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not render the QR flyer.");

  ctx.fillStyle = "#0f172a";
  ctx.fillRect(0, 0, 1080, 1080);
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.font = "bold 52px sans-serif";
  ctx.fillText("Dedicated Ultimatum Appointed Associates", 540, 100, 1000);
  ctx.font = "34px sans-serif";
  ctx.fillText(title.slice(0, 60), 540, 155, 1000);
  ctx.font = "bold 30px sans-serif";
  ctx.fillText(`Serving ${location}`.slice(0, 64), 540, 200, 1000);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(210, 230, 660, 660);
  ctx.drawImage(img, 220, 240, 640, 640);
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 40px monospace";
  ctx.fillText(reference, 540, 950);
  ctx.font = "30px sans-serif";
  ctx.fillText("Scan to book  •  +1 868-763-1106", 540, 1010);
  return canvas.toDataURL("image/png");
}
