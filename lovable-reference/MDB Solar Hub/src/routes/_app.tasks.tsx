import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Calendar, Flag, Check, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { TASKS } from "@/lib/mdb-data";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import type { Priority } from "@/lib/mdb-data";

export const Route = createFileRoute("/_app/tasks")({
  head: () => ({ meta: [{ title: "Tasks — MDB Solar OS" }] }),
  component: TasksPage,
});

const buckets = ["Today", "Tomorrow", "Fri", "Next week"] as const;

function TasksPage() {
  const [tasks, setTasks] = useState(TASKS);
  const [newOpen, setNewOpen] = useState(false);
  const toggle = (id: string) =>
    setTasks((all) => all.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <PageHeader
        eyebrow="My day"
        title="Tasks & follow-ups"
        subtitle="Everything that needs your attention to keep deals moving. AI suggestions sync from every lead."
        actions={
          <button
            onClick={() => setNewOpen(true)}
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md text-sm font-medium"
          >
            <Plus className="size-4" /> New task
          </button>
        }
      />

      <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
        {buckets.map((b) => {
          const list = tasks.filter((t) => t.due === b);
          return (
            <div key={b} className="bg-card border border-border rounded-xl shadow-card">
              <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                <div className="text-sm font-semibold text-foreground">{b}</div>
                <div className="text-[10px] font-bold text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">
                  {list.length}
                </div>
              </div>
              <div className="p-2 space-y-1.5">
                {list.length === 0 && <div className="text-xs text-muted-foreground text-center py-6">Nothing here — nice.</div>}
                {list.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => toggle(t.id)}
                    className={`w-full text-left flex items-start gap-3 p-2.5 rounded-md hover:bg-secondary/60 transition-colors ${t.done ? "opacity-60" : ""}`}
                  >
                    <div className={`size-5 rounded border grid place-items-center shrink-0 mt-0.5 ${t.done ? "bg-success border-success text-primary-foreground" : "border-input"}`}>
                      {t.done && <Check className="size-3" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className={`text-sm text-foreground ${t.done ? "line-through" : ""}`}>{t.title}</div>
                      <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
                        <span className="inline-flex items-center gap-1"><Calendar className="size-3" /> {t.due}</span>
                        <span className={`inline-flex items-center gap-1 font-semibold uppercase ${t.priority === "high" ? "text-destructive" : t.priority === "med" ? "text-primary" : "text-muted-foreground"}`}>
                          <Flag className="size-3" /> {t.priority}
                        </span>
                        <span className="text-muted-foreground">· {t.lead}</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      <NewTaskDialog open={newOpen} onOpenChange={setNewOpen} />
    </div>
  );
}

function NewTaskDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [due, setDue] = useState("");
  const [priority, setPriority] = useState<Priority>("Medium");
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!title.trim()) return;
    setSaving(true);
    const { data: userData } = await supabase.auth.getUser();
    const { error } = await supabase.from("tasks").insert({
      title: title.trim(),
      description: description || null,
      due_date: due || null,
      priority,
      assigned_to: userData.user?.id ?? null,
    });
    setSaving(false);
    if (error) { toast.error("Couldn't create task", { description: error.message }); return; }
    toast.success("Task created");
    setTitle(""); setDescription(""); setDue(""); setPriority("Medium");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader><DialogTitle>New task</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label className="text-xs">Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} placeholder="Follow up with…" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Description</Label>
            <Textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} maxLength={1000} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Due date</Label>
              <Input type="date" value={due} onChange={(e) => setDue(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Priority</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(["Low", "Medium", "High"] as Priority[]).map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
          <Button onClick={save} disabled={saving || !title.trim()}>
            {saving && <Loader2 className="size-3.5 animate-spin mr-1.5" />} Create task
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}