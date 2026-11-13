import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export interface SeismicEvent {
  id: string;
  title: string;
  magnitude: number;
  depthKm: number;
  place: string;
  time: string;
  alertLevel: "GREEN" | "AMBER" | "RED";
  dispatchDirective: string;
  coordinates: [number, number]; // [lng, lat]
  distanceFromPosKm: number;
}

// Bounding box for Trinidad & Tobago / Paria / SE Caribbean (Lat: 9.0 to 12.8, Lng: -63.5 to -59.0)
const POS_COORDS = { lat: 10.6667, lng: -61.5189 };

function haversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

export const getCaribbeanSeismicFeed = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ minMagnitude: z.number().default(2.5), limit: z.number().default(10) }).parse(input)
  )
  .handler(async ({ data }) => {
    const params = new URLSearchParams({
      format: "geojson",
      starttime: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // Last 30 days
      minmagnitude: String(data.minMagnitude),
      minlatitude: "9.0",
      maxlatitude: "12.8",
      minlongitude: "-63.5",
      maxlongitude: "-59.0",
      orderby: "time",
      limit: String(data.limit),
    });

    const response = await fetch(`https://earthquake.usgs.gov/fdsnws/event/1/query?${params}`, {
      signal: AbortSignal.timeout(10_000),
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      throw new Error("Unable to retrieve live Caribbean seismic telemetry.");
    }

    const json = (await response.json()) as {
      features: Array<{
        id: string;
        properties: { mag: number; place: string; time: number; title: string };
        geometry: { coordinates: [number, number, number] }; // [lng, lat, depth]
      }>;
    };

    const events: SeismicEvent[] = (json.features || []).map((feat) => {
      const mag = Number(feat.properties.mag.toFixed(1));
      const [lng, lat, depthKm] = feat.geometry.coordinates;
      const distance = haversineDistanceKm(POS_COORDS.lat, POS_COORDS.lng, lat, lng);

      let alertLevel: "GREEN" | "AMBER" | "RED" = "GREEN";
      let dispatchDirective = "Normal operations. Minor seismic tremor recorded.";

      if (mag >= 5.5) {
        alertLevel = "RED";
        dispatchDirective = "CRITICAL: Significant earthquake. Halt elevated dispatches, confirm crew safety, inspect gas/electrical lines.";
      } else if (mag >= 4.2) {
        alertLevel = "AMBER";
        dispatchDirective = "CAUTION: Moderate event. Check field crews in epicentral zone and verify road bridge passability.";
      }

      return {
        id: feat.id,
        title: feat.properties.title,
        magnitude: mag,
        depthKm: Math.round(depthKm),
        place: feat.properties.place,
        time: new Date(feat.properties.time).toISOString(),
        alertLevel,
        dispatchDirective,
        coordinates: [lng, lat],
        distanceFromPosKm: distance,
      };
    });

    return {
      updatedAt: new Date().toISOString(),
      source: "USGS Caribbean Regional Seismic Network",
      events,
    };
  });
