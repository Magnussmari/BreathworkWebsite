# CI/CD & DevOps Guide - Nordic Breath Platform

> **Mission**: Establish a robust, automated deployment pipeline with monitoring, error tracking, and scalable infrastructure for the Breathwork booking platform.

---

## 📋 Table of Contents

1. [Deployment Strategy Overview](#deployment-strategy-overview)
2. [Environment Setup](#environment-setup)
3. [CI/CD Pipeline Configuration](#cicd-pipeline-configuration)
4. [Database Management](#database-management)
5. [Monitoring & Observability](#monitoring--observability)
6. [Security & Secrets Management](#security--secrets-management)
7. [Scaling Strategy](#scaling-strategy)
8. [Incident Response](#incident-response)
9. [Pre-Launch Checklist](#pre-launch-checklist)

---

## Deployment Strategy Overview

### Three-Tier Approach

```
Development → Staging → Production
    ↓           ↓           ↓
  Local      Preview     Live
```

### Recommended Stack (100% Free + Stripe Pay-Per-Use)

| Component | Technology | Cost | Why |
|-----------|-----------|------|-----|
| **Hosting** | Vercel | **FREE** | Serverless, auto-scaling, edge network |
| **Database** | Supabase (Free tier) | **FREE** | 500MB DB, 50k users, 5GB bandwidth |
| **CI/CD** | GitHub Actions | **FREE** | 2,000 min/month, integrated |
| **Monitoring** | Sentry (Developer) | **FREE** | 5k errors/month |
| **Uptime** | UptimeRobot | **FREE** | 50 monitors, 5-min checks |
| **CDN** | Cloudflare | **FREE** | SSL, DDoS, caching |
| **Payments** | Stripe | **Pay-per-use** | ~2.4% transaction fees |
| **Messaging** | Slack (Free) | **FREE** | 10k message history |
| **Email** | Resend (Free) | **FREE** | 100 emails/day |

**Total Monthly Cost: $0 + Stripe fees (~2.4% of revenue)**

---

## Environment Setup

### 1. Environment Variables by Stage

#### Development (.env.local)
```bash
NODE_ENV=development
DATABASE_URL=postgresql://localhost:5432/breathwork_dev
STRIPE_SECRET_KEY=sk_test_...
VITE_STRIPE_PUBLIC_KEY=pk_test_...
SESSION_SECRET=dev-secret-change-me
```

#### Staging (.env.staging)
```bash
NODE_ENV=staging
DATABASE_URL=postgresql://user:pass@staging-db.supabase.co:6543/postgres
STRIPE_SECRET_KEY=sk_test_...
VITE_STRIPE_PUBLIC_KEY=pk_test_...
SESSION_SECRET=[generate with: openssl rand -base64 32]
SENTRY_DSN=https://...@sentry.io/...
```

#### Production (.env.production)
```bash
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@prod-db.supabase.co:6543/postgres
STRIPE_SECRET_KEY=sk_live_...
VITE_STRIPE_PUBLIC_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
SESSION_SECRET=[strong 32-byte secret]
SENTRY_DSN=https://...@sentry.io/...
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
REDIS_URL=redis://...  # For session storage
```

### 2. Secret Generation Commands

```bash
# Session secret (32 bytes base64)
openssl rand -base64 32

# Random password (24 chars)
openssl rand -base64 18

# Database encryption key
openssl rand -hex 32
```

---

## CI/CD Pipeline Configuration

### Vercel Deployment (Recommended - FREE)

**Step 1: Install Vercel CLI**
```bash
npm install -g vercel
```

**Step 2: Configure Vercel**

Create `vercel.json` in project root:
```json
{
  "version": 2,
  "builds": [
    {
      "src": "server/index.ts",
      "use": "@vercel/node"
    },
    {
      "src": "client/package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist/client"
      }
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "server/index.ts"
    },
    {
      "src": "/(.*)",
      "dest": "client/$1"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
```

**Step 3: Deploy**
```bash
# First time - link project
vercel

# Production deployment
vercel --prod
```

**Step 4: Configure Environment Variables in Vercel Dashboard**
1. Go to Project Settings → Environment Variables
2. Add all production secrets
3. Redeploy after adding secrets

**Auto-Deploy on Git Push**: Vercel automatically deploys when you push to `main` branch!

### GitHub Actions Workflow (Alternative/Additional CI)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

env:
  NODE_VERSION: '20.x'

jobs:
  # 1. Run Tests
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: TypeScript type check
        run: npm run check

      - name: Run tests (when available)
        run: npm test || echo "No tests configured yet"

  # 2. Build Application
  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build application
        run: npm run build
        env:
          VITE_STRIPE_PUBLIC_KEY: ${{ secrets.VITE_STRIPE_PUBLIC_KEY }}

      - name: Upload build artifacts
        uses: actions/upload-artifact@v3
        with:
          name: dist
          path: dist/

  # 3. Deploy to Staging (on PR)
  deploy-staging:
    if: github.event_name == 'pull_request'
    needs: build
    runs-on: ubuntu-latest
    environment: staging
    steps:
      - uses: actions/checkout@v4

      - name: Download build artifacts
        uses: actions/download-artifact@v3
        with:
          name: dist

      - name: Deploy to Vercel (Preview)
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          github-comment: true

  # 4. Deploy to Production (on main push)
  deploy-production:
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    needs: build
    runs-on: ubuntu-latest
    environment: production
    steps:
      - uses: actions/checkout@v4

      - name: Download build artifacts
        uses: actions/download-artifact@v3
        with:
          name: dist

      - name: Run database migrations
        run: npm run db:push
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}

      - name: Deploy to Vercel (Production)
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'

      - name: Notify deployment success
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          text: '✅ Production deployment successful!'
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}
        if: success()

      - name: Notify deployment failure
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          text: '❌ Production deployment failed!'
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}
        if: failure()

  # 5. Health Check
  health-check:
    needs: deploy-production
    runs-on: ubuntu-latest
    steps:
      - name: Wait for deployment
        run: sleep 30

      - name: Check application health
        run: |
          response=$(curl -s -o /dev/null -w "%{http_code}" https://breathwork.is/api/health)
          if [ $response -ne 200 ]; then
            echo "Health check failed with status: $response"
            exit 1
          fi
          echo "✅ Health check passed!"
```

### Deploy Preview on Pull Requests

```yaml
# .github/workflows/preview.yml
name: Deploy Preview

on:
  pull_request:
    types: [opened, synchronize, reopened]

jobs:
  deploy-preview:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Deploy to Vercel Preview
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          github-comment: true
```

---

## Database Management

### 1. Migration Strategy

```bash
# Development - push schema changes
npm run db:push

# Production - use migrations
npx drizzle-kit generate:pg
npx drizzle-kit push:pg
```

### 2. Backup Automation

**Supabase**: Automatic daily backups (Pro plan)

**Self-hosted**: Use cron job

```bash
# /scripts/backup-db.sh
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="backup_${DATE}.sql"
pg_dump $DATABASE_URL > /backups/$BACKUP_FILE
gzip /backups/$BACKUP_FILE

# Upload to S3 (optional)
aws s3 cp /backups/${BACKUP_FILE}.gz s3://breathwork-backups/

# Cleanup old backups (keep 30 days)
find /backups -name "backup_*.sql.gz" -mtime +30 -delete
```

**Crontab entry**:
```bash
# Daily backup at 3 AM
0 3 * * * /path/to/scripts/backup-db.sh
```

### 3. Database Seeding

```bash
# Initialize production with default data
node scripts/setup-breathwork.js

# Verify setup
psql $DATABASE_URL -c "SELECT * FROM class_templates WHERE is_default = true;"
```

---

## Monitoring & Observability

### 1. Error Tracking with Sentry

**Install Sentry**:
```bash
npm install @sentry/node @sentry/react
```

**Server Setup** (`server/index.ts`):
```typescript
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});

app.use(Sentry.Handlers.requestHandler());
app.use(Sentry.Handlers.errorHandler());
```

**Client Setup** (`client/src/main.tsx`):
```typescript
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  integrations: [
    new Sentry.BrowserTracing(),
    new Sentry.Replay(),
  ],
  tracesSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});
```

### 2. Application Performance Monitoring (APM)

**Health Check Endpoint** (`server/routes.ts`):
```typescript
app.get('/api/health', async (req, res) => {
  try {
    // Check database connection
    await db.execute(sql`SELECT 1`);

    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version,
      uptime: process.uptime(),
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message,
    });
  }
});
```

### 3. Log Aggregation

**Structured Logging with Pino**:
```bash
npm install pino pino-pretty
```

```typescript
import pino from 'pino';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV === 'development'
    ? { target: 'pino-pretty' }
    : undefined,
});

