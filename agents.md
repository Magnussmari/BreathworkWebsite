# Agent Development Guide for Nordic Breath

This document provides guidance for AI coding agents (like Cursor, Continue, Cody, Replit Agent) working on the Nordic Breath booking platform.

## 🎯 Project Overview

Nordic Breath is a full-stack TypeScript application for breathwork session booking with Stripe payments, Replit Auth, and PostgreSQL database. The architecture follows modern best practices with React frontend, Express backend, and Drizzle ORM.

## 🏗 Architecture Principles

### Data Flow
1. **Schema First**: Always define or update `shared/schema.ts` before touching storage or routes
2. **Storage Layer**: All database operations go through `server/storage.ts` interface
3. **API Routes**: Keep `server/routes.ts` thin - validation and delegation only
4. **Frontend**: React Query manages server state; React Hook Form handles forms

### Key Patterns
- **Type Safety**: Leverage Drizzle's `$inferSelect` and `createInsertSchema` from drizzle-zod
- **Validation**: Use Zod schemas for all API inputs
- **Authorization**: Always check user role before protected operations
- **Error Handling**: Use try-catch in routes; surface errors to frontend via toast

## 📋 Common Tasks & Patterns

### Adding a New Feature

1. **Define Database Schema** (`shared/schema.ts`)
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
export type InsertNewTable = z.infer<typeof insertNewTableSchema>;
```

2. **Update Storage Interface** (`server/storage.ts`)
```typescript
// Interface
export interface IStorage {
  createNewThing(data: InsertNewTable): Promise<NewTable>;
  getNewThing(id: string): Promise<NewTable | undefined>;
  // ... other methods
}

// Implementation
async createNewThing(data: InsertNewTable): Promise<NewTable> {
  const [item] = await db.insert(newTable).values(data).returning();
  return item;
}
```

3. **Add API Routes** (`server/routes.ts`)
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

4. **Frontend Implementation**
```typescript
// Query
const { data, isLoading } = useQuery({
  queryKey: ['/api/new-thing'],
});

// Mutation
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

### Database Changes

**CRITICAL RULES:**
1. ✅ **Use `npm run db:push`** to sync schema changes
2. ✅ **Never manually write SQL migrations**
3. ✅ **Always check existing database before changing ID types**
4. ❌ **Never change primary key types** (serial ↔ varchar breaks data)

```bash
# After modifying shared/schema.ts
npm run db:push

# If that fails (rare):
npm run db:push --force

# View your database:
npm run db:studio
```

### Adding Authentication to Routes

All protected routes must use `isAuthenticated` middleware:

```typescript
app.get('/api/protected', isAuthenticated, async (req: any, res) => {
  // req.user.claims.sub contains the user ID from OIDC
  const user = await storage.getUser(req.user.claims.sub);
  
  // Role-based access control
  if (user?.role !== 'admin') {
    return res.status(403).json({ message: "Access denied" });
  }
  
  // Your logic here
});
```

### Working with Drizzle Joins

Drizzle returns joined data with nested table names:

```typescript
// Query with join
const result = await db
  .select()
  .from(bookings)
  .innerJoin(users, eq(bookings.clientId, users.id))
  .where(eq(bookings.id, id));

// Access pattern (note the nested structure)
const booking = result[0];
const bookingData = booking.bookings;  // Data from bookings table
const userData = booking.users;        // Data from users table
```

**Frontend defensive pattern** (handles both camelCase and snake_case):
```typescript
const clientName = booking.users?.firstName || booking.users?.first_name || 'Unknown';
```

## 🚨 Common Pitfalls & Solutions

### Issue: Date Handling in Zod Schemas

**Problem**: Sending ISO strings to backend expecting Date objects

**Solution**: Transform in schema
```typescript
export const insertTimeSlotSchema = createInsertSchema(timeSlots)
  .omit({ id: true, createdAt: true })
  .extend({
    startTime: z.string().or(z.date()).transform(val => 
      typeof val === 'string' ? new Date(val) : val
    ),
  });
```

### Issue: Query Keys for Cache Invalidation

**Problem**: Using string interpolation breaks cache invalidation

❌ **Wrong:**
```typescript
queryKey: [`/api/users/${userId}`]
```

✅ **Correct:**
```typescript
queryKey: ['/api/users', userId]
```

### Issue: ISK Currency in Stripe

**Problem**: Fractional amounts (e.g., 4500.50 ISK)

✅ **Solution**: Always use whole króna
```typescript
const amountInISK = Math.round(priceInISK); // No decimals
```

### Issue: Form Not Submitting

**Debug**: Log form errors
```typescript
const form = useForm({ ... });

// Add this to see validation errors
console.log(form.formState.errors);
```

### Issue: Unauthorized Errors (401)

**Check:**
1. User is logged in (check `/api/auth/user`)
2. Route has `isAuthenticated` middleware
3. User role is sufficient for the operation
4. Session is valid and not expired

## 🔍 Debugging Guide

### Backend Debugging

1. **Check Server Logs**: Look for route errors and validation failures
2. **Database Queries**: Use `console.log()` before DB calls
3. **Middleware Chain**: Ensure `isAuthenticated` is properly applied

