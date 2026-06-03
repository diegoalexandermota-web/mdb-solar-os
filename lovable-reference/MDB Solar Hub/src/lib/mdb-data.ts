export type PipelineStage =
  | "New Lead"
  | "Contacted"
  | "Appointment Set"
  | "Proposal Sent"
  | "Credit Approved"
  | "Contract Signed"
  | "Site Survey"
  | "Permit"
  | "Install Scheduled"
  | "Installed"
  | "PTO"
  | "Commission Paid";

export const PIPELINE_STAGES: PipelineStage[] = [
  "New Lead",
  "Contacted",
  "Appointment Set",
  "Proposal Sent",
  "Credit Approved",
  "Contract Signed",
  "Site Survey",
  "Permit",
  "Install Scheduled",
  "Installed",
  "PTO",
  "Commission Paid",
];

export type ServiceType = "Solar" | "Water" | "Roofing" | "HVAC" | "Battery" | "EV Charger";

export type LeadBadge =
  | "Hot Lead"
  | "Needs Follow-Up"
  | "Credit Ready"
  | "Missing Documents"
  | "Install Risk"
  | "Commission Pending";

export type Priority = "High" | "Medium" | "Low";

export interface Lead {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  service: ServiceType;
  utility: string;
  bill: number;
  credit: "500-599" | "600-679" | "680-739" | "740+";
  source: string;
  rep: string;
  stage: PipelineStage;
  nextFollowUp: string;
  lastContact: string;
  notes: string;
  createdAt: string;
  priority: Priority;
  badges: LeadBadge[];
}

export const REPS = ["Diego Mota", "Brittany Lopez", "Jose Rivera", "Ashley Chen", "Devon Williams"];
export const UTILITIES = ["Duke Energy", "FPL", "TECO", "OUC", "JEA"];
const SOURCES = ["Door-to-Door", "Facebook Ad", "Referral", "Google", "Event", "Costco Partner"];
const SERVICES: ServiceType[] = ["Solar", "Water", "Roofing", "HVAC", "Battery", "EV Charger"];
const FIRST = ["Carlos", "Maria", "James", "Jennifer", "Luis", "Ashley", "David", "Sofia", "Michael", "Patricia", "Andre", "Karen", "Robert", "Daniela", "Kevin", "Tracy", "Ricardo", "Megan", "Tyler", "Nina", "Brandon", "Olivia", "Marcus", "Stephanie"];
const LAST = ["Hernandez", "Smith", "Johnson", "Garcia", "Martinez", "Brown", "Davis", "Miller", "Wilson", "Moore", "Taylor", "Anderson", "Thomas", "Jackson", "White", "Harris", "Martin", "Lee", "Walker", "Hall"];
const STREETS = ["Palm Ave", "Sunset Blvd", "Ocean Dr", "Pine St", "Magnolia Ln", "Coral Way", "Bayshore Dr", "Hibiscus Ct", "Royal Palm Way", "Citrus Grove Rd", "Lake Shore Dr", "Reunion Blvd"];
export const CITIES = ["Davenport, FL", "Orlando, FL", "Kissimmee, FL", "Tampa, FL", "Lakeland, FL", "Winter Haven, FL", "Miami, FL", "Jacksonville, FL"];
const PRIORITIES: Priority[] = ["High", "Medium", "Low"];

function pick<T>(arr: T[], i: number): T { return arr[i % arr.length]; }
function rand(seed: number, max: number) { return Math.floor(((seed * 9301 + 49297) % 233280) / 233280 * max); }

// Stable reference epoch so SSR and client render identical demo dates.
const REF_EPOCH = Date.parse("2026-05-29T12:00:00Z");
function refDate(offsetDays: number) {
  return new Date(REF_EPOCH + offsetDays * 86400000).toISOString().slice(0, 10);
}

export const LEADS: Lead[] = Array.from({ length: 28 }, (_, i) => {
  const first = pick(FIRST, i * 3 + 1);
  const last = pick(LAST, i * 5 + 2);
  const name = `${first} ${last}`;
  const city = pick(CITIES, i);
  const stage = PIPELINE_STAGES[rand(i + 7, PIPELINE_STAGES.length)];
  const credit = (["500-599", "600-679", "680-739", "740+"] as const)[rand(i + 4, 4)];
  const badges: LeadBadge[] = [];
  if (i % 4 === 0) badges.push("Hot Lead");
  if (i % 3 === 0) badges.push("Needs Follow-Up");
  if (credit === "680-739" || credit === "740+") badges.push("Credit Ready");
  if (i % 5 === 2) badges.push("Missing Documents");
  if (stage === "Install Scheduled" && i % 6 === 0) badges.push("Install Risk");
  if (["Installed", "PTO"].includes(stage)) badges.push("Commission Pending");
  return {
    id: `L-${1000 + i}`,
    name,
    phone: `(${305 + (i % 5)}) ${String(200 + i * 7).padStart(3, "0")}-${String(1000 + i * 113).slice(-4)}`,
    email: `${first.toLowerCase()}.${last.toLowerCase()}@gmail.com`,
    address: `${100 + i * 17} ${pick(STREETS, i)}, ${city}`,
    city,
    service: pick(SERVICES, i + 1),
    utility: pick(UTILITIES, i + 2),
    bill: 180 + rand(i + 11, 420),
    credit,
    source: pick(SOURCES, i + 3),
    rep: pick(REPS, i),
    stage,
    nextFollowUp: refDate((i % 10) - 3),
    lastContact: refDate(-(((i % 7) + 1))),
    notes: i % 3 === 0
      ? "Homeowner concerned about Duke Energy rate hikes. Wants to lock in savings. Spouse needs to be present at appointment."
      : i % 3 === 1
      ? "Pre-qualified for $0 down loan. Roof is 8 years old, no replacement needed. Interested in battery backup."
      : "Referral from prior install. Looking at water softener add-on. Asked about EV charger pricing.",
    createdAt: refDate(-(i + 1)),
    priority: pick(PRIORITIES, i + 1),
    badges,
  };
});

