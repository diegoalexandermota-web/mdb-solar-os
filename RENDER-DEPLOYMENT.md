# MDB Solar OS Render Deployment Guide

## 1. Service Type Recommendation
**Use: Render Web Service**
- MDB Solar OS uses Next.js with SSR and API routes. Render Static Site is NOT recommended.

## 2. Build & Start Commands
- **Build Command:** `npm run build`
- **Start Command:** `npm run start`

## 3. Environment Variables (Render > Environment tab)
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `OPENAI_API_KEY`
- `MDB_AI_BACKEND_URL`

## 4. Setup Steps
1. Push your code to GitHub (see previous instructions).
2. Create a new **Web Service** on Render.
3. Connect your GitHub repo.
4. Set the build and start commands above.
5. Add all required environment variables in the Render dashboard.
6. Deploy.

## 5. Domain Setup
- Add your custom domain in the Render dashboard (optional).
- Configure DNS as instructed by Render.

## 6. Notes
- No Vercel-specific dependencies are present.
- Next.js SSR and API routes are fully supported on Render Web Service.
- No deployment blockers detected.
- Demo/sample data is provided for a lively experience.

## 7. Troubleshooting
- If you see SSR/hydration errors, check your environment variables and Supabase setup.
- For static export, use Vercel or Netlify, but for full SSR/API, Render Web Service is required.

---

**MDB Solar OS is production-ready for Render Web Service deployment.**
