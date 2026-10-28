import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Copy, ShoppingBag, Sparkles, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { MARKETPLACE_SCRIPTS } from "@/data/marketplace-scripts";

export const Route = createFileRoute("/marketplace")({
  component: MarketplacePage,
  head: () => ({
    meta: [
      { title: "Promotional Script Store — DUAA Marketing Engine" },
      { name: "description", content: "High-converting Trinidad & Tobago business marketing templates for WhatsApp, SMS, and Social." },
    ],
  }),
});

function MarketplacePage() {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyScript = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("Script copied to clipboard!");
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <div className="min-h-screen bg-background py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <Badge variant="secondary" className="px-3 py-1 text-xs">
            <Sparkles className="w-3.5 h-3.5 mr-1 text-primary inline" /> Marketing & Campaign Asset Store
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Promotional Scripts & Campaigns</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto text-sm sm:text-base">
            Turnkey outreach copy designed for local businesses across Port of Spain, Chaguanas, San Fernando, and Tobago.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {MARKETPLACE_SCRIPTS.map((script) => (
            <Card key={script.id} className="flex flex-col justify-between">
              <CardHeader>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <Badge variant="outline">{script.channel}</Badge>
                  <span className="font-semibold text-primary text-sm">TTD ${script.priceTTD}</span>
                </div>
                <CardTitle className="text-lg leading-snug">{script.title}</CardTitle>
                <p className="text-xs text-muted-foreground mt-2">{script.preview}</p>
              </CardHeader>
              <CardContent>
                <div className="bg-muted p-3 rounded text-xs font-mono text-muted-foreground line-clamp-4">
                  {script.fullScript}
                </div>
              </CardContent>
              <CardFooter className="flex gap-2">
                <Button variant="outline" size="sm" className="w-full" onClick={() => copyScript(script.id, script.fullScript)}>
                  {copiedId === script.id ? <Check className="w-4 h-4 mr-1 text-emerald-500" /> : <Copy className="w-4 h-4 mr-1" />}
                  Copy
                </Button>
                <Button size="sm" className="w-full" asChild>
                  <Link to="/pay" search={{ ref: script.id, amount: script.priceTTD }}>
                    <ShoppingBag className="w-4 h-4 mr-1" /> Buy
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
