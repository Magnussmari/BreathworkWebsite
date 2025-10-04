# 🚀 FREE Deployment Guide - Zero Monthly Cost

> Deploy Nordic Breath breathwork platform with **$0/month infrastructure** using free tiers

---

## 📊 Cost Breakdown

| Service | Monthly Cost | What You Get |
|---------|--------------|--------------|
| Vercel (Hosting) | **$0** | 100GB bandwidth, unlimited sites |
| Supabase (Database) | **$0** | 500MB DB, 50k users, 5GB bandwidth |
| Cloudflare (CDN) | **$0** | Unlimited requests, SSL, DDoS |
| Sentry (Errors) | **$0** | 5,000 errors/month |
| UptimeRobot | **$0** | 50 monitors, 5-min checks |
| Slack (Messaging) | **$0** | 10k message history |
| Resend (Email) | **$0** | 100 emails/day (3k/month) |
| **TOTAL** | **$0** | Perfect for MVP! |
| Stripe (Payments) | **Pay-per-use** | ~2.4% of revenue |

---

## 🎯 Quick Start (5 Steps)

### 1️⃣ Setup Supabase Database (FREE)

**Create Account**: https://supabase.com

```bash
# 1. Create new project (choose Iceland region if available)
# 2. Wait for database provisioning (~2 minutes)
# 3. Copy connection string from Settings → Database
# 4. Use TRANSACTION POOLER (port 6543)
```

**Connection String Format**:
```
postgresql://postgres.PROJECT_REF:PASSWORD@aws-1-REGION.pooler.supabase.com:6543/postgres
```

**Add to `.env`**:
```bash
DATABASE_URL=postgresql://postgres.xxx:your-password@aws-1-eu-west-1.pooler.supabase.com:6543/postgres
```

### 2️⃣ Push Database Schema

```bash
npm run db:push
```

### 3️⃣ Initialize Application

```bash
node scripts/setup-breathwork.js
```

This creates:
- Default admin user (maggismari@gmail.com)
- 9D Breathwork class template
- Initial configuration

### 4️⃣ Deploy to Vercel (FREE)

**Option A: GitHub Integration (Recommended)**

1. Push code to GitHub
2. Go to https://vercel.com/new
3. Import your repository
4. Add environment variables:
   ```
   DATABASE_URL=postgresql://...
   STRIPE_SECRET_KEY=sk_test_...
   VITE_STRIPE_PUBLIC_KEY=pk_test_...
   SESSION_SECRET=[generate with: openssl rand -base64 32]
   ```
5. Click "Deploy" ✅

**Option B: Vercel CLI**

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

### 5️⃣ Configure Custom Domain (Optional)

1. Add domain in Vercel dashboard
2. Update DNS records at your registrar:
   ```
   Type: CNAME
   Name: @
   Value: cname.vercel-dns.com
   ```
3. Wait for SSL certificate (automatic)

---

## 🔐 Environment Variables Setup

### Vercel Dashboard

1. Go to Project → Settings → Environment Variables
2. Add these secrets (Production):

```bash
# Database (Supabase)
DATABASE_URL=postgresql://postgres.xxx:pass@...pooler.supabase.com:6543/postgres

# Stripe (Start with TEST keys)
STRIPE_SECRET_KEY=sk_test_51...
VITE_STRIPE_PUBLIC_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...  # Get after webhook setup

# Session Security
SESSION_SECRET=                   # Generate: openssl rand -base64 32

# Monitoring (Optional)
SENTRY_DSN=https://...@sentry.io/...
```

### Local Development

Create `.env`:
```bash
DATABASE_URL=postgresql://localhost:5432/breathwork_dev
STRIPE_SECRET_KEY=sk_test_...
VITE_STRIPE_PUBLIC_KEY=pk_test_...
SESSION_SECRET=dev-secret-change-me
NODE_ENV=development
```

---

## 📧 Setup Free Email (Resend)

**Why Resend**: 100 emails/day FREE, better deliverability than SendGrid free tier

### Setup Steps

1. Create account: https://resend.com
2. Verify your domain (or use resend.dev for testing)
3. Get API key
4. Add to Vercel environment:
   ```bash
   RESEND_API_KEY=re_...
   ```

### Install Package

```bash
npm install resend
```

### Send Email Example

```typescript
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

await resend.emails.send({
  from: 'Nordic Breath <bookings@nordicbreath.is>',
  to: user.email,
  subject: 'Class Registration Confirmed',
  html: '<strong>Your spot is reserved!</strong>',
});
```

---

## 💳 Setup Stripe (Pay-Per-Use)

### Create Stripe Account

1. Sign up: https://stripe.com
2. Complete business verification
3. Enable **ISK (Iceland Króna)** currency
4. Get API keys from Dashboard → Developers → API keys

### Configure Webhook

1. Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://your-domain.vercel.app/api/stripe/webhook`
3. Select events:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
4. Copy webhook secret → Add to Vercel env vars

### ISK Currency Notes

⚠️ **Iceland Króna is zero-decimal**:
- 4,500 ISK = 4500 (no cents)
- DO NOT multiply by 100
- Stripe API expects whole ISK amounts

```typescript
// ✅ Correct
const amount = 4500; // 4,500 ISK

// ❌ Wrong
const amount = 4500 * 100; // Would be 450,000 ISK!
```

---

## 💬 Setup Slack Integration (FREE)

### Create Slack App

1. Go to https://api.slack.com/apps
2. Click "Create New App" → "From scratch"
3. Name: "Nordic Breath Notifications"
4. Choose workspace

### Configure Bot Permissions