// Usage
logger.info({ userId, classId }, 'Registration created');
logger.error({ err, userId }, 'Payment failed');
```

### 4. Uptime Monitoring

**UptimeRobot Configuration**:
1. Monitor: `https://breathwork.is/api/health`
2. Interval: 5 minutes
3. Alert contacts: Email + Slack
4. HTTP status: 200 expected

---

## Security & Secrets Management

### 1. Environment Variable Management

**GitHub Secrets** (Settings → Secrets and variables → Actions):
- `DATABASE_URL`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `SESSION_SECRET`
- `SENTRY_DSN`
- `SLACK_WEBHOOK`

**Railway/Render**: Use platform's secret management

### 2. Security Headers

```typescript
import helmet from 'helmet';

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "fonts.googleapis.com"],
      scriptSrc: ["'self'", "js.stripe.com"],
      frameSrc: ["js.stripe.com"],
      imgSrc: ["'self'", "data:", "https:"],
      fontSrc: ["'self'", "fonts.gstatic.com"],
    },
  },
}));
```

### 3. Rate Limiting

```bash
npm install express-rate-limit
```

```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP',
});

app.use('/api/', limiter);
```

### 4. SSL/TLS Configuration

**Cloudflare Setup**:
1. Add domain to Cloudflare
2. Enable Full (strict) SSL/TLS encryption
3. Enable HSTS
4. Enable automatic HTTPS rewrites

