# Breathwork Booking System - Complete System Map

**Generated:** 2025-10-04
**Status:** Production Ready (needs Resend API key)

---

## Table of Contents
1. [System Overview](#system-overview)
2. [Architecture](#architecture)
3. [Database Schema](#database-schema)
4. [API Routes](#api-routes)
5. [Frontend Pages](#frontend-pages)
6. [User Flows](#user-flows)
7. [Authentication](#authentication)
8. [Payment System](#payment-system)
9. [Email System](#email-system)
10. [Known Issues](#known-issues)
11. [Deployment Checklist](#deployment-checklist)

---

## System Overview

### Tech Stack
- **Frontend:** React 18 + TypeScript + Vite + Tailwind CSS + shadcn/ui
- **Backend:** Express.js + Node.js
- **Database:** PostgreSQL (Supabase) + Drizzle ORM
- **Authentication:** Custom email/password with JWT sessions
- **Payments:** Bank Transfer (Icelandic ISK)
- **Email:** Resend API
- **Routing:** Wouter (lightweight React router)
- **State:** TanStack Query (React Query)
- **Forms:** React Hook Form + Zod validation

### Key Features
1. ✅ Multi-role system (Client, Admin)
2. ✅ Class template management
3. ✅ Class scheduling with custom pricing
4. ✅ 10-minute temporary reservations during booking
5. ✅ Bank transfer payment with 24-hour deadline
6. ✅ Email confirmations (requires Resend setup)
7. ✅ Admin dashboard for class & registration management
8. ✅ Client dashboard to view bookings
9. ✅ Full Icelandic localization

### Removed Features
- ❌ Staff role (removed - only Client and Admin remain)
- ❌ Stripe payment (replaced with bank transfer)
- ❌ Old bookings/time-slots system (replaced with classes/registrations)

---

## Architecture

### Directory Structure
```
Breathworkis/
├── client/               # React frontend
│   └── src/
│       ├── pages/        # Page components
│       ├── components/   # Reusable UI components
│       ├── hooks/        # Custom React hooks
│       └── lib/          # Utilities
├── server/               # Express backend
│   ├── index.ts          # Server entry point
│   ├── routes.ts         # API route definitions
│   ├── storage.ts        # Database access layer
│   ├── email.ts          # Email templates & sending
│   └── supabaseAuth.ts   # Authentication middleware
├── shared/               # Shared code
│   └── schema.ts         # Database schema + types
└── scripts/              # Setup scripts
    └── setup-breathwork.js
```

### Data Flow Pattern
```
Frontend → API Routes → Storage Layer → Database
                ↓
         Email Service (Resend)
```

**Critical Pattern:**
1. Define schema in `shared/schema.ts`
2. Add storage methods in `server/storage.ts`
3. Create API routes in `server/routes.ts`
4. Frontend consumes via React Query

---

## Database Schema

### Core Tables

#### `users`
Primary user accounts with email/password authentication.

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| email | VARCHAR | Unique email address |
| passwordHash | VARCHAR | Bcrypt hashed password |
| firstName | VARCHAR | Optional first name |
| lastName | VARCHAR | Optional last name |
| role | ENUM | `'client'` or `'admin'` |
| isSuperuser | BOOLEAN | Can create custom templates |
| phone | VARCHAR | Optional phone number |
| createdAt | TIMESTAMP | Account creation date |
| updatedAt | TIMESTAMP | Last update |

#### `class_templates`
Reusable class definitions (e.g., "9D Breathwork Session").

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| name | VARCHAR | Template name |
| description | TEXT | Full description |
| duration | INTEGER | Duration in minutes |
| price | INTEGER | Price in ISK (zero-decimal) |
| maxCapacity | INTEGER | Default max participants |
| isDefault | BOOLEAN | True for 9D Breathwork |
| isActive | BOOLEAN | Can be used for new classes |
| createdBy | UUID | User ID (null for defaults) |

#### `classes`
Scheduled instances of class templates.

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| templateId | UUID | FK to class_templates |
| scheduledDate | TIMESTAMP | Date/time of class |
| location | VARCHAR | Physical location |
| maxCapacity | INTEGER | Can override template |
| customPrice | INTEGER | Optional custom price |
| currentBookings | INTEGER | Number of registrations |
| status | ENUM | `'upcoming'`, `'completed'`, `'cancelled'` |
| instructorNotes | TEXT | Private admin notes |

#### `registrations`
Client bookings for classes.

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| classId | UUID | FK to classes |
| clientId | UUID | FK to users |
| status | ENUM | `'reserved'`, `'pending'`, `'confirmed'`, `'cancelled'` |
| paymentStatus | ENUM | `'pending'`, `'paid'`, `'refunded'` |
| paymentAmount | INTEGER | Amount in ISK |
| paymentMethod | ENUM | `'bank_transfer'`, `'cash'`, `'card_at_door'` |
| paymentReference | VARCHAR | Booking number (e.g., "BWMGCSW7FB") |
| userConfirmedTransfer | BOOLEAN | User checked "I transferred" |
| adminVerifiedPayment | BOOLEAN | Admin confirmed payment |
| paymentDeadline | TIMESTAMP | 24 hours from booking |
| reservedUntil | TIMESTAMP | 10-minute temp hold |
| attended | BOOLEAN | Did user attend |
| notes | TEXT | Optional notes |

#### `company_payment_info`
Bank account details for customer transfers.

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| companyName | VARCHAR | Company name |
| companyId | VARCHAR | Kennitala |
| bankName | VARCHAR | Bank name |
| accountNumber | VARCHAR | Format: 0133-26-012345 |
| iban | VARCHAR | Optional IBAN |
| swiftBic | VARCHAR | Optional SWIFT/BIC |
| instructions | TEXT | Payment instructions (Icelandic) |
| isActive | BOOLEAN | Currently in use |

### Legacy Tables (Backward Compatibility)
- `services` - Old service definitions
- `instructors` - Instructor profiles
- `availability` - Weekly availability templates
- `timeSlots` - Specific bookable time slots
- `bookings` - Old booking system
- `waitlist` - Waitlist for full sessions
- `blockedTimes` - Instructor unavailability
- `vouchers` - Discount codes

---

## API Routes

### Authentication Routes

#### `POST /api/auth/register`
Create new user account.

**Request:**
```json
{
  "email": "user@example.is",
  "password": "password123",
  "firstName": "Jón",
  "lastName": "Jónsson",
  "phone": "5551234"
}
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.is",
    "role": "client"
  }
}
```

**Side Effects:**
- Sets `session_token` cookie (7 days)
- Password hashed with bcrypt
- Default role: `client`

#### `POST /api/auth/login`
Authenticate existing user.

**Request:**
```json
{
  "email": "user@example.is",
  "password": "password123"
}
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.is",
    "role": "client"
  }
}
```

**Errors:**
- `401` - Invalid credentials

#### `POST /api/auth/logout`
End user session.

**Response:**
```json
{
  "message": "Logged out successfully"
}
```

**Side Effects:**
- Clears `session_token` cookie
- Deletes session from memory

#### `GET /api/auth/user`
Get current authenticated user.

**Response:**
```json
{
  "id": "uuid",
  "email": "user@example.is",
  "firstName": "Jón",
  "lastName": "Jónsson",
  "role": "client",
  "isSuperuser": false
}
```

**Errors:**
- `401` - Not authenticated
- `404` - User not found

---

### Class Routes

#### `GET /api/class-templates`
List all active class templates.

**Response:**
```json
[
  {
    "id": "uuid",
    "name": "9D Breathwork Session",
    "description": "Full description...",
    "duration": 90,
    "price": 7900,
    "maxCapacity": 15,
    "isDefault": true
  }
]
```

#### `POST /api/class-templates`
Create custom class template (superuser only).

**Auth:** Required (superuser)

**Request:**
```json
{
  "name": "Custom Session",
  "description": "Description...",
  "duration": 60,
  "price": 5000,
  "maxCapacity": 10
}
```

#### `GET /api/classes/upcoming`
List all upcoming classes (public).

**Response:**
```json
[
  {
    "id": "uuid",
    "templateId": "uuid",
    "scheduledDate": "2025-10-11T21:40:00.000Z",
    "location": "Akureyri, Iceland",
    "maxCapacity": 15,
    "customPrice": null,
    "currentBookings": 4,
    "status": "upcoming",
    "template": {
      "name": "9D Breathwork Session",
      "price": 7900,
      ...
    }
  }
]
```

#### `GET /api/classes/all`
List ALL classes (admin only).

**Auth:** Required (admin)

**Response:** Same as `/upcoming` but includes all statuses

#### `GET /api/classes/:id`
Get single class details.

**Response:**
```json
{
  "id": "uuid",
  "templateId": "uuid",
  "scheduledDate": "2025-10-11T21:40:00.000Z",
  "location": "Akureyri, Iceland",
  "maxCapacity": 15,
  "customPrice": 8000,
  "currentBookings": 4,
  "status": "upcoming",
  "template": { ... }
}
```

#### `POST /api/classes`
Create new scheduled class (admin only).

**Auth:** Required (admin)

**Request:**
```json
{
  "templateId": "uuid",
  "scheduledDate": "2025-10-15T18:00:00.000Z",
  "location": "Reykjavík, Iceland",
  "maxCapacity": 15,
  "customPrice": 8000
}
```

---

### Registration Routes (New System)

#### `POST /api/registrations/reserve`
**Step 1:** Create 10-minute temporary reservation.

**Auth:** Required

**Request:**
```json
{
  "classId": "uuid",
  "paymentAmount": 7900
}
```

**Response:**
```json
{
  "id": "registration-uuid",
  "classId": "uuid",
  "clientId": "uuid",
  "paymentReference": "BWMGCSW7FB",
  "paymentAmount": 7900,
  "status": "reserved",
  "reservedUntil": "2025-10-04T22:25:00.000Z",
  "paymentDeadline": "2025-10-05T22:15:00.000Z"
}
```

**Logic:**
- Checks class availability
- Generates unique payment reference
- Sets 10-minute reservation (`reservedUntil`)
- Sets 24-hour payment deadline (`paymentDeadline`)
- Creates registration with status=`'reserved'`

**Errors:**
- `404` - Class not found
- `400` - Class is full

#### `PATCH /api/registrations/:id/confirm`
**Step 2:** Confirm registration after user indicates transfer completed.

**Auth:** Required (owner only)

**Response:**
```json
{
  "id": "uuid",
  "status": "confirmed",
  "userConfirmedTransfer": true,
  ...
}
```

**Logic:**
- Checks reservation hasn't expired
- Updates status to `'confirmed'`
- Sets `userConfirmedTransfer` = `true`
- Sends confirmation email (if Resend configured)

**Side Effects:**
- Email sent to user with:
  - Booking details
  - Bank transfer instructions
  - Payment reference
  - Class information

**Errors:**
- `404` - Registration not found
- `403` - Not your registration
- `400` - Reservation expired

#### `PATCH /api/registrations/:id/cancel`
Cancel a registration.

**Auth:** Required (owner or admin)

**Response:**
```json
{
  "id": "uuid",
  "status": "cancelled",
  ...
}
```

**Logic:**
- Updates status to `'cancelled'`
- Decrements `currentBookings` on class
- Frees up spot for others

#### `GET /api/registrations/my`
Get current user's registrations.

**Auth:** Required

**Response:**
```json
[
  {
    "id": "uuid",
    "classId": "uuid",
    "status": "confirmed",
    "paymentStatus": "pending",
    "paymentAmount": 7900,
    "paymentReference": "BWMGCSW7FB",
    "class": {
      "scheduledDate": "2025-10-11T21:40:00.000Z",
      "location": "Akureyri",
      "template": {
        "name": "9D Breathwork Session",
        ...
      }
    }
  }
]
```

#### `GET /api/registrations/class/:classId`
Get all registrations for a class (admin only).

**Auth:** Required (admin)

**Response:** Array of registrations with user details

#### `GET /api/registrations/:id`
Get single registration with full details.

**Auth:** Required (owner or admin)

**Response:**
```json
{
  "id": "uuid",
  "classId": "uuid",
  "clientId": "uuid",
  "status": "confirmed",
  "paymentStatus": "pending",
  "paymentAmount": 7900,
  "paymentReference": "BWMGCSW7FB",
  "paymentDeadline": "2025-10-05T22:15:00.000Z",
  ...
}
```

---

### Payment Info Routes

#### `GET /api/payment-info`
Get active bank transfer details (public).

**Response:**
```json
[
  {
    "id": "uuid",
    "companyName": "Breathwork ehf.",
    "companyId": "1234567890",
    "bankName": "Íslandsbanki",
    "accountNumber": "0133-26-012345",
    "instructions": "Vinsamlegast notaðu bókunarnúmerið...",
    "isActive": true
  }
]
```

---

## Frontend Pages

### Public Pages

#### `/` - Landing Page (`landing.tsx`)
Home page with hero section and class listings.

**Components:**
- Hero with CTA
- Upcoming classes grid
- Features section
- How it works

**Key Elements:**
- "Skoða tíma" button → navigates to classes
- Class cards show: name, date, time, location, price, availability

#### `/classes` - Classes Landing (`classes-landing.tsx`)
Browse all available classes.

**Components:**
- Class filters (future feature)
- Class grid with details
- Book button per class

#### `/class/:id` - Class Detail (`class-detail.tsx`)
**CRITICAL PAGE** - Full booking flow.

**State Machine:**
```
initial → confirming → success
   ↓           ↓
cancel ← ← ← ← ← (timeout or manual)
```

**Step 1: Initial**
- Shows class details
- "Bóka tíma" button
- Checks authentication (redirects to login if needed)
- Checks availability

**Step 2: Confirming (10-minute timer)**
- Creates temporary reservation
- Shows countdown timer (MM:SS format)
- Displays bank transfer details
- Payment reference shown prominently
- Checkbox: "✓ Ég hef millifært greiðsluna"
- "Staðfesta bókun" button (enabled only when checkbox checked)
- Auto-cancels if timer reaches 0

**Step 3: Success**
- Success overlay with checkmark
- "Bókun tókst!" message
- "Staðfestingarpóstur verður sendur..."
- Link to view bookings

**Key Features:**
- Real-time availability updates
- Automatic reservation cancellation on timeout
- Full Icelandic text
- Responsive design

**Mutations:**
- `createReservationMutation` - POST /api/registrations/reserve
- `confirmRegistrationMutation` - PATCH /api/registrations/:id/confirm
- `cancelReservationMutation` - PATCH /api/registrations/:id/cancel

#### `/about` - About Page
Static info about the company.

### Authenticated Pages

#### `/my-bookings` - Client Dashboard (`client-dashboard.tsx`)
**Fully Icelandic** - User's booking management.

**Sections:**

1. **Stats Cards**
   - Væntanlegir tímar (upcoming count)
   - Liðnir tímar (past count)
   - Allar bókanir (total count)

2. **Væntanlegir tímar (Upcoming)**
   - Shows all future confirmed/reserved registrations
   - Card per booking with:
     - Template name
     - Status badge (Staðfest/Frátekið/Í bið/Afturkallað)
     - Payment badge (Greitt/Millifærsla)
     - Dagsetning, Tími, Staðsetning, Pláss
     - Cancel button (X icon) if >24hrs away
   - Empty state: "Engir væntanlegir tímar" with CTA

3. **Liðnir tímar (Past)**
   - Shows cancelled or past-date registrations
   - Same card format but muted/no actions
   - Cancelled registrations show "Afturkallað" badge

**Features:**
- Cancel dialog: "Afturkalla bókun?"
- Responsive grid layout
- Auto-refresh after mutations
- Full Icelandic localization

**Queries:**
- GET /api/registrations/my

**Mutations:**
- PATCH /api/registrations/:id/cancel

#### `/admin` - Admin Dashboard (`admin-dashboard.tsx`)
**Admin only** - Full management interface.

**Tabs:**

1. **Overview**
   - Total bookings, revenue stats
   - Recent activity

2. **Schedule Management**
   - List of all classes (upcoming, past, cancelled)
   - Create new class button
   - Table columns (Icelandic):
     - Tími (Date & Time)
     - Dagsetning
     - Staðsetning
     - Bókanir (X/Y format)
     - Verð (with "(sérsniðið)" indicator)
   - Filters by status

3. **Registrations**
   - View all registrations
   - Filter by class, status, payment status
   - Mark payments as verified
   - Export functionality (future)

4. **Templates**
   - Manage class templates
   - Create custom templates (superuser only)

**Create Class Dialog:**
- Template selector (dropdown)
- Date/time picker
- Location input
- Max capacity (defaults from template)
- Custom price (optional)

**Queries:**
- GET /api/classes/all
- GET /api/class-templates
- GET /api/analytics/bookings

**Mutations:**
- POST /api/classes

### Authentication Pages

#### `/login` - Login Page
Email/password login form.

**Fields:**
- Email
- Password

**Actions:**
- Login button → POST /api/auth/login
- Register link → /register

**Validation:**
- Email format
- Min 6 chars password

**On Success:**
- Redirects to `/my-bookings` (client) or `/admin` (admin)

#### `/register` - Register Page
New user signup.

**Fields:**
- Email (required)
- Password (required, min 6 chars)
- First Name (optional)
- Last Name (optional)
- Phone (optional)

**Actions:**
- Register button → POST /api/auth/register
- Login link → /login

**On Success:**
- Auto-login and redirect to `/my-bookings`

---

## User Flows

### Client Booking Flow

```
1. User browses classes on landing page
   ↓
2. Clicks class to see details (/class/:id)
   ↓
3. Reviews class info, clicks "Bóka tíma"
   ↓
4. If not logged in → redirected to /login
   ↓
5. Logs in, redirected back to class
   ↓
6. Clicks "Bóka tíma" again
   ↓
7. System creates 10-minute reservation
   ↓
8. "Confirming" state shows:
   - 10:00 countdown timer
   - Bank transfer details
   - Payment reference (e.g., BWMGCSW7FB)
   - Checkbox "Ég hef millifært greiðsluna"
   ↓
9. User transfers payment via online banking
   ↓
10. User checks checkbox
    ↓
11. User clicks "Staðfesta bókun"
    ↓
12. System confirms registration
    ↓
13. Email sent (if Resend configured)
    ↓
14. Success overlay shown
    ↓
15. User can view booking in /my-bookings
```

**Timeout Scenario:**
```
If timer reaches 0:00:
  ↓
Auto-cancel reservation
  ↓
Toast: "Bókun felld niður"
  ↓
Back to initial state
  ↓
Spot freed for others
```

### Admin Class Creation Flow

```
1. Admin logs in → /admin
   ↓
2. Navigates to "Schedule Management" tab
   ↓
3. Clicks "Create Class" button
   ↓
4. Dialog opens:
   - Selects template (9D Breathwork Session)
   - Sets date/time (e.g., Oct 15, 2025 6:00 PM)
   - Sets location (e.g., Reykjavík, Iceland)
   - Sets capacity (default 15, can override)
   - Optional: custom price (e.g., 8000 kr instead of 7900)
   ↓
5. Clicks "Create"
   ↓
6. POST /api/classes
   ↓
7. Class appears in table
   ↓
8. Visible on public class listings
```

### Payment Verification Flow (Admin)

```
1. Customer books class
   ↓
2. Registration created with:
   - status: "confirmed"
   - paymentStatus: "pending"
   - paymentReference: "BWMGCSW7FB"
   ↓
3. Customer receives email with bank details
   ↓
4. Customer transfers to bank account
   ↓
5. Admin checks bank account (external)
   ↓
6. Admin finds transfer with reference "BWMGCSW7FB"
   ↓
7. Admin goes to /admin → Registrations tab
   ↓
8. Finds registration by reference
   ↓
9. Marks payment as verified:
   - adminVerifiedPayment: true
   - paymentStatus: "paid"
   ↓
10. Customer can see "Greitt" badge in dashboard
```

---

## Authentication

### Session Management

**Technology:** JWT tokens stored in HTTP-only cookies

**Cookie Name:** `session_token`

**Cookie Settings:**
```javascript
{
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
}
```

**Token Payload:**
```json
{
  "userId": "uuid",
  "email": "user@example.is",
  "iat": 1696435200
}
```

**Secret:** Stored in `process.env.SESSION_SECRET`

### Middleware: `isAuthenticated`

Located in: `server/supabaseAuth.ts`

**Usage:**
```typescript
app.get('/api/protected', isAuthenticated, async (req: AuthRequest, res) => {
  const userId = req.user!.id;
  // ...
});
```

**Behavior:**
- Reads `session_token` cookie
- Verifies JWT signature
- Decodes user ID and email
- Attaches to `req.user`
- Returns `401` if invalid/missing

**Extended Type:**
```typescript
interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}
```

### Role-Based Access

**Roles:** `'client'` | `'admin'`

**Pattern:**
```typescript
const user = await storage.getUser(req.user!.id);
if (user?.role !== 'admin') {
  return res.status(403).json({ message: "Admin access required" });
}
```

**Role Assignment:**
- Default: `'client'`
- Manual DB update for admin
- Superuser flag for custom template creation

---

## Payment System

### Bank Transfer (Millifærsla)

**Primary Payment Method:** Icelandic bank transfer

**Currency:** ISK (zero-decimal - no cents/aurar)

**Flow:**

1. **Reservation Created**
   - Payment reference generated: `BW{timestamp_base36}` (e.g., "BWMGCSW7FB")
   - Payment deadline set: 24 hours from booking

2. **Customer Instructions**
   - Email contains:
     - Bank name: Íslandsbanki
     - Account number: 0133-26-012345 (format: XXXX-XX-XXXXXX)
     - Kennitala: Breathwork ehf.
     - Reference: BWMGCSW7FB
     - Amount: 7,900 kr.
     - Instructions in Icelandic

3. **Transfer Completion**
   - Customer transfers via online banking
   - Must include payment reference in transfer
   - Checks box in UI: "Ég hef millifært greiðsluna"
   - Confirms booking

4. **Admin Verification**
   - Admin checks bank account daily
   - Matches payment reference to registration
   - Updates `adminVerifiedPayment` to `true`
   - Updates `paymentStatus` to `'paid'`

### Payment Reference Format

**Generation:**
```javascript
const paymentReference = `BW${Date.now().toString(36).toUpperCase()}`;
// Examples: BWMGCSW7FB, BWMGCT670S
```

**Properties:**
- Prefix: "BW" (Breathwork)
- Unique timestamp-based ID
- Base36 encoding (shorter)
- Uppercase for clarity

### Price Display

**Format:** Icelandic (space as thousands separator)

```javascript
// ✅ Correct
7900 → "7,900 kr."  // or "7 900 kr." with Icelandic locale

// ❌ Wrong
7900 → "7,900 ISK"  // Don't use ISK, use "kr."
7900 → "$79.00"     // No dollars or decimals
```

**Database Storage:**
- Type: `INTEGER`
- Unit: Króna (whole numbers only)
- No decimals (Iceland abolished aurar in 2023)

### Payment Statuses

**Registration.paymentStatus:**
- `'pending'` - Awaiting payment (initial state)
- `'paid'` - Payment verified by admin
- `'refunded'` - Payment returned to customer

**Registration.status:**
- `'reserved'` - 10-minute temp hold
- `'pending'` - Historical (not used in new system)
- `'confirmed'` - User confirmed, awaiting payment verification
- `'cancelled'` - Registration cancelled

**Workflow:**
```
reserved (10 min) → confirmed (user clicks) → paid (admin verifies)
   ↓                      ↓                        ↓
cancelled          cancelled                  refunded
```

---

## Email System

### Provider: Resend

**Setup Required:**
1. Get API key from resend.com
2. Set environment variables:
   ```bash
   RESEND_API_KEY=re_your_api_key_here
   FROM_EMAIL=bookings@breathwork.is
   ```
3. Verify domain in Resend dashboard

### Email Templates

**Location:** `server/email.ts`

#### Registration Confirmation Email

**Function:** `sendRegistrationConfirmation()`

**Triggered:** After user confirms booking (PATCH /api/registrations/:id/confirm)

**To:** User's email

**Subject:** `Bókun staðfest - 9D Breathwork Session - {date}`

**Content (Icelandic HTML):**
- Header with Breathwork branding
- "Bókun þín hefur verið staðfest!" headline
- Booking details card:
  - Bókunarnúmer (payment reference)
  - Dagsetning (full Icelandic format)
  - Tími + duration
  - Staðsetning
  - Upphæð
- Payment instructions box (yellow):
  - Banki
  - Reikningsnúmer
  - Kennitala
  - Tilvitnun (payment reference)
  - "Vinsamlegast greiddu innan 24 klst."
- Important info box (blue):
  - Komdu 15 mínútum fyrir
  - Klæðstu í þægilegan fatnað
  - Ekki borða þungan mat 2 klst. fyrir
  - Taktu með vatn
- Full class description
- Contact info
- Footer

**Variables:**
```typescript
{
  registration: Registration,
  classItem: Class & { template: ClassTemplate },
  user: User,
  paymentInfo: {
    companyName: string,
    bankName: string,
    accountNumber: string,
    instructions: string
  }
}
```

#### Payment Reminder Email

**Function:** `sendPaymentReminder()`

**Triggered:** Manually or via cron job (not yet implemented)

**To:** User's email

**Subject:** `Áminning um greiðslu - Bókunarnúmer {reference}`

**Content:**
- Header
- "⏰ Áminning um greiðslu" headline
- Booking reference
- Amount to pay
- Bank transfer details table
- Footer

---

## Known Issues

### 1. ✅ FIXED: Client Dashboard English Text
**Status:** RESOLVED
- All text now in Icelandic
- Badges: Staðfest, Afturkallað, Frátekið, Greitt, Millifærsla
- Sections: Væntanlegir tímar, Liðnir tímar
- Actions: Afturkalla, Halda pláss

### 2. ⚠️ Email System Not Configured
**Status:** NEEDS SETUP
- Resend API key not set
- Emails won't send until configured
- Feature is fully implemented, just needs credentials

**Fix:**
```bash
# In .env
RESEND_API_KEY=re_your_resend_api_key
FROM_EMAIL=bookings@breathwork.is
```

### 3. ⚠️ Test Payment Info in Database
**Status:** NEEDS UPDATE
- Current bank details are placeholders
- Account: 0133-26-012345 (fake)
- Kennitala: 1234567890 (fake)

**Fix:**
1. Log into admin dashboard
2. Go to Settings (future feature)
3. Update payment info
OR manually in database:
```sql
UPDATE company_payment_info
SET account_number = 'real-account',
    company_id = 'real-kennitala'
WHERE is_active = true;
```

### 4. ⚠️ No Automated Payment Verification
**Status:** MANUAL PROCESS
- Admin must manually check bank transfers
- No integration with Icelandic banking APIs
- Time-consuming for high volume

**Potential Solutions:**
- Integrate with bank's API (if available)
- Use Saltpay or similar Icelandic payment gateway
- Keep manual process with better admin UI

### 5. ⚠️ No Email on Reservation Timeout
**Status:** FEATURE GAP
- When 10-minute reservation expires, no email sent
- User might be confused
- Should notify: "Your reservation expired, please try again"

**Fix:** Add email to `cancelReservationMutation` timeout path

### 6. ⚠️ No Payment Reminder Automation
**Status:** FEATURE GAP
- `sendPaymentReminder()` exists but never called
- Should send email if payment not received in 23 hours
- Requires cron job or scheduled task

**Fix:** Implement scheduled job (e.g., node-cron) to check pending payments

### 7. 🐛 TypeScript Errors in Other Pages
**Status:** NON-CRITICAL
- Several pages have TypeScript warnings
- Mostly related to old booking system (deprecated)
- Doesn't affect production build
- Should be cleaned up

**Affected Files:**
- checkout.tsx (Stripe references)
- booking-flow.tsx (old time slots)
- staff-dashboard.tsx (staff role removed)
- navbar.tsx (staff comparison)

### 8. 📝 Missing Features (Future)
- Class filters/search
- User profile editing
- Password reset
- Multi-language support (currently only Icelandic)
- Recurring class scheduling
- Attendance tracking
- Review/rating system
- Gift vouchers (table exists, not implemented)

---

## Deployment Checklist

### Pre-Deployment

- [ ] Update `companyPaymentInfo` with real bank details
- [ ] Set `RESEND_API_KEY` in production environment
- [ ] Set `FROM_EMAIL` to real domain email
- [ ] Verify domain in Resend dashboard
- [ ] Set `SESSION_SECRET` to strong random value
  ```bash
  openssl rand -base64 32
  ```
- [ ] Set `NODE_ENV=production`
- [ ] Update `DATABASE_URL` to production Supabase
- [ ] Run `npm run db:push` on production database
- [ ] Run `npx tsx scripts/setup-breathwork.js` to:
  - Create superuser (maggismari@gmail.com)
  - Create default 9D template
  - Create payment info record
- [ ] Test email sending end-to-end
- [ ] Create first real class in admin dashboard
- [ ] Test full booking flow with real payment

### Production Environment Variables

```bash
# Database
DATABASE_URL=postgresql://[user]:[pass]@[host]/[db]?sslmode=require

# Authentication
SESSION_SECRET=[use openssl rand -base64 32]
NODE_ENV=production

# Email
RESEND_API_KEY=re_[your_key]
FROM_EMAIL=bookings@breathwork.is

# Server
PORT=5000

# Optional: Stripe (deprecated, can remove)
STRIPE_SECRET_KEY=
VITE_STRIPE_PUBLIC_KEY=
```

### Post-Deployment

- [ ] Verify all pages load
- [ ] Test login/register flow
- [ ] Test booking flow as client
- [ ] Test admin dashboard
- [ ] Verify emails arrive (check spam)
- [ ] Monitor server logs for errors
- [ ] Set up monitoring/alerting (e.g., Sentry)
- [ ] Document admin procedures
- [ ] Train admin on payment verification

### Vercel Deployment

**Build Command:**
```bash
npm run build
```

**Output Directory:**
```
dist
```

**Install Command:**
```bash
npm install
```

**Environment Variables:** Set all from above list in Vercel dashboard

**Domain:**
- Set custom domain (e.g., breathwork.is)
- Configure DNS
- Enable HTTPS

---

## Appendix

### Useful Commands

```bash
# Development
npm run dev                      # Start dev server (port 5000)
npm run build                    # Build for production
npm run check                    # TypeScript type checking
npm run db:push                  # Push schema changes to DB
npm run db:studio                # Open Drizzle Studio

# Setup
npx tsx scripts/setup-breathwork.js  # Initialize database

# Testing
curl http://localhost:5000/api/auth/user  # Test auth endpoint
```

### Database Queries

```sql
-- View all registrations
SELECT r.id, r.payment_reference, r.status, r.payment_status,
       u.email, c.scheduled_date, ct.name
FROM registrations r
JOIN users u ON r.client_id = u.id
JOIN classes c ON r.class_id = c.id
JOIN class_templates ct ON c.template_id = ct.id
ORDER BY r.created_at DESC;

-- Find unpaid registrations older than 24h
SELECT * FROM registrations
WHERE payment_status = 'pending'
  AND created_at < NOW() - INTERVAL '24 hours';

-- See today's classes
SELECT c.*, ct.name
FROM classes c
JOIN class_templates ct ON c.template_id = ct.id
WHERE DATE(c.scheduled_date) = CURRENT_DATE
  AND c.status = 'upcoming';
```

### Architecture Decisions

**Why remove Stripe?**
- Bank transfer is standard in Iceland
- Avoids 2-3% transaction fees
- Matches customer expectations
- Simpler for small business

**Why 10-minute reservation?**
- Prevents double-booking during checkout
- Long enough for bank transfer initiation
- Short enough to keep spots flowing
- Industry standard for ticket systems

**Why no cents/decimals?**
- Iceland abolished aurar (cents) in 2023
- All prices rounded to nearest króna
- ISK is zero-decimal currency
- Matches banking system

**Why React Query?**
- Automatic caching
- Optimistic updates
- Parallel requests
- Minimal boilerplate

**Why Drizzle ORM?**
- Type-safe queries
- No magic, plain SQL
- Better DX than Prisma for joins
- Supabase compatibility

---

**Last Updated:** 2025-10-04
**Version:** 1.0
**Maintainer:** Claude Code (Anthropic)
