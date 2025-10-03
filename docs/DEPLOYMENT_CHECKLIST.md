# Deployment Checklist for Nordic Breath

Use this checklist before deploying to production to ensure everything is configured correctly.

## 📋 Pre-Deployment Checklist

### Database Setup
- [ ] Supabase project created and configured
- [ ] Database schema pushed (`npm run db:push`)
- [ ] Production database credentials added to `.env`
- [ ] Database backups configured (Pro tier) or manual backup strategy in place
- [ ] SSL/TLS enabled for database connections
- [ ] Connection pooling verified working
- [ ] Test data removed from production database

### Environment Variables
- [ ] All required environment variables set:
  - [ ] `DATABASE_URL` or `PG*` variables
  - [ ] `SESSION_SECRET` (unique, 32+ characters)
  - [ ] `STRIPE_SECRET_KEY` (live key, not test)
  - [ ] `VITE_STRIPE_PUBLIC_KEY` (live key, not test)
  - [ ] `REPL_ID` and `REPLIT_DOMAINS` configured
  - [ ] `ISSUER_URL` set correctly
  - [ ] `NODE_ENV=production`
- [ ] `.env` file is in `.gitignore` (never committed)
- [ ] All secrets stored securely (not in code)

### Stripe Configuration
- [ ] Stripe account verified and activated
- [ ] Live API keys obtained and configured
- [ ] ISK currency enabled
- [ ] Payment methods configured (Cards, Apple Pay, Google Pay)
- [ ] Webhooks set up at production URL
- [ ] Webhook signing secret configured
- [ ] Test payments completed successfully
- [ ] Fraud prevention enabled (Stripe Radar)
- [ ] Refund policy defined
- [ ] Customer email notifications enabled

### Authentication
- [ ] OIDC redirect URIs updated for production domain
- [ ] Session secret is strong and unique
- [ ] Admin user accounts created
- [ ] Staff accounts created and linked to instructors
- [ ] Test/demo accounts removed or disabled
- [ ] Email verification flow tested

### Application Testing
- [ ] All user flows tested end-to-end:
  - [ ] User registration/login
  - [ ] Service browsing
  - [ ] Booking creation
  - [ ] Payment processing
  - [ ] Booking confirmation
  - [ ] Booking cancellation
  - [ ] Booking rescheduling
  - [ ] Admin session creation
  - [ ] Admin analytics
- [ ] Mobile responsiveness verified
- [ ] Cross-browser testing completed (Chrome, Safari, Firefox)
- [ ] Error handling tested (network failures, invalid inputs)
- [ ] Loading states display correctly

### Code Quality
- [ ] TypeScript type checking passes (`npm run check`)
- [ ] No critical console errors
- [ ] Build succeeds (`npm run build`)
- [ ] All dependencies up to date
- [ ] Unused code and comments removed
- [ ] Debug logs removed or disabled in production

### Security
- [ ] SQL injection protection verified (using Drizzle ORM)
- [ ] XSS protection in place
- [ ] CORS configured correctly
- [ ] Rate limiting considered for API endpoints
- [ ] Sensitive data not logged
- [ ] HTTPS enforced
- [ ] Security headers configured
- [ ] Input validation on all forms

### Performance
- [ ] Database queries optimized (no N+1 problems)
- [ ] Images optimized
- [ ] Bundle size checked
- [ ] Lazy loading implemented where appropriate
- [ ] CDN configured (if applicable)
- [ ] Caching strategy in place

### Legal & Compliance
- [ ] Privacy Policy page added
- [ ] Terms of Service page added
- [ ] Cookie consent (if using cookies for tracking)
- [ ] GDPR compliance (if serving EU customers)
- [ ] Refund policy clearly stated
- [ ] Contact information visible

### Business Setup
- [ ] Services configured with correct pricing
- [ ] Instructor profiles complete
- [ ] Availability schedules set
- [ ] Initial sessions/time slots created
- [ ] Booking confirmation email template reviewed
- [ ] Customer support email configured

### Monitoring & Maintenance
- [ ] Error tracking set up (e.g., Sentry)
- [ ] Analytics configured (e.g., Google Analytics)
- [ ] Uptime monitoring enabled
- [ ] Backup strategy documented
- [ ] Incident response plan created
- [ ] Support contact methods defined

### Documentation
- [ ] README.md updated with production setup
- [ ] API documentation current
- [ ] Deployment process documented
- [ ] Rollback procedure documented
- [ ] Team has access to all credentials (securely)

## 🚀 Deployment Steps

### Option 1: Replit Deployment

1. **Prepare Environment**
   ```bash
   # Set environment to production
   NODE_ENV=production
   ```

2. **Configure Secrets**
   - Go to Replit Secrets tab
   - Add all production environment variables
   - Verify all secrets are set

3. **Deploy**
   - Click "Deploy" or enable "Always On"
   - Verify deployment URL
   - Update Stripe webhook URL
   - Update OIDC redirect URIs

4. **Verify**
   - Test complete booking flow
   - Check Stripe dashboard for test payment
   - Verify all pages load correctly

### Option 2: VPS/Custom Server

