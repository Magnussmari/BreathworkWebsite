# Get Your Supabase Database URL

## Step 1: Go to Supabase Dashboard

Visit: https://supabase.com/dashboard/project/jwixnfnbinqsrqjlfdet/settings/database

## Step 2: Find Connection String

Look for the **"Connection string"** section, then click the **"URI"** tab.

You should see something like:

```
postgresql://postgres.jwixnfnbinqsrqjlfdet:[YOUR-PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres
```

## Step 3: Choose the Right Mode

You'll see two options:

### Option A: Transaction Mode (Port 6543) ✅ **RECOMMENDED FOR DRIZZLE**
```
postgresql://postgres.jwixnfnbinqsrqjlfdet:[YOUR-PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres
```

### Option B: Session Mode (Port 5432)
```
postgresql://postgres.jwixnfnbinqsrqjlfdet:[YOUR-PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:5432/postgres
```

## Step 4: Replace the Password

Replace `[YOUR-PASSWORD]` with your actual database password: `HVYYoo5q1985!`

**Important**: If your password contains special characters like `!`, you need to URL-encode them:
- `!` becomes `%21`
- `@` becomes `%40`
- `#` becomes `%23`
- etc.

So your password `HVYYoo5q1985!` becomes `HVYYoo5q1985%21`

## Step 5: Update .env

Your final DATABASE_URL should look like:

```env
DATABASE_URL=postgresql://postgres.jwixnfnbinqsrqjlfdet:HVYYoo5q1985%21@aws-0-eu-central-1.pooler.supabase.com:6543/postgres
```

## Step 6: Test the Connection

Run:
```bash
npm run db:push
```

---

## Troubleshooting

### If you get "Tenant or user not found"
- The password is wrong or not properly URL-encoded
- The database username format is incorrect
- Check your Supabase dashboard for the exact format

### If you get "ENOTFOUND" or DNS error
- The hostname is wrong
- Copy the exact hostname from Supabase dashboard
- Make sure your Supabase project isn't paused

### If you get connection timeout
- Your IP might be blocked
- Check Supabase dashboard → Settings → Database → Connection pooling
- Make sure "Allow connections from anywhere" is enabled (or add your IP)

---

## Quick Copy-Paste Template

After you get the connection string from Supabase, update your `.env`:

```env
# Database Configuration (Supabase)
DATABASE_URL=postgresql://postgres.jwixnfnbinqsrqjlfdet:HVYYoo5q1985%21@[CORRECT-HOST]:6543/postgres

# Supabase Configuration
SUPABASE_URL=https://jwixnfnbinqsrqjlfdet.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3aXhuZm5iaW5xc3JxamxmZGV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0ODE2ODcsImV4cCI6MjA3NTA1NzY4N30.wtZPziRPVSAqV6LmzBFMmGtYylE8n8TTZVSmtjj8Hlk

# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_51S6XhF2Ovq1RjZREOmE0jBYKjLYno2CpN7Mf44Wr7cKAJtc76QmTaDWtzpuFmRqpO0L19NEtCPyuBNzS9MtxBHA300yqsftRx9
VITE_STRIPE_PUBLIC_KEY=pk_test_51S6XhF2Ovq1RjZRE2Nvt0w2KrQrAW0LPikpsZ9ItmiYYFDKR9Cvx4avpGePIGHbMTcIotLZelfKeX5RnMtvg04YI00JDeNe0Ros

# Application Configuration
NODE_ENV=development
PORT=5000
```

Replace `[CORRECT-HOST]` with the hostname from your Supabase dashboard.
