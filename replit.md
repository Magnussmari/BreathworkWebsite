# Nordic Breath - Breathwork Booking Platform

## Overview
A comprehensive booking platform for a breathwork company in Iceland featuring authentication, scheduling, payment processing, and role-based dashboards.

## Tech Stack
- **Frontend**: React + TypeScript + Vite + Tailwind CSS + shadcn/ui
- **Backend**: Express.js + PostgreSQL (Supabase)
- **Authentication**: Replit Auth (OIDC)
- **Payments**: Stripe (ISK currency support)
- **Database ORM**: Drizzle ORM

## Project Structure
```
├── client/src/          # React frontend
│   ├── pages/          # Application pages
│   ├── components/     # Reusable components
│   ├── hooks/          # Custom React hooks
│   └── lib/            # Utilities and configs
├── server/             # Express backend
│   ├── routes.ts       # API endpoints
│   ├── storage.ts      # Database interface
│   ├── db.ts           # Database connection
│   ├── replitAuth.ts   # Authentication setup
│   └── seed.ts         # Test data seeding
└── shared/             # Shared types and schemas
    └── schema.ts       # Drizzle database schema
```

## Database Schema
- **users**: Client, staff, and admin accounts
- **services**: Breathwork session offerings
- **instructors**: Staff member profiles with bios and certifications
- **availability**: Instructor weekly schedule templates
- **timeSlots**: Specific bookable time slots
- **bookings**: Client reservations and payments
- **waitlist**: Queue for fully booked sessions
- **blockedTimes**: Holidays and instructor unavailability
- **vouchers**: Discount codes and promotions

## Key Features

### Authentication (Replit Auth)
- Multi-provider login (Google, GitHub, etc.)
- Role-based access control (client, staff, admin)
- Session persistence with PostgreSQL store
- Endpoints: `/api/login`, `/api/callback`, `/api/logout`, `/api/auth/user`

### Booking Flow (4-step process)
1. Service selection from catalog
2. Date and time selection with availability checking
3. Instructor selection (optional - can be auto-assigned)
4. Client information form with custom fields
5. Stripe payment checkout

### Payment Integration
- Stripe Checkout Session with ISK currency
- Support for credit cards, Apple Pay, Google Pay
- Full payment required during booking
- Payment status tracking (pending, paid, refunded)

### Client Dashboard
- View upcoming and past bookings
- Cancel bookings (24-hour policy)
- Download/view booking confirmations
- Rebook cancelled sessions

### Staff Dashboard
- View assigned bookings
- Confirm pending bookings
- Manage personal availability
- View instructor profile

### Admin Dashboard
- Service management (create, edit, delete, activate/deactivate)
- Revenue analytics and booking statistics
- Manage all bookings across all instructors
- View system-wide metrics

## Routes

### Public Routes
- `/` - Landing page (unauthenticated) or Home (authenticated)

### Authenticated Routes
- `/` - Home page with quick actions
- `/booking` - Multi-step booking flow
- `/checkout` - Stripe payment page
- `/services` - Service catalog
- `/instructors` - Instructor profiles
- `/dashboard` - Client bookings dashboard

### Role-Specific Routes
- `/staff` - Staff dashboard (staff only)
- `/admin` - Admin dashboard (admin only)

## API Endpoints

### Authentication
- `GET /api/login` - Initiate Replit Auth login
- `GET /api/callback` - OAuth callback
- `GET /api/logout` - End session
- `GET /api/auth/user` - Get current user

### Services
- `GET /api/services` - List all active services
- `POST /api/services` - Create service (admin)
- `PATCH /api/services/:id` - Update service (admin)
- `DELETE /api/services/:id` - Delete service (admin)

### Instructors
- `GET /api/instructors` - List all instructors

### Time Slots
- `GET /api/time-slots` - Get available slots (with filters)

### Bookings
- `GET /api/bookings` - Get user bookings
- `POST /api/bookings` - Create booking
- `PATCH /api/bookings/:id/cancel` - Cancel booking
- `PATCH /api/bookings/:id/confirm` - Confirm booking (staff/admin)

### Payments
- `POST /api/payments/create-checkout-session` - Create Stripe session
- `POST /api/payments/webhook` - Stripe webhook handler

### Analytics (Admin)
- `GET /api/analytics/revenue` - Revenue statistics
- `GET /api/analytics/bookings` - Booking metrics

## Test Data
Run `tsx server/seed.ts` to populate the database with:

### Test Users
- **Admin**: admin@nordicbreath.is (role: admin)
- **Staff 1**: sigridur@nordicbreath.is (role: staff, instructor)
- **Staff 2**: bjorn@nordicbreath.is (role: staff, instructor)
- **Client**: test@example.is (role: client)

### Services
1. Introduction to Breathwork (60 min, 4,500 ISK)
2. Deep Healing Breathwork (90 min, 7,900 ISK)
3. Private One-on-One Session (90 min, 12,500 ISK)
4. Weekend Breathwork Retreat (480 min, 45,000 ISK)

### Availability
- Sigríður: Monday-Friday, 9:00-17:00
- Björn: Monday-Friday, 10:00-18:00

### Time Slots
140 slots created for next 7 weekdays at 9 AM, 11 AM, 2 PM, and 4 PM

## Environment Variables
- `DATABASE_URL` - PostgreSQL connection string
- `SESSION_SECRET` - Express session encryption key
- `STRIPE_SECRET_KEY` - Stripe API secret key
- `VITE_STRIPE_PUBLIC_KEY` - Stripe publishable key (frontend)
- `REPL_ID` - Replit workspace ID (auto-provided)
- `REPLIT_DOMAINS` - Replit domains (auto-provided)
- `ISSUER_URL` - OIDC issuer (defaults to https://replit.com/oidc)

## Running the Application
```bash
npm run dev  # Starts both frontend and backend on port 5000
```

The workflow "Start application" runs this command automatically.

## Recent Changes (2025-10-03)
- Created comprehensive MVP with all core features
- Implemented Replit Auth integration
- Set up Stripe payment processing
- Built role-based dashboards for client, staff, and admin
- Created database seed script for reliable test data
- All 4 services created with proper pricing in ISK
- 2 instructors with weekly availability schedules
- 140 time slots generated for next 7 business days

## Known Issues
None currently identified.

## Next Steps
- Test MVP features end-to-end
- Verify authentication flow
- Test complete booking and payment process
- Validate dashboard functionality for all roles
