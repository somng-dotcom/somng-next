# Deployment Guide - School of Mathematics Nigeria LMS

## Prerequisites
- GitHub account
- Vercel account (free tier works)
- Supabase project configured
- Paystack account with API keys
- `pnpm` installed locally

## Pre-Deployment Verification
Before deploying, run these commands locally to ensure stability:
```bash
pnpm run build  # Must pass without errors
pnpm run lint   # Should be free of critical errors
```

## Deployment Steps

### 1. Push to GitHub
```bash
git init
git add .
git commit -m "Ready for production"
git remote add origin https://github.com/YOUR_USERNAME/somng-lms.git
git push -u origin main
```

### 2. Deploy to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Click "Add New Project"
3. Import your GitHub repository
4. **Framework Preset**: Next.js
5. **Root Directory**: `./`
6. **Build Command**: `next build` (or `pnpm build`)
7. **Install Command**: `pnpm install`

### 3. Environment Variables in Vercel
Add these in Vercel Dashboard > Project > Settings > Environment Variables:

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | **CRITICAL**: Supabase service role key (keep secret) |
| `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` | Paystack public key (pk_live_xxx) |
| `PAYSTACK_SECRET_KEY` | Paystack secret key (sk_live_xxx) |
| `NEXT_PUBLIC_SITE_URL` | Your production URL (e.g., https://learn.schoolofmaths.ng) |

### 4. Database Security (Supabase)
Ensure you have run the latest security scripts in the Supabase SQL Editor:
- `supabase/force_fix_all.sql`: Applies critical RLS policies and admin permissions.

### 5. Update Supabase Auth Settings
1. Go to Supabase Dashboard > Authentication > URL Configuration
2. Update **Site URL** to your production domain (e.g., `https://learn.schoolofmaths.ng`)
3. Add your domain to **Redirect URLs** (e.g., `https://learn.schoolofmaths.ng/**`)

## Post-Deployment Checklist
- [ ] Log in as Admin and verify Dashboard access
- [ ] Test the Notification Log (Internal API check)
- [ ] Verify Payment Verification endpoint (via Paystack webhook test)
- [ ] Check console for no "Infinite Loading" skeletons upon tab switching

