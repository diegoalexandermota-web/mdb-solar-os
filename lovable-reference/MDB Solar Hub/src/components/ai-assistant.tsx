import { useState } from "react";
import {
  Sparkles, Send, MessageSquare, FileText, Lightbulb, ShieldCheck, Zap, X,
  AlertTriangle, Flame, DollarSign, Wallet, Phone, Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Msg = { role: "user" | "ai"; text: string };

const QUICK = [
  { icon: Lightbulb, label: "Next best action", prompt: "What's the next best action for this lead?" },
  { icon: MessageSquare, label: "Draft WhatsApp follow-up", prompt: "Write a friendly WhatsApp follow-up for a Duke Energy customer worried about rate hikes." },
  { icon: ShieldCheck, label: "Objection handling", prompt: "Customer says solar is too expensive — give me a 2-sentence rebuttal." },
  { icon: FileText, label: "Lead summary", prompt: "Summarize my notes for the active lead in 3 bullets." },
  { icon: Zap, label: "Proposal recommendation", prompt: "Recommend the best MDB bundle (solar/water/roof/HVAC/battery/EV) for this homeowner." },
  { icon: Sun, label: "Risk warning", prompt: "Flag any risks (permit, credit, install, missing docs) on this lead." },
];

function Sun(props: React.SVGProps<SVGSVGElement>) {
  return <Sparkles {...props} />;
}

function canned(prompt: string): string {
  const p = prompt.toLowerCase();
  if (p.includes("whatsapp")) {
    return "Hey [Name]! 👋 Following up from yesterday — I ran your Duke Energy bill vs. our locked-in MDB Solar rate and you'd save about $147/mo from day one with $0 down. Want me to send the side-by-side now, or call you after 6pm? — Diego, MDB Solar";
  }
  if (p.includes("summari")) {
    return "• Homeowner motivated by rising Duke Energy bills (avg $312/mo)\n• Pre-qualified 720+ credit, $0-down loan path\n• Decision-maker is spouse — needs to be on next call\n• Open to water softener add-on, not interested in EV charger yet";
  }
  if (p.includes("next best") || p.includes("next action")) {
    return "Book a 20-min virtual proposal review for tomorrow 6:30pm with both spouses present. Send the rate-lock one-pager via SMS before the call, and lead with the 25-year locked-rate comparison. Bring the water softener add-on as the alt close.";
  }
  if (p.includes("recommend") || p.includes("bundle") || p.includes("proposal")) {
    return "Recommended MDB bundle: 9.2 kW solar (23 panels) + Tesla Powerwall 3 + Whole-Home Water Softener. Est. $214/mo combined vs. current $312 Duke bill. Bundle qualifies for 30% federal tax credit on solar+battery and the truck only rolls once.";
  }
  if (p.includes("objection") || p.includes("expensive")) {
    return "I hear you — most folks think solar is an extra bill. The reality is you're already paying for power; we swap your utility bill for a smaller, fixed MDB Solar payment, and the utility keeps raising rates every 18 months. Want me to show you the 25-year side-by-side?";
  }
  if (p.includes("risk") || p.includes("warning") || p.includes("flag")) {
    return "⚠️ 2 risks on this deal:\n• Credit auth signed but income doc still pending — block before NTP.\n• HOA in Reunion (Davenport) requires roof-color match approval; submit before permit pull or install slips 2 weeks.";
  }
  return "Got it. Pull up the lead and I can draft the message, summarize the file, or generate a proposal — just tell me which one.";
}

export function AIAssistant() {
  const [open, setOpen] = useState(true);
  const [tab, setTab] = useState<"copilot" | "chat">("copilot");
  const [input, setInput] = useState("");
  const [msgs, setMsgs] = useState<Msg[]>([
    { role: "ai", text: "Hey Diego 👋 I'm MDB AI. I read every lead in your pipeline and surface the next best action, draft outreach, handle objections, recommend bundles, and flag risk. Pick a shortcut or ask me anything." },
  ]);

  function send(text: string) {
    if (!text.trim()) return;
    setMsgs((m) => [...m, { role: "user", text }, { role: "ai", text: canned(text) }]);
    setInput("");
    setTab("chat");
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-30 size-14 rounded-full bg-gradient-to-br from-primary to-primary-glow text-primary-foreground shadow-elegant grid place-items-center hover:scale-105 transition-transform"
      >
        <Sparkles className="size-6" />
      </button>
    );
  }

  return (
    <aside className="hidden xl:flex w-[360px] shrink-0 flex-col border-l border-border bg-card">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between bg-gradient-to-br from-navy via-primary to-primary-glow text-primary-foreground">
        <div className="flex items-center gap-2">
          <div className="size-8 rounded-lg bg-gold grid place-items-center shadow-elegant">
            <Sparkles className="size-4 text-gold-foreground" />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold">MDB AI Assistant</div>
            <div className="text-[10px] uppercase tracking-wider opacity-70 flex items-center gap-1">
              <span className="size-1.5 rounded-full bg-success animate-pulse" /> Live · monitoring 28 leads
            </div>
          </div>
        </div>
        <button onClick={() => setOpen(false)} className="opacity-70 hover:opacity-100">
          <X className="size-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="px-3 pt-2 border-b border-border flex gap-1 bg-card">
        {(["copilot", "chat"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "flex-1 text-[11px] font-semibold uppercase tracking-wider py-2 rounded-t-md transition-colors",
              tab === t
                ? "bg-secondary text-foreground border-b-2 border-gold"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t === "copilot" ? "Copilot brief" : "Chat"}
          </button>
        ))}
      </div>

      {tab === "copilot" ? (
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          <BriefCard
            tone="gold"
            icon={Lightbulb}
            title="Today's priorities"
            lines={[
              "Call Carlos Hernandez · confirm 2pm",
              "Send proposal PDF · Maria Smith",
              "Push credit app · James Johnson",
            ]}
          />
          <BriefCard
            tone="primary"
            icon={Phone}
            title="Needs follow-up (5)"
            lines={[
              "Jennifer Garcia · 4 days silent",
              "Luis Martinez · proposal sent, no reply",
              "Ashley Brown · price objection unhandled",
            ]}
          />
          <BriefCard
            tone="danger"
            icon={AlertTriangle}
            title="Deals at risk"
            lines={[
              "Reunion HOA approval pending · install slips",
              "FPL net-metering doc missing · L-1014",
              "Credit auth expires Fri · L-1011",
            ]}
          />
          <BriefCard
            tone="primary"
            icon={Flame}
            title="Hot leads · act today"
            lines={[
              "Sofia Davis · 740+ credit, $412 Duke bill",
              "Daniela Wilson · referral, ready to sign",
            ]}
          />
          <BriefCard
            tone="gold"
            icon={MessageSquare}
            title="Suggested WhatsApp draft"
            lines={[
              "Hey Carlos! Confirming today 2pm. I'll bring the locked-rate side-by-side vs Duke. — Diego, MDB",
            ]}
            action={{ label: "Send via WhatsApp", onClick: () => send("Draft WhatsApp follow-up") }}
          />
          <BriefCard
            tone="danger"
            icon={DollarSign}
            title="Revenue warning"
            lines={[
              "Projected May close-out down $42k vs forecast",
              "Driver: 3 proposals stuck > 6 days at Credit Approved",
            ]}
          />
          <BriefCard
            tone="gold"
            icon={Wallet}
            title="Commission alerts"
            lines={[
              "$1,980 unlocks when L-1009 hits PTO (ETA 5d)",
              "1 commission on Hold — missing utility bill",
            ]}
          />
          <BriefCard
            tone="primary"
            icon={Clock}
            title="AI insight"
            lines={[
              "Leads contacted within 5 min close 3.2× more.",
              "12 new leads waited > 1 hr today — assign now.",
            ]}
          />

          <div className="grid grid-cols-2 gap-1.5 pt-1">
            {QUICK.map((q) => (
              <button
                key={q.label}
                onClick={() => send(q.prompt)}
                className="flex items-center gap-1.5 text-left text-[11px] px-2 py-1.5 rounded-md border border-border bg-background hover:bg-secondary hover:border-primary/30 transition-colors"
              >
                <q.icon className="size-3 text-primary shrink-0" />
                <span className="truncate">{q.label}</span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {msgs.map((m, i) => (
            <div
              key={i}
              className={cn(
                "rounded-lg px-3 py-2 text-sm whitespace-pre-line",
                m.role === "ai"
                  ? "bg-secondary text-secondary-foreground"
                  : "bg-primary text-primary-foreground ml-8",
              )}
            >
              {m.text}
            </div>
          ))}
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="p-3 border-t border-border flex gap-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask MDB AI…"
          className="flex-1 px-3 py-2 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <Button type="submit" size="icon" className="bg-primary hover:bg-primary/90">
          <Send className="size-4" />
        </Button>
      </form>
    </aside>
  );
}

function BriefCard({
  tone, icon: Icon, title, lines, action,
}: {
  tone: "primary" | "gold" | "danger";
  icon: any;
  title: string;
  lines: string[];
  action?: { label: string; onClick: () => void };
}) {
  const toneCls =
    tone === "danger"
      ? "border-destructive/30 bg-destructive/5"
      : tone === "gold"
      ? "border-gold/40 bg-gold/5"
      : "border-primary/25 bg-primary/5";
  const iconCls =
    tone === "danger"
      ? "bg-destructive/15 text-destructive"
      : tone === "gold"
      ? "bg-gold/20 text-navy"
      : "bg-primary/15 text-primary";
  return (
    <div className={cn("rounded-lg border p-2.5", toneCls)}>
      <div className="flex items-center gap-2 mb-1.5">
        <div className={cn("size-6 rounded-md grid place-items-center", iconCls)}>
          <Icon className="size-3.5" />
        </div>
        <div className="text-[11px] font-bold uppercase tracking-wider text-foreground">{title}</div>
      </div>
      <ul className="space-y-1 pl-1">
        {lines.map((l, i) => (
          <li key={i} className="text-[11.5px] leading-snug text-foreground/85 flex gap-1.5">
            <span className="text-gold mt-1 size-1 rounded-full bg-gold shrink-0" />
            <span>{l}</span>
          </li>
        ))}
      </ul>
      {action && (
        <button
          onClick={action.onClick}
          className="mt-2 text-[11px] font-semibold text-primary hover:underline"
        >
          {action.label} →
        </button>
      )}
    </div>
  );
}