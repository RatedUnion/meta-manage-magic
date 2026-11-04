import { useState } from "react";
import { Copy, ImagePlus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

const CHANNELS = ["Facebook", "Instagram", "WhatsApp", "SMS", "Email", "Web"];
const GOALS = ["Promote a service", "Seasonal campaign", "Booking reminder", "Educational post", "Special offer"];
const TONES = ["Warm and professional", "Friendly and conversational", "Confident and concise", "Educational and reassuring"];
const MAX_FILE_BYTES = 4 * 1024 * 1024;
const DRAFT_STORAGE_KEY = "dee-content-studio-draft-v1";

type Props = { onUseDraft?: (draft: string) => void };

function localDraft(channel: string, goal: string, audience: string, brief: string) {
  const action = channel === "SMS" ? "Reply or call us to learn more." : "Contact DUAA or request a booking to get started.";
  return `[OFFLINE DRAFT — REVIEW BEFORE USE]\n\n${brief.trim()}\n\nCreated for: ${audience.trim()}\nCampaign goal: ${goal}\n\n${action}\n\nNote: Dee's live AI was unavailable, so this is a basic template, not an AI-reviewed draft.`;
}

export function DeeContentStudio({ onUseDraft }: Props) {
  const [channel, setChannel] = useState(CHANNELS[0]);
  const [goal, setGoal] = useState(GOALS[0]);
  const [tone, setTone] = useState(TONES[0]);
  const [audience, setAudience] = useState("");
  const [brief, setBrief] = useState("");
  const [approvedFacts, setApprovedFacts] = useState("");
  const [documentText, setDocumentText] = useState("");
  const [imageDataUrl, setImageDataUrl] = useState("");
  const [fileName, setFileName] = useState("");
  const [draft, setDraft] = useState(() => {
    try { return localStorage.getItem(DRAFT_STORAGE_KEY) ?? ""; } catch { return ""; }
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const attachFile = async (file?: File) => {
    if (!file) return;
    if (file.size > MAX_FILE_BYTES) {
      setError("Attachments must be 4 MB or smaller. Your current brief and draft are unchanged.");
      return;
    }
    setError("");
    setFileName(file.name);
    setDocumentText("");
    setImageDataUrl("");
    if (["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      const reader = new FileReader();
      reader.onload = () => setImageDataUrl(typeof reader.result === "string" ? reader.result : "");
      reader.onerror = () => setError("Could not read the image. Please choose another file.");
      reader.readAsDataURL(file);
      return;
    }
    if (["text/plain", "text/markdown", "text/csv", "application/json"].includes(file.type) || /\.(txt|md|csv|json)$/i.test(file.name)) {
      try {
        const text = await file.text();
        if (text.length > 20_000) throw new Error("Document text exceeds the 20,000-character limit.");
        setDocumentText(text);
      } catch (cause) {
        setFileName("");
        setError(cause instanceof Error ? cause.message : "Could not read the document.");
      }
      return;
    }
    setFileName("");
    setError("Supported files: PNG, JPEG, WebP images and TXT, Markdown, CSV, or JSON documents. PDF files are not processed yet.");
  };

  const generate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (audience.trim().length < 2 || brief.trim().length < 3) {
      setError("Enter a target audience and campaign brief first.");
      return;
    }
    setBusy(true);
    setError("");
    setDraft("");
    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) throw new Error("Sign in to generate campaign content.");
      const response = await fetch("/api/content", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ channel, goal, tone, audience, brief, approvedFacts, documentText, imageDataUrl: imageDataUrl || undefined }),
      });
      if (!response.ok) throw new Error(await response.text() || "Generation failed.");
      if (!response.body) throw new Error("No response stream received.");
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let text = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        text += decoder.decode(value, { stream: true });
        setDraft(text);
      }
      text += decoder.decode();
      if (!text.trim()) throw new Error("No draft was returned.");
      setDraft(text);
      try { localStorage.setItem(DRAFT_STORAGE_KEY, text); } catch { /* storage may be disabled */ }
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Generation failed.";
      setError(`${message} A basic offline draft is available instead.`);
      const fallback = localDraft(channel, goal, audience, brief);
      setDraft(fallback);
      try { localStorage.setItem(DRAFT_STORAGE_KEY, fallback); } catch { /* storage may be disabled */ }
    } finally {
      setBusy(false);
    }
  };

  const copyDraft = async () => {
    try { await navigator.clipboard.writeText(draft); }
    catch { setError("Could not copy. Select the draft text and copy it manually."); }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg"><Sparkles className="h-5 w-5 text-primary" />Dee Content Studio</CardTitle>
        <p className="text-sm text-muted-foreground">Create channel-ready drafts. Images and supported text documents can inform generation. Review every claim; nothing is published automatically.</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={generate} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            {[ ["Channel", channel, setChannel, CHANNELS], ["Goal", goal, setGoal, GOALS], ["Tone", tone, setTone, TONES] ].map(([label, value, setter, options]) => (
              <label key={label as string} className="space-y-1 text-xs font-medium text-muted-foreground">{label as string}
                <select value={value as string} onChange={(event) => (setter as (v: string) => void)(event.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground">
                  {(options as string[]).map((option) => <option key={option}>{option}</option>)}
                </select>
              </label>
            ))}
          </div>
          <label className="block space-y-1 text-xs font-medium text-muted-foreground">Target audience
            <input required maxLength={200} value={audience} onChange={(event) => setAudience(event.target.value)} placeholder="e.g. Fleet managers in Port of Spain" className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground" />
          </label>
          <label className="block space-y-1 text-xs font-medium text-muted-foreground">Campaign brief
            <textarea required maxLength={2000} rows={3} value={brief} onChange={(event) => setBrief(event.target.value)} placeholder="Service, seasonal context, and intended call to action" className="w-full rounded-md border border-input bg-background p-3 text-sm text-foreground" />
          </label>
          <label className="block space-y-1 text-xs font-medium text-muted-foreground">Confirmed facts or offer (optional)
            <textarea maxLength={2000} rows={2} value={approvedFacts} onChange={(event) => setApprovedFacts(event.target.value)} placeholder="Enter only prices, dates, and claims you have confirmed." className="w-full rounded-md border border-input bg-background p-3 text-sm text-foreground" />
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground"><ImagePlus className="h-4 w-4" />Attach image or text document (4 MB max)
            <input type="file" accept="image/png,image/jpeg,image/webp,.txt,.md,.csv,.json" className="sr-only" onChange={(event) => void attachFile(event.target.files?.[0])} />
          </label>
          {fileName && <p className="text-xs text-muted-foreground">Attached: {fileName} {imageDataUrl ? "(image ready)" : documentText ? "(document text ready)" : "(reading…)"}</p>}
          <Button type="submit" disabled={busy}>{busy ? "Generating…" : "Generate campaign draft"}</Button>
        </form>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        {draft && <section aria-live="polite" className="space-y-3 rounded-lg border border-border bg-secondary/20 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="text-sm font-semibold">Draft preview · {channel}</h3><div className="flex gap-2"><Button type="button" size="sm" variant="outline" onClick={copyDraft}> <Copy className="mr-2 h-4 w-4" />Copy</Button>{onUseDraft && <Button type="button" size="sm" variant="outline" onClick={() => onUseDraft(draft)}>Use in publisher</Button>}</div></div>
          <textarea aria-label="Edit generated draft" value={draft} onChange={(event) => { setDraft(event.target.value); try { localStorage.setItem(DRAFT_STORAGE_KEY, event.target.value); } catch { /* storage may be disabled */ } }} rows={9} className="w-full resize-y rounded-md border border-input bg-background p-3 text-sm leading-relaxed" />
          <p className="text-xs text-muted-foreground">Draft only—not published. Verify prices, dates, availability, permissions, and claims before sharing.</p>
        </section>}
      </CardContent>
    </Card>
  );
}