```typescript
app.get('/api/test', isAuthenticated, async (req: any, res) => {
  console.log('User ID:', req.user.claims.sub);
  console.log('Request body:', req.body);
  // ... rest of logic
});
```

### Frontend Debugging

1. **React Query Devtools**: Check query status and data
2. **Network Tab**: Inspect request/response
3. **Form State**: Log `formState.errors` for validation issues

```typescript
// Enable query devtools
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

<QueryClientProvider client={queryClient}>
  <App />
  <ReactQueryDevtools />
</QueryClientProvider>
```

### Database Debugging

```bash
# Open Drizzle Studio
npm run db:studio

# Connect via psql
psql $DATABASE_URL

# Check table structure
\d+ table_name

# View recent bookings
SELECT * FROM bookings ORDER BY created_at DESC LIMIT 10;
```

## 📝 Code Style Guidelines

### TypeScript
- Use explicit types for function parameters and return values
- Leverage Drizzle's inferred types (`typeof table.$inferSelect`)
- Use Zod for runtime validation

### React
- **No explicit React imports** (Vite handles this)
- Functional components only
- Use hooks for state management
- Add `data-testid` to all interactive elements

### Naming Conventions
- **Tables**: plural snake_case (`time_slots`)
- **Files**: kebab-case (`admin-dashboard.tsx`)
- **Components**: PascalCase (`BookingFlow`)
- **Functions**: camelCase (`getUserBookings`)
- **Constants**: UPPER_SNAKE_CASE (`STRIPE_SECRET_KEY`)

## 🧪 Testing Checklist

Before marking a feature complete:

- [ ] Backend route returns expected data structure
- [ ] Frontend displays data correctly
- [ ] Form validation works (client and server-side)
- [ ] Error states are handled (loading, error messages)
- [ ] Authorization checks prevent unauthorized access
- [ ] Database queries are efficient (no N+1 problems)
- [ ] TypeScript compiles without errors
- [ ] Data-testid attributes added to interactive elements

## 🚀 Deployment Checklist

- [ ] Environment variables set correctly
- [ ] Database schema pushed (`npm run db:push`)
- [ ] Stripe webhooks configured
- [ ] OIDC redirect URIs updated
- [ ] ISK amounts are whole numbers
- [ ] Error logging enabled
- [ ] SSL/TLS certificates configured

## 📚 Quick Reference

### Essential Files
- `shared/schema.ts` - Database schema and types
- `server/storage.ts` - Database operations interface
- `server/routes.ts` - API endpoints
- `client/src/lib/queryClient.ts` - React Query setup
- `client/src/pages/*` - Application pages

### Environment Variables
- `DATABASE_URL` - PostgreSQL connection
- `STRIPE_SECRET_KEY` - Stripe API key
- `VITE_STRIPE_PUBLIC_KEY` - Stripe public key (frontend)
- `SESSION_SECRET` - Session encryption key
- `REPL_ID`, `REPLIT_DOMAINS` - Replit Auth config

### Key Packages
- `drizzle-orm` - Database ORM
- `drizzle-zod` - Zod schema generation
- `@tanstack/react-query` - Server state management
- `react-hook-form` - Form handling
- `zod` - Runtime validation
- `wouter` - Routing (frontend)
- `stripe` - Payment processing

## 🤖 Agent-Specific Tips

### For Cursor/Continue
- Use `Ctrl/Cmd+K` to ask about specific code sections
- Reference `shared/schema.ts` when writing queries
- Check `server/storage.ts` for available methods before adding new ones

### For Replit Agent
- Project uses Replit Auth (already configured)
- Database push is automatic when schema changes
- Use Secrets tab for environment variables

### For Cody
- Codebase context is crucial - always read existing patterns
- Follow the established data flow: schema → storage → routes → frontend
- Check similar features for consistency

## 🔄 Git Workflow

```bash
# Before starting work
git pull origin main

# Create feature branch
git checkout -b feature/your-feature-name

# Make changes, test thoroughly

# Commit with descriptive message
git add .
git commit -m "feat: add session rescheduling functionality"

# Push and create PR
git push origin feature/your-feature-name
```

### Commit Message Format
- `feat:` - New feature
- `fix:` - Bug fix
- `refactor:` - Code restructuring
- `docs:` - Documentation changes
- `style:` - Formatting changes
- `test:` - Adding tests
- `chore:` - Maintenance tasks

## 💡 Pro Tips

1. **Always read existing code** before implementing similar features
2. **Use TypeScript errors as guides** - they often point to missing implementations
3. **Test with real data** - seed script provides realistic test scenarios
4. **Check both frontend and backend logs** when debugging
5. **Use Drizzle Studio** to inspect database state visually
6. **Follow the data flow** - understand how data moves through the system
7. **Keep routes thin** - business logic belongs in storage layer
8. **Validate early** - catch bad data at the API boundary

## 📖 Additional Reading

- Project README.md - Setup and deployment instructions
- replit.md - Current project state and recent changes
- Drizzle ORM docs - https://orm.drizzle.team
- React Query docs - https://tanstack.com/query
- Stripe ISK guide - Handle zero-decimal currency properly

---

**Remember**: This is a production application handling real payments. Always prioritize data integrity, security, and user experience. When in doubt, ask for clarification rather than making assumptions.
