import { useEffect, useState } from "react";
import { Loader2, Pencil } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { updateLead, type UpdateLeadInput } from "@/lib/leads-api";
import { PIPELINE_STAGES, REPS, type Lead } from "@/lib/mdb-data";

const SERVICE_TYPES = ["Solar", "Water Treatment", "Roofing", "HVAC", "Battery", "EV Charger"];
const UTILITIES = ["Duke Energy", "FPL", "TECO", "OUC", "JEA", "Other"];
const PRIORITIES = ["Low", "Medium", "High"] as const;
const CREDIT_RANGES = ["500-599", "600-679", "680-739", "740+"];
const LEAD_SOURCES = ["Door-to-Door", "Referral", "Website", "Social Media", "Event", "Other"];
const STATES = ["FL", "TX", "CA", "GA", "NC", "SC", "AZ", "NV", "Other"];

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  lead: Lead;
  onSaved: () => void;
};

type FormState = {
  customer_name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  service_type: string;
  utility_company: string;
  monthly_bill: string;
  credit_score_range: string;
  lead_source: string;
  assigned_rep_name: string;
  pipeline_stage: string;
  priority: string;
  notes: string;
  next_follow_up_date: string;
};

function fromLead(lead: Lead): FormState {
  return {
    customer_name: lead.name,
    phone: lead.phone,
    email: lead.email,
    address: lead.address,
    city: lead.city,
    state: "FL",
    service_type: lead.service,
    utility_company: lead.utility,
    monthly_bill: String(lead.bill ?? ""),
    credit_score_range: lead.credit,
    lead_source: lead.source,
    assigned_rep_name: lead.rep,
    pipeline_stage: lead.stage,
    priority: lead.priority,
    notes: lead.notes,
    next_follow_up_date: lead.nextFollowUp ?? "",
  };
}

export function EditLeadDialog({ open, onOpenChange, lead, onSaved }: Props) {
  const [form, setForm] = useState<FormState>(() => fromLead(lead));
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  useEffect(() => {
    if (open) {
      setForm(fromLead(lead));
      setErrors({});
    }
  }, [open, lead]);

  function set<K extends keyof FormState>(k: K, v: FormState[K]) {
    setForm((f) => ({ ...f, [k]: v }));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: undefined }));
  }

  function validate(): boolean {
    const e: Partial<Record<keyof FormState, string>> = {};
    if (!form.customer_name.trim()) e.customer_name = "Required";
    if (!form.phone.trim() && !form.email.trim()) {
      e.phone = "Phone or email required";
      e.email = "Phone or email required";
    }
    if (!form.service_type) e.service_type = "Required";
    if (!form.city.trim()) e.city = "Required";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function onSubmit() {
    if (!validate()) return;
    setSubmitting(true);
    const patch: UpdateLeadInput = {
      customer_name: form.customer_name.trim(),
      phone: form.phone.trim() || null,
      email: form.email.trim() || null,
      address: form.address.trim() || null,
      city: form.city.trim() || null,
      state: form.state || null,
      service_type: form.service_type || null,
      utility_company: form.utility_company || null,
      monthly_bill: form.monthly_bill ? Number(form.monthly_bill) : null,
      credit_score_range: form.credit_score_range || null,
      lead_source: form.lead_source || null,
      pipeline_stage: form.pipeline_stage as Lead["stage"],
      priority: form.priority as Lead["priority"],
      notes: form.notes.trim() || null,
      next_follow_up_date: form.next_follow_up_date || null,
    };
    const { error } = await updateLead(lead.id, patch);
    setSubmitting(false);
    if (error) {
      toast.error("Failed to update lead", { description: error });
      return;
    }
    toast.success("Lead updated successfully.");
    onOpenChange(false);
    onSaved();
    window.dispatchEvent(new CustomEvent("leads:changed"));
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="size-4 text-primary" /> Edit Lead
          </DialogTitle>
          <DialogDescription>Update lead details. Changes are saved to your pipeline.</DialogDescription>
        </DialogHeader>

        <div className="grid sm:grid-cols-2 gap-3 py-2">
          <Field label="Customer name *" error={errors.customer_name}>
            <Input value={form.customer_name} onChange={(e) => set("customer_name", e.target.value)} maxLength={120} />
          </Field>
          <Field label="Assigned rep">
            <SelectField value={form.assigned_rep_name} onChange={(v) => set("assigned_rep_name", v)} opts={REPS} />
          </Field>
          <Field label="Phone" error={errors.phone}>
            <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} maxLength={32} />
          </Field>
          <Field label="Email" error={errors.email}>
            <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} maxLength={255} />
          </Field>
          <Field label="Address" className="sm:col-span-2">
            <Input value={form.address} onChange={(e) => set("address", e.target.value)} maxLength={255} />
          </Field>
          <Field label="City *" error={errors.city}>
            <Input value={form.city} onChange={(e) => set("city", e.target.value)} maxLength={80} />
          </Field>
          <Field label="State">
            <SelectField value={form.state} onChange={(v) => set("state", v)} opts={STATES} />
          </Field>
          <Field label="Service type *" error={errors.service_type}>
            <SelectField value={form.service_type} onChange={(v) => set("service_type", v)} opts={SERVICE_TYPES} />
          </Field>
          <Field label="Utility">
            <SelectField value={form.utility_company} onChange={(v) => set("utility_company", v)} opts={UTILITIES} />
          </Field>
          <Field label="Monthly bill ($)">
            <Input type="number" min={0} value={form.monthly_bill} onChange={(e) => set("monthly_bill", e.target.value)} />
          </Field>
          <Field label="Credit score">
            <SelectField value={form.credit_score_range} onChange={(v) => set("credit_score_range", v)} opts={CREDIT_RANGES} />
          </Field>
          <Field label="Lead source">
            <SelectField value={form.lead_source} onChange={(v) => set("lead_source", v)} opts={LEAD_SOURCES} />
          </Field>
          <Field label="Priority">
            <SelectField value={form.priority} onChange={(v) => set("priority", v)} opts={PRIORITIES as unknown as string[]} />
          </Field>
          <Field label="Pipeline stage">
            <SelectField value={form.pipeline_stage} onChange={(v) => set("pipeline_stage", v)} opts={PIPELINE_STAGES as unknown as string[]} />
          </Field>
          <Field label="Next follow-up">
            <Input type="date" value={form.next_follow_up_date} onChange={(e) => set("next_follow_up_date", e.target.value)} />
          </Field>
          <Field label="Notes" className="sm:col-span-2">
            <Textarea rows={3} maxLength={2000} value={form.notes} onChange={(e) => set("notes", e.target.value)} />
          </Field>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>Cancel</Button>
          <Button onClick={onSubmit} disabled={submitting}>
            {submitting && <Loader2 className="size-4 animate-spin mr-2" />} Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children, error, className = "" }: { label: string; children: React.ReactNode; error?: string; className?: string }) {
  return (
    <div className={`space-y-1 ${className}`}>
      <Label className="text-xs">{label}</Label>
      {children}
      {error && <div className="text-[11px] text-destructive">{error}</div>}
    </div>
  );
}

function SelectField({ value, onChange, opts }: { value: string; onChange: (v: string) => void; opts: string[] }) {
  return (
    <Select value={value || undefined} onValueChange={onChange}>
      <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
      <SelectContent>
        {opts.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}