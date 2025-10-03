# Nordic Breath - Breathwork Booking Platform

A comprehensive booking platform for a breathwork company in Iceland featuring authentication, scheduling, payment processing, and role-based dashboards.

## 🚀 Features

### For Clients
- Browse breathwork services and instructor profiles
- Book sessions with preferred instructors
- Secure payment via Stripe (ISK currency, cards, Apple Pay, Google Pay)
- View upcoming and past bookings
- Cancel and reschedule bookings
- Download booking confirmations

### For Staff (Instructors)
- View assigned bookings
- Confirm pending bookings
- Manage weekly availability schedule
- View and update instructor profile

### For Admins
- Create and manage breathwork sessions
- Service management (create, edit, delete, activate/deactivate)
- Revenue analytics and booking statistics
- Manage all bookings across instructors
- View system-wide metrics

## 🛠 Tech Stack

- **Frontend**: React + TypeScript + Vite + Tailwind CSS + shadcn/ui
- **Backend**: Express.js + Node.js
- **Database**: PostgreSQL (Supabase)
- **Authentication**: Replit Auth (OIDC) - Multi-provider support
- **Payments**: Stripe Checkout (ISK currency)
- **ORM**: Drizzle ORM
- **State Management**: TanStack Query (React Query)
- **Forms**: React Hook Form + Zod validation

## 📋 Prerequisites

- Node.js 20.x or higher
- PostgreSQL database (Supabase recommended)
- Stripe account
- VS Code (recommended)

## 🏃‍♂️ Getting Started

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd nordic-breath
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

Create a `.env` file in the root directory (use `.env.example` as reference):

```bash
# Database Configuration
DATABASE_URL=postgresql://user:password@host:port/database

# Alternative PostgreSQL Connection Details
PGHOST=your-db-host.supabase.co
PGPORT=5432
PGDATABASE=postgres
PGUSER=postgres
PGPASSWORD=your-secure-password

# Session Secret (Generate with: openssl rand -base64 32)
SESSION_SECRET=your-random-32-character-secret-here

# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
VITE_STRIPE_PUBLIC_KEY=pk_test_your_stripe_publishable_key

# Replit Auth (for OIDC authentication)
REPL_ID=your-repl-id
REPLIT_DOMAINS=your-domain.replit.dev
ISSUER_URL=https://replit.com/oidc

# Application Configuration
NODE_ENV=development
PORT=5000
```

### 4. Set Up Supabase Database

#### Option A: Create New Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the database to be provisioned
3. Copy the connection string from Settings → Database
4. Update `DATABASE_URL` in your `.env` file

#### Option B: Use Existing Database

1. Update all `PG*` variables in `.env` with your database credentials
2. Or use the single `DATABASE_URL` connection string

### 5. Push Database Schema

```bash
npm run db:push
```

This will create all necessary tables in your PostgreSQL database.

### 6. Seed Test Data (Optional)

```bash
npm run seed
```

This creates:
- 4 test users (admin, 2 staff, 1 client)
- 4 breathwork services
- 2 instructor profiles
- Weekly availability schedules
- 140 test time slots

**Test Accounts:**
- Admin: `admin@nordicbreath.is` (role: admin)
- Staff 1: `sigridur@nordicbreath.is` (role: staff)
- Staff 2: `bjorn@nordicbreath.is` (role: staff)
- Client: `test@example.is` (role: client)

### 7. Run Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:5000`

## 🗄 Database Schema

The application uses the following main tables:

- **users**: Client, staff, and admin accounts
- **services**: Breathwork session offerings
- **instructors**: Staff member profiles with bios and certifications
- **availability**: Instructor weekly schedule templates
- **timeSlots**: Specific bookable time slots
- **bookings**: Client reservations and payments
- **waitlist**: Queue for fully booked sessions
- **blockedTimes**: Holidays and instructor unavailability
- **vouchers**: Discount codes and promotions

## 🔧 VS Code Setup

### Recommended Extensions

