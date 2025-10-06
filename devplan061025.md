# Development Plan - Class Registration System Fix
**Date**: October 6, 2025
**Issue**: Classes created by admin don't appear on frontend (localhost vs Vercel deployment mismatch)

## Root Cause Analysis

### Problem Summary
There is a **route pattern mismatch** between the Express server (localhost) and Vercel serverless functions:

- **Frontend** calls: `/api/classes?type=upcoming` and `/api/classes?type=all` (query parameter pattern)
- **Express server** (`server/routes.ts`) defines: `/api/classes/upcoming` and `/api/classes/all` (path-based pattern)
- **Vercel serverless** (`api/classes/index.js`) correctly handles: `/api/classes?type=upcoming` (query parameter pattern)

### Why This Happened
The Vercel serverless function was recently created to work with the free tier deployment, using `req.query.type` to handle different request types. However, the main Express server was not updated to match this pattern, causing:
- ✅ **Vercel deployment works** - serverless function handles query params correctly
- ❌ **Localhost fails** - Express returns HTML instead of JSON because routes don't match

### Evidence
1. Database has classes (verified: 1 class exists with ID `0668a67a-f994-4923-bbb6-bbd21365d115`)
2. Direct route test: `GET /api/classes/upcoming` → ✅ Returns JSON with class data
3. Query param test: `GET /api/classes?type=upcoming` → ❌ Returns HTML (route not found)
4. Frontend uses query param pattern in 3 files

## Affected Files

### Backend
- ❌ `server/routes.ts` - Lines 642, 698, 708, 721 (path-based routes)
- ✅ `api/classes/index.js` - Already correct (query parameter routes)

### Frontend
- `client/src/pages/classes-landing.tsx` - Line 17
- `client/src/pages/admin-dashboard.tsx` - Lines 110, 330-331
- `client/src/pages/client-dashboard.tsx` - Uses `/api/classes?type=upcoming`

## Implementation Plan

### Step 1: Update Express Server Routes (server/routes.ts)
**Objective**: Make localhost match Vercel deployment behavior by handling query parameters

**Current Code** (Lines 642-719):
```typescript
// Separate path-based routes
app.get('/api/classes/all', isAuthenticated, async (req: AuthRequest, res) => { ... });
app.get('/api/classes/upcoming', async (req, res) => { ... });
app.get('/api/classes/:id', async (req, res) => { ... });
app.get('/api/classes/:id/registrations', isAuthenticated, async (req: AuthRequest, res) => { ... });
```

**New Code** (Based on Express.js documentation - `req.query` is a getter for query parameters):
```typescript
// Single route handler with query parameter support (matches Vercel pattern)
app.get('/api/classes', async (req, res) => {
  try {
    const { type } = req.query;

    // GET /api/classes?type=upcoming - Public upcoming classes
    if (type === 'upcoming') {
      const classes = await storage.getUpcomingClasses();
      return res.json(classes);
    }

    // GET /api/classes?type=all - Admin all classes
    if (type === 'all') {
      const user = await storage.getUser(req.user?.id);
      if (!user || !isAdminOrSuperuser(user)) {
        return res.status(403).json({ message: "Admin access required" });
      }
      const classes = await storage.getAllClasses();
      return res.json(classes);
    }

    // Default: upcoming classes
    const classes = await storage.getUpcomingClasses();
    return res.json(classes);
  } catch (error) {
    console.error("Classes error:", error);
    res.status(500).json({ message: "Failed to fetch classes" });
  }
});

// Keep specific ID routes separate (after the query param route)
app.get('/api/classes/:id', async (req, res) => {
  try {
    const classItem = await storage.getClass(req.params.id);
    if (!classItem) {
      return res.status(404).json({ message: "Class not found" });
    }
    res.json(classItem);
  } catch (error) {
    console.error("Fetch class error:", error);
    res.status(500).json({ message: "Failed to fetch class" });
  }
});

app.get('/api/classes/:id/registrations', isAuthenticated, async (req: AuthRequest, res) => {
  try {
    const user = await storage.getUser(req.user!.id);
    if (!user || !isAdminOrSuperuser(user)) {
      return res.status(403).json({ message: "Admin access required" });
    }
    const registrations = await storage.getClassRegistrations(req.params.id);
    res.json(registrations);
  } catch (error) {
    console.error("Fetch registrations error:", error);
    res.status(500).json({ message: "Failed to fetch registrations" });
  }
});
```

**Why This Works**:
- Express.js `req.query` automatically parses query parameters (e.g., `?type=upcoming` → `req.query.type === 'upcoming'`)
- Route order matters: `/api/classes` with query params must come before `/api/classes/:id`
- Authentication handling moved inside the route for conditional logic

