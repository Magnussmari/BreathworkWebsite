# Nordic Breath - Breathwork Booking Platform

A comprehensive booking platform for a breathwork company in Iceland featuring authentication, scheduling, payment processing, and role-based dashboards.

## 🚀 Features

### For Clients
- Browse breathwork class templates and schedules
- Register for classes with one-click booking
- View upcoming and past class registrations
- Cancel registrations (24-hour policy)
- Pay at door or via Stripe *(coming soon)*
- Receive class reminders and updates

### For Admins
- Create and manage class templates (9D Breathwork, etc.)
- Schedule classes with date, time, location, capacity
- View and manage all registrations
- Revenue analytics and attendance tracking *(in development)*
- Bulk class creation and management

### Upcoming Features
- 💳 **Stripe Payment Integration**: Online payment processing with ISK support
- 💬 **Slack Messaging**: In-app messaging for users and notifications
- 📧 **Email Notifications**: Automated reminders, confirmations, and updates
- 📊 **Advanced Analytics**: Revenue tracking, popular class times, attendance trends
- ⏰ **Waitlist System**: Auto-notify and book when spots open up

## 🛠 Tech Stack

### Core Technologies
- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Express.js + Node.js
- **Database**: PostgreSQL (Supabase) + Drizzle ORM
- **Authentication**: Supabase Auth (email/password + bcrypt)
- **Routing**: Wouter (lightweight React router)

### UI & Styling
- **CSS Framework**: Tailwind CSS
- **Component Library**: shadcn/ui (Radix UI primitives)
- **Icons**: Lucide React
- **Animations**: Framer Motion + tailwindcss-animate

### State & Forms
- **State Management**: TanStack Query (React Query)
- **Forms**: React Hook Form + Zod validation
- **Date Handling**: date-fns

### Payments & Integrations (In Progress)
- **Payments**: Stripe (ISK currency, zero-decimal) - *Implementation pending*
- **Messaging**: Slack API integration - *Planning phase*
- **Email**: To be determined (SendGrid/Resend/AWS SES)

### Development Tools
- **Build Tool**: Vite
- **Package Manager**: npm
- **TypeScript**: 5.6.3
- **Database Migrations**: Drizzle Kit
- **Code Quality**: ESLint + Prettier (recommended)

## 📋 Prerequisites

- Node.js 20.x or higher
- PostgreSQL database (Supabase)
- Stripe account (for payments)
- Admin account credentials (see setup below)

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
# Database Configuration (Supabase)
# IMPORTANT: Use Transaction mode pooler (port 6543) for runtime
DATABASE_URL=postgresql://postgres.PROJECT_REF:PASSWORD@aws-1-REGION.pooler.supabase.com:6543/postgres

# Supabase Configuration (for project metadata)
SUPABASE_URL=https://PROJECT_REF.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key

# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
VITE_STRIPE_PUBLIC_KEY=pk_test_your_stripe_publishable_key

# Application Configuration
NODE_ENV=development
PORT=3000
```

**Important Notes:**
- Use **Transaction mode pooler** (port `6543`) for `DATABASE_URL` - required for Neon serverless driver
- For migrations (`npm run db:push`), the pooler URL works fine
- Password in URL must be **URL-encoded** (e.g., `!` becomes `%21`)

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

### 6. Initialize Application

Run the setup script to configure the default template and superuser:

```bash
node scripts/setup-breathwork.js
```

This will:
- Set `maggismari@gmail.com` as superuser
- Create the default "9D Breathwork Session" template
- Configure initial application settings

**Alternative: Create Admin Manually**

```bash
node scripts/create-admin.js
```

Or update via database:

```sql
UPDATE users SET role = 'admin' WHERE email = 'your@email.com';
```

### 7. Create Test Classes (Optional)

Generate test classes for development:

```bash
node scripts/create-test-class.js
```

This creates sample scheduled classes based on the default template.

### 8. Run Development Server

```bash
npm run dev
```

The application will be available at **`http://localhost:3000`**