---

## Scaling Strategy

### Phase 1: Single Server (0-1,000 users)
```
Client → Cloudflare CDN → Railway/Render → Supabase
```
- Vertical scaling (increase RAM/CPU)
- Connection pooling (Supabase built-in)
- Redis session store

### Phase 2: Load Balancing (1,000-10,000 users)
```
           ┌→ Server 1 ─┐
Client → LB ─→ Server 2 ─→ Supabase
           └→ Server 3 ─┘
```
- Horizontal scaling with load balancer
- Shared Redis for sessions
- CDN for static assets

### Phase 3: Microservices (10,000+ users)
```
API Gateway → Auth Service
           → Booking Service
           → Payment Service
           → Notification Service
```

### Database Scaling

**Read Replicas**:
```typescript
// Read from replica
const users = await readDb.select().from(users);

// Write to primary
await writeDb.insert(registrations).values(data);
```

**Connection Pooling**:
```typescript
const pool = new Pool({
  connectionString: DATABASE_URL,
  max: 20, // maximum pool size
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

---

## Incident Response

### 1. Incident Severity Levels

| Level | Response Time | Description |
|-------|--------------|-------------|
| P0 - Critical | 15 min | Site down, payment failures |
| P1 - High | 1 hour | Feature broken, data loss risk |
| P2 - Medium | 4 hours | Performance degradation |
| P3 - Low | 24 hours | Minor bugs, cosmetic issues |

### 2. On-Call Rotation

**Setup Opsgenie or PagerDuty**:
- Primary: Magnus (Week 1)
- Secondary: [Team member] (Week 2)
- Escalation after 15 min no response

### 3. Incident Checklist

**When alerts fire:**

1. ✅ **Acknowledge** the alert immediately
2. ✅ **Assess** severity and impact
3. ✅ **Communicate** in #incidents Slack channel
4. ✅ **Investigate** logs in Sentry/Logtail
5. ✅ **Mitigate** issue (rollback if needed)
6. ✅ **Document** in incident report
7. ✅ **Post-mortem** within 48 hours

### 4. Rollback Procedure

```bash
# Railway rollback
railway rollback