Add these scopes (OAuth & Permissions):
```
chat:write          # Send messages
users:read          # Get user info
channels:read       # List channels
im:write           # Direct messages
im:read            # Read DMs
files:write        # Upload files
```

### Install App & Get Token

1. Click "Install to Workspace"
2. Authorize
3. Copy **Bot User OAuth Token**: `xoxb-...`
4. Add to Vercel env vars:
   ```bash
   SLACK_BOT_TOKEN=xoxb-...
   ```

### Install Slack SDK

```bash
npm install @slack/web-api
```

### Send Message Example

```typescript
import { WebClient } from '@slack/web-api';

const slack = new WebClient(process.env.SLACK_BOT_TOKEN);

await slack.chat.postMessage({
  channel: 'general',
  text: `New class registration from ${user.name}!`,
});
```

---

## 📊 Setup Monitoring (FREE)

### Sentry Error Tracking

1. Create account: https://sentry.io
2. Create new project (React + Node.js)
3. Copy DSN
4. Add to Vercel:
   ```bash
   SENTRY_DSN=https://...@sentry.io/...
   VITE_SENTRY_DSN=https://...@sentry.io/...  # For client-side
   ```

### UptimeRobot Health Checks

1. Create account: https://uptimerobot.com (FREE)
2. Add new monitor:
   - Type: HTTP(s)
   - URL: `https://your-domain.vercel.app/api/health`
   - Interval: 5 minutes
3. Add alert contacts (email + Slack webhook)

### Cloudflare CDN

1. Add site to Cloudflare (free plan)
2. Update nameservers at domain registrar
3. Enable:
   - SSL/TLS: Full (strict)
   - Auto minify (HTML, CSS, JS)
   - Brotli compression
   - Browser Cache TTL: 4 hours

---

## ✅ Deployment Checklist

### Pre-Deploy
- [ ] All environment variables configured in Vercel
- [ ] Database schema pushed to Supabase
- [ ] Default admin user created
- [ ] Stripe test keys working
- [ ] All tests passing

### First Deploy
- [ ] Push to GitHub main branch
- [ ] Vercel auto-deploys
- [ ] Check deployment logs for errors
- [ ] Visit site and test login
- [ ] Test class booking flow

### Post-Deploy
- [ ] Configure custom domain (if applicable)
- [ ] Set up UptimeRobot monitoring
- [ ] Configure Sentry error tracking
- [ ] Test Stripe webhook locally: `stripe listen --forward-to localhost:3000/api/stripe/webhook`
- [ ] Switch to Stripe live keys when ready

---

## 🚨 Common Issues & Fixes

### Build Fails on Vercel

**Issue**: TypeScript errors or missing dependencies

**Fix**:
```bash
# Run locally first
npm run check
npm run build

# If builds locally, check Vercel build logs
```

### Database Connection Errors

**Issue**: "connection refused" or timeout

**Fix**:
1. Use **Transaction Pooler** (port 6543), not Direct Connection (5432)
2. URL-encode password (! → %21)
3. Check Supabase project isn't paused (free tier auto-pauses after 1 week inactivity)
4. Restart project in Supabase dashboard

### Stripe Webhook Not Working

**Issue**: Webhook signature verification fails

**Fix**:
1. Copy webhook secret exactly (starts with `whsec_`)
2. Add to Vercel env vars
3. Redeploy after adding env var
4. Use Stripe CLI for local testing:
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```

### Session Cookies Not Persisting

**Issue**: Users logged out on page refresh

**Fix**:
```typescript
// server/supabaseAuth.ts
res.cookie('session_token', token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production', // Important!
  sameSite: 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000,
});
```

---

## 📈 Scaling on Free Tier

### Optimization Tips

**Frontend**:
- ✅ Use Vercel Edge Network (automatic)
- ✅ Lazy load images
- ✅ Code splitting with React.lazy()
- ✅ Compress images to WebP

**Backend**:
- ✅ Database connection pooling (Supabase built-in)
- ✅ Cache static data with React Query
- ✅ Optimize database queries (use indexes)

**Database**:
- ✅ Add indexes on frequently queried columns
- ✅ Use pagination for large lists
- ✅ Archive old data after 1 year

### Free Tier Limits

**Supabase Free Tier**:
- 500 MB database storage
- 5 GB bandwidth/month
- 50,000 monthly active users
- Auto-pauses after 7 days inactivity

**Estimate**: With 50 classes/month, ~100 users, you'll use:
- Database: ~20-50 MB (well within limits)
- Bandwidth: ~1-2 GB (within limits)
- Users: ~100 (within limits)

**When to Upgrade**: When you hit 500MB database or need backups (~200-300 active users)

---

## 🎉 You're Live!

Your app is now deployed with:
- ✅ Zero monthly infrastructure cost
- ✅ Global CDN (Vercel Edge)
- ✅ Automatic SSL certificate
- ✅ Auto-deploy on Git push
- ✅ Preview deployments for PRs
- ✅ Error tracking (Sentry)
- ✅ Uptime monitoring (UptimeRobot)

**Only Pay**: ~2.4% Stripe fees on revenue

**Next Steps**:
1. Test all features on production
2. Switch Stripe to live keys
3. Add custom domain
4. Start marketing! 🚀

---

## 🔗 Quick Links

- Vercel Dashboard: https://vercel.com/dashboard
- Supabase Dashboard: https://supabase.com/dashboard
- Stripe Dashboard: https://dashboard.stripe.com
- Sentry Dashboard: https://sentry.io
- UptimeRobot: https://uptimerobot.com/dashboard

---

*Last Updated: October 4, 2025*
