import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Check, Clock, Sun, Phone, MessageSquare, LifeBuoy, Sparkles,
  FileSignature, CalendarCheck, Send, User,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { PORTAL_CUSTOMER } from "@/lib/mdb-data";
import { telHref, waHref, openExternal, comingSoon } from "@/lib/actions";

export const Route = createFileRoute("/_app/portal")({
  head: () => ({ meta: [{ title: "Customer Portal Preview — MDB Solar OS" }] }),
  component: Portal,
});

function Portal() {
  const c = PORTAL_CUSTOMER;
  const currentIdx = c.steps.findIndex((s) => !s.done);

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <PageHeader
        eyebrow="Preview · This is what Carlos sees"
        title="MDB Customer Portal"
        subtitle="Live status, documents needed, and direct line to the rep + MDB AI. Mobile-first by default."
      />

      <div className="rounded-xl p-6 text-primary-foreground shadow-elegant" style={{ background: "var(--gradient-hero)" }}>
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="text-xs uppercase tracking-widest font-semibold opacity-80 flex items-center gap-2">
              <Sun className="size-3.5 text-gold" /> Welcome back, {c.name.split(" ")[0]}
            </div>
            <div className="text-2xl font-bold mt-1">Your MDB Solar project is on track ☀️</div>
            <div className="text-sm opacity-80 mt-1">{c.address} · {c.system}</div>
          </div>
          <div className="bg-gold text-gold-foreground rounded-lg p-3 max-w-sm">
            <div className="text-[10px] uppercase tracking-widest font-bold opacity-80">Next step</div>
            <div className="text-sm font-semibold mt-1">{c.nextStep}</div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Project status */}
          <div className="bg-card border border-border rounded-xl p-6 shadow-card">
            <h3 className="font-semibold text-foreground mb-4">Project status</h3>
            <ol className="relative border-l-2 border-border ml-2 space-y-4">
              {c.steps.map((s, i) => {
                const isCurrent = i === currentIdx;
                return (
                  <li key={s.name} className="ml-4">
                    <div className={`absolute -left-[9px] size-4 rounded-full grid place-items-center ${s.done ? "bg-success text-primary-foreground" : isCurrent ? "bg-gold text-gold-foreground ring-4 ring-gold/25" : "bg-secondary border border-border"}`}>
                      {s.done ? <Check className="size-2.5" /> : isCurrent ? <Clock className="size-2.5" /> : null}
                    </div>
                    <div className={`text-sm ${isCurrent ? "font-semibold text-foreground" : s.done ? "text-foreground" : "text-muted-foreground"}`}>{s.name}</div>
                    <div className="text-[11px] text-muted-foreground">{s.date}</div>
                  </li>
                );
              })}
            </ol>
          </div>

          {/* Docs needed */}
          <div className="bg-card border border-border rounded-xl p-6 shadow-card">
            <h3 className="font-semibold text-foreground mb-3">Documents needed</h3>
            <div className="space-y-2">
              {c.docsNeeded.map((d) => (
                <div key={d.name} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-secondary/40">
                  <FileSignature className="size-4 text-primary shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-foreground">{d.name}</div>
                    <div className="text-[11px] text-muted-foreground">{d.required ? "Required to proceed" : "Optional"}</div>
                  </div>
                  <button
                    onClick={() => comingSoon("Document storage")}
                    className="bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold px-3 py-1.5 rounded-md"
                  >
                    Upload
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Appointments */}
          <div className="bg-card border border-border rounded-xl p-6 shadow-card">
            <h3 className="font-semibold text-foreground mb-3">Appointment schedule</h3>
            <div className="space-y-2">
              {c.appointments.map((a) => (
                <div key={a.name} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-secondary/40">
                  <CalendarCheck className="size-4 text-primary shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-foreground">{a.name}</div>
                    <div className="text-[11px] text-muted-foreground">{a.when}</div>
                  </div>
                  <button
                    onClick={() => comingSoon("Rescheduling")}
                    className="text-xs font-medium text-primary hover:underline"
                  >
                    Reschedule
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {/* Rep card */}
          <div className="bg-card border border-border rounded-xl p-5 shadow-card">
            <div className="text-xs uppercase tracking-wide text-muted-foreground mb-3">Your MDB rep</div>
            <div className="flex items-center gap-3">
              <div className="size-12 rounded-full bg-gradient-to-br from-primary to-primary-glow text-primary-foreground grid place-items-center font-bold">
                {c.rep.split(" ").map(p => p[0]).join("")}
              </div>
              <div>
                <div className="font-semibold text-foreground">{c.rep}</div>
                <div className="text-[11px] text-muted-foreground">{c.repPhone}</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-4">
              <button
                onClick={() => openExternal(telHref(c.repPhone), "No phone number for this rep.")}
                className="inline-flex items-center justify-center gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 py-2 rounded-md text-xs font-semibold"
              >
                <Phone className="size-3.5" /> Call
              </button>
              <button
                onClick={() => openExternal(waHref(c.repPhone, `Hi ${c.rep.split(" ")[0]}, quick question about my project.`), "No phone number for this rep.")}
                className="inline-flex items-center justify-center gap-1.5 bg-gold text-gold-foreground hover:opacity-90 py-2 rounded-md text-xs font-semibold"
              >
                <MessageSquare className="size-3.5" /> WhatsApp
              </button>
            </div>
          </div>

          {/* Support */}
          <button
            onClick={() => c.repPhone ? openExternal(telHref(c.repPhone)) : comingSoon("Support chat")}
            className="w-full flex items-center gap-3 bg-card border border-border rounded-xl p-5 shadow-card hover:border-primary/40 transition-colors text-left"
          >
            <div className="size-10 rounded-md bg-primary/10 text-primary grid place-items-center">
              <LifeBuoy className="size-5" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold text-foreground">Get support</div>
              <div className="text-[11px] text-muted-foreground">Mon–Sat · 8am–7pm ET</div>
            </div>
          </button>

          {/* MDB AI chat */}
          <CustomerAI />
        </div>
      </div>
    </div>
  );
}

type ChatMsg = { role: "ai" | "user"; text: string };
function CustomerAI() {
  const [msgs, setMsgs] = useState<ChatMsg[]>([
    { role: "ai", text: "Hi Carlos! I'm MDB AI. Ask me about your install date, what document is still needed, or how much you'll save in year one." },
  ]);
  const [input, setInput] = useState("");
  function send() {
    if (!input.trim()) return;
    const text = input;
    const reply = text.toLowerCase().includes("install")
      ? "Your inspection is Wed Dec 4 (9am–12pm). PTO from Duke Energy usually lands within 7 days of inspection — you'll start producing within ~10 days."
      : text.toLowerCase().includes("doc")
      ? "We still need your HOA approval letter. Tap Upload above or text it to (407) 555-2210 and I'll attach it for you."
      : "Great question — I'll loop in Diego and he'll text you in under an hour.";
    setMsgs((m) => [...m, { role: "user", text }, { role: "ai", text: reply }]);
    setInput("");
  }
  return (
    <div className="bg-card border border-border rounded-xl shadow-card flex flex-col" style={{ minHeight: 320 }}>
      <div className="px-4 py-3 border-b border-border flex items-center gap-2 bg-gradient-to-r from-navy to-primary rounded-t-xl text-primary-foreground">
        <div className="size-7 rounded-md bg-gold grid place-items-center"><Sparkles className="size-3.5 text-gold-foreground" /></div>
        <div className="text-sm font-semibold">MDB AI · 24/7 chat</div>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2 text-sm">
        {msgs.map((m, i) => (
          <div key={i} className={`rounded-lg px-3 py-2 ${m.role === "ai" ? "bg-secondary text-secondary-foreground" : "bg-primary text-primary-foreground ml-8"}`}>
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide opacity-70 mb-0.5">
              {m.role === "ai" ? <><Sparkles className="size-3" /> MDB AI</> : <><User className="size-3" /> You</>}
            </div>
            {m.text}
          </div>
        ))}
      </div>
      <form onSubmit={(e) => { e.preventDefault(); send(); }} className="p-2 border-t border-border flex gap-2">
        <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask about your project…" className="flex-1 px-3 py-2 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
        <button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90 px-3 rounded-md"><Send className="size-4" /></button>
      </form>
    </div>
  );
}