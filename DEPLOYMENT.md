# MDB Solar OS Deployment Instructions

## 1. Environment Variables

Copy `.env.example` to `.env.local` and fill in your values:
- `NEXT_PUBLIC_SUPABASE_URL` (from Supabase project settings)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (from Supabase project settings)
- `OPENAI_API_KEY` (for AI features, from OpenAI)
- `NEXT_PUBLIC_MDB_AI_BACKEND_URL` (your AI backend, or leave blank for demo)

## 2. Supabase Setup
- Create a Supabase project
- Run `supabase-schema.sql` in the SQL editor
- Enable Row Level Security (RLS) and configure policies for all tables
- Add demo data for leads, proposals, tasks, etc. (see demo-data.sql if provided)

## 3. Local Development
- `npm install`
- `npm run dev`
- Visit http://localhost:3000

## 4. Production Build
- `npm run build`
- `npm start`

## 5. Deployment
- Deploy to Vercel (recommended) or your preferred platform
- Set all environment variables in your deployment dashboard
- Point to your Supabase production database

## 6. Demo Data
- Use Supabase dashboard to add sample leads, proposals, tasks, etc.
- Or import a provided demo-data.sql

## 7. Security
- Ensure RLS is enabled and tested
- Do not commit `.env.local` or secrets
- Test customer portal access restrictions

## 8. Support
- For issues, contact your MDB Solar OS admin or developer
