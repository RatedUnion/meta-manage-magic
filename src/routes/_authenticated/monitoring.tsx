<Card className="border shadow-sm overflow-hidden">
  <CardHeader className="border-b bg-muted/40 pb-3">
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
      <CardTitle className="flex items-center gap-2 text-base font-semibold">
        <Cloud className="h-5 w-5 text-sky-500" />
        Live Weather Broadcast & Dispatch Radar
      </CardTitle>
      <div className="flex items-center gap-2">
        <span className="flex items-center gap-1.5 rounded-full bg-red-500/10 px-2.5 py-0.5 text-xs font-semibold text-red-600 dark:text-red-400">
          <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
          ON-AIR BROADCAST
        </span>
      </div>
    </div>
  </CardHeader>

  <CardContent className="p-4 space-y-4">
    <div className="flex flex-wrap items-center gap-2">
      <select
        aria-label="Weather area"
        value={weatherArea}
        onChange={(event) => setWeatherArea(event.target.value as (typeof AREAS)[number])}
        className="h-10 min-w-48 flex-1 rounded-md border border-input bg-background px-3 text-sm"
      >
        {AREAS.map((area) => (
          <option key={area} value={area}>
            {area} (Trinidad & Tobago)
          </option>
        ))}
      </select>
      <Button onClick={() => void runWeatherCheck()} disabled={weatherLoading || viewOnly}>
        <RefreshCw className={`mr-2 h-4 w-4 ${weatherLoading ? "animate-spin" : ""}`} />
        {weatherLoading ? "Broadcasting…" : "Refresh Broadcast"}
      </Button>
    </div>

    {weather ? (
      <div className="space-y-4 animate-in fade-in">
        {/* Current Conditions Grid */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border bg-card p-3">
            <p className="text-xs font-medium text-muted-foreground">Current Temp</p>
            <p className="mt-1 text-2xl font-bold">{Math.round(weather.current.temperatureC)}°C</p>
            <p className="text-xs text-muted-foreground mt-0.5">{weatherLabel(weather.current.weatherCode)}</p>
          </div>
          <div className="rounded-xl border bg-card p-3">
            <p className="text-xs font-medium text-muted-foreground">Heat Index / Feels</p>
            <p className="mt-1 text-2xl font-bold">{Math.round(weather.current.feelsLikeC)}°C</p>
            <p className="text-xs text-muted-foreground mt-0.5">{weather.current.humidityPercent}% humidity</p>
          </div>
          <div className="rounded-xl border bg-card p-3">
            <p className="text-xs font-medium text-muted-foreground">Rainfall Volume</p>
            <p className="mt-1 text-2xl font-bold">{weather.current.precipitationMm} mm</p>
            <p className="text-xs text-muted-foreground mt-0.5">Precipitation</p>
          </div>
          <div className="rounded-xl border bg-card p-3">
            <p className="text-xs font-medium text-muted-foreground">Sustained / Gusts</p>
            <p className="mt-1 text-2xl font-bold">{Math.round(weather.current.windSpeedKmh)} km/h</p>
            <p className="text-xs text-muted-foreground mt-0.5">Gusts to {Math.round(weather.current.windGustKmh)} km/h</p>
          </div>
        </div>

        {/* Dispatch Risk Advisory Banner */}
        <div className={cn(
          "rounded-xl border p-3 text-sm",
          weather.current.weatherCode >= 80 || weather.current.windGustKmh >= 50
            ? "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300"
            : weather.current.precipitationMm > 0
            ? "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300"
            : "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
        )}>
          <p className="font-semibold flex items-center gap-1.5">
            <Activity className="h-4 w-4" />
            Field Dispatch Advisory:
          </p>
          <p className="mt-1 text-xs leading-relaxed">
            {weatherAdvice(weather.current.weatherCode, weather.current.windGustKmh, weather.current.precipitationMm)}
          </p>
        </div>

        {/* 6-Hour Forecast Broadcasting Cards */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Regional Hourly Forecast Horizon
          </p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
            {weather.forecast.map((hour) => (
              <div key={hour.time} className="rounded-lg border bg-muted/40 p-2.5 text-center">
                <p className="text-xs font-bold">{hour.time.slice(11, 16)}</p>
                <p className="mt-1 text-base font-semibold">{Math.round(hour.temperatureC)}°C</p>
                <p className="text-[11px] text-muted-foreground truncate">{weatherLabel(hour.weatherCode)}</p>
                <div className="mt-1.5 pt-1.5 border-t border-border/50 text-[10px] text-muted-foreground">
                  <p>🌧️ {hour.precipitationProbability}%</p>
                  <p>💨 {Math.round(hour.windSpeedKmh)} km/h</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-[11px] text-muted-foreground">
          Telemetry Source: {weather.source} · Broadcast updated: {new Date(weather.updatedAt).toLocaleTimeString()} AST
        </p>
      </div>
    ) : (
      <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
        Select a Trinidad & Tobago region above and tap <strong>Refresh Broadcast</strong> to initiate the live forecast stream.
      </div>
    )}
  </CardContent>
</Card>
