## Phase 1 — Lovable Cloud foundation

Lovable Cloud is already enabled for this project. No manual credentials are required from you — the backend URL and publishable key are auto-injected. You will only need to (a) sign up the first user from the new `/signup` page and (b) optionally promote that user to `admin` from the in-app Admin page after signup.

### 1. Database schema (one migration)

Tables (all in `public`, all with RLS enabled and GRANTs to `authenticated` + `service_role`):

- `profiles` — `id`, `user_id` (FK auth.users, unique), `full_name`, `email`, `phone`, `avatar_url`, timestamps. **Roles live in a separate table** (security best practice — never on profiles).
- `user_roles` — `id`, `user_id`, `role` (enum: `admin`, `manager`, `sales_rep`, `operations`, `customer`). Backed by a `has_role(uuid, app_role)` SECURITY DEFINER function to avoid RLS recursion.
- `leads` — all fields from your spec, with `pipeline_stage` and `service_type` as text (matches existing demo types). `assigned_rep` stored as `uuid` referencing `auth.users.id`.
- `tasks` — FK to `leads`, `assigned_to` uuid, status enum (`open`, `in_progress`, `done`).
- `projects` — FK to `leads`, all spec fields.
- `commissions` — FK to `leads`, `rep_id` uuid, status + milestone enums.
- `proposals` — FK to `leads`, all spec fields, `proposal_status` enum.

Trigger: `handle_new_user()` auto-creates a `profiles` row on signup (using email + raw_user_meta_data.full_name).

### 2. RLS policies

- `profiles`: user sees/updates own row; admins see all.
- `user_roles`: read own; admins manage all.
- `leads`: admins + managers see all; sales_rep sees rows where `assigned_rep = auth.uid()`; operations sees all; customer sees none.
- `tasks`: same model as leads (via lead's assigned_rep or `assigned_to = auth.uid()`).
- `projects` / `commissions` / `proposals`: admins + managers full access; sales_rep sees rows for their assigned leads; customers see their own project (matched by `profiles.user_id` → lead via email for now).
- Insert: any authenticated user can create leads (sales rep workflow); update restricted by the same role rules.

### 3. Auth wiring

- Keep the existing `/login` page styling. Make the form actually call `supabase.auth.signInWithPassword` and Google sign-in via the Lovable broker (`lovable.auth.signInWithOAuth("google")`).
- Add `/signup` page (matches login styling) — email/password + full name; profile row auto-created via trigger.
- Add root `onAuthStateChange` listener that invalidates router + query cache on sign-in/out.
- Convert `_app` layout into an `_authenticated` guard: `beforeLoad` checks session, redirects unauth users to `/login`. (Renames `_app.*.tsx` files → `_authenticated.*.tsx`, or keep `_app` filename and just add the auth guard. **I'll keep filenames** to avoid touching every route file — only `_app.tsx` gets the guard.)
- Logout button in sidebar `UserCard` calls `supabase.auth.signOut()`.
- Configure `supabase--configure_social_auth` for Google in the same step.

### 4. Wire Leads + Pipeline pages

- `useLeads()` hook: TanStack Query reads from `supabase.from("leads").select()`. **If result is empty**, falls back to the existing `LEADS` demo array so the UI never looks broken on a fresh project.
- New Lead button → opens dialog → inserts into Supabase.
- Lead detail page reads single row by id (with demo fallback when id starts with `L-`).
- Pipeline drag/click stage change → `update({ pipeline_stage })` on Supabase.
- Tasks/Projects/Commissions/Proposals pages: **left on demo data for Phase 1.** I'll wire them in Phase 2 so we can verify Phase 1 stabilizes first.

### 5. What stays untouched

- Sidebar, theme toggle, AI assistant, dashboard layout, branding, all visual styling.
- Demo data file (`mdb-data.ts`) — kept as fallback.

### Technical details

- Migration uses one `CREATE TYPE ... app_role`, one `CREATE TYPE ... lead_stage` (matches existing 12-stage flow), and `CREATE TYPE` for commission/proposal/task status enums.
- `has_role(_user_id uuid, _role app_role)` SECURITY DEFINER function backs every role-based policy.
- `handle_new_user` trigger inserts into `profiles` only — role assignment is manual (first signup can be promoted via SQL or Admin page).
- Bearer attacher in `src/start.ts` already exists (per stack convention) — I'll verify and add if missing.
- Demo IDs (`L-1000`...) stay strings; new Supabase rows use uuid. The leads hook normalizes both shapes for the UI.

### What you'll do after I ship

1. Open `/signup`, create your account (`Diego Mota` / your email).
2. I'll give you a one-line SQL snippet to run from the in-app Admin page (or I can wire a "promote me to admin" button on first signup) to grant your user the `admin` role.
3. Click **New Lead** on the Leads page to verify writes work.

Confirm and I'll execute steps 1–4 in one batch.