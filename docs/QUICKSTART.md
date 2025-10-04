# Quick Start Guide

## ✅ Migration Complete!

Your breathwork booking app has been successfully migrated from Replit Auth to Supabase with email/password authentication.

## 🚀 Running the App

The server is currently running at: **http://localhost:3000**

### Admin Login Credentials:
- **Email**: maggismari@gmail.com
- **Password**: password1234 (change this after first login!)
- **Role**: admin

## 📝 What Was Done

### Backend (100% Complete)
- ✅ Removed Replit Auth completely
- ✅ Implemented email/password authentication with bcrypt
- ✅ Updated all 30+ API routes
- ✅ Connected to Supabase database (eu-north-1)
- ✅ Created admin user account
- ✅ Tested authentication flow successfully

### API Endpoints Working:
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login with email/password
- `POST /api/auth/logout` - Logout
- `GET /api/auth/user` - Get current user (authenticated)
- All other existing routes updated for new auth

## 🔧 Configuration

### Environment Variables (.env):
```env
DATABASE_URL=postgresql://postgres.jwixnfnbinqsrqjlfdet:HVYYoo5q1985%21@aws-1-eu-north-1.pooler.supabase.com:6543/postgres
SUPABASE_URL=https://jwixnfnbinqsrqjlfdet.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
STRIPE_SECRET_KEY=sk_test_...
VITE_STRIPE_PUBLIC_KEY=pk_test_...
NODE_ENV=development
PORT=3000
```

### Server Port Changed:
- **Before**: 5000 (conflicted with macOS AirPlay)
- **After**: 3000

## 🧪 Test the API

### Login Test:
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"maggismari@gmail.com","password":"password1234"}' \
  -c cookies.txt
```

### Get User Profile:
```bash
curl http://localhost:3000/api/auth/user -b cookies.txt
```

## 📋 Next Steps (Frontend)

The backend is complete, but the frontend still needs updates:

1. **Create Login Page** (`client/src/pages/login.tsx`)
   - Email/password form
   - Call POST `/api/auth/login`
   - Store session cookie

2. **Create Register Page** (`client/src/pages/register.tsx`)
   - Registration form
   - Call POST `/api/auth/register`

3. **Update Auth Context** (`client/src/lib/auth-context.tsx` or similar)
   - Remove Replit Auth code
   - Use cookie-based sessions
   - Call GET `/api/auth/user` to check authentication

4. **Update Navigation**
   - Show login/logout based on auth state
   - Redirect to login if not authenticated

## 📁 Important Files

### Backend:
- `server/supabaseAuth.ts` - Authentication middleware
- `server/routes.ts` - All API routes
- `server/storage.ts` - Database operations
- `shared/schema.ts` - Database schema

### Scripts:
- `create-admin.js` - Create admin users
- `npm run dev` - Start development server
- `npm run db:push` - Push schema changes

### Documentation:
- `devday031025.md` - Full migration log
- `MIGRATION_STATUS.md` - Detailed status
- `get-db-url.md` - Database connection help

## 🐛 Troubleshooting

### Port Already in Use:
If you get "EADDRINUSE" error, change PORT in `.env`

### Database Connection Failed:
Check `DATABASE_URL` matches your Supabase dashboard settings

### Authentication Not Working:
1. Clear cookies
2. Check server logs for errors
3. Verify user exists in database

## 🎯 Production Checklist

Before deploying:
- [ ] Change admin password from default
- [ ] Update SESSION_SECRET to secure random value
- [ ] Switch to Redis for session storage (not in-memory)
- [ ] Set up Stripe webhooks
- [ ] Configure CORS properly
- [ ] Enable HTTPS only cookies
- [ ] Set up database backups
- [ ] Update SUPABASE_ANON_KEY if needed

## 💾 Database

Your Supabase database includes:
- **users** table with passwordHash field
- **Admin user**: maggismari@gmail.com (ID: 83c3d453-d0b8-4a83-a855-1d200ab90557)
- All existing tables (services, bookings, instructors, etc.)

## 🔐 Security Notes

- Passwords hashed with bcrypt (10 rounds)
- Sessions stored in-memory (7-day expiration)
- HttpOnly cookies (XSS protection)
- SameSite=lax (CSRF protection)
- Password hash never sent to client

## 📞 Support

See detailed logs in `devday031025.md` for step-by-step migration process.

---

**Status**: Backend migration complete ✅
**Server**: Running at http://localhost:3000
**Admin**: maggismari@gmail.com / password1234
