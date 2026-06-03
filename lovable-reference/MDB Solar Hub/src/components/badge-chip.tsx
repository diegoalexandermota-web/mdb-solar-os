import type { LeadBadge } from "@/lib/mdb-data";

export function BadgeChip({ badge }: { badge: LeadBadge }) {
  const map: Record<LeadBadge, string> = {
    "Hot Lead": "bg-destructive/15 text-destructive border-destructive/30",
    "Needs Follow-Up": "bg-warning/25 text-navy border-warning/40",
    "Credit Ready": "bg-success/15 text-success border-success/30",
    "Missing Documents": "bg-orange-100 text-orange-900 border-orange-300 dark:bg-orange-950 dark:text-orange-200",
    "Install Risk": "bg-destructive/10 text-destructive border-destructive/30",
    "Commission Pending": "bg-gold/20 text-navy border-gold/40",
  };
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide border ${map[badge]}`}>
      {badge}
    </span>
  );
}