**Quick Test:**
1. Visit http://localhost:3000
2. Click "Login to Book Session"
3. Login with admin credentials
4. You should see the authenticated home page with navbar

## 🗄 Database Schema

### Class-Based System (Current)

- **users**: Client and admin accounts with password hashing (bcrypt)
- **classTemplates**: Class types (9D Breathwork, etc.) with pricing and duration
- **classes**: Scheduled class instances with date, location, capacity
- **registrations**: Client bookings with payment and attendance tracking

### Legacy System (For Migration)

- **services**: Breathwork session offerings *(deprecated)*
- **instructors**: Staff member profiles *(to be integrated)*
- **availability**: Instructor weekly schedules *(legacy)*
- **timeSlots**: Specific bookable slots *(legacy)*
- **bookings**: Old reservation system *(being migrated)*
- **waitlist**: Queue for fully booked sessions
- **vouchers**: Discount codes and promotions

**Authentication:**
- Email/password authentication with bcrypt (10 rounds)
- HTTP-only cookie sessions (7-day expiration)
- Secure session management with token-based auth

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

## 🔐 Authentication

This application uses **email/password authentication** with industry-standard security:

### Security Features
- ✅ **bcrypt password hashing** (10 rounds, auto-salted)
- ✅ **HttpOnly cookies** (prevents XSS attacks)
- ✅ **SameSite=lax** (CSRF protection)
- ✅ **7-day session expiration** with auto-cleanup
- ✅ **In-memory session store** (migrate to Redis for production)

### User Roles

The application supports three roles:
- **client** (default): Can register, book sessions, and manage their bookings
- **staff**: Can view and manage their assigned bookings, update availability
- **admin**: Full access to all features including analytics and user management

### Registration Flow
1. User fills out registration form at `/register`
2. Password is hashed with bcrypt (never stored in plain text)
3. Session cookie is created automatically
4. User is redirected to authenticated home page

### Login Flow
1. User enters email/password at `/login`
2. Server verifies password against bcrypt hash
3. Session token stored in httpOnly cookie
4. User redirected to role-appropriate dashboard

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
│   ├── db.ts              # Database connection (Neon serverless)
│   ├── supabaseAuth.ts    # Authentication middleware
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

### Development
```bash
npm run dev              # Start development server (frontend + backend on port 3000)
npm run check            # TypeScript type checking
```

### Database
```bash
npm run db:push          # Push schema changes to database
```

### Build & Deploy
```bash
npm run build            # Build for production (Vite + esbuild)
npm run start            # Start production server
npm run preview          # Preview production build locally
```

### Utility Scripts
```bash
node scripts/setup-breathwork.js    # Initialize app with default template
node scripts/create-admin.js        # Create/update admin user
node scripts/create-test-class.js   # Generate test classes
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

- [x] User can register new account
- [x] User can login with email/password
- [x] User can logout
- [x] Session persists across page refreshes
- [x] Admin can access admin dashboard
- [ ] Client can browse services
- [ ] Client can book a session
- [ ] Payment flow completes successfully
- [ ] Booking appears in client dashboard
- [ ] Staff can view their bookings
- [ ] Admin can create new time slots

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

1. Check `DATABASE_URL` is using **Transaction mode pooler** (port 6543)
2. Verify password is URL-encoded in connection string
3. Check server logs for database connection errors
4. Clear browser cookies and try again
5. Ensure admin user exists in database

### Port Already in Use

```bash
# macOS uses port 5000 for AirPlay - use port 3000 instead
lsof -ti:3000 | xargs kill -9
```

### Database Connection Errors

```bash
# Common issues:
# 1. Using direct connection instead of pooler (must use port 6543)
# 2. Password not URL-encoded (! should be %21)
# 3. Wrong region in connection string
# 4. Supabase project paused (check dashboard)
```

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
