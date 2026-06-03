import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createLeadTask } from "@/lib/leads-api";

const APPOINTMENT_TYPES = [
  "Discovery Call",
  "Virtual Proposal Review",
  "In-Home Consultation",
  "Site Survey",
  "Install Walkthrough",
  "Follow-up",
];

export function ScheduleDialog({
  open, onOpenChange, leadId, leadName, onScheduled,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  leadId: string;
  leadName?: string;
  onScheduled?: () => void;
}) {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [type, setType] = useState(APPOINTMENT_TYPES[0]);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!date) { toast.error("Please pick a date."); return; }
    setSaving(true);
    const title = `${type}${leadName ? ` · ${leadName}` : ""}${time ? ` @ ${time}` : ""}`;
    const { error } = await createLeadTask(leadId, {
      title,
      description: notes || undefined,
      due_date: date,
      priority: "Medium",
    });
    setSaving(false);
    if (error) { toast.error("Couldn't schedule", { description: error }); return; }
    toast.success("Appointment scheduled");
    setDate(""); setTime(""); setNotes(""); setType(APPOINTMENT_TYPES[0]);
    onOpenChange(false);
    onScheduled?.();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Schedule appointment</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Date</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Time</Label>
              <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Appointment type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {APPOINTMENT_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Notes</Label>
            <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={1000} placeholder="Agenda, attendees, prep…" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
          <Button onClick={save} disabled={saving || !date}>
            {saving && <Loader2 className="size-3.5 animate-spin mr-1.5" />} Save appointment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}