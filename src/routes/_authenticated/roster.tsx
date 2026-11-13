import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  MapPin,
  Phone,
  Search,
  UserCheck,
  Plus,
  Pencil,
  Trash2,
  Truck,
  ShieldCheck,
  DollarSign,
  HardHat,
  Link2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { listBookings } from "@/lib/bookings.functions";
import { useViewMode } from "@/lib/view-mode";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/roster")({
  component: RosterPage,
  head: () => ({ meta: [{ title: "Crew & Service-Area Roster — DUAA" }] }),
});

export type CrewStatus = "Available" | "Booked" | "On-call" | "Standby";

export interface CrewMember {
  id: string;
  name: string;
  phone: string;
  specialty: string;
  area: string;
  status: CrewStatus;
  vehicle: string;
  certifications: string;
  ppeChecklist: string;
  rate: string;
  assignedBookingId?: string | null;
  assignedBookingRef?: string | null;
}

const DEFAULT_CREW: CrewMember[] = [
  {
    id: "tech-alpha",
    name: "Field Unit Alpha",
    specialty: "Mobile mechanic · OBD diagnostics & brakes",
    area: "San Fernando & South Trinidad",
    status: "On-call",
    phone: "+1 868-763-1106",
    vehicle: "Flatbed Tow & Service Rig 1",
    certifications: "OSHA-10, Automotive ASE",
    ppeChecklist: "Hardhat, Steel-Toe Boots, Eye Shield",
    rate: "TT$ 180/hr",
    assignedBookingRef: null,
  },
  {
    id: "tech-beta",
    name: "Field Unit Beta",
    specialty: "Commercial & automotive electrical",
    area: "Port of Spain & East-West Corridor",
    status: "Booked",
    phone: "+1 868-763-1106",
    vehicle: "Rapid Service Van 2",
    certifications: "EID Certified, High-Voltage Safety",
    ppeChecklist: "Arc Flash Rated Suit, Insulated Gloves",
    rate: "TT$ 220/hr",
    assignedBookingRef: "DUA-COMMERCIAL",
  },
  {
    id: "tech-gamma",
    name: "Field Unit Gamma",
    specialty: "Grounds, landscaping & floral care",
    area: "Central Trinidad & Diego Martin",
    status: "Available",
    phone: "+1 868-763-1106",
    vehicle: "Commercial Flatbed Hauler 3",
    certifications: "DUAA Commercial Turf Operator",
    ppeChecklist: "Ear Defenders, Steel-Toe, High-Vis",
    rate: "TT$ 150/hr",
    assignedBookingRef: null,
  },
  {
    id: "tech-delta",
    name: "Twin-Island Coordination",
    specialty: "Delivery, towing & service enquiries",
    area: "Trinidad & Tobago · Marine & Inter-Island",
    status: "On-call",
    phone: "+1 868-763-1106",
    vehicle: "Logistics Dispatch Base & Tender",
    certifications: "Logistics & Maritime Freight Protocol",
    ppeChecklist: "Life Vest, High-Vis, Safety Boots",
    rate: "TT$ 200/hr",
    assignedBookingRef: null,
  },
];

const STORAGE_KEY = "duaa_operational_roster_v1";

