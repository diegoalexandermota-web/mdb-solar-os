import { createFileRoute } from "@tanstack/react-router";
import { Check, HardHat, Calendar, Sun } from "lucide-react";
import { PageHeader, ServicePill } from "@/components/page-header";
import { PROJECTS, PROJECT_STEPS } from "@/lib/mdb-data";

export const Route = createFileRoute("/_app/projects")({
  head: () => ({ meta: [{ title: "Project Tracker — MDB Solar OS" }] }),
  component: ProjectsPage,
});

function ProjectsPage() {
  return (
    <div className="p-6 lg:p-8 space-y-6">
      <PageHeader
        eyebrow="Customer success"
        title="Project tracker"
        subtitle="From contract to PTO. Customers see the same live timeline in their MDB portal."
      />

      <div className="space-y-5">
        {PROJECTS.map((p) => (
          <div key={p.id} className="bg-card border border-border rounded-xl shadow-card overflow-hidden">
            <div className="p-5 flex flex-wrap items-center gap-4 border-b border-border">
              <div className="size-12 rounded-lg bg-gradient-to-br from-primary to-primary-glow text-primary-foreground grid place-items-center font-bold">
                {p.lead.name.split(" ").map((s) => s[0]).join("")}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="font-semibold text-foreground">{p.lead.name}</div>
                  <ServicePill service={p.lead.service} />
                  <span className="text-[10px] text-muted-foreground font-mono">{p.id}</span>
                </div>
                <div className="text-xs text-muted-foreground">{p.lead.address}</div>
              </div>
              <Meta icon={Sun} label="System" val={`${p.systemKw} kW · ${p.panels} panels`} />
              <Meta icon={HardHat} label="Crew" val={p.installer} />
              <Meta icon={Calendar} label="Permit" val={p.permitNumber} />
            </div>

            <div className="p-5 overflow-x-auto">
              <div className="flex items-center min-w-max gap-1.5">
                {PROJECT_STEPS.map((step, i) => {
                  const done = i < p.step;
                  const current = i === p.step;
                  return (
                    <div key={step} className="flex items-center">
                      <div className="flex flex-col items-center w-28">
                        <div className={`size-9 rounded-full grid place-items-center text-xs font-bold ${current ? "bg-gold text-gold-foreground ring-4 ring-gold/25" : done ? "bg-success text-primary-foreground" : "bg-secondary text-muted-foreground border border-border"}`}>
                          {done ? <Check className="size-4" /> : i + 1}
                        </div>
                        <div className={`text-[10px] mt-2 text-center font-medium ${current ? "text-foreground" : done ? "text-success" : "text-muted-foreground"}`}>{step}</div>
                      </div>
                      {i < PROJECT_STEPS.length - 1 && (
                        <div className={`h-0.5 w-8 -mt-6 ${done ? "bg-success" : "bg-border"}`} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Meta({ icon: Icon, label, val }: { icon: any; label: string; val: string }) {
  return (
    <div className="hidden md:flex items-center gap-2.5">
      <div className="size-8 rounded-md bg-primary/10 text-primary grid place-items-center"><Icon className="size-4" /></div>
      <div className="leading-tight">
        <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
        <div className="text-xs font-semibold text-foreground">{val}</div>
      </div>
    </div>
  );
}