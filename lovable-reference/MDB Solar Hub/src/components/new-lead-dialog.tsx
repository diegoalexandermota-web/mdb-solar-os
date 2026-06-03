import { useState } from "react";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
  DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { createLead, type NewLeadInput } from "@/lib/leads-api";
import { REPS } from "@/lib/mdb-data";

const SERVICE_TYPES = ["Solar", "Water Treatment", "Roofing", "HVAC", "Battery", "EV Charger"];
const UTILITIES = ["Duke Energy", "FPL", "TECO", "OUC", "JEA", "Other"];
const PRIORITIES = ["Low", "Medium", "High", "Hot Lead"] as const;
const CREDIT_RANGES = ["500-599", "600-679", "680-739", "740+"];
const LEAD_SOURCES = ["Door-to-Door", "Referral", "Website", "Social Media", "Event", "Other"];
const STATES = ["FL", "TX", "CA", "GA", "NC", "SC", "AZ", "NV", "Other"];

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
  priority: string;
  notes: string;
  next_follow_up_date: string;
};

const EMPTY: FormState = {
  customer_name: "", phone: "", email: "", address: "", city: "", state: "FL",
  service_type: "", utility_company: "", monthly_bill: "", credit_score_range: "",
  lead_source: "", assigned_rep_name: "", priority: "Medium", notes: "",
  next_follow_up_date: "",
};

export function NewLeadDialog() {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

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
    // Map "Hot Lead" priority to "High" since DB enum has only Low/Medium/High
    const dbPriority = form.priority === "Hot Lead" ? "High" : (form.priority as NewLeadInput["priority"]);
    const payload: NewLeadInput = {
      customer_name: form.customer_name.trim(),
      phone: form.phone.trim() || undefined,
      email: form.email.trim() || undefined,
      address: form.address.trim() || undefined,
      city: form.city.trim() || undefined,
      state: form.state || undefined,
      service_type: form.service_type || undefined,
      utility_company: form.utility_company || undefined,
      monthly_bill: form.monthly_bill ? Number(form.monthly_bill) : undefined,
      credit_score_range: form.credit_score_range || undefined,
      lead_source: form.lead_source || undefined,
      priority: dbPriority,
      notes: form.notes.trim() || undefined,
      next_follow_up_date: form.next_follow_up_date || undefined,
    };
    const { data, error } = await createLead(payload);
    setSubmitting(false);
    if (error || !data) {
      toast.error("Unable to create lead", {
        description: error ?? "Backend is not ready. Please try again.",
      });
      return;
    }
    toast.success("Lead created successfully.");
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("leads:changed"));
    }
    setForm(EMPTY);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setErrors({}); }}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5 shadow-elegant">
          <Plus className="size-4" /> New Lead
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[640px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Lead</DialogTitle>
          <DialogDescription>Add a new lead to the pipeline. Fields marked * are required.</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-2">
          <Field label="Customer Name *" error={errors.customer_name} className="sm:col-span-2">
            <Input maxLength={120} value={form.customer_name} onChange={(e) => set("customer_name", e.target.value)} />
          </Field>

          <Field label="Phone" error={errors.phone}>
            <Input maxLength={40} value={form.phone} onChange={(e) => set("phone", e.target.value)} />
          </Field>
          <Field label="Email" error={errors.email}>
            <Input type="email" maxLength={255} value={form.email} onChange={(e) => set("email", e.target.value)} />
          </Field>

          <Field label="Address" className="sm:col-span-2">
            <Input maxLength={255} value={form.address} onChange={(e) => set("address", e.target.value)} />
          </Field>

          <Field label="City *" error={errors.city}>
            <Input maxLength={80} value={form.city} onChange={(e) => set("city", e.target.value)} />
          </Field>
          <Field label="State">
            <SelectInput value={form.state} onChange={(v) => set("state", v)} options={STATES} placeholder="State" />
          </Field>

          <Field label="Service Type *" error={errors.service_type}>
            <SelectInput value={form.service_type} onChange={(v) => set("service_type", v)} options={SERVICE_TYPES} placeholder="Select service" />
          </Field>
          <Field label="Utility Company">
            <SelectInput value={form.utility_company} onChange={(v) => set("utility_company", v)} options={UTILITIES} placeholder="Select utility" />
          </Field>

          <Field label="Monthly Electric Bill ($)">
            <Input type="number" min={0} max={10000} value={form.monthly_bill} onChange={(e) => set("monthly_bill", e.target.value)} />
          </Field>
          <Field label="Credit Score Range">
            <SelectInput value={form.credit_score_range} onChange={(v) => set("credit_score_range", v)} options={CREDIT_RANGES} placeholder="Select range" />
          </Field>

          <Field label="Lead Source">
            <SelectInput value={form.lead_source} onChange={(v) => set("lead_source", v)} options={LEAD_SOURCES} placeholder="Select source" />
          </Field>
          <Field label="Assigned Rep">
            <SelectInput value={form.assigned_rep_name} onChange={(v) => set("assigned_rep_name", v)} options={REPS} placeholder="Select rep" />
          </Field>

          <Field label="Priority">
            <SelectInput value={form.priority} onChange={(v) => set("priority", v)} options={[...PRIORITIES]} placeholder="Select priority" />
          </Field>
          <Field label="Next Follow-Up Date">
            <Input type="date" value={form.next_follow_up_date} onChange={(e) => set("next_follow_up_date", e.target.value)} />
          </Field>

          <Field label="Notes" className="sm:col-span-2">
            <Textarea rows={3} maxLength={2000} value={form.notes} onChange={(e) => set("notes", e.target.value)} />
          </Field>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={submitting}>Cancel</Button>
          <Button onClick={onSubmit} disabled={submitting} className="gap-1.5">
            {submitting && <Loader2 className="size-4 animate-spin" />}
            Create Lead
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label, error, className, children,
}: { label: string; error?: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={`flex flex-col gap-1.5 ${className ?? ""}`}>
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      {children}
      {error && <span className="text-[11px] text-destructive">{error}</span>}
    </div>
  );
}

function SelectInput({
  value, onChange, options, placeholder,
}: { value: string; onChange: (v: string) => void; options: string[]; placeholder: string }) {
  return (
    <Select value={value || undefined} onValueChange={onChange}>
      <SelectTrigger><SelectValue placeholder={placeholder} /></SelectTrigger>
      <SelectContent>
        {options.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}