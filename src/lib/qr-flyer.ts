/** Browser-only helpers for appointed QR flyers attached to Facebook posts. */
export const SITE_URL = "https://meta-manage-magic.lovable.app";

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

export function referenceFor(url: string) {
  let h = 0;
  for (const c of url + new Date().toISOString().slice(0, 10)) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return `DUAA-${h.toString(36).toUpperCase().slice(0, 6)}`;
}

/** Draws a 1080x1080 branded flyer with the QR code and returns a PNG data URL. */
export async function renderQrFlyer(url: string, title: string, reference: string) {
  const QRCode = (await import("qrcode")).default;
  const qr = await QRCode.toDataURL(url, { margin: 1, width: 640 });
  const img = new Image();
  img.src = qr;
  await img.decode();

  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1080;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#0f172a";
  ctx.fillRect(0, 0, 1080, 1080);
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.font = "bold 52px sans-serif";
  ctx.fillText("Dedicated Ultimatum Appointed Associates", 540, 110, 1000);
  ctx.font = "34px sans-serif";
  ctx.fillText(title.slice(0, 60), 540, 170, 1000);
  ctx.fillRect(210, 220, 660, 660);
  ctx.drawImage(img, 220, 230, 640, 640);
  ctx.font = "bold 40px monospace";
  ctx.fillText(reference, 540, 950);
  ctx.font = "30px sans-serif";
  ctx.fillText("Scan to book  •  +1 868-763-1106", 540, 1010);
  return canvas.toDataURL("image/png");
}