Install these extensions for the best development experience:

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "prisma.prisma",
    "formulahendry.auto-rename-tag",
    "ms-vscode.vscode-typescript-next"
  ]
}
```

### Workspace Settings

Create `.vscode/settings.json`:

```json
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true,
  "files.associations": {
    "*.css": "tailwindcss"
  }
}
```

## 🔐 Authentication Setup

This application uses **Replit Auth (OIDC)** which is a passwordless multi-provider authentication system.

### For Development

When developing locally outside of Replit, you'll need to:

1. Set up proper redirect URIs in your OIDC provider
2. Update `ISSUER_URL`, `REPL_ID`, and `REPLIT_DOMAINS` environment variables
3. Modify `server/replitAuth.ts` if using a different OIDC provider

### User Roles

The application supports three roles:
- **client**: Can book sessions and manage their bookings
- **staff**: Can view and manage their assigned bookings
- **admin**: Full access to all features including analytics and session management

## 💳 Stripe Setup

### 1. Create Stripe Account

1. Sign up at [stripe.com](https://stripe.com)
2. Complete account verification
3. Enable Iceland (ISK) as a supported currency

### 2. Get API Keys

1. Go to Developers → API keys
2. Copy **Publishable key** → `VITE_STRIPE_PUBLIC_KEY`
3. Copy **Secret key** → `STRIPE_SECRET_KEY`

### 3. Configure Webhook (for Production)

1. Go to Developers → Webhooks
2. Add endpoint: `https://your-domain.com/api/payments/webhook`
3. Select events: `checkout.session.completed`, `payment_intent.succeeded`
4. Copy webhook secret to your `.env`

### Important: ISK Currency Handling

⚠️ **Iceland Króna (ISK) is a zero-decimal currency**:
- All amounts must be in whole króna only (no fractions)
- In Stripe API, amounts are in whole units (e.g., 4500 = 4,500 ISK)
- Card networks no longer permit fractional ISK payments since April 2023

## 💰 Cost Estimates

### Supabase (Database)

**Free Tier** (Perfect for MVP/Small Business):
- ✅ 500 MB database storage
- ✅ 1 GB file storage
- ✅ 50,000 monthly active users
- ✅ 5 GB bandwidth/month
- ✅ 2 active projects
- ⚠️ Auto-pauses after 1 week of inactivity
- ⚠️ No automated backups

**Estimated usage for Nordic Breath:**
- Database: ~50-100 MB (well within limits)
- Users: ~50-500 users/month (within limits)
- Bandwidth: ~2-3 GB/month (within limits)

**Recommendation**: Start with **Free tier** ✅

**Pro Tier** ($25/month when you grow):
- No auto-pause
- Daily backups
- 8 GB database
- 100 GB file storage
- 100 GB bandwidth

### Stripe (Payments)

**No monthly fees** - Pay per transaction only

**Fee Structure for Iceland:**
- European cards: **1.4% + 30 ISK** per transaction
- Non-European cards: **2.9% + 30 ISK** per transaction
- Dispute fee: **~2,070 ISK** (refunded if you win)

**Example Transaction Fees:**

| Service Price | European Card Fee | Non-EU Card Fee |
|--------------|-------------------|-----------------|
| 4,500 ISK | 93 ISK (2.1%) | 161 ISK (3.6%) |
| 7,900 ISK | 141 ISK (1.8%) | 259 ISK (3.3%) |
| 12,500 ISK | 205 ISK (1.6%) | 393 ISK (3.1%) |
| 45,000 ISK | 660 ISK (1.5%) | 1,335 ISK (3.0%) |

**Monthly Cost Estimate (Based on 20 bookings/month, avg 8,000 ISK):**
- Revenue: 160,000 ISK
- Stripe fees (70% EU cards): ~2,400 ISK
- Stripe fees (30% non-EU): ~1,500 ISK
- **Total Stripe fees: ~3,900 ISK/month (~2.4%)**

## 📁 Project Structure

