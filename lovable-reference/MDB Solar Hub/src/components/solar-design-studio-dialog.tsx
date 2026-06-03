import { Sparkles, Clock, Satellite, MousePointer2, Sun, Box, Layers, ExternalLink } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  leadId?: string | null;
  proposalId?: string | null;
  defaults?: { customer_name?: string; address?: string };
};

const ITEMS: { icon: React.ComponentType<{ className?: string }>; label: string; status: string }[] = [
  { icon: Satellite,     label: "Satellite design workspace", status: "Coming soon" },
  { icon: MousePointer2, label: "Interactive panel placement", status: "Coming soon" },
  { icon: Sun,           label: "Irradiance and shade analysis", status: "Coming soon" },
  { icon: Box,           label: "3D roof model", status: "Coming soon" },
  { icon: Layers,        label: "Equipment-level design", status: "Coming soon" },
  { icon: ExternalLink,  label: "Aurora / OpenSolar export", status: "Optional when required" },
];

export function SolarDesignStudioDialog({ open, onOpenChange }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="size-4 text-primary" /> MDB Solar Design Studio
          </DialogTitle>
          <DialogDescription>
            Advanced module in development.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border border-border bg-gradient-to-br from-secondary/40 to-card p-6 text-center">
          <div className="mx-auto size-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
            <Clock className="size-6 text-primary" />
          </div>
          <h3 className="text-base font-semibold">Advanced design engine — coming soon</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
            The full MDB Solar Design Studio will be built as a separate custom module.
            For now, use the AI Solar Designer estimate and the AI Visual Solar Preview.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-2 mt-2">
          {ITEMS.map(({ icon: Icon, label, status }) => (
            <div key={label} className="flex items-center gap-2 p-2.5 rounded-md border border-border bg-card">
              <div className="size-8 rounded-md bg-secondary/60 flex items-center justify-center">
                <Icon className="size-4 text-muted-foreground" />
              </div>
              <div className="min-w-0">
                <div className="text-[12px] font-medium truncate">{label}</div>
                <div className="text-[10px] text-muted-foreground">{status}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-[10px] text-muted-foreground border border-dashed border-border rounded-md p-2 mt-1">
          Preliminary sales design only. Final engineering, AHJ, utility, lender, and installer validation required before installation.
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
