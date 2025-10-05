# Get Your Supabase Database URL

## Step 1: Go to Supabase Dashboard

Visit: https://supabase.com/dashboard → Select your project → Settings → Database

## Step 2: Find Connection String

Look for the **"Connection string"** section, then click the **"URI"** tab.

You should see something like:

```
postgresql://postgres.your-project:[YOUR-PASSWORD]@aws-region.pooler.supabase.com:6543/postgres
```

## Step 3: Choose the Right Mode

You'll see two options:

### Option A: Transaction Mode (Port 6543) ✅ **RECOMMENDED FOR DRIZZLE**
```
postgresql://postgres.your-project:[YOUR-PASSWORD]@aws-region.pooler.supabase.com:6543/postgres
```

### Option B: Session Mode (Port 5432)
```
postgresql://postgres.your-project:[YOUR-PASSWORD]@aws-region.pooler.supabase.com:5432/postgres
```

## Step 4: Replace the Password

Replace `[YOUR-PASSWORD]` with your actual database password

**Important**: If your password contains special characters like `!`, you need to URL-encode them:
- `!` becomes `%21`
- `@` becomes `%40`
- `#` becomes `%23`
- etc.

So for example, if your password is `MyP@ss!`, it becomes `MyP%40ss%21`

## Step 5: Update .env

Your final DATABASE_URL should look like:

```env
DATABASE_URL=postgresql://postgres.your-project:your-encoded-password@aws-region.pooler.supabase.com:6543/postgres
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
DATABASE_URL=postgresql://postgres.your-project:[YOUR-PASSWORD]@[CORRECT-HOST]:6543/postgres

# Supabase Configuration
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key-here

# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
VITE_STRIPE_PUBLIC_KEY=pk_test_your_stripe_public_key

# Application Configuration
NODE_ENV=development
PORT=5000
```

Replace `[CORRECT-HOST]` with the hostname from your Supabase dashboard.
