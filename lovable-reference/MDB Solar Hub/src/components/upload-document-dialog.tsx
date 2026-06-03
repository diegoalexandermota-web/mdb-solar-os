import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Upload } from "lucide-react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { uploadLeadDocument } from "@/lib/leads-api";

const DOC_TYPES = [
  "Utility Bill",
  "Driver's License",
  "Credit Authorization",
  "HOA Approval Letter",
  "Solar Contract",
  "Other",
];

export function UploadDocumentDialog({
  open, onOpenChange, leadId, onUploaded,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  leadId: string;
  onUploaded?: () => void;
}) {
  const [type, setType] = useState(DOC_TYPES[0]);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!file) { toast.error("Pick a file to upload."); return; }
    setBusy(true);
    const { error } = await uploadLeadDocument(leadId, file, type);
    setBusy(false);
    if (error) {
      toast.error(error);
      return;
    }
    toast.success("Document uploaded successfully.");
    setFile(null);
    setType(DOC_TYPES[0]);
    onOpenChange(false);
    onUploaded?.();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle>Upload document</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label className="text-xs">Document type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {DOC_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">File</Label>
            <Input
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              accept=".pdf,.png,.jpg,.jpeg,.webp,.heic,.doc,.docx"
            />
            {file && <div className="text-[11px] text-muted-foreground">{file.name} · {(file.size / 1024).toFixed(0)} KB</div>}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>Cancel</Button>
          <Button onClick={submit} disabled={busy || !file}>
            {busy ? <Loader2 className="size-3.5 animate-spin mr-1.5" /> : <Upload className="size-3.5 mr-1.5" />}
            Upload
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}