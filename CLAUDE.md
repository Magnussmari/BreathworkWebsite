# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Nordic Breath is a full-stack breathwork session booking platform built with React, Express, PostgreSQL (Supabase), and bank transfer payments (ISK currency). The application supports three user roles: clients (book sessions), staff (instructors), and admins (full management).

## Development Commands

### Start Development Server
```bash
npm run dev
# Runs both frontend and backend on http://localhost:5000
```

### Database Operations
```bash
npm run db:push           # Push schema changes to database
npm run db:studio         # Open Drizzle Studio (visual database manager)
npm run seed              # Seed test data (4 users, services, time slots)
```

### Build & Type Checking
```bash
npm run build             # Build for production
npm run check             # TypeScript type checking
npm run preview           # Preview production build
```

## Architecture & Data Flow

### Critical Pattern: Schema → Storage → Routes → Frontend

1. **Define schema first** in `shared/schema.ts` (Drizzle ORM)
2. **Add storage methods** to `server/storage.ts` interface and implementation
3. **Create API routes** in `server/routes.ts` with validation and auth
4. **Frontend consumes** via React Query hooks

### Key Files

- `shared/schema.ts` - Database schema, types, and Zod validation schemas
- `server/storage.ts` - Database operations interface (all DB access goes through here)
- `server/routes.ts` - Express API routes with authentication and validation
- `server/replitAuth.ts` - OIDC authentication setup
- `client/src/lib/queryClient.ts` - React Query configuration
- `client/src/pages/*` - Application pages by role (client/staff/admin dashboards)

### Database Schema

Tables: `users`, `services`, `instructors`, `availability`, `timeSlots`, `bookings`, `waitlist`, `blockedTimes`, `vouchers`, `sessions` (express-session)

All tables use UUID primary keys generated via `gen_random_uuid()`. Foreign keys reference these UUIDs.

### Authentication Flow

- Uses JWT-based authentication with HTTP-only cookies
- Session tokens signed with `SESSION_SECRET` environment variable
- Protected routes use `isAuthenticated` middleware in `server/supabaseAuth.ts`
- User ID available via `req.user.id` in authenticated routes
- Role-based access: check `user.role` for `'client'`, `'staff'`, or `'admin'`
- Tokens expire after 7 days

## Adding a New Feature

### 1. Database Schema (`shared/schema.ts`)
```typescript
export const newTable = pgTable("new_table", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  // ... fields
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertNewTableSchema = createInsertSchema(newTable).omit({
  id: true,
  createdAt: true
});
export type NewTable = typeof newTable.$inferSelect;
export type InsertNewTable = z.infer<typeof insertNewTableSchema>;
```

Then run: `npm run db:push`

### 2. Storage Layer (`server/storage.ts`)
```typescript
// Add to IStorage interface
export interface IStorage {
  createNewThing(data: InsertNewTable): Promise<NewTable>;
  getNewThing(id: string): Promise<NewTable | undefined>;
}

// Add implementation in Storage class
async createNewThing(data: InsertNewTable): Promise<NewTable> {
  const [item] = await db.insert(newTable).values(data).returning();
  return item;
}
```

### 3. API Routes (`server/routes.ts`)
```typescript
app.post('/api/new-thing', isAuthenticated, async (req: any, res) => {
  try {
    const user = await storage.getUser(req.user.claims.sub);
    if (user?.role !== 'admin') {
      return res.status(403).json({ message: "Admin access required" });
    }

    const validated = insertNewTableSchema.parse(req.body);
    const result = await storage.createNewThing(validated);
    res.json(result);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "Failed to create" });
  }
});
```

### 4. Frontend (React Query)
```typescript
const { data } = useQuery({
  queryKey: ['/api/new-thing'],
});

const mutation = useMutation({
  mutationFn: async (data: InsertNewTable) => {
    await apiRequest("POST", "/api/new-thing", data);
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['/api/new-thing'] });
    toast({ title: "Success" });
  },
});
```

## Critical Rules & Patterns