function RosterPage() {
  const { viewOnly } = useViewMode();
  const [query, setQuery] = useState("");
  const [crewList, setCrewList] = useState<CrewMember[]>(() => {
    if (typeof window === "undefined") return DEFAULT_CREW;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : DEFAULT_CREW;
    } catch {
      return DEFAULT_CREW;
    }
  });

  const [activeModal, setActiveModal] = useState<"add" | "edit" | "assign" | "delete" | null>(null);
  const [selectedCrew, setSelectedCrew] = useState<CrewMember | null>(null);
  const [formData, setFormData] = useState<Partial<CrewMember>>({});

  // Query live bookings to enable Direct Booking Assignment
  const fetchBookings = useServerFn(listBookings);
  const { data: bookings = [] } = useQuery({
    queryKey: ["bookings"],
    queryFn: () => fetchBookings(),
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(crewList));
    } catch {
      // Ignore write errors in restricted storage
    }
  }, [crewList]);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return crewList;
    return crewList.filter((tech) =>
      `${tech.name} ${tech.specialty} ${tech.area} ${tech.status} ${tech.vehicle} ${tech.assignedBookingRef ?? ""}`
        .toLowerCase()
        .includes(term)
    );
  }, [query, crewList]);

  const openAdd = () => {
    setSelectedCrew(null);
    setFormData({
      name: "",
      phone: "+1 868-763-1106",
      specialty: "",
      area: "East-West Corridor",
      status: "Available",
      vehicle: "",
      certifications: "OSHA-10",
      ppeChecklist: "Steel-Toe Boots, High-Vis",
      rate: "TT$ 180/hr",
      assignedBookingRef: null,
    });
    setActiveModal("add");
  };

  const openEdit = (tech: CrewMember) => {
    setSelectedCrew(tech);
    setFormData({ ...tech });
    setActiveModal("edit");
  };

  const openAssign = (tech: CrewMember) => {
    setSelectedCrew(tech);
    setFormData({
      assignedBookingId: tech.assignedBookingId ?? "",
      assignedBookingRef: tech.assignedBookingRef ?? "",
      status: tech.status,
    });
    setActiveModal("assign");
  };

  const openDelete = (tech: CrewMember) => {
    setSelectedCrew(tech);
    setActiveModal("delete");
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim() || !formData.phone?.trim()) {
      toast.error("Please enter crew name and phone number");
      return;
    }

    if (activeModal === "add") {
      const newMember: CrewMember = {
        id: `crew-${Date.now()}`,
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        specialty: formData.specialty?.trim() || "General Field Technician",
        area: formData.area?.trim() || "Trinidad & Tobago",
        status: (formData.status as CrewStatus) || "Available",
        vehicle: formData.vehicle?.trim() || "Standard Fleet Vehicle",
        certifications: formData.certifications?.trim() || "Standard DUAA Compliance",
        ppeChecklist: formData.ppeChecklist?.trim() || "Standard PPE Kit",
        rate: formData.rate?.trim() || "TT$ 180/hr",
        assignedBookingRef: null,
      };
      setCrewList((prev) => [newMember, ...prev]);
      toast.success(`${newMember.name} added to roster`);
    } else if (activeModal === "edit" && selectedCrew) {
      setCrewList((prev) =>
        prev.map((c) => (c.id === selectedCrew.id ? ({ ...c, ...formData } as CrewMember) : c))
      );
      toast.success(`Updated ${selectedCrew.name}`);
    }

    setActiveModal(null);
  };

  const handleAssignSave = () => {
    if (!selectedCrew) return;
    const bookingRef = formData.assignedBookingRef?.trim() || null;
    const newStatus: CrewStatus = bookingRef ? "Booked" : "Available";

    setCrewList((prev) =>
      prev.map((c) =>
        c.id === selectedCrew.id
          ? {
              ...c,
              assignedBookingRef: bookingRef,
              status: (formData.status as CrewStatus) || newStatus,
            }
          : c
      )
    );
    toast.success(bookingRef ? `Assigned to booking ${bookingRef}` : "Cleared booking assignment");
    setActiveModal(null);
  };

  const handleDelete = () => {
    if (!selectedCrew) return;
    setCrewList((prev) => prev.filter((c) => c.id !== selectedCrew.id));
    toast.success(`Removed ${selectedCrew.name} from roster`);
    setActiveModal(null);
  };

  return (
    <main className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" asChild>
              <Link to="/bookings">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Bookings
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Crew & Operational Roster</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                DUAA dispatch & field operational management for Trinidad & Tobago.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!viewOnly && (
              <Button size="sm" onClick={openAdd}>
                <Plus className="mr-2 h-4 w-4" />
                Add Crew Member
              </Button>
            )}
            <Button size="sm" variant="outline" asChild>
              <a href="tel:+18687631106">
                <Phone className="mr-2 h-4 w-4" />
                Confirm Dispatch
              </a>
            </Button>
          </div>
        </header>

        <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-sm text-muted-foreground">
          Direct Booking Assignment mode active. Crew profiles maintain Full Operational Spec (vehicles, PPE, certs, and rates).
        </div>

        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by crew name, specialty, corridor, vehicle, or assigned booking..."
            className="pl-9"
          />
        </div>

        {filtered.length ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {filtered.map((tech) => (
              <Card key={tech.id} className="relative flex flex-col justify-between">
                <div>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-3">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <UserCheck className="h-4 w-4 text-primary" />
                        {tech.name}
                      </CardTitle>
                      <div className="flex items-center gap-1.5">
                        <Badge
                          variant={
                            tech.status === "Available"
                              ? "outline"
                              : tech.status === "Booked"
                              ? "destructive"
                              : "secondary"
                          }
                        >
                          {tech.status}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <p className="font-medium text-foreground">{tech.specialty}</p>
                    
                    <p className="flex items-start gap-2 text-muted-foreground">
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      {tech.area}
                    </p>

                    <div className="grid grid-cols-1 gap-1.5 rounded-md bg-muted/40 p-2.5 text-xs text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Truck className="h-3.5 w-3.5 text-primary" />
                        <span className="font-medium text-foreground">Unit:</span> {tech.vehicle || "N/A"}
                      </div>
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                        <span className="font-medium text-foreground">Certs:</span> {tech.certifications || "Standard"}
                      </div>
                      <div className="flex items-center gap-2">
                        <HardHat className="h-3.5 w-3.5 text-primary" />
                        <span className="font-medium text-foreground">PPE:</span> {tech.ppeChecklist || "Required"}
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-3.5 w-3.5 text-primary" />
                        <span className="font-medium text-foreground">Rate:</span> {tech.rate || "Standard"}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <a
                        href={`tel:${tech.phone.replace(/\s/g, "")}`}
                        className="inline-flex items-center gap-2 text-primary underline-offset-4 hover:underline"
                      >
                        <Phone className="h-4 w-4" />
                        {tech.phone}
                      </a>
                      {tech.assignedBookingRef ? (
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <Link2 className="h-3 w-3" />
                          {tech.assignedBookingRef}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">Unassigned</span>
                      )}
                    </div>
                  </CardContent>
                </div>

                {!viewOnly && (
                  <div className="flex items-center justify-end gap-2 border-t bg-muted/10 px-4 py-2.5">
                    <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => openAssign(tech)}>
                      <Link2 className="mr-1.5 h-3.5 w-3.5" />
                      Assign Job
                    </Button>
                    <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => openEdit(tech)}>
                      <Pencil className="mr-1.5 h-3.5 w-3.5" />
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => openDelete(tech)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}
              </Card>
            ))}
          </div>
        ) : (
          <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
            No roster entries match “{query}”.
          </p>
        )}
      </div>

      {/* Add / Edit Modal */}
      <Dialog open={activeModal === "add" || activeModal === "edit"} onOpenChange={(open) => !open && setActiveModal(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{activeModal === "add" ? "Add Crew Member" : `Edit ${selectedCrew?.name}`}</DialogTitle>
            <DialogDescription>
              DUAA Full Operational Spec: fill out technician qualifications and equipment.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="crew-name">Unit / Member Name</Label>
                <Input
                  id="crew-name"
                  value={formData.name || ""}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Field Unit Delta"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="crew-phone">Phone (T&T)</Label>
                <Input
                  id="crew-phone"
                  value={formData.phone || ""}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+1 868-xxx-xxxx"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="crew-specialty">Trade Specialty</Label>
              <Input
                id="crew-specialty"
                value={formData.specialty || ""}
                onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                placeholder="e.g. Commercial Electrical · High-Voltage"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="crew-area">Corridor / Service Area</Label>
                <Input
                  id="crew-area"
                  value={formData.area || ""}
                  onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                  placeholder="e.g. Port of Spain & Corridor"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="crew-status">Status</Label>
                <Select
                  value={formData.status || "Available"}
                  onValueChange={(val) => setFormData({ ...formData, status: val as CrewStatus })}
                >
                  <SelectTrigger id="crew-status">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Available">Available</SelectItem>
                    <SelectItem value="Booked">Booked</SelectItem>
                    <SelectItem value="On-call">On-call</SelectItem>
                    <SelectItem value="Standby">Standby</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="crew-vehicle">Assigned Vehicle / Flatbed</Label>
                <Input
                  id="crew-vehicle"
                  value={formData.vehicle || ""}
                  onChange={(e) => setFormData({ ...formData, vehicle: e.target.value })}
                  placeholder="e.g. Flatbed Tow Rig 4"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="crew-rate">Hourly / Job Rate</Label>
                <Input
                  id="crew-rate"
                  value={formData.rate || ""}
                  onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
                  placeholder="e.g. TT$ 180/hr"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="crew-certs">Safety Certifications</Label>
              <Input
                id="crew-certs"
                value={formData.certifications || ""}
                onChange={(e) => setFormData({ ...formData, certifications: e.target.value })}
                placeholder="e.g. OSHA-10, EID Electrical, Fire Safety"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="crew-ppe">PPE Checklist</Label>
              <Input
                id="crew-ppe"
                value={formData.ppeChecklist || ""}
                onChange={(e) => setFormData({ ...formData, ppeChecklist: e.target.value })}
                placeholder="e.g. Steel-Toe, Hardhat, High-Vis Vest"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setActiveModal(null)}>
                Cancel
              </Button>
              <Button type="submit">Save Changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Direct Booking Assignment Modal */}
      <Dialog open={activeModal === "assign"} onOpenChange={(open) => !open && setActiveModal(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Assign {selectedCrew?.name} to Booking</DialogTitle>
            <DialogDescription>
              Link this crew member directly to an active customer booking.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            <div className="space-y-1.5">
              <Label>Select Active Booking</Label>
              <Select
                value={formData.assignedBookingRef || "none"}
                onValueChange={(val) =>
                  setFormData({
                    ...formData,
                    assignedBookingRef: val === "none" ? null : val,
                    status: val === "none" ? "Available" : "Booked",
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a booking" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None (Clear Assignment)</SelectItem>
                  {bookings.map((b) => (
                    <SelectItem key={b.id} value={b.reference}>
                      {b.reference} — {b.service} ({b.name})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Or enter custom reference / project code</Label>
              <Input
                value={formData.assignedBookingRef || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    assignedBookingRef: e.target.value,
                    status: e.target.value ? "Booked" : "Available",
                  })
                }
                placeholder="e.g. DUA-COMMERCIAL-01"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setActiveModal(null)}>
              Cancel
            </Button>
            <Button onClick={handleAssignSave}>Confirm Assignment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={activeModal === "delete"} onOpenChange={(open) => !open && setActiveModal(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Crew Member</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove <span className="font-semibold text-foreground">{selectedCrew?.name}</span> from the active roster?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-2">
            <Button variant="outline" onClick={() => setActiveModal(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
