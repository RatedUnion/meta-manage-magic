import { useState } from "react";
import { PlusCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";

interface ManualBookingDialogProps {
  onBookingCreated?: () => void;
  disabled?: boolean;
}

export function ManualBookingDialog({ onBookingCreated, disabled }: ManualBookingDialogProps) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("+1 (868) ");
  const [service, setService] = useState("Domestic Maintenance");
  const [isCommercial, setIsCommercial] = useState(false);
  const [bookingDate, setBookingDate] = useState("");
  const [amount, setAmount] = useState<number>(400);
  const [paymentStatus, setPaymentStatus] = useState<"pending" | "paid" | "awaiting_verification">("awaiting_verification");
  const [notes, setNotes] = useState("");

  const handleCategoryChange = (commercial: boolean) => {
    setIsCommercial(commercial);
    if (commercial) {
      if (amount < 1200) setAmount(1200);
      setService("Commercial Electrical & Facility Maintenance");
    } else {
      if (amount < 400) setAmount(400);
      setService("Domestic Maintenance & Repairs");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Please provide the customer name.");
      return;
    }

    if (amount < 110) {
      toast.error("Minimum booking price must cover the non-negotiable TTD $110 appointment fee.");
      return;
    }

    if (isCommercial && amount < 1200) {
      toast.error("Commercial bookings must meet the minimum TTD $1,200 floor (1–2 crew).");
      return;
    }

    setSubmitting(true);
    try {
      const code = Math.random().toString(36).substring(2, 12).toUpperCase();

      const { error } = await supabase.from("bookings").insert({
        name: name.trim(),
        email: email.trim() || "walk-in@duaa.tt",
        phone: phone.trim(),
        service: service.trim(),
        booking_date: bookingDate ? new Date(bookingDate).toISOString() : new Date().toISOString(),
        status: "confirmed",
        payment_status: paymentStatus,
        payment_amount: amount,
        payment_currency: "TTD",
        payment_method: "bank_transfer",
        notes: notes ? `[Manual Staff Entry] ${notes}` : "[Manual Staff Entry]",
        booking_code: code,
      });

      if (error) throw error;

      toast.success(`Booking logged successfully! Code: ${code}`);
      setOpen(false);
      setName("");
      setEmail("");
      setPhone("+1 (868) ");
      setNotes("");
      onBookingCreated?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to record manual booking.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" disabled={disabled} className="gap-2">
          <PlusCircle className="h-4 w-4" />
          Log Manual Booking
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Log Phone / Walk-in Booking</DialogTitle>
          <DialogDescription>
            Record client details and payment status directly into the roster ledger.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="cust-name">Client Name *</Label>
              <Input
                id="cust-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Maria Gonzalez"
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="cust-phone">Phone Number</Label>
              <Input
                id="cust-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (868) 763-1106"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="cust-email">Email (Optional)</Label>
              <Input
                id="cust-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="client@live.com"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="cust-date">Appointment Date</Label>
              <Input
                id="cust-date"
                type="datetime-local"
                value={bookingDate}
                onChange={(e) => setBookingDate(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label>Service Tier</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={!isCommercial ? "default" : "outline"}
                size="sm"
                className="flex-1"
                onClick={() => handleCategoryChange(false)}
              >
                Domestic (From TTD $400)
              </Button>
              <Button
                type="button"
                variant={isCommercial ? "default" : "outline"}
                size="sm"
                className="flex-1"
                onClick={() => handleCategoryChange(true)}
              >
                Commercial (Min TTD $1,200)
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="booking-price">Agreed Total (TTD $)</Label>
              <Input
                id="booking-price"
                type="number"
                min={110}
                step={10}
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                required
              />
              <p className="text-[11px] text-muted-foreground">
                {isCommercial ? "Min $1,200 (1–2 crew)" : "Base from $400 · Fee $110 floor"}
              </p>
            </div>
            <div className="space-y-1">
              <Label htmlFor="payment-status">Payment Status</Label>
              <select
                id="payment-status"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value as typeof paymentStatus)}
              >
                <option value="awaiting_verification">Awaiting Transfer Verification</option>
                <option value="paid">Paid (Cash / LINX / Wire Verified)</option>
                <option value="pending">Pending Client Action</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="booking-notes">Scope & Notes</Label>
            <Input
              id="booking-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. 200A panel changeover, 2-man crew, Chaguanas"
            />
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Saving…" : "Log Manual Booking"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