# Manual rollback with Git
git revert <commit-hash>
git push origin main

# Database rollback (if needed)
npx drizzle-kit drop
npm run db:push
node scripts/restore-backup.js
```

---

## Pre-Launch Checklist

### Infrastructure
- [ ] Domain purchased and configured
- [ ] SSL certificate active
- [ ] CDN (Cloudflare) configured
- [ ] DNS records set (A, CNAME, MX)
- [ ] Production database created (Supabase Pro)
- [ ] Database backups automated
- [ ] Redis/session store configured

### Security
- [ ] All secrets stored securely (no .env in Git)
- [ ] Security headers configured (helmet.js)
- [ ] Rate limiting enabled
- [ ] CORS properly configured
- [ ] SQL injection protection verified
- [ ] XSS protection enabled
- [ ] CSRF protection implemented

### Monitoring
- [ ] Sentry error tracking configured
- [ ] Uptime monitoring active (UptimeRobot)
- [ ] APM dashboards created
- [ ] Slack alerts configured
- [ ] Log aggregation setup (Logtail/Papertrail)
- [ ] Health check endpoint tested

### Integrations
- [ ] Stripe production keys configured
- [ ] Stripe webhooks registered and tested
- [ ] Slack API tokens configured
- [ ] Email service configured (SendGrid/Resend)
- [ ] Payment flow tested end-to-end

### Testing
- [ ] Load testing completed (k6/Artillery)
- [ ] Security audit completed
- [ ] All user flows tested
- [ ] Mobile responsiveness verified
- [ ] Browser compatibility tested (Chrome, Safari, Firefox)
- [ ] Payment edge cases tested

### Documentation
- [ ] API documentation complete
- [ ] Deployment runbook created
- [ ] Incident response plan documented
- [ ] User documentation updated
- [ ] Admin guide created

### Compliance (if needed)
- [ ] Privacy policy published
- [ ] Terms of service published
- [ ] GDPR compliance verified
- [ ] Cookie consent implemented
- [ ] Data retention policy documented

### Performance
- [ ] Images optimized (WebP, lazy loading)
- [ ] Code splitting implemented
- [ ] Database queries optimized
- [ ] Lighthouse score > 90
- [ ] Load time < 3 seconds

---

## Next Steps: Stripe & Slack Integration

### Stripe Integration Roadmap

**Phase 1: Setup** (1 week)
1. Create Stripe account (Iceland entity)
2. Obtain API keys (test + production)
3. Set up webhook endpoints
4. Configure ISK currency (zero-decimal)
5. Test payment flow with test cards

**Phase 2: Implementation** (2 weeks)
1. Payment intent creation on registration
2. Stripe Elements checkout integration
3. Webhook handlers (payment success/failure)
4. Payment status tracking in database
5. Refund handling for cancellations
6. Receipt generation and email

**Phase 3: Testing** (1 week)
1. Test all payment scenarios
2. Test refund flows
3. Security audit
4. Load testing payment system
5. Compliance verification

**Required Documents**:
- [ ] Business registration (Iceland)
- [ ] Bank account details
- [ ] Tax identification number
- [ ] Business address verification
- [ ] Identity verification for account holder

### Slack Integration Roadmap

**Phase 1: Setup** (1 week)
1. Create Slack workspace or use existing
2. Create Slack App at api.slack.com
3. Configure OAuth scopes and permissions
4. Generate Bot User OAuth Token
5. Install app to workspace

**Phase 2: Implementation** (2 weeks)
1. In-app messaging UI components
2. Slack API integration (send/receive messages)
3. User-to-user direct messaging
4. Admin broadcast capabilities
5. Class update notifications
6. Real-time message sync

**Phase 3: Features** (2 weeks)
1. Message threading
2. File attachments
3. Emoji reactions
4. Read receipts
5. Push notifications
6. Message search

**Required Slack Scopes**:
- `chat:write` - Send messages
- `users:read` - Read user info
- `channels:read` - List channels
- `im:write` - Create direct messages
- `im:read` - Read direct messages
- `files:write` - Upload files

---

## Cost Estimation (Monthly) - 100% FREE Plan

### Core Infrastructure (FREE Forever)
| Service | Plan | Cost | Limits |
|---------|------|------|--------|
| **Vercel** | Hobby | **$0** | 100GB bandwidth, unlimited deploys |
| **Supabase** | Free | **$0** | 500MB DB, 50k users, 5GB bandwidth |
| **GitHub Actions** | Free | **$0** | 2,000 minutes/month |
| **Sentry** | Developer | **$0** | 5,000 errors/month |
| **UptimeRobot** | Free | **$0** | 50 monitors, 5-min checks |
| **Cloudflare** | Free | **$0** | Unlimited requests |
| **Slack** | Free | **$0** | 10,000 message history |
| **Resend** | Free | **$0** | 100 emails/day, 3,000/month |
| **Total Infrastructure** | | **$0/month** | ✅ |

### Pay-Per-Use
| Service | Model | Cost |
|---------|-------|------|
| **Stripe** | Transaction fee | 1.4% + 30 ISK (EU cards)<br>2.9% + 30 ISK (non-EU) |

### Example Revenue Scenario

**20 bookings/month @ avg 8,000 ISK**
- Revenue: **160,000 ISK**
- Stripe fees (70% EU): ~2,400 ISK
- Stripe fees (30% non-EU): ~1,500 ISK
- **Total fees: ~3,900 ISK (~2.4%)**
- **Infrastructure cost: 0 ISK**
- **Net after fees: 156,100 ISK (97.6%)**

### When to Upgrade (Future Growth)

**Supabase Free → Pro ($25/month)** when you hit:
- 500MB database storage
- 50,000 monthly active users
- Need daily backups
- Need point-in-time recovery

**Vercel Hobby → Pro ($20/month)** when you hit:
- 100GB bandwidth/month
- Need team collaboration
- Need advanced analytics

**Resend Free → Pro ($20/month)** when you hit:
- 3,000 emails/month
- Need dedicated IP
- Need advanced analytics

**Current Recommendation**: Stay on **FREE tier** until you're profitable! 🚀

---

## Quick Command Reference

```bash
# Deployment
git push origin main                    # Auto-deploy to production
railway up                              # Manual Railway deploy
vercel --prod                          # Manual Vercel deploy

# Database
npm run db:push                        # Push schema changes
node scripts/backup-db.sh              # Manual backup
psql $DATABASE_URL                     # Connect to database

# Monitoring
railway logs                           # View production logs
sentry-cli releases list               # View Sentry releases
curl https://breathwork.is/api/health  # Health check

# Rollback
railway rollback                       # Rollback last deploy
git revert HEAD && git push           # Revert last commit
```

---

## Support & Resources

- **Railway Docs**: https://docs.railway.app
- **Sentry Docs**: https://docs.sentry.io
- **Stripe Docs**: https://stripe.com/docs
- **Slack API**: https://api.slack.com
- **Drizzle ORM**: https://orm.drizzle.team

---

*Last Updated: October 4, 2025*
*Review & Update: Monthly or after major changes*
