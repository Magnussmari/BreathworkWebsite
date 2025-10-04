# 🚀 START HERE - Nordic Breath Platform

> **Quick Reference**: Everything you need to know in one place

---

## 📚 Documentation Guide

### For Development
1. **README.md** - Full project overview, setup instructions, tech stack
2. **QUICKSTART.md** - Fast setup for local development
3. **CLAUDE.md** - AI assistant guidelines for code generation

### For Deployment
1. **DEPLOY_FREE.md** - Complete FREE deployment guide (Vercel + Supabase)
2. **FREE_TIER_SUMMARY.md** - Cost breakdown and free tier limits
3. **CICD.md** - Complete DevOps guide, monitoring, scaling

### For Daily Work
1. **devday0410.md** - Latest session notes and next tasks
2. **MIGRATION_STATUS.md** - System migration tracking
3. **scripts/** - Utility scripts (create-admin, setup, etc.)

---

## ⚡ Quick Commands

```bash
# Development
npm run dev              # Start dev server (http://localhost:3000)
npm run check            # TypeScript type checking

# Database
npm run db:push          # Push schema changes to Supabase

# Setup
node scripts/setup-breathwork.js    # Initialize app with defaults
node scripts/create-admin.js        # Create admin user
node scripts/create-test-class.js   # Generate test classes

# Deploy
git push origin main     # Auto-deploy to Vercel (if connected)
vercel --prod           # Manual Vercel deployment
```

---

## 🎯 Current Status

### ✅ Completed
- Authentication system (Supabase + bcrypt)
- Class-based booking system
- Client dashboard (modern redesign)
- Admin dashboard (class creation)
- Responsive UI (shadcn/ui components)
- Database schema (Drizzle ORM)

### 🚧 In Progress
- Registration POST endpoint (500 error to fix)
- Stripe payment integration
- Slack messaging integration
- Email notifications (Resend)

### 📋 Next Up
1. Deploy to Vercel FREE tier (30 min)
2. Fix registration endpoint bug (1 hour)
3. Integrate Stripe payments (1 week)
4. Add Slack messaging (1 week)

---

## 💰 Cost Structure

**Infrastructure**: **$0/month** (100% FREE tier)
- Vercel hosting: FREE (100GB bandwidth)
- Supabase database: FREE (500MB, 50k users)
- Monitoring: FREE (Sentry, UptimeRobot)
- Email: FREE (Resend - 100/day)
- Messaging: FREE (Slack - 10k history)

**Payments**: Stripe pay-per-use (~2.4% transaction fees)

**Scales to**: 50k users, 500MB data before needing upgrades!

---

## 🏗️ Architecture

```
Frontend (React + Vite)
    ↓
Backend (Express.js)
    ↓
Database (Supabase PostgreSQL)
    ↓
Payments (Stripe ISK)
```

**Class System**:
```
classTemplates → classes → registrations
```

---

## 🔑 Environment Variables

```bash
# Required
DATABASE_URL=postgresql://...              # Supabase connection
STRIPE_SECRET_KEY=sk_test_...             # Stripe API key
VITE_STRIPE_PUBLIC_KEY=pk_test_...        # Stripe public key
SESSION_SECRET=[openssl rand -base64 32]  # Session security

# Optional
SENTRY_DSN=https://...                    # Error tracking
SLACK_BOT_TOKEN=xoxb-...                  # Slack integration
RESEND_API_KEY=re_...                     # Email sending
```

---

## 📞 Quick Support

**Issues?**
1. Check `README.md` troubleshooting section
2. Review `devday0410.md` known issues
3. Check server logs in Vercel dashboard
4. Review Sentry for error details

**Common Fixes**:
- Database errors → Check Supabase isn't paused (free tier)
- Build errors → Run `npm run check` locally first
- Auth errors → Verify SESSION_SECRET is set
- Stripe errors → Check webhook secret matches

---

## 🎓 Learning Resources

- **Drizzle ORM**: https://orm.drizzle.team
- **Stripe API**: https://stripe.com/docs
- **Supabase**: https://supabase.com/docs
- **Vercel**: https://vercel.com/docs
- **shadcn/ui**: https://ui.shadcn.com

---

## 🎉 Ready to Deploy?

1. Read **DEPLOY_FREE.md** (10 min read)
2. Create accounts (FREE - see checklist)
3. Push to GitHub
4. Connect to Vercel
5. Add environment variables
6. Deploy! (5 minutes)

**You'll be live with $0/month cost!** 🚀

---

*For detailed info, see individual documentation files*