```
nordic-breath/
├── client/                 # React frontend
│   ├── src/
│   │   ├── pages/         # Application pages
│   │   ├── components/    # Reusable components
│   │   ├── hooks/         # Custom React hooks
│   │   └── lib/           # Utilities and configs
│   └── index.html
├── server/                # Express backend
│   ├── routes.ts          # API endpoints
│   ├── storage.ts         # Database operations
│   ├── db.ts              # Database connection
│   ├── replitAuth.ts      # Authentication setup
│   ├── seed.ts            # Test data seeding
│   ├── vite.ts            # Vite middleware
│   └── index.ts           # Server entry point
├── shared/                # Shared code
│   └── schema.ts          # Drizzle database schema
├── .env.example           # Environment variables template
├── package.json           # Dependencies
├── vite.config.ts         # Vite configuration
├── drizzle.config.ts      # Drizzle ORM configuration
└── tailwind.config.ts     # Tailwind CSS configuration
```

## 🔄 Available Scripts

```bash
# Development
npm run dev              # Start development server (frontend + backend)

# Database
npm run db:push          # Push schema changes to database
npm run db:studio        # Open Drizzle Studio (visual database manager)
npm run seed             # Seed database with test data

# Build
npm run build            # Build for production
npm run preview          # Preview production build

# Type Checking
npm run check            # TypeScript type checking
```

## 🚀 Deployment

### Option 1: Replit (Recommended for Quick Start)

The application is already configured for Replit deployment. Simply:

1. Connect your repository to Replit
2. Set environment variables in Secrets
3. Click "Run"

### Option 2: Vercel/Netlify

1. Build the application: `npm run build`
2. Deploy the `dist` folder
3. Set up environment variables
4. Configure database connection

### Option 3: VPS/Docker

1. Set up Node.js environment
2. Clone repository
3. Install dependencies
4. Set environment variables
5. Run `npm run build && npm start`

## 🧪 Testing

### Manual Testing Checklist

- [ ] User can sign up/login via Replit Auth
- [ ] Client can browse services
- [ ] Client can book a session
- [ ] Payment flow completes successfully
- [ ] Booking appears in client dashboard
- [ ] Staff can view their bookings
- [ ] Admin can create new sessions
- [ ] Admin can view analytics

### Test Payment Cards

Use Stripe test cards:
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- 3D Secure: `4000 0027 6000 3184`

## 📝 Common Tasks

### Add a New Service

1. Log in as admin
2. Go to Admin Dashboard → Services tab
3. Click "Create Service"
4. Fill in details and save

### Create a Booking Session

1. Log in as admin
2. Go to Admin Dashboard → Sessions tab
3. Click "Create Session"
4. Select service, instructor, date, and time
5. Save

### Grant Admin Access to a User

```bash
# Connect to your database
psql $DATABASE_URL

# Update user role
UPDATE users SET role = 'admin' WHERE email = 'user@example.com';
```

## 🐛 Troubleshooting

### Database Connection Issues

```bash
# Test connection
psql $DATABASE_URL

# If connection fails, check:
# 1. Firewall rules in Supabase
# 2. Connection string format
# 3. SSL mode (add ?sslmode=require if needed)
```

### Stripe Webhook Errors

1. Check webhook secret matches
2. Verify endpoint is publicly accessible
3. Check webhook event types are correct
4. View webhook logs in Stripe Dashboard

### Authentication Not Working

1. Verify `ISSUER_URL` is correct
2. Check redirect URIs match
3. Ensure session secret is set
4. Clear browser cookies and try again

## 📚 Additional Resources

- [Drizzle ORM Documentation](https://orm.drizzle.team)
- [Stripe API Documentation](https://stripe.com/docs/api)
- [Supabase Documentation](https://supabase.com/docs)
- [React Hook Form](https://react-hook-form.com)
- [Tailwind CSS](https://tailwindcss.com)
- [shadcn/ui Components](https://ui.shadcn.com)

## 📧 Support

For questions or issues, please contact the development team or open an issue in the repository.

## 📄 License

[Your License Here]

---

**Built with ❤️ for Nordic Breath**