export const TASKS = [
  { id: "T1", title: "Call Carlos Hernandez to confirm Tue 2pm appointment", lead: "L-1000", due: "Today", priority: "high", done: false },
  { id: "T2", title: "Send proposal PDF to Maria Smith", lead: "L-1001", due: "Today", priority: "high", done: false },
  { id: "T3", title: "Follow up on credit app — James Johnson", lead: "L-1002", due: "Tomorrow", priority: "med", done: false },
  { id: "T4", title: "Order site survey for Jennifer Garcia", lead: "L-1003", due: "Tomorrow", priority: "med", done: false },
  { id: "T5", title: "Upload signed contract to project tracker", lead: "L-1004", due: "Fri", priority: "low", done: true },
  { id: "T6", title: "WhatsApp reminder: Luis Martinez install scheduled", lead: "L-1005", due: "Fri", priority: "med", done: false },
  { id: "T7", title: "Drop off welcome kit — Ashley Brown", lead: "L-1006", due: "Next week", priority: "low", done: false },
  { id: "T8", title: "Call utility re: PTO delay for David Davis", lead: "L-1007", due: "Next week", priority: "high", done: false },
];

export const PROJECT_STEPS = [
  "Contract Signed",
  "Documents Uploaded",
  "Site Survey",
  "Design",
  "Permitting",
  "Installation",
  "Inspection",
  "PTO",
  "Completed",
];

export const PROJECTS = LEADS.filter((l) =>
  ["Contract Signed", "Site Survey", "Permit", "Install Scheduled", "Installed", "PTO", "Commission Paid"].includes(l.stage),
).slice(0, 6).map((l, i) => ({
  id: `P-${2000 + i}`,
  lead: l,
  step: i % PROJECT_STEPS.length,
  systemKw: 8 + (i % 5),
  panels: 18 + (i % 4) * 2,
  installer: pick(["Sunrise Crew A", "Eagle Crew B", "Atlantic Crew C"], i),
  permitNumber: `MIA-${10234 + i * 47}`,
}));

export const REP_LEADERBOARD = [
  { rep: "Diego Mota", deals: 14, revenue: 412000, commission: 28840 },
  { rep: "Brittany Lopez", deals: 12, revenue: 358000, commission: 25060 },
  { rep: "Jose Rivera", deals: 9, revenue: 274500, commission: 19215 },
  { rep: "Ashley Chen", deals: 7, revenue: 210800, commission: 14756 },
  { rep: "Devon Williams", deals: 5, revenue: 148000, commission: 10360 },
];

export const TRAINING_SCRIPTS = [
  { title: "FPL rate-hike opener", body: "Hey [Name], I noticed your block just got hit with the 7% FPL increase — most of my neighbors lock in a fixed rate around the bill they're paying now. Mind if I run a free comparison?" },
  { title: "Objection: 'I need to think about it'", body: "Totally fair. What specifically would you want to think through — the monthly payment, the system size, or how the credit works? I can clear that up in 60 seconds." },
  { title: "Water softener cross-sell", body: "Since we'll already be on site for the solar install, our water team can add a whole-home softener for about $39/mo — most customers tack it on so the truck only rolls once." },
];

