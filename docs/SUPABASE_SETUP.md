# Supabase Database Setup Guide

This guide walks you through setting up Supabase as your PostgreSQL database for the Nordic Breath application.

## 📊 Why Supabase?

- **Free Tier**: 500 MB database, perfect for MVPs and small businesses
- **PostgreSQL**: Industry-standard relational database
- **Managed Service**: No server maintenance required
- **Global CDN**: Fast performance worldwide
- **Built-in Auth**: (Optional - we use Replit Auth instead)
- **Real-time**: Database change subscriptions (optional feature)

## 🚀 Step-by-Step Setup

### 1. Create Supabase Account

1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project"
3. Sign up with GitHub, Google, or email
4. Verify your email address

### 2. Create New Project

1. Click "New Project" in the dashboard
2. Fill in project details:
   - **Name**: `nordic-breath-production` (or your preferred name)
   - **Database Password**: Generate a strong password (save this!)
   - **Region**: Choose closest to Iceland:
     - Europe (Frankfurt) - `eu-central-1`
     - Europe (London) - `eu-west-2`
     - Recommended: **Europe (Frankfurt)** for best performance
3. Click "Create new project"
4. Wait 2-3 minutes for provisioning

### 3. Get Connection String

1. Go to **Project Settings** (gear icon in sidebar)
2. Click **Database** tab
3. Scroll to **Connection string** section
4. Copy the **URI** format (NOT the Pooler connection string):

```
postgresql://postgres.xxxxx:YOUR_PASSWORD@aws-0-eu-central-1.pooler.supabase.com:5432/postgres
```

### 4. Configure Environment Variables

Add to your `.env` file:

```bash
# Main connection string
DATABASE_URL=postgresql://postgres.xxxxx:YOUR_PASSWORD@aws-0-eu-central-1.pooler.supabase.com:5432/postgres

# Alternative: Individual connection params
PGHOST=aws-0-eu-central-1.pooler.supabase.com
PGPORT=5432
PGDATABASE=postgres
PGUSER=postgres.xxxxx
PGPASSWORD=YOUR_PASSWORD
```

**Important**: Replace `YOUR_PASSWORD` with the password you set when creating the project.

### 5. Test Connection

```bash
# Test using psql (if installed)
psql $DATABASE_URL

# Or test using Node.js
node -e "require('./server/db').db.execute('SELECT NOW()').then(r => console.log('Connected!', r))"
```

### 6. Push Database Schema

```bash
# Install dependencies first
npm install

# Push your Drizzle schema to Supabase
npm run db:push
```

This creates all tables defined in `shared/schema.ts`:
- users
- services
- instructors
- availability
- time_slots
- bookings
- waitlist
- blocked_times
- vouchers

### 7. Seed Test Data (Optional)

```bash
npm run seed
```

This creates:
- 4 test users (admin, 2 staff, 1 client)
- 4 breathwork services with pricing
- 2 instructor profiles
- 140 test time slots

### 8. Verify in Supabase Dashboard

1. Go to **Table Editor** in Supabase dashboard
2. You should see all tables listed
3. Click on tables to view seeded data
4. Example: Click `users` → should see 4 test users

## 🔒 Security Best Practices

### Enable Row Level Security (RLS)

Supabase recommends RLS for production. Since we handle authentication in our Express backend, we can skip this for now, but for extra security:

1. Go to **Authentication** → **Policies** in Supabase
2. Click **Enable RLS** for each table
3. Create policies matching our app's authorization logic

**Note**: Our Express API already handles authorization, so RLS is optional.

### Restrict Database Access

1. Go to **Project Settings** → **Database**
2. Scroll to **Connection Pooling**
3. Enable **SSL enforcement** (recommended)
4. Consider enabling **IP restrictions** for production

### Secure Your Password

- ✅ Use a strong, unique password
- ✅ Store in `.env` file (not committed to git)
- ✅ Use different passwords for dev/staging/production
- ❌ Never hardcode in source code
- ❌ Never share publicly

## 📈 Monitoring Usage

### Check Database Size

1. Go to **Project Settings** → **Database**
2. View **Database size** under Usage
3. Free tier limit: **500 MB**

### Check Bandwidth

1. Go to **Project Settings** → **Usage**
2. View **Bandwidth** consumption
3. Free tier limit: **5 GB/month**

### When to Upgrade

Upgrade to **Pro** ($25/month) when:
- Database size exceeds 400 MB (80% of free tier)
- You need daily automated backups
- You want to eliminate auto-pause after 1 week of inactivity
- Your app is generating revenue

## 🔧 Common Issues

### Issue: "Connection Refused"

**Causes**:
- Incorrect connection string
- Database not fully provisioned
- Firewall blocking connection

**Solutions**:
1. Verify connection string is correct
2. Wait a few minutes if project was just created
3. Check your internet connection
4. Try adding `?sslmode=require` to connection string

### Issue: "Password authentication failed"

**Causes**:
- Wrong password in `.env`
- Password contains special characters not URL-encoded

**Solutions**:
1. Double-check password in Supabase dashboard
2. URL-encode special characters (or reset password to simpler one)
3. Use the exact connection string from Supabase dashboard

### Issue: "Too many connections"

**Cause**: Free tier has connection limits

**Solutions**:
1. Use connection pooling (already enabled by default)
2. Reduce concurrent connections in your app
3. Upgrade to Pro tier for more connections

### Issue: "Database size exceeded"

**Cause**: Hit 500 MB limit on free tier

**Solutions**:
1. Delete old/test data
2. Archive old bookings to external storage
3. Upgrade to Pro tier (8 GB included)

## 📊 Database Management

### Using Drizzle Studio

```bash
npm run db:studio
```

- Visual database browser
- Runs on `http://localhost:4983`
- View and edit data directly
- No SQL knowledge required

### Using psql (Command Line)

```bash
# Connect to database
psql $DATABASE_URL

# Useful commands
\dt                    # List all tables
\d+ users              # Describe users table
SELECT * FROM users;   # Query data
\q                     # Quit
```

### Using Supabase Dashboard

1. Go to **Table Editor**
2. Click on any table
3. View/edit data in spreadsheet-like interface
4. Click **SQL Editor** for custom queries

## 🔄 Backup Strategy

### Free Tier
- ❌ No automated backups
- ✅ Manual export via Supabase dashboard
- ✅ Create your own backup script

### Manual Backup (Free Tier)

```bash
# Export entire database
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# Restore from backup
psql $DATABASE_URL < backup_20250103.sql
```

### Pro Tier ($25/month)
- ✅ Automated daily backups
- ✅ 7-day retention
- ✅ Point-in-time recovery (PITR)

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [PostgreSQL Tutorial](https://www.postgresqltutorial.com/)
- [Drizzle ORM Docs](https://orm.drizzle.team)
- [Connection Pooling Guide](https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pooler)

## 🆘 Getting Help

- [Supabase Discord](https://discord.supabase.com)
- [Supabase Support](https://supabase.com/support)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/supabase)

---

**Next Steps**: After database setup, configure [Stripe payments](./STRIPE_SETUP.md)
