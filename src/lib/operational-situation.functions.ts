import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const OPERATIONAL_AREAS = {
  "Port of Spain": { latitude: 10.6667, longitude: -61.5189 },
  "Diego Martin": { latitude: 10.6925, longitude: -61.5662 },
  Chaguanas: { latitude: 10.5167, longitude: -61.4111 },
  "San Fernando": { latitude: 10.2805, longitude: -61.4687 },
  "Point Lisas": { latitude: 10.4, longitude: -61.4667 },
  Arima: { latitude: 10.6374, longitude: -61.2823 },
  "Sangre Grande": { latitude: 10.5871, longitude: -61.1301 },
  Mayaro: { latitude: 10.3, longitude: -61.0 },
  Scarborough: { latitude: 11.1823, longitude: -60.7353 },
  "Crown Point": { latitude: 11.1497, longitude: -60.8322 },
  Roxborough: { latitude: 11.2485, longitude: -60.588 },
} as const;

const areaSchema = z.enum(Object.keys(OPERATIONAL_AREAS) as [keyof typeof OPERATIONAL_AREAS, ...(keyof typeof OPERATIONAL_AREAS)[]]);

const weatherResponseSchema = z.object({
  current: z.object({
    time: z.string(),
    temperature_2m: z.number(),
    apparent_temperature: z.number(),
    relative_humidity_2m: z.number(),
    precipitation: z.number(),
    wind_speed_10m: z.number(),
    wind_gusts_10m: z.number(),
    weather_code: z.number(),
  }),
  hourly: z.object({
    time: z.array(z.string()),
    temperature_2m: z.array(z.number()),
    precipitation_probability: z.array(z.number()),
    precipitation: z.array(z.number()),
    wind_speed_10m: z.array(z.number()),
    weather_code: z.array(z.number()),
  }),
});

export const getOperationalWeather = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ area: areaSchema }).parse(input))
  .handler(async ({ data }) => {
    const coordinates = OPERATIONAL_AREAS[data.area];
    const params = new URLSearchParams({
      latitude: String(coordinates.latitude),
      longitude: String(coordinates.longitude),
      current: "temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,wind_speed_10m,wind_gusts_10m,weather_code",
      hourly: "temperature_2m,precipitation_probability,precipitation,wind_speed_10m,weather_code",
      forecast_days: "1",
      timezone: "America/Port_of_Spain",
    });

    const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`, {
      signal: AbortSignal.timeout(10_000),
      headers: { Accept: "application/json" },
    });
    if (!response.ok) throw new Error("Weather service is temporarily unavailable. Try again shortly.");

    const parsed = weatherResponseSchema.safeParse(await response.json());
    if (!parsed.success) throw new Error("Weather service returned an unexpected response.");

    const { current, hourly } = parsed.data;
    const currentIndex = Math.max(0, hourly.time.findIndex((time) => time >= current.time));
    const forecast = hourly.time.slice(currentIndex, currentIndex + 4).map((time, offset) => {
      const index = currentIndex + offset;
      return {
        time,
        temperatureC: hourly.temperature_2m[index],
        precipitationProbability: hourly.precipitation_probability[index],
        precipitationMm: hourly.precipitation[index],
        windSpeedKmh: hourly.wind_speed_10m[index],
        weatherCode: hourly.weather_code[index],
      };
    });

    return {
      area: data.area,
      latitude: coordinates.latitude,
      longitude: coordinates.longitude,
      updatedAt: current.time,
      current: {
        temperatureC: current.temperature_2m,
        feelsLikeC: current.apparent_temperature,
        humidityPercent: current.relative_humidity_2m,
        precipitationMm: current.precipitation,
        windSpeedKmh: current.wind_speed_10m,
        windGustKmh: current.wind_gusts_10m,
        weatherCode: current.weather_code,
      },
      forecast,
      source: "Open-Meteo",
    };
  });
