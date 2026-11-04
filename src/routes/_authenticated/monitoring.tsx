import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  AlertTriangle,
  Archive,
  CarFront,
  Cloud,
  CloudDrizzle,
  CloudRain,
  CloudSun,
  Droplets,
  ExternalLink,
  MapPin,
  PackageCheck,
  Plus,
  RefreshCw,
  Sun,
  Thermometer,
  Truck,
  Wind,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/monitoring")({
  component: MonitoringPage,
  head: () => ({ meta: [{ title: "Operations Monitoring — DUAA" }] }),
});

type Location = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
};

type WeatherData = {
  current: {
    temperature_2m: number;
    apparent_temperature: number;
    relative_humidity_2m: number;
    precipitation: number;
    weather_code: number;
    wind_speed_10m: number;
    time: string;
  };
  daily: {
    time: string[];
    weather_code: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_probability_max: number[];
  };
};

type Asset = {
  id: number;
  name: string;
  category: string;
  quantity: number;
  location: string;
  condition: string;
};

type MovementLog = {
  id: number;
  asset: string;
  quantity: number;
  from: string;
  to: string;
  notes: string;
  time: string;
};

type OpsLog = { id: number; message: string; time: string };

const LOCATIONS: Location[] = [
  { id: "pos", name: "Port of Spain", latitude: 10.6549, longitude: -61.5019 },
  { id: "chaguanas", name: "Chaguanas", latitude: 10.5168, longitude: -61.411 },
  { id: "san-fernando", name: "San Fernando", latitude: 10.2805, longitude: -61.468 },
  { id: "tobago", name: "Scarborough, Tobago", latitude: 11.182, longitude: -60.735 },
];

const inputClass =
  "h-9 w-full rounded-md border border-input bg-background px-3 text-sm";

function describeWeather(code: number) {
  if (code === 0) return "Clear sky";
  if (code <= 2) return "Partly cloudy";
  if (code === 3) return "Overcast";
  if (code === 45 || code === 48) return "Foggy";
  if (code >= 51 && code <= 57) return "Drizzle";
  if (code >= 61 && code <= 67) return "Rain";
  if (code >= 71 && code <= 77) return "Snow";
  if (code >= 80 && code <= 82) return "Rain showers";
  if (code >= 85 && code <= 86) return "Snow showers";
  if (code >= 95) return "Thunderstorms";
  return "Conditions unavailable";
}

function WeatherIcon({
  code,
  className,
}: {
  code: number;
  className?: string;
}) {
  if (code === 0) return <Sun className={className} />;
  if (code <= 2) return <CloudSun className={className} />;
  if (code >= 51 && code <= 57) return <CloudDrizzle className={className} />;
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82) || code >= 95) {
    return <CloudRain className={className} />;
  }
  return <Cloud className={className} />;
}

