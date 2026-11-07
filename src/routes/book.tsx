{/* Insert inside src/routes/book.tsx directly above the Build Sheet section */}
<div className="rounded-xl border border-primary/20 bg-gradient-to-r from-primary/5 via-primary/10 to-transparent p-4 sm:p-5">
  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow">
        <Sparkles className="h-5 w-5" />
      </div>
      <div>
        <p className="text-sm font-semibold flex items-center gap-2">
          Kimi AI Booking Assistant Active
          <Badge variant="outline" className="text-[10px] bg-background">Live Scope Analysis</Badge>
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          Need help estimating parts, labor, or towing? Kimi can review your fault descriptions and combo options.
        </p>
      </div>
    </div>
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="text-xs shrink-0"
      onClick={() => {
        const chatButton = document.querySelector('button[aria-label*="Kimi"]') as HTMLButtonElement | null;
        chatButton?.click();
      }}
    >
      Consult Kimi AI
    </Button>
  </div>
</div>
