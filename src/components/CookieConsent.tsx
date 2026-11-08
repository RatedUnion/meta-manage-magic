import { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { ShieldCheck, Cookie } from "lucide-react";
import { Button } from "@/components/ui/button";

const COOKIE_STORAGE_KEY = "duaa_cookie_consent";

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(COOKIE_STORAGE_KEY);
      if (!stored) {
        setVisible(true);
      }
    } catch {
      // Ignore storage errors in restricted contexts
    }
  }, []);

  const handleConsent = (choice: "all" | "essential") => {
    try {
      localStorage.setItem(COOKIE_STORAGE_KEY, JSON.stringify({ choice, timestamp: new Date().toISOString() }));
    } catch {
      // Ignore storage errors
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-4xl rounded-xl border border-border/80 bg-background/95 p-4 shadow-2xl backdrop-blur-md md:p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-primary/10 p-2 text-primary">
            <Cookie className="h-5 w-5" />
          </div>
          <div className="space-y-1 text-sm">
            <p className="font-semibold text-foreground">Cookie & Privacy Preferences</p>
            <p className="text-muted-foreground text-xs leading-relaxed">
              We use essential functional cookies to authenticate staff, remember your booking choices, and store site settings. We do not use third-party advertising trackers. Review our{" "}
              <Link to="/cookies" className="text-primary underline underline-offset-2 hover:opacity-80">
                Cookie Policy
              </Link>{" "}
              and{" "}
              <Link to="/privacy" className="text-primary underline underline-offset-2 hover:opacity-80">
                Privacy Policy
              </Link>
              .
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 md:shrink-0">
          <Button variant="outline" size="sm" onClick={() => handleConsent("essential")} className="text-xs">
            Essential Only
          </Button>
          <Button size="sm" onClick={() => handleConsent("all")} className="text-xs">
            <ShieldCheck className="mr-1.5 h-3.5 w-3.5" /> Accept All
          </Button>
        </div>
      </div>
    </div>
  );
}