1. **Server Setup**
   ```bash
   # Clone repository
   git clone <your-repo-url>
   cd nordic-breath
   
   # Install dependencies
   npm install
   
   # Build application
   npm run build
   ```

2. **Configure Environment**
   ```bash
   # Create .env file
   cp .env.example .env
   
   # Edit with production values
   nano .env
   ```

3. **Database Setup**
   ```bash
   # Push schema to production database
   npm run db:push
   ```

4. **Start Application**
   ```bash
   # Using PM2 (recommended)
   npm install -g pm2
   pm2 start npm --name "nordic-breath" -- start
   pm2 save
   pm2 startup
   
   # Or using systemd service
   # Create /etc/systemd/system/nordic-breath.service
   ```

5. **Configure Nginx (Reverse Proxy)**
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       
       location / {
           proxy_pass http://localhost:5000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

6. **SSL Certificate**
   ```bash
   # Using Let's Encrypt
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d your-domain.com
   ```

### Option 3: Vercel/Netlify

1. **Configure Build Settings**
   - Build command: `npm run build`
   - Output directory: `dist`
   - Install command: `npm install`

2. **Environment Variables**
   - Add all production variables in platform settings
   - Ensure `NODE_ENV=production`

3. **Deploy**
   - Connect GitHub repository
   - Trigger deployment
   - Monitor build logs

## 🔍 Post-Deployment Verification

### Immediate Checks (Within 1 Hour)
- [ ] Application loads without errors
- [ ] Can create account and log in
- [ ] Can complete a test booking
- [ ] Payment processes successfully
- [ ] Email confirmations sent
- [ ] Admin dashboard accessible
- [ ] All API endpoints responding correctly
- [ ] No console errors in browser
- [ ] No server errors in logs

### Within 24 Hours
- [ ] Monitor error logs for issues
- [ ] Check Stripe dashboard for payments
- [ ] Verify webhook deliveries
- [ ] Test from different devices/browsers
- [ ] Monitor database performance
- [ ] Check application performance metrics
- [ ] Verify backup systems working

### Within 1 Week
- [ ] Review user feedback
- [ ] Analyze usage patterns
- [ ] Check for any edge cases
- [ ] Optimize slow queries if any
- [ ] Review and adjust pricing if needed
- [ ] Monitor conversion rates

## 🆘 Troubleshooting Common Issues

### Issue: Payment Failures

**Check:**
1. Stripe webhooks receiving events
2. Webhook signature verification passing
3. Database booking status updating correctly
4. Error logs for payment processing errors

**Fix:**
- Verify webhook URL is correct
- Check webhook signing secret
- Test with Stripe test cards first
- Review Stripe dashboard for failed payments

### Issue: Authentication Errors

**Check:**
1. OIDC redirect URIs match production URL
2. Session secret is set correctly
3. Database user table has correct data
4. Cookies are being set properly

**Fix:**
- Update redirect URIs in OIDC provider settings
- Clear browser cookies and test again
- Verify session secret is consistent across restarts
- Check HTTPS is enforced

### Issue: Database Connection Errors

**Check:**
1. Connection string is correct
2. Database is accessible from production server
3. Firewall rules allow connections
4. Connection pool not exhausted

**Fix:**
- Test connection with `psql $DATABASE_URL`
- Check Supabase firewall settings
- Restart application to reset connection pool
- Consider upgrading database tier if connection limit reached

### Issue: Slow Performance

**Check:**
1. Database query performance
2. Network latency
3. Unoptimized queries (N+1 problems)
4. Large bundle sizes

**Fix:**
- Use Drizzle Studio to analyze slow queries
- Add database indexes for frequently queried fields
- Enable query caching where appropriate
- Optimize frontend bundle with code splitting

## 📊 Monitoring Metrics

Track these metrics post-deployment:

### Business Metrics
- Number of bookings per day/week
- Revenue per day/week
- Conversion rate (visitors → bookings)
- Average booking value
- Cancellation rate

### Technical Metrics
- Application uptime
- Response time for key endpoints
- Database query performance
- Error rate
- Payment success rate
- Webhook delivery success rate

### User Experience
- Page load times
- Time to complete booking
- Mobile vs desktop usage
- Browser compatibility issues
- Customer support tickets

## 🔄 Maintenance Schedule

### Daily
- Monitor error logs
- Check payment processing
- Review customer support tickets

### Weekly
- Review analytics
- Check database size/usage
- Verify backups are working
- Update content if needed

### Monthly
- Review and optimize performance
- Update dependencies
- Review security best practices
- Analyze business metrics
- Plan new features based on feedback

### Quarterly
- Comprehensive security audit
- Review and update documentation
- Evaluate infrastructure costs
- Plan major updates or features

---

## ✅ Final Sign-Off

Before going live, have the following team members sign off:

- [ ] **Developer**: Code reviewed and tested
- [ ] **Business Owner**: Pricing and policies approved
- [ ] **Designer**: UI/UX approved
- [ ] **Legal**: Terms and privacy policy reviewed
- [ ] **Finance**: Payment processing and accounting verified

**Deployment Date**: ___________________  
**Deployed By**: ___________________  
**Production URL**: ___________________

---

**Ready to launch? Good luck with your deployment! 🚀**