export function fmtCurrency(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

// ---- Activity timeline ---------------------------------------------------
export interface ActivityEvent {
  id: string;
  type: "call" | "sms" | "whatsapp" | "email" | "note" | "stage" | "doc" | "appt";
  text: string;
  who: string;
  when: string;
}

export function activityFor(leadId: string): ActivityEvent[] {
  const seed = parseInt(leadId.replace("L-", ""), 10) || 0;
  const base: ActivityEvent[] = [
    { id: "a1", type: "stage", text: "Lead created from door-knock canvas", who: "Diego Mota", when: "5 days ago" },
    { id: "a2", type: "call", text: "First contact call · 7 min · qualified", who: "Diego Mota", when: "4 days ago" },
    { id: "a3", type: "whatsapp", text: "Sent rate-lock one-pager + intro video", who: "Diego Mota", when: "3 days ago" },
    { id: "a4", type: "appt", text: "Booked virtual proposal review · Tue 6:30pm", who: "Diego Mota", when: "2 days ago" },
    { id: "a5", type: "doc", text: "Uploaded 12-month utility bill (PDF)", who: "Customer", when: "1 day ago" },
    { id: "a6", type: "note", text: "Spouse will join the call. Concerned about roof age.", who: "Diego Mota", when: "1 day ago" },
  ];
  return base.slice(0, 3 + (seed % 4));
}

// ---- Documents -----------------------------------------------------------
export interface LeadDoc { id: string; name: string; status: "Received" | "Pending" | "Signed"; size: string }
export function docsFor(leadId: string): LeadDoc[] {
  const s = parseInt(leadId.replace("L-", ""), 10) || 0;
  const all: LeadDoc[] = [
    { id: "d1", name: "Utility bill (12-mo)", status: "Received", size: "1.2 MB" },
    { id: "d2", name: "Driver's license", status: s % 2 ? "Received" : "Pending", size: "640 KB" },
    { id: "d3", name: "Credit authorization", status: s % 3 ? "Signed" : "Pending", size: "210 KB" },
    { id: "d4", name: "HOA approval letter", status: s % 4 === 0 ? "Pending" : "Received", size: "480 KB" },
    { id: "d5", name: "Solar contract (MDB-2024)", status: s % 5 === 0 ? "Signed" : "Pending", size: "2.1 MB" },
  ];
  return all;
}

// ---- Commissions ---------------------------------------------------------
export type CommissionStatus = "Pending" | "Approved" | "Paid" | "Hold";
export type CommissionMilestone = "Contract" | "NTP" | "Install" | "PTO" | "Paid";

export interface Commission {
  id: string;
  rep: string;
  customer: string;
  service: ServiceType;
  dealValue: number;
  commission: number;
  status: CommissionStatus;
  milestone: CommissionMilestone;
  payoutDate: string;
}

export const COMMISSIONS: Commission[] = LEADS
  .filter((l) => ["Contract Signed", "Site Survey", "Permit", "Install Scheduled", "Installed", "PTO", "Commission Paid"].includes(l.stage))
  .map((l, i) => {
    const dealValue = 22000 + (i * 1400);
    const commission = Math.round(dealValue * 0.07);
    const milestoneByStage: Record<string, CommissionMilestone> = {
      "Contract Signed": "Contract",
      "Site Survey": "Contract",
      "Permit": "NTP",
      "Install Scheduled": "NTP",
      "Installed": "Install",
      "PTO": "PTO",
      "Commission Paid": "Paid",
    };
    const statusByStage: Record<string, CommissionStatus> = {
      "Contract Signed": "Pending",
      "Site Survey": "Pending",
      "Permit": "Pending",
      "Install Scheduled": "Approved",
      "Installed": "Approved",
      "PTO": "Approved",
      "Commission Paid": "Paid",
    };
    const status = i % 9 === 4 ? "Hold" : statusByStage[l.stage];
    return {
      id: `C-${3000 + i}`,
      rep: l.rep,
      customer: l.name,
      service: l.service,
      dealValue,
      commission,
      status,
      milestone: milestoneByStage[l.stage],
      payoutDate: refDate(((i % 14) + 7)),
    };
  });

// ---- Customer Portal (single customer demo) ------------------------------
export const PORTAL_CUSTOMER = {
  name: "Carlos Hernandez",
  address: "2841 Reunion Blvd, Davenport, FL",
  system: "9.2 kW · 23 panels · 410W Mission Solar",
  rep: "Diego Mota",
  repPhone: "(407) 555-2210",
  nextStep: "Final inspection scheduled with Polk County — Wed Dec 4, 9am-12pm",
  steps: [
    { name: "Contract Signed", done: true, date: "Oct 12" },
    { name: "Documents Uploaded", done: true, date: "Oct 14" },
    { name: "Site Survey", done: true, date: "Oct 20" },
    { name: "Design", done: true, date: "Oct 28" },
    { name: "Permitting", done: true, date: "Nov 9" },
    { name: "Installation", done: true, date: "Nov 22" },
    { name: "Inspection", done: false, date: "Dec 4 (scheduled)" },
    { name: "PTO", done: false, date: "Pending Duke Energy" },
    { name: "Completed", done: false, date: "—" },
  ],
  docsNeeded: [
    { name: "HOA approval letter", required: true, status: "Pending" },
    { name: "Updated driver's license photo", required: false, status: "Pending" },
  ],
  appointments: [
    { name: "Final inspection", when: "Wed Dec 4 · 9am-12pm" },
    { name: "PTO walkthrough", when: "TBD · within 7 days of inspection" },
  ],
};