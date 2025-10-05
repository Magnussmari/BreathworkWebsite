# Breathwork - 9D Öndun Booking Platform

A full-stack breathwork session booking platform built for Nordic Breath Iceland.

## 🚀 Live Production

**Live URL:** https://breathwork.vercel.app

## Tech Stack

- **Frontend:** React 18 + TypeScript + Vite + Tailwind CSS + shadcn/ui
- **Backend:** Express.js + Vercel Serverless Functions
- **Database:** PostgreSQL (Supabase) + Drizzle ORM
- **Payments:** Stripe (ISK currency)
- **Email:** Resend
- **Auth:** JWT session-based authentication
- **Deployment:** Vercel

## Quick Start

```bash
# Install dependencies
npm install

# Run database migrations
npm run db:push

# Start development server
npm run dev
```

Visit http://localhost:5000

## Environment Variables

Required variables (see `.env.example`):

```
DATABASE_URL=          # Supabase PostgreSQL connection
SUPABASE_URL=         # Supabase project URL  
SUPABASE_ANON_KEY=    # Supabase anonymous key
RESEND_API_KEY=       # Resend email API key
FROM_EMAIL=           # From email address
SESSION_SECRET=       # JWT session secret
NODE_ENV=             # Environment (development/production)
```

## Project Structure

```
├── client/           # React frontend
│   ├── src/
│   │   ├── pages/   # Route pages
│   │   ├── components/ # Reusable components
│   │   └── lib/     # Utilities & config
├── server/          # Express backend
│   ├── routes.ts    # API routes
│   ├── storage.ts   # Database layer
│   └── supabaseAuth.ts # Authentication
├── shared/          # Shared types & schemas
│   └── schema.ts    # Drizzle schema & Zod validation
└── api/             # Vercel serverless functions
    ├── health.js
    └── auth/
        ├── login.js
        ├── register.js
        └── user.js
```

## Key Features

- **User Roles:** Client, Staff (Instructor), Admin
- **Booking System:** 5-minute reservation window with Stripe payment
- **Waitlist:** Automatic notification when slots open
- **Email Confirmations:** Automated booking confirmations via Resend
- **Admin Dashboard:** User management, class scheduling, bookings
- **Responsive Design:** Mobile-first Icelandic UI

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/user` - Get current user
- `POST /api/auth/logout` - User logout

### Classes
- `GET /api/classes/upcoming` - List upcoming classes
- `GET /api/classes/:id` - Get class details
- `POST /api/classes` - Create class (admin)

### Bookings
- `POST /api/bookings` - Create booking reservation
- `GET /api/bookings/:id` - Get booking details
- `DELETE /api/bookings/:id` - Cancel booking

## Documentation

- [Security Audit](./SECURITY_AUDIT.md)
- [Deployment Guide](./docs/devday/devday051025-deployment.md)
- [Development Logs](./docs/devday/)

## License

Private - All Rights Reserved
