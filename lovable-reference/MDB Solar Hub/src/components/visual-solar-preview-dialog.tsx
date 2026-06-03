import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Sparkles,
  Loader2,
  Upload,
  AlertTriangle,
  ShieldCheck,
  ImageIcon,
  Download,
  HardHat,
  Layers,
  Sun,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toDbUuid } from "@/lib/leads-api";

type ViewType = "house" | "roof" | "satellite" | "drone";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  leadId?: string | null;
  proposalId?: string | null;
  defaults?: {
    address?: string;
    panelCount?: number | null;
    customer_name?: string;
  };
};

const VIEW_OPTIONS: { value: ViewType; label: string }[] = [
  { value: "house", label: "House photo" },
  { value: "roof", label: "Roof photo" },
  { value: "satellite", label: "Satellite screenshot" },
  { value: "drone", label: "Drone image" },
];

const ROADMAP = [
  "Roof plane detection",
  "Satellite auto-detection",
  "Obstruction detection",
  "Tree / shade analysis",
  "Setback compliance",
  "Automatic panel optimization",
  "Wind-zone adjustments",
  "True 3D roof rendering",
];

export function VisualSolarPreviewDialog({ open, onOpenChange, defaults, leadId, proposalId }: Props) {
  const [viewType, setViewType] = useState<ViewType>("house");
  const [address, setAddress] = useState<string>(defaults?.address ?? "");
  const [panelCount, setPanelCount] = useState<string>(
    defaults?.panelCount ? String(defaults.panelCount) : "20",
  );
  const [notes, setNotes] = useState<string>("");
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [sourceMime, setSourceMime] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [savedUrl, setSavedUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setAddress(defaults?.address ?? "");
    setPanelCount(defaults?.panelCount ? String(defaults.panelCount) : "20");
    setNotes("");
    setSourceImage(null);
    setSourceMime(null);
    setResultImage(null);
    setSavedUrl(null);
    setViewType("house");
  }, [open, defaults?.address, defaults?.panelCount]);

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 8 * 1024 * 1024) {
      toast.error("Image too large", { description: "Please use an image under 8 MB." });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setSourceImage(typeof reader.result === "string" ? reader.result : null);
      setSourceMime(f.type || "image/png");
      setResultImage(null);
    };
    reader.readAsDataURL(f);
  }

  async function generate() {
    if (!sourceImage && !address) {
      toast.error("Add a photo or address", {
        description: "Upload a house/roof/satellite image, or enter a property address.",
      });
      return;
    }
    setLoading(true);
    setResultImage(null);
    try {
      const res = await fetch("/api/visual-solar-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: sourceImage,
          imageMime: sourceMime,
          address: address || null,
          panelCount: panelCount ? Number(panelCount) : null,
          notes: notes || null,
          viewType,
        }),
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({ error: "" }));
        throw new Error(errBody?.error || `Request failed (${res.status}).`);
      }
      const json = (await res.json()) as { image: string; panelCount: number };
      setResultImage(json.image);
      toast.success("Visual solar preview generated.");
      void persist(json.image);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Generation failed.";
      toast.error("Visual preview failed", { description: msg });
    } finally {
      setLoading(false);
    }
  }

  async function persist(dataUrl: string) {
    try {
      const dbLeadId = toDbUuid(leadId);
      const dbProposalId = toDbUuid(proposalId);
      let publicUrl: string | null = null;

      // Best-effort upload to Storage if the bucket exists.
      try {
        const b64 = dataUrl.split(",")[1] ?? "";
        const bin = atob(b64);
        const bytes = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
        const blob = new Blob([bytes], { type: "image/png" });
        const path = `${dbLeadId ?? "anon"}/${crypto.randomUUID()}.png`;
        const { error: upErr } = await supabase.storage
          .from("solar-previews")
          .upload(path, blob, { contentType: "image/png", upsert: false });
        if (!upErr) {
          publicUrl = supabase.storage.from("solar-previews").getPublicUrl(path).data.publicUrl;
        }
      } catch {
        // storage optional — continue with data URL
      }

      setSavedUrl(publicUrl);

      const { data: userData } = await supabase.auth.getUser();
      const { error } = await (supabase.from as any)("solar_visual_previews").insert({
        lead_id: dbLeadId,
        proposal_id: dbProposalId,
        original_image_url: sourceImage ? "uploaded" : null,
        generated_preview_url: publicUrl,
        confidence_level: confidence,
        view_type: viewType,
        panel_count: panelCount ? Number(panelCount) : null,
        notes: notes || null,
        created_by: userData.user?.id ?? null,
      });
      if (error) {
        console.warn("Failed to save visual preview record:", error.message);
      }
    } catch (err) {
      console.warn("persist visual preview failed:", err);
    }
  }

  const estPanels = panelCount ? Number(panelCount) : 20;
  const estSystemKw = (estPanels * 0.41).toFixed(2);
  const estRoofUsage = Math.min(95, Math.round(estPanels * 2.1));
  const confidence: "Low" | "Medium" | "High" = !sourceImage
    ? "Low"
    : viewType === "satellite" || viewType === "drone"
      ? "High"
      : "Medium";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="size-4 text-primary" /> MDB AI Visual Solar Preview
          </DialogTitle>
          <DialogDescription>
            Generate a preliminary AI visual mockup of solar panel placement on the home. Sales preview only — not a final engineered layout.
          </DialogDescription>
        </DialogHeader>

        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Image type">
            <Select value={viewType} onValueChange={(v) => setViewType(v as ViewType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {VIEW_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Property address">
            <Input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="123 Sunshine Dr, Tampa, FL"
            />
          </Field>
          <Field label="Estimated panel count">
            <Input
              value={panelCount}
              onChange={(e) => setPanelCount(e.target.value)}
              inputMode="numeric"
              placeholder="20"
            />
          </Field>
          <Field label="Upload image (optional)">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileRef.current?.click()}
                className="gap-1.5"
              >
                <Upload className="size-4" /> Choose photo
              </Button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={onFile}
              />
              {sourceImage && (
                <span className="text-[11px] text-muted-foreground truncate">Image loaded</span>
              )}
            </div>
          </Field>
        </div>
        <Field label="Design notes (optional)">
          <Textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Prefer south + west facing planes. Avoid shaded NE corner near oak tree."
          />
        </Field>

        <div className="flex justify-end">
          <Button onClick={generate} disabled={loading} className="gap-1.5">
            {loading ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
            Generate Visual Solar Preview
          </Button>
        </div>

        {(sourceImage || resultImage) && (
          <div className="space-y-4 mt-2">
            <div className="rounded-lg border border-border bg-secondary/30 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Sun className="size-4 text-primary" />
                <div className="text-sm font-semibold text-foreground">
                  MDB AI Visual Solar Preview — Before / After
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <PreviewPane label="Original" image={sourceImage} loading={false} placeholder="No source image — AI generated from address." />
                <PreviewPane
                  label="AI Solar Overlay"
                  image={resultImage}
                  loading={loading}
                  placeholder="Click Generate to create a preview."
                />
              </div>
              {resultImage && (
                <div className="mt-3 flex items-center justify-between">
                  <span className={confidenceClass(confidence)}>
                    {confidence} visual confidence
                  </span>
                  <a
                    href={resultImage}
                    download="mdb-solar-preview.png"
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
                  >
                    <Download className="size-3.5" /> Download preview
                  </a>
                </div>
              )}
              <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
                <Stat label="Est. panels" val={`${estPanels}`} />
                <Stat label="Est. system size" val={`${estSystemKw} kW`} />
                <Stat label="Roof usage" val={`~${estRoofUsage}%`} />
                <Stat label="View type" val={viewType} />
              </div>
              <div className="mt-3 text-[11px] text-muted-foreground">
                <span className="font-medium text-foreground">Design notes:</span>{" "}
                Sleek black mono panels arranged on best south-facing plane; setbacks preserved from roof edges and obstructions; orientation/tilt assumed from photo perspective. Verify on site.
              </div>
            </div>

            <div className="rounded-lg border border-dashed border-border bg-secondary/20 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Layers className="size-4 text-primary" />
                <div className="text-xs font-semibold text-foreground">
                  Advanced Visual Designer — Coming Soon
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] text-muted-foreground">
                {ROADMAP.map((item) => (
                  <div key={item} className="flex items-center gap-1.5">
                    <HardHat className="size-3 text-muted-foreground" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-border p-3">
              <div className="text-xs font-semibold text-foreground mb-1">External Design Validation</div>
              <div className="text-[11px] text-muted-foreground mb-2">
                Used only when required by lender, installer, utility, AHJ, or engineering workflow.
              </div>
              <div className="flex flex-wrap gap-2 text-[11px] text-muted-foreground">
                {[
                  "Export to Aurora",
                  "Export to OpenSolar",
                  "Upload third-party final design",
                  "Upload shade report",
                  "Upload engineered layout",
                ].map((l) => (
                  <span key={l} className="px-2 py-1 rounded bg-secondary/50 border border-border">
                    {l}
                  </span>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-dashed border-border p-3 text-[11px] text-muted-foreground flex items-start gap-2">
              <ShieldCheck className="size-3.5 mt-0.5 shrink-0 text-primary" />
              <span>
                Preliminary AI-generated solar visualization. Final panel placement, engineering, setbacks, fire code, shading analysis, structural review, utility approval, and permitting requirements must be validated before installation.
              </span>
            </div>

            <div className="rounded-lg border border-warning/30 bg-warning/10 p-3 text-[11px] text-navy flex items-start gap-2">
              <AlertTriangle className="size-3.5 mt-0.5 shrink-0" />
              <span>
                This is not a stamped engineering design. MDB AI Visual Solar Preview supports sales conversations and proposal preparation only.
              </span>
            </div>
          </div>
        )}

        <DialogFooter className="mt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-[11px] text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function confidenceClass(c: "Low" | "Medium" | "High") {
  const base = "text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded ";
  if (c === "High") return base + "bg-success/15 text-success";
  if (c === "Medium") return base + "bg-primary/10 text-primary";
  return base + "bg-warning/25 text-navy";
}


function Stat({ label, val }: { label: string; val: string }) {
  return (
    <div className="bg-card border border-border rounded-md p-2">
      <div className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</div>
      <div className="text-sm font-semibold text-foreground mt-0.5 capitalize">{val}</div>
    </div>
  );
}

function PreviewPane({
  label,
  image,
  loading,
  placeholder,
}: {
  label: string;
  image: string | null;
  loading: boolean;
  placeholder: string;
}) {
  return (
    <div className="rounded-md border border-border bg-card overflow-hidden">
      <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground px-2 py-1.5 border-b border-border">
        {label}
      </div>
      <div className="aspect-video bg-secondary/40 flex items-center justify-center relative">
        {loading ? (
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <Loader2 className="size-6 animate-spin text-primary" />
            <span className="text-[11px]">Rendering visual preview…</span>
          </div>
        ) : image ? (
          <img src={image} alt={label} className="w-full h-full object-cover" />
        ) : (
          <div className="flex flex-col items-center gap-2 text-muted-foreground p-3 text-center">
            <ImageIcon className="size-6" />
            <span className="text-[11px]">{placeholder}</span>
          </div>
        )}
      </div>
    </div>
  );
}