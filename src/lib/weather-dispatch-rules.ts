export type TradeCategory = "electrical" | "landscaping" | "mechanic" | "towing" | "general";

export type DispatchClearance = "GO" | "CAUTION" | "HOLD";

export interface TradeWeatherEvaluation {
  trade: TradeCategory;
  clearance: DispatchClearance;
  badgeColor: "emerald" | "amber" | "red";
  reason: string;
  directive: string;
}

export interface WeatherTelemetryInput {
  weatherCode: number;
  precipitationMm: number;
  windSpeedKmh: number;
  windGustKmh: number;
  temperatureC: number;
}

/**
 * WMO Weather Code categories:
 * 0-3: Clear / Partly Cloudy
 * 45-48: Fog / Reduced Visibility
 * 51-57: Drizzle
 * 61-67: Rain (Slight to Heavy)
 * 71-77: Snow / Hail (Rare/N/A in T&T)
 * 80-82: Rain Showers (Violent bursts)
 * 95-99: Thunderstorms with or without hail
 */
export function evaluateTradeWeatherConditions(
  telemetry: WeatherTelemetryInput
): Record<TradeCategory, TradeWeatherEvaluation> {
  const { weatherCode, precipitationMm, windGustKmh } = telemetry;
  const isThunderstorm = weatherCode >= 95;
  const isHighWind = windGustKmh >= 45;
  const isGaleForce = windGustKmh >= 60;
  const isRaining = precipitationMm > 0.5 || (weatherCode >= 51 && weatherCode <= 82);
  const isHeavyRain = precipitationMm >= 3.0 || weatherCode === 65 || weatherCode === 82;

  // 1. Electrical (VoltSage) - Extreme electrocution risk outdoors
  let electrical: TradeWeatherEvaluation;
  if (isThunderstorm) {
    electrical = {
      trade: "electrical",
      clearance: "HOLD",
      badgeColor: "red",
      reason: "Active thunderstorm / lightning threat detected.",
      directive: "MANDATORY HOLD for all exterior wiring, service entrance, generator transfer switches, and solar work.",
    };
  } else if (isHeavyRain || isRaining) {
    electrical = {
      trade: "electrical",
      clearance: "CAUTION",
      badgeColor: "amber",
      reason: "Wet ground and active rain.",
      directive: "Indoor panel wiring permitted. Exterior conduit and outdoor meter work requires dry clearance.",
    };
  } else {
    electrical = {
      trade: "electrical",
      clearance: "GO",
      badgeColor: "emerald",
      reason: "Dry atmospheric conditions.",
      directive: "Safe for both indoor distribution and exterior service connections.",
    };
  }

  // 2. Landscaping & Grounds (FloraScape) - High exposure, tree hazards, waterlogging
  let landscaping: TradeWeatherEvaluation;
  if (isThunderstorm || isGaleForce) {
    landscaping = {
      trade: "landscaping",
      clearance: "HOLD",
      badgeColor: "red",
      reason: "Severe wind gusts or lightning hazard.",
      directive: "HOLD all exterior tree trimming, weed whacking, and power tool operation. Severe slip/fall hazard.",
    };
  } else if (isRaining || isHighWind) {
    landscaping = {
      trade: "landscaping",
      clearance: "HOLD",
      badgeColor: "red",
      reason: "Saturated soil and active rainfall.",
      directive: "Postpone commercial lawn mowing and floral maintenance to prevent turf gouging and equipment clogging.",
    };
  } else {
    landscaping = {
      trade: "landscaping",
      clearance: "GO",
      badgeColor: "emerald",
      reason: "Optimal ground firmness and dry canopy.",
      directive: "Cleared for full exterior agenda, brush cutting, and green waste haulage.",
    };
  }

  // 3. Mobile Mechanic (GearMaster Dee) - Roadside slip and safety risks
  let mechanic: TradeWeatherEvaluation;
  if (isThunderstorm || isHeavyRain) {
    mechanic = {
      trade: "mechanic",
      clearance: "CAUTION",
      badgeColor: "amber",
      reason: "Heavy downpours or reduced highway visibility.",
      directive: "Divert roadside tire/engine repairs to covered parking or shop bays. High risk on highway shoulders.",
    };
  } else {
    mechanic = {
      trade: "mechanic",
      clearance: "GO",
      badgeColor: "emerald",
      reason: "Roadway visibility and pavement acceptable.",
      directive: "Cleared for on-site diagnostic scanning, brake jobs, and OEM part replacements.",
    };
  }

  // 4. Heavy Towing & Transport (Logistics Dispatcher) - Highway hydroplaning
  let towing: TradeWeatherEvaluation;
  if (isGaleForce || isThunderstorm) {
    towing = {
      trade: "towing",
      clearance: "CAUTION",
      badgeColor: "amber",
      reason: "Highway flash flooding or extreme crosswinds.",
      directive: "Allow +30m transit window on Churchill-Roosevelt & Solomon Hochoy highways. Confirm wrecker tie-downs.",
    };
  } else {
    towing = {
      trade: "towing",
      clearance: "GO",
      badgeColor: "emerald",
      reason: "Corridor transit operating normally.",
      directive: "Standard wrecker mobilization and flatbed transport approved.",
    };
  }

  // 5. General Services
  const general: TradeWeatherEvaluation =
    isThunderstorm || isGaleForce
      ? {
          trade: "general",
          clearance: "HOLD",
          badgeColor: "red",
          reason: "Severe weather protocol active.",
          directive: "Notify clients and rebook non-critical appointments.",
        }
      : {
          trade: "general",
          clearance: "GO",
          badgeColor: "emerald",
          reason: "Conditions within operational tolerance.",
          directive: "Proceed with scheduled client appointments.",
        };

  return { electrical, landscaping, mechanic, towing, general };
}