function formatDay(value: string) {
  return new Date(`${value}T12:00:00`).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function MonitoringPage() {
  const [locationId, setLocationId] = useState(LOCATIONS[0].id);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assets, setAssets] = useState<Asset[]>([
    {
      id: 1,
      name: "Mobile diagnostic scanner",
      category: "Tools",
      quantity: 2,
      location: "Port of Spain",
      condition: "Available",
    },
    {
      id: 2,
      name: "Portable generator",
      category: "Equipment",
      quantity: 1,
      location: "Chaguanas",
      condition: "In use",
    },
    {
      id: 3,
      name: "Safety cones",
      category: "Supplies",
      quantity: 12,
      location: "San Fernando",
      condition: "Available",
    },
  ]);
  const [assetForm, setAssetForm] = useState({
    name: "",
    category: "Equipment",
    quantity: "1",
    location: LOCATIONS[0].name,
  });
  const [movementForm, setMovementForm] = useState({
    assetId: "",
    quantity: "1",
    from: "",
    to: "",
    notes: "",
  });
  const [movements, setMovements] = useState<MovementLog[]>([]);
  const [opsLogs, setOpsLogs] = useState<OpsLog[]>([
    {
      id: 1,
      message: "Operations monitoring dashboard opened.",
      time: new Date().toISOString(),
    },
  ]);
  const [miscNote, setMiscNote] = useState("");
  const location = LOCATIONS.find((item) => item.id === locationId) ?? LOCATIONS[0];

  const addLog = (message: string) => {
    setOpsLogs((current) =>
      [{ id: Date.now(), message, time: new Date().toISOString() }, ...current].slice(
        0,
        30,
      ),
    );
  };

  const loadWeather = useCallback(
    async (signal?: AbortSignal) => {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({
        latitude: String(location.latitude),
        longitude: String(location.longitude),
        current:
          "temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,weather_code,wind_speed_10m",
        daily:
          "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max",
        forecast_days: "5",
        timezone: "auto",
      });

      try {
        const response = await fetch(
          `https://api.open-meteo.com/v1/forecast?${params}`,
          { signal },
        );
        if (!response.ok) {
          throw new Error("Weather service is temporarily unavailable.");
        }
        setWeather((await response.json()) as WeatherData);
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;
        setError(
          err instanceof Error
            ? err.message
            : "Could not load local conditions.",
        );
        setWeather(null);
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [location.latitude, location.longitude],
  );

  useEffect(() => {
    const controller = new AbortController();
    void loadWeather(controller.signal);
    return () => controller.abort();
  }, [loadWeather]);

  const addAsset = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = assetForm.name.trim();
    const quantity = Number(assetForm.quantity);
    if (!name || !Number.isInteger(quantity) || quantity < 1) return;

    setAssets((current) => [
      {
        id: Date.now(),
        name,
        category: assetForm.category,
        quantity,
        location: assetForm.location,
        condition: "Available",
      },
      ...current,
    ]);
    addLog(`Inventory added: ${quantity} × ${name} at ${assetForm.location}.`);
    setAssetForm({
      name: "",
      category: "Equipment",
      quantity: "1",
      location: location.name,
    });
  };

  const recordMovement = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const asset = assets.find((item) => item.id === Number(movementForm.assetId));
    const quantity = Number(movementForm.quantity);
    const from = movementForm.from.trim();
    const to = movementForm.to.trim();
    if (
      !asset ||
      !from ||
      !to ||
      from === to ||
      !Number.isInteger(quantity) ||
      quantity < 1 ||
      quantity > asset.quantity
    ) {
      return;
    }

    const record: MovementLog = {
      id: Date.now(),
      asset: asset.name,
      quantity,
      from,
      to,
      notes: movementForm.notes.trim(),
      time: new Date().toISOString(),
    };
    setMovements((current) => [record, ...current]);
    setAssets((current) =>
      current.flatMap((item) => {
        if (item.id !== asset.id) return [item];
        if (quantity === item.quantity) return [{ ...item, location: to }];
        return [
          { ...item, quantity: item.quantity - quantity },
          { ...item, id: Date.now() + 1, quantity, location: to },
        ];
      }),
    );
    addLog(`Asset movement: ${quantity} × ${asset.name}, ${from} → ${to}.`);
    setMovementForm({ assetId: "", quantity: "1", from: "", to: "", notes: "" });
  };

  const saveMiscNote = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const note = miscNote.trim();
    if (!note) return;
    addLog(`Miscellaneous note: ${note}`);
    setMiscNote("");
  };

  const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${location.longitude - 0.045}%2C${location.latitude - 0.03}%2C${location.longitude + 0.045}%2C${location.latitude + 0.03}&layer=mapnik&marker=${location.latitude}%2C${location.longitude}`;
  const trafficUrl = `https://embed.waze.com/iframe?zoom=13&lat=${location.latitude}&lon=${location.longitude}&ct=livemap`;
  const mapsLink = `https://www.google.com/maps/search/?api=1&query=${location.latitude},${location.longitude}`;
  const trafficLink = `https://www.waze.com/live-map/directions?to=ll.${location.latitude}%2C${location.longitude}`;

  return (
    <main className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Operations Monitoring</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Local weather, maps, traffic, assets, inventory, and operational activity.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label htmlFor="monitor-location" className="sr-only">
              Choose monitoring location
            </label>
            <select
              id="monitor-location"
              value={locationId}
              onChange={(event) => setLocationId(event.target.value)}
              className={inputClass}
            >
              {LOCATIONS.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
            <Button onClick={() => void loadWeather()} disabled={loading} size="sm">
              <RefreshCw
                className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />
              {loading ? "Updating…" : "Refresh weather"}
            </Button>
          </div>
        </header>

        {error && (
          <div
            role="alert"
            className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
          >
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        <section
          aria-label="Current weather"
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          <Card>
            <CardContent className="flex items-center gap-4 pt-6">
              <Thermometer className="h-8 w-8 text-orange-500" />
              <div>
                <p className="text-xs text-muted-foreground">Current temperature</p>
                <p className="text-2xl font-semibold">
                  {weather ? `${Math.round(weather.current.temperature_2m)}°C` : "—"}
                </p>
                <p className="text-xs text-muted-foreground">
                  Feels like {weather ? `${Math.round(weather.current.apparent_temperature)}°C` : "—"}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 pt-6">
              {weather ? (
                <WeatherIcon
                  code={weather.current.weather_code}
                  className="h-8 w-8 text-sky-500"
                />
              ) : (
                <Cloud className="h-8 w-8 text-sky-500" />
              )}
              <div>
                <p className="text-xs text-muted-foreground">Conditions</p>
                <p className="text-lg font-semibold">
                  {weather ? describeWeather(weather.current.weather_code) : "—"}
                </p>
                <p className="text-xs text-muted-foreground">{location.name}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 pt-6">
              <Droplets className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-xs text-muted-foreground">Humidity / rain</p>
                <p className="text-2xl font-semibold">
                  {weather ? `${weather.current.relative_humidity_2m}%` : "—"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {weather ? `${weather.current.precipitation} mm precipitation` : "—"}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 pt-6">
              <Wind className="h-8 w-8 text-teal-500" />
              <div>
                <p className="text-xs text-muted-foreground">Wind speed</p>
                <p className="text-2xl font-semibold">
                  {weather ? `${weather.current.wind_speed_10m} km/h` : "—"}
                </p>
                <p className="text-xs text-muted-foreground">
                  Updated {weather ? new Date(weather.current.time).toLocaleTimeString() : "—"}
                </p>
              </div>
            </CardContent>
          </Card>
        </section>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CloudSun className="h-5 w-5 text-sky-500" />
              5-day forecast
            </CardTitle>
          </CardHeader>
          <CardContent>
            {weather ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                {weather.daily.time.map((day, index) => (
                  <div key={day} className="rounded-lg border border-border p-3 text-center">
                    <p className="text-sm font-medium">{formatDay(day)}</p>
                    <WeatherIcon
                      code={weather.daily.weather_code[index]}
                      className="mx-auto my-2 h-7 w-7 text-sky-500"
                    />
                    <p className="text-sm">
                      {Math.round(weather.daily.temperature_2m_max[index])}° / {Math.round(weather.daily.temperature_2m_min[index])}°C
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Rain chance: {weather.daily.precipitation_probability_max[index]}%
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-4 text-center text-sm text-muted-foreground">
                {loading ? "Loading forecast…" : "Forecast unavailable."}
              </p>
            )}
          </CardContent>
        </Card>

        <section className="grid gap-4 lg:grid-cols-2" aria-label="Maps and traffic">
          <Card className="overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="flex items-center gap-2 text-base">
                <MapPin className="h-5 w-5" /> Map — {location.name}
              </CardTitle>
              <a href={mapsLink} target="_blank" rel="noreferrer" aria-label="Open location in Google Maps">
                <ExternalLink className="h-4 w-4" />
              </a>
            </CardHeader>
            <CardContent className="p-0">
              <iframe
                title={`Map of ${location.name}`}
                src={mapUrl}
                className="h-72 w-full border-0"
                loading="lazy"
              />
            </CardContent>
          </Card>
          <Card className="overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="flex items-center gap-2 text-base">
                <CarFront className="h-5 w-5" /> Traffic — {location.name}
              </CardTitle>
              <a href={trafficLink} target="_blank" rel="noreferrer" aria-label="Open traffic in Waze">
                <ExternalLink className="h-4 w-4" />
              </a>
            </CardHeader>
            <CardContent className="p-0">
              <iframe
                title={`Traffic map for ${location.name}`}
                src={trafficUrl}
                className="h-72 w-full border-0"
                loading="lazy"
                allow="geolocation"
              />
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-4 lg:grid-cols-2" aria-label="Asset and inventory management">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Archive className="h-5 w-5" /> Assets &amp; inventory
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={addAsset} className="grid gap-2 sm:grid-cols-2">
                <input
                  aria-label="Asset name"
                  required
                  maxLength={100}
                  placeholder="Asset or item name"
                  value={assetForm.name}
                  onChange={(event) => setAssetForm({ ...assetForm, name: event.target.value })}
                  className={inputClass}
                />
                <select
                  aria-label="Asset category"
                  value={assetForm.category}
                  onChange={(event) => setAssetForm({ ...assetForm, category: event.target.value })}
                  className={inputClass}
                >
                  <option>Equipment</option>
                  <option>Tools</option>
                  <option>Supplies</option>
                  <option>Vehicles</option>
                  <option>Other</option>
                </select>
                <input
                  aria-label="Quantity"
                  type="number"
                  min="1"
                  step="1"
                  required
                  value={assetForm.quantity}
                  onChange={(event) => setAssetForm({ ...assetForm, quantity: event.target.value })}
                  className={inputClass}
                />
                <select
                  aria-label="Inventory location"
                  value={assetForm.location}
                  onChange={(event) => setAssetForm({ ...assetForm, location: event.target.value })}
                  className={inputClass}
                >
                  {LOCATIONS.map((item) => (
                    <option key={item.id}>{item.name}</option>
                  ))}
                </select>
                <Button type="submit" size="sm" className="sm:col-span-2">
                  <Plus className="mr-2 h-4 w-4" /> Add to inventory
                </Button>
              </form>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b text-xs text-muted-foreground">
                      <th className="py-2 pr-3">Asset</th>
                      <th className="py-2 pr-3">Category</th>
                      <th className="py-2 pr-3">Qty</th>
                      <th className="py-2 pr-3">Location</th>
                      <th className="py-2">Condition</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assets.map((asset) => (
                      <tr key={asset.id} className="border-b last:border-0">
                        <td className="py-2 pr-3">{asset.name}</td>
                        <td className="py-2 pr-3">{asset.category}</td>
                        <td className="py-2 pr-3">{asset.quantity}</td>
                        <td className="py-2 pr-3">{asset.location}</td>
                        <td className="py-2">{asset.condition}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Truck className="h-5 w-5" /> Asset displacement &amp; movement
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Record where assets are being transferred.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={recordMovement} className="grid gap-2 sm:grid-cols-2">
                <select
                  aria-label="Asset to move"
                  required
                  value={movementForm.assetId}
                  onChange={(event) => {
                    const selected = assets.find((asset) => asset.id === Number(event.target.value));
                    setMovementForm({
                      ...movementForm,
                      assetId: event.target.value,
                      quantity: "1",
                      from: selected?.location ?? "",
                    });
                  }}
                  className={inputClass}
                >
                  <option value="">Select an asset</option>
                  {assets.filter((asset) => asset.quantity > 0).map((asset) => (
                    <option key={asset.id} value={asset.id}>
                      {asset.name} ({asset.quantity} at {asset.location})
                    </option>
                  ))}
                </select>
                <input
                  aria-label="Movement quantity"
                  type="number"
                  min="1"
                  step="1"
                  required
                  value={movementForm.quantity}
                  onChange={(event) => setMovementForm({ ...movementForm, quantity: event.target.value })}
                  className={inputClass}
                />
                <input
                  aria-label="From location"
                  required
                  maxLength={100}
                  placeholder="From location"
                  value={movementForm.from}
                  onChange={(event) => setMovementForm({ ...movementForm, from: event.target.value })}
                  className={inputClass}
                />
                <input
                  aria-label="To location"
                  required
                  maxLength={100}
                  placeholder="To location"
                  value={movementForm.to}
                  onChange={(event) => setMovementForm({ ...movementForm, to: event.target.value })}
                  className={inputClass}
                />
                <input
                  aria-label="Movement notes"
                  maxLength={200}
                  placeholder="Reason / reference (optional)"
                  value={movementForm.notes}
                  onChange={(event) => setMovementForm({ ...movementForm, notes: event.target.value })}
                  className={inputClass}
                />
                <Button type="submit" size="sm" className="sm:col-span-2">
                  <PackageCheck className="mr-2 h-4 w-4" /> Record movement
                </Button>
              </form>
              <div className="space-y-2">
                {movements.length === 0 ? (
                  <p className="py-3 text-center text-sm text-muted-foreground">
                    Movement records will appear here.
                  </p>
                ) : (
                  movements.map((movement) => (
                    <div key={movement.id} className="rounded-md border p-3 text-sm">
                      <p className="font-medium">
                        {movement.quantity} × {movement.asset}: {movement.from} → {movement.to}
                      </p>
                      {movement.notes && (
                        <p className="mt-1 text-muted-foreground">{movement.notes}</p>
                      )}
                      <p className="mt-1 text-xs text-muted-foreground">
                        {new Date(movement.time).toLocaleString()}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-4 lg:grid-cols-2" aria-label="Operations logs and miscellaneous notes">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Activity logs</CardTitle>
              <p className="text-xs text-muted-foreground">
                Recent inventory changes, movements, and dashboard notes.
              </p>
            </CardHeader>
            <CardContent className="max-h-80 space-y-2 overflow-y-auto">
              {opsLogs.map((log) => (
                <div key={log.id} className="border-b pb-2 last:border-0">
                  <p className="text-sm">{log.message}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(log.time).toLocaleString()}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Miscellaneous</CardTitle>
              <p className="text-xs text-muted-foreground">
                Capture other operational updates, incidents, or reminders in the activity log.
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={saveMiscNote} className="space-y-2">
                <textarea
                  aria-label="Miscellaneous operational note"
                  required
                  maxLength={500}
                  rows={4}
                  placeholder="Enter an operational update, incident, or reminder"
                  value={miscNote}
                  onChange={(event) => setMiscNote(event.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
                <Button type="submit" size="sm">Save note</Button>
              </form>
            </CardContent>
          </Card>
        </section>
        <p className="text-center text-xs text-muted-foreground">
          Weather by Open-Meteo · Maps by OpenStreetMap · Traffic by Waze. Asset, movement, and activity entries are held in page memory and reset when this page is reloaded.
        </p>
      </div>
    </main>
  );
}