### Database Changes
- **ALWAYS** use `npm run db:push` after schema changes (never write manual migrations)
- **NEVER** change primary key types (breaks existing data)
- Use `npm run db:studio` to visually inspect database

### Date Handling in Zod
Transform ISO strings to Date objects in schemas:
```typescript
export const insertTimeSlotSchema = createInsertSchema(timeSlots)
  .extend({
    startTime: z.string().or(z.date()).transform(val =>
      typeof val === 'string' ? new Date(val) : val
    ),
  });
```

### Drizzle Joins Return Nested Data
```typescript
const result = await db
  .select()
  .from(bookings)
  .innerJoin(users, eq(bookings.clientId, users.id));

// Access pattern
const booking = result[0];
const bookingData = booking.bookings;  // bookings table data
const userData = booking.users;         // users table data
```

### React Query Cache Keys
Use array format for proper invalidation:
```typescript
// ✅ Correct
queryKey: ['/api/users', userId]

// ❌ Wrong (breaks cache invalidation)
queryKey: [`/api/users/${userId}`]
```

### ISK Currency Handling
Iceland Króna is zero-decimal (no fractional amounts since April 2023):
```typescript
// Always use whole króna
const amountInISK = Math.round(priceInISK); // No decimals
```

### Authorization Pattern
```typescript
app.get('/api/protected', isAuthenticated, async (req: any, res) => {
  const user = await storage.getUser(req.user.claims.sub);

  if (user?.role !== 'admin') {
    return res.status(403).json({ message: "Access denied" });
  }

  // Your logic here
});
```

## Path Aliases

TypeScript and Vite configured with:
- `@/*` → `client/src/*`
- `@shared/*` → `shared/*`
- `@assets/*` → `attached_assets/*`

## Code Style

### TypeScript
- Explicit types for function parameters and return values
- Use Drizzle's `$inferSelect` and `createInsertSchema` from drizzle-zod
- Runtime validation with Zod schemas

### React
- No explicit React imports (Vite handles this)
- Functional components only
- React Query for server state, React Hook Form for forms
- shadcn/ui components for UI

### Naming Conventions
- Tables: plural snake_case (`time_slots`)
- Files: kebab-case (`admin-dashboard.tsx`)
- Components: PascalCase (`BookingFlow`)
- Functions: camelCase (`getUserBookings`)

## Test Data

Run `npm run seed` to create:
- 4 test users (admin, 2 staff, 1 client)
- Test accounts:
  - Admin: `admin@nordicbreath.is`
  - Staff: `sigridur@nordicbreath.is`, `bjorn@nordicbreath.is`
  - Client: `test@example.is`
- 4 breathwork services
- 2 instructor profiles with availability
- 140 time slots across 2 weeks

## Environment Variables

Required in `.env`:
- `DATABASE_URL` - PostgreSQL connection string (Supabase/Neon)
- `SESSION_SECRET` - JWT signing secret (generate with `openssl rand -base64 32`)
- `RESEND_API_KEY` - Email service API key
- `FROM_EMAIL` - Sender email address for notifications
- `SUPABASE_URL` - Supabase project URL (optional)
- `SUPABASE_ANON_KEY` - Supabase anonymous key (optional)

## Common Issues

### Form Not Submitting
Log form errors to debug validation:
```typescript
console.log(form.formState.errors);
```

### 401 Unauthorized Errors
Check:
1. User is logged in (`/api/auth/user`)
2. Route has `isAuthenticated` middleware
3. User role is sufficient
4. Session is valid

### TypeScript Errors
- Check path aliases in `tsconfig.json` match `vite.config.ts`
- Run `npm run check` to see all type errors
- Use Drizzle's inferred types instead of manual types

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS + shadcn/ui
- **Backend**: Express.js + Node.js
- **Database**: PostgreSQL (Supabase) + Drizzle ORM
- **Authentication**: JWT tokens with bcrypt password hashing
- **Payments**: Bank transfer (ISK currency)
- **Email**: Resend API
- **State Management**: TanStack Query (React Query)
- **Forms**: React Hook Form + Zod validation
- **Routing**: Wouter (lightweight React router)