### Step 2: Update POST Route for Class Creation (server/routes.ts)
**Objective**: Ensure POST route also follows the same pattern

**Find the POST route** (should be around line 750+):
```typescript
app.post('/api/classes', isAuthenticated, async (req: AuthRequest, res) => {
  try {
    const user = await storage.getUser(req.user!.id);
    if (!user || !isAdminOrSuperuser(user)) {
      return res.status(403).json({ message: "Admin access required" });
    }

    const validated = insertClassSchema.parse(req.body);
    const newClass = await storage.createClass(validated);
    res.json(newClass);
  } catch (error) {
    console.error("Create class error:", error);
    res.status(500).json({ message: "Failed to create class" });
  }
});
```

**No changes needed** - POST route is already correct.

### Step 3: Verify React Query Cache Invalidation (client/src/pages/admin-dashboard.tsx)
**Objective**: Ensure cache invalidation works correctly after creating a class

**Current Code** (Lines 330-331):
```typescript
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ['/api/classes?type=all'] });
  queryClient.invalidateQueries({ queryKey: ['/api/classes?type=upcoming'] });
  setClassDialogOpen(false);
  classForm.reset();
  toast({ title: "Class Created", description: "The breathwork class has been scheduled successfully." });
},
```

**Analysis**: Based on TanStack Query documentation, the `invalidateQueries` with `queryKey` uses **prefix matching** by default. The current implementation is correct and will invalidate all queries starting with those keys.

**No changes needed** - Cache invalidation is already correct.

### Step 4: Testing Plan

#### Local Testing (Port 3000)
1. **Start dev server**: `npm run dev`
2. **Test GET endpoints**:
   ```bash
   # Should return JSON with classes
   curl http://localhost:3000/api/classes?type=upcoming
   curl http://localhost:3000/api/classes?type=all
   curl http://localhost:3000/api/classes
   ```
3. **Test in browser**:
   - Navigate to `http://localhost:3000/classes`
   - Verify classes appear on landing page
   - Login as admin
   - Create a new class
   - Verify it appears immediately on frontend

#### Vercel Deployment Testing
1. **Deploy changes**: `git push origin main`
2. **Test production**:
   - Navigate to production URL
   - Verify classes still appear (should continue working)
   - Create a new class as admin
   - Verify it appears on frontend

### Step 5: Optional Cleanup (Future Consideration)

Since both localhost and Vercel now handle the same pattern, consider:
- Removing duplicate serverless function at `api/classes/index.js` if Express server handles all routes
- OR keep serverless functions for better Vercel optimization (current approach)

**Recommendation**: Keep serverless functions as-is for now since they're working and optimized for Vercel's architecture.

## Implementation Checklist

- [ ] Backup current `server/routes.ts`
- [ ] Update GET `/api/classes` routes to handle query parameters
- [ ] Verify POST route is correct
- [ ] Test locally with curl commands
- [ ] Test in browser (localhost:3000/classes)
- [ ] Test admin class creation flow
- [ ] Git commit changes
- [ ] Deploy to Vercel
- [ ] Test production deployment
- [ ] Monitor for any errors in Vercel logs

## Technical References

### Express.js Query Parameters
- `req.query` is an object containing parsed query string parameters
- Automatically available in Express (no middleware needed for simple params)
- Example: `GET /api/classes?type=upcoming` → `req.query.type === 'upcoming'`

### TanStack Query Cache Invalidation
- `queryClient.invalidateQueries({ queryKey: ['prefix'] })` uses **prefix matching**
- Invalidates all queries where `queryKey` starts with the provided prefix
- Multiple invalidations can be called sequentially
- Automatically refetches active queries

### Route Order in Express
- Routes are matched in the order they're defined
- More specific routes should come after general ones
- `/api/classes?type=...` should be before `/api/classes/:id`

## Success Criteria

✅ Classes created by admin appear immediately on localhost frontend
✅ Classes created by admin appear immediately on Vercel deployment
✅ No breaking changes to existing functionality
✅ All API endpoints return JSON (not HTML)
✅ React Query cache invalidation works correctly

## Risk Assessment

**Low Risk**:
- Changes are isolated to route handlers
- Backend storage layer remains unchanged
- Frontend code requires no modifications
- Vercel serverless functions already work correctly

**Mitigation**:
- Test thoroughly on localhost before deploying
- Keep serverless functions as fallback
- Can rollback easily if issues occur

---

**Status**: Ready for implementation
**Estimated Time**: 30 minutes
**Priority**: High (core functionality broken on localhost)
