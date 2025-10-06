# Registration Flow Mapping - CRITICAL FIX NEEDED

## Current Frontend API Calls (What's Actually Being Called)

### From class-detail.tsx:
1. `POST /api/registrations/reserve` - Reserve a class spot ✅ EXISTS
2. `PATCH /api/registrations/:id/confirm` - Confirm reservation ❌ 404
3. `PATCH /api/registrations/:id/cancel` - Cancel reservation ❌ 404

### From registration-success.tsx:
4. `GET /api/registrations/:id` - Get registration details ✅ EXISTS
5. `PATCH /api/registrations/:id/confirm-transfer` - User confirms bank transfer ❌ 404

### From client-dashboard.tsx:
6. `GET /api/registrations/my` - Get user's registrations ❌ 404
7. `PATCH /api/registrations/:id/cancel` - Cancel (same as #3) ❌ 404

### From admin-dashboard.tsx:
8. `PATCH /api/registrations/:id` - Admin update registration ✅ EXISTS

## Current Serverless Functions (What Actually Exists on Vercel)

1. `api/registrations/reserve.js` - Handles POST /api/registrations/reserve ✅
2. `api/registrations/[id].js` - Handles:
   - GET /api/registrations/:id ✅
   - PATCH /api/registrations/:id ✅
   - PATCH /api/registrations/:id?action=confirm (query param - NOT BEING USED)
   - PATCH /api/registrations/:id?action=cancel (query param - NOT BEING USED)
   - PATCH /api/registrations/:id?action=confirm-transfer (query param - NOT BEING USED)

## THE PROBLEM

Frontend calls **NESTED ROUTES** like `/api/registrations/:id/confirm`
Serverless functions expect **QUERY PARAMS** like `/api/registrations/:id?action=confirm`

Vercel file-based routing requires:
- `/api/registrations/[id]/confirm.js` to handle `/api/registrations/:id/confirm`
- `/api/registrations/[id]/cancel.js` to handle `/api/registrations/:id/cancel`
- `/api/registrations/[id]/confirm-transfer.js` to handle `/api/registrations/:id/confirm-transfer`
- `/api/registrations/my.js` to handle `/api/registrations/my`

## SOLUTION OPTIONS

### Option 1: Create Nested Route Files (Exceeds Function Limit)
- Need 4 more functions (my, confirm, cancel, confirm-transfer)
- Total would be 16 functions (over 12 limit) ❌

### Option 2: Remove More Functions & Create Nested Routes
- Remove: instructors/index.js, users/index.js, class-templates/index.js
- Create: registration nested routes
- Risky - breaks other features ❌

### Option 3: Create Lightweight Proxy Functions (RECOMMENDED)
- Create tiny nested route files that just proxy to [id].js with action params
- Each file ~10 lines, just changes the route
- Keeps within limits with smart consolidation ✅

## RECOMMENDED FIX

Create these 4 small proxy files:
1. `api/registrations/my.js` - GET user registrations
2. `api/registrations/[id]/confirm.js` - Proxy to [id].js?action=confirm
3. `api/registrations/[id]/cancel.js` - Proxy to [id].js?action=cancel
4. `api/registrations/[id]/confirm-transfer.js` - Proxy to [id].js?action=confirm-transfer

Remove to stay within limit:
- Keep all current functions (all essential)
- No removals needed if we create lightweight proxies

Total functions: 12 current + 4 new = 16 ❌ STILL OVER LIMIT

## BETTER SOLUTION: Consolidate More Aggressively

Remove:
- `api/instructors/index.js` (low usage)
- `api/users/index.js` (admin only, low priority)
- `api/class-templates/index.js` (can be handled by classes)

This frees 3 slots: 12 - 3 = 9
Add 4 registration routes: 9 + 4 = 13 ❌ STILL OVER

## BEST SOLUTION: Mega-Consolidation

Create ONE mega registration handler that routes everything:
- `api/registrations/index.js` - Handles ALL registration routes with smart routing

This would be: 12 - 2 (remove reserve.js + [id].js) + 1 (new index.js) = 11 functions ✅

Let me implement this!
