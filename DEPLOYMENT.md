# Deployment Guide - School of Mathematics Nigeria LMS

## Prerequisites
- GitHub account
- Vercel account (free tier works)
- Supabase project configured
- Paystack account with API keys

## Deployment Steps

### 1. Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/somng-lms.git
git push -u origin main
```

### 2. Deploy to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Click "Add New Project"
3. Import your GitHub repository
4. Configure environment variables (see below)
5. Click "Deploy"

### 3. Environment Variables in Vercel
Add these in Vercel Dashboard > Project > Settings > Environment Variables:

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key |
| `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` | Paystack public key (pk_live_xxx) |
| `PAYSTACK_SECRET_KEY` | Paystack secret key (sk_live_xxx) |

### 4. Configure Custom Domain (Optional)
1. In Vercel, go to Project > Settings > Domains
2. Add your domain (e.g., `learn.schoolofmaths.ng`)
3. Update DNS records as instructed

### 5. Update Supabase Auth Settings
1. Go to Supabase Dashboard > Authentication > URL Configuration
2. Update Site URL to your production domain
3. Add your domain to Redirect URLs

## Post-Deployment Verification
- [ ] Test student registration
- [ ] Test admin login (/admin)
- [ ] Test course viewing
- [ ] Test payment flow (small test payment)
