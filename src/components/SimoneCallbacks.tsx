import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Bell, Check, Phone, Plus, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useViewMode } from "@/lib/view-mode";
import { listCallbackReminders, saveCallbackReminder, updateCallbackReminder } from "@/lib/simone.functions";
import { type CallbackReminder, type CallbackInput } from "@/lib/simone";

export function SimoneCallbacks() {
  const { viewOnly } = useViewMode();
  const list = useServerFn(listCallbackReminders);
  const save = useServerFn(saveCallbackReminder);
  const update = useServerFn(updateCallbackReminder);
  const client = useQueryClient();
  const { data = [], error, isPending } = useQuery({ queryKey: ["simone-callbacks"], queryFn: async () => await list() as CallbackReminder[] });
  const [saving, setSaving] = useState(false);
  const [mutating, setMutating] = useState<string | null>(null);
  const [showHandled, setShowHandled] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [reason, setReason] = useState<CallbackInput["reason"]>("no-answer");
  const [message, setMessage] = useState("");
  const [when, setWhen] = useState("");
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      await save({ data: { contactName: name, phoneNumber: phone, reason, message, reminderAt: when ? new Date(when).toISOString() : new Date().toISOString() } });
      await client.invalidateQueries({ queryKey: ["simone-callbacks"] });
      setName(""); setPhone(""); setMessage(""); setWhen("");
      toast.success("Callback reminder saved.");
    } catch (err) { toast.error(err instanceof Error ? err.message : "Could not save reminder."); }
    finally { setSaving(false); }
  };
  const changeStatus = async (item: CallbackReminder) => {
    setMutating(item.id);
    try {
      await update({ data: { id: item.id, status: item.status === "pending" ? "handled" : "pending" } });
      await client.invalidateQueries({ queryKey: ["simone-callbacks"] });
    } catch (err) { toast.error(err instanceof Error ? err.message : "Could not update reminder."); }
    finally { setMutating(null); }
  };
  const visible = data.filter((item) => showHandled || item.status === "pending");
  return <section className="mt-8 border-t border-border pt-6" aria-labelledby="callback-heading">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h2 id="callback-heading" className="flex items-center gap-2 text-xl font-semibold"><Bell className="h-5 w-5 text-primary" />Simone · Callback reminders</h2>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={showHandled} onChange={(event) => setShowHandled(event.target.checked)} /> Show handled</label>
    </div>
    {!viewOnly && <form onSubmit={submit} className="my-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <label className="space-y-1 text-sm">Contact name<Input aria-label="Contact name" value={name} onChange={(e) => setName(e.target.value)} required maxLength={120} /></label>
      <label className="space-y-1 text-sm">Callback number<Input aria-label="Callback number" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 868 000 0000" required maxLength={24} /></label>
      <label className="space-y-1 text-sm">Reason<select aria-label="Callback reason" value={reason} onChange={(e) => setReason(e.target.value as CallbackInput["reason"])} className="h-10 w-full rounded-md border border-input bg-background px-3"><option value="no-answer">Unanswered call</option><option value="busy">Busy call</option><option value="sms">SMS received</option></select></label>
      <label className="space-y-1 text-sm">Remind at<Input aria-label="Remind at" type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} /></label>
      <label className="space-y-1 text-sm sm:col-span-2 lg:col-span-3">Message / callback note<textarea aria-label="Callback note" value={message} onChange={(e) => setMessage(e.target.value)} maxLength={1600} rows={2} className="w-full rounded-md border border-input bg-background p-3" /></label>
      <Button type="submit" disabled={saving} className="self-end"><Plus className="mr-2 h-4 w-4" />{saving ? "Saving…" : "Save callback reminder"}</Button>
    </form>}
    {isPending && <p className="py-4 text-muted-foreground">Loading reminders…</p>}
    {error && <div role="alert" className="py-4 text-destructive">{error.message}<Button variant="outline" size="sm" className="ml-3" onClick={() => client.invalidateQueries({ queryKey: ["simone-callbacks"] })}>Retry</Button></div>}
    {!isPending && !error && !visible.length && <p className="py-6 text-sm text-muted-foreground">No {showHandled ? "saved" : "pending"} callback reminders.</p>}
    <div className="grid gap-3 sm:grid-cols-2">{visible.map((item) => <article key={item.id} className="min-w-0 rounded-lg border border-border bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="break-words font-semibold">{item.contact_name}</h3><Badge variant="outline">{item.status}</Badge></div>
      <a href={`tel:${item.phone_number}`} className="mt-2 inline-flex items-center gap-2 text-sm text-primary"><Phone className="h-4 w-4" />{item.phone_number}</a>
      <p className="mt-2 text-sm text-muted-foreground">{item.reason === "sms" ? "SMS received" : item.reason === "busy" ? "Busy call" : "Unanswered call"} · {new Date(item.reminder_at).toLocaleString()}</p>
      {item.message && <p className="mt-2 whitespace-pre-wrap break-words text-sm">{item.message}</p>}
      <p className="mt-2 text-xs text-muted-foreground">{item.source === "manual" ? "Manually logged" : "Twilio event"} · {item.assistant_name}</p>
      {!viewOnly && <Button size="sm" variant="outline" disabled={mutating === item.id} className="mt-3" onClick={() => changeStatus(item)}>{item.status === "pending" ? <Check className="mr-2 h-4 w-4" /> : <RotateCcw className="mr-2 h-4 w-4" />}{item.status === "pending" ? "Mark handled" : "Reopen"}</Button>}
    </article>)}</div>
  </section>;
}