# 💳 Payment Strategy - Minimize Fees, Maximize Profit

> **Goal**: Reduce payment processing fees from 2.4% to ~0.5% by offering multiple payment methods

---

## 📊 Current Situation Analysis

### Stripe-Only Scenario (Current)

**Assumptions**:
- 3 classes/month × 15 participants = **45 bookings/month**
- Average price: **7,900 ISK** per class
- Monthly revenue: **355,500 ISK** (~$2,600 USD)

**Stripe Fee Structure**:
- EU cards (70% of customers): **1.4% + 30 ISK** = ~141 ISK per transaction
- Non-EU cards (30% of customers): **2.9% + 30 ISK** = ~259 ISK per transaction

**Monthly Cost**:
```
EU cards:     31.5 bookings × 141 ISK = 4,442 ISK
Non-EU cards: 13.5 bookings × 259 ISK = 3,497 ISK
─────────────────────────────────────────────────
TOTAL:                                  7,939 ISK/month
Effective rate:                         2.2% of revenue
```

**Annual Impact**:
- Revenue: **4,266,000 ISK** (~$31,200 USD)
- Stripe fees: **95,268 ISK** (~$696 USD)
- **That's losing 2.2% of all revenue to payment fees!**

---

## 🎯 Recommended Multi-Payment Strategy

### The 50/20/30 Model

Offer customers **3 payment options** based on preference:

| Method | Target | % of Customers | Fees | Why |
|--------|--------|----------------|------|-----|
| **Pay at Door** | Locals, regulars | 50% | **0 ISK** | Zero fees, builds trust |
| **Bank Transfer** | Icelandic customers | 20% | **~0.1%** | Truelayer API (FREE tier) |
| **Stripe** | Tourists, international | 30% | **2.2%** | Fallback for convenience |

### Expected Results

**Monthly Fees Breakdown** (45 bookings):
```
Pay at Door:    22.5 bookings × 0 ISK       = 0 ISK
Bank Transfer:   9.0 bookings × 10 ISK      = 90 ISK (Truelayer)
Stripe:         13.5 bookings × 141 ISK     = 1,904 ISK
──────────────────────────────────────────────────────────
TOTAL:                                        1,994 ISK/month
Effective rate:                               0.56% of revenue
```

**Savings**:
- Monthly: **5,945 ISK** saved (vs Stripe-only)
- Annual: **71,340 ISK** saved (~$520 USD)
- **75% reduction in payment fees!**

---

## 🏦 Payment Method Details

### Option 1: Pay at Door (50% of customers)

**How it works**:
1. Customer books online (free reservation)
2. Optional: 30% deposit via Stripe to reduce no-shows
3. Pay remainder at door (cash or card terminal)

**Pros**:
- ✅ ZERO online fees
- ✅ Preferred by many Icelanders
- ✅ No chargebacks
- ✅ Immediate cash flow

**Cons**:
- ❌ Higher no-show risk (mitigated by deposit)
- ❌ Requires card terminal at venue
- ❌ Manual tracking needed

**Implementation**:
```typescript
// Registration with "Pay at Door" option
const registration = {
  paymentMethod: 'door',
  paymentStatus: 'pending',
  depositPaid: false, // or true if deposit required
  amount: 7900,
  depositAmount: 2370, // 30% if required
};
```

**Card Terminal Options** (for door payments):
- **iZettle** (Square): 1.75% fee (still better than 2.4% online!)
- **SumUp**: 1.69% fee
- **Teya** (formerly Saltpay): Icelandic company, competitive rates

---

### Option 2: Bank Transfer (20% of customers)

**How it works**:
1. Customer selects "Bank Transfer" at checkout
2. Show bank details + unique reference code
3. Customer transfers via online banking
4. System auto-verifies payment via Truelayer API
5. Booking confirmed automatically

**Iceland Bank Integration Options**:

#### A. Truelayer (Recommended - FREE)
- **Cost**: FREE for first 10,000 transactions/month
- **Support**: All major Icelandic banks
- **Features**: Real-time payment verification, webhooks
- **Docs**: https://truelayer.com

**Supported Iceland Banks**:
- Íslandsbanki
- Arion banki
- Landsbankinn
- Kvika banki

#### B. Manual Bank Transfer (Fallback)
- Show your bank account: `IS14 0159 2600 7654 5510 3989 80`
- Reference: `BOOKING-{id}`
- Manual verification (check bank daily)
- Confirm booking manually

**Implementation**:
```typescript
// Truelayer integration
import { TrueLayerClient } from 'truelayer-client';

const client = new TrueLayerClient({
  client_id: process.env.TRUELAYER_CLIENT_ID,
  client_secret: process.env.TRUELAYER_CLIENT_SECRET,
});

// Create payment request
const payment = await client.createPayment({
  amount: 7900,
  currency: 'ISK',
  beneficiary: {
    account_identifier: {
      type: 'iban',
      iban: 'IS14015926007654551039898',
    },
    name: 'Nordic Breath ehf',
    reference: `BOOKING-${bookingId}`,
  },
  user: {
    name: user.name,
    email: user.email,
  },
});

// Redirect user to their bank
res.redirect(payment.authorization_flow.authorization_url);

// Webhook confirms payment
app.post('/api/truelayer/webhook', async (req, res) => {
  const { payment_id, status } = req.body;

  if (status === 'executed') {
    await updateRegistration(bookingId, {
      paymentStatus: 'paid',
      paymentMethod: 'bank_transfer',
    });
  }
});
```

**Pros**:
- ✅ Very low fees (0-0.1%)
- ✅ Popular in Iceland
- ✅ Trusted payment method
- ✅ Auto-verification with API

**Cons**:
- ❌ 1-2 business day settlement
- ❌ Not instant confirmation (unless using API)
- ❌ Less convenient for tourists

---

### Option 3: Stripe Online Payment (30% of customers)

**When to use**:
- International customers
- Tourists without Icelandic bank
- Customers who prefer instant confirmation
- Last-minute bookings

**Keep current Stripe integration as fallback**

**Optimization**: Use Stripe Link for returning customers
- Saves payment details securely
- One-click checkout
- Still 2.4% fee but faster UX

---

## 💡 Deposit System (Optional but Recommended)

### Reduce No-Shows with Deposits

**How it works**:
1. All bookings require **30% deposit** (2,370 ISK)
2. Deposit paid online via Stripe (convenient, instant)
3. Remaining 70% (5,530 ISK) paid at door or via bank transfer

**Benefits**:
- ✅ Reduces no-shows significantly (financial commitment)
- ✅ Lower Stripe fees (only on 30% deposit)
- ✅ Customer flexibility on remainder payment
- ✅ Immediate partial payment

**Fee Comparison**:
```
Full Payment via Stripe:  7,900 ISK × 2.2% = 174 ISK fee

Deposit System:
- Deposit (Stripe):       2,370 ISK × 2.2% = 52 ISK
- Remainder (Door/Bank):  5,530 ISK × 0-1.75% = 0-97 ISK
- Total fees:             52-149 ISK (vs 174 ISK)
- Savings:                14-70% per transaction
```

**Implementation**:
```typescript
const depositAmount = Math.round(classPrice * 0.30); // 30%
const remainingAmount = classPrice - depositAmount;

// Stripe payment intent for deposit only
const paymentIntent = await stripe.paymentIntents.create({
  amount: depositAmount,
  currency: 'isk',
  metadata: {
    bookingId: booking.id,
    isDeposit: 'true',
    remainingAmount: remainingAmount,
  },
});
```

---

## 🏗️ Implementation Roadmap

### Phase 1: Add "Pay at Door" Option (1-2 days)

**Database Schema Update**:
```typescript
// shared/schema.ts
export const registrations = pgTable("registrations", {
  // ... existing fields
  paymentMethod: varchar("payment_method", {
    enum: ["stripe", "door", "bank_transfer", "deposit"]
  }).default("stripe").notNull(),
  depositPaid: boolean("deposit_paid").default(false),
  depositAmount: integer("deposit_amount"),
  remainingAmount: integer("remaining_amount"),
});
```

**UI Update** (class-detail.tsx):
```tsx
<div className="space-y-4">
  <h3>Payment Method</h3>
  <RadioGroup onValueChange={setPaymentMethod}>
    <div className="flex items-center space-x-2">
      <RadioGroupItem value="door" id="door" />
      <Label htmlFor="door">
        Pay at Door (Cash/Card) - FREE
        <span className="text-sm text-muted-foreground block">
          No online fees. Pay when you arrive.
        </span>
      </Label>
    </div>

    <div className="flex items-center space-x-2">
      <RadioGroupItem value="stripe" id="stripe" />
      <Label htmlFor="stripe">
        Pay Online (Credit Card)
        <span className="text-sm text-muted-foreground block">
          Instant confirmation. All cards accepted.
        </span>
      </Label>
    </div>
  </RadioGroup>
</div>
```

### Phase 2: Add Bank Transfer (3-4 days)

**Install Truelayer SDK**:
```bash
npm install truelayer-client
```

**Environment Variables**:
```bash
TRUELAYER_CLIENT_ID=your_client_id
TRUELAYER_CLIENT_SECRET=your_client_secret
BANK_ACCOUNT_IBAN=IS14015926007654551039898
BANK_ACCOUNT_NAME="Nordic Breath ehf"
```

**API Routes** (server/routes.ts):
```typescript
// Create bank payment
app.post('/api/payments/bank-transfer', isAuthenticated, async (req, res) => {
  const { registrationId } = req.body;
  const registration = await storage.getRegistration(registrationId);

  const payment = await truelayerClient.createPayment({
    amount: registration.paymentAmount,
    currency: 'ISK',
    beneficiary: {
      account_identifier: {
        type: 'iban',
        iban: process.env.BANK_ACCOUNT_IBAN,
      },
      name: process.env.BANK_ACCOUNT_NAME,
      reference: `BOOKING-${registrationId}`,
    },
  });

  res.json({
    authUrl: payment.authorization_flow.authorization_url,
    paymentId: payment.id,
  });
});

// Truelayer webhook
app.post('/api/truelayer/webhook', async (req, res) => {
  const { payment_id, status, metadata } = req.body;

  if (status === 'executed') {
    const bookingRef = metadata.reference; // "BOOKING-{id}"
    const bookingId = bookingRef.replace('BOOKING-', '');

    await storage.updateRegistration(bookingId, {
      paymentStatus: 'paid',
      paymentMethod: 'bank_transfer',
    });
  }

  res.sendStatus(200);
});
```

### Phase 3: Add Deposit System (2-3 days)

**Update Payment Flow**:
```typescript
// Calculate deposit (30%)
const depositAmount = Math.round(classPrice * 0.30);
const remainingAmount = classPrice - depositAmount;

// Create registration with deposit info
const registration = await storage.createRegistration({
  classId,
  clientId: user.id,
  paymentMethod: 'deposit',
  paymentAmount: classPrice,
  depositAmount,
  remainingAmount,
  depositPaid: false,
  paymentStatus: 'pending',
});

// Create Stripe payment for deposit only
const paymentIntent = await stripe.paymentIntents.create({
  amount: depositAmount, // Only 30%
  currency: 'isk',
  metadata: { registrationId: registration.id },
});
```

**Admin View** - Show payment status:
```tsx
<Table>
  <TableRow>
    <TableCell>{user.name}</TableCell>
    <TableCell>
      {registration.depositPaid ? (
        <Badge variant="outline">
          Deposit Paid ({registration.depositAmount} ISK)
        </Badge>
      ) : (
        <Badge variant="destructive">Pending</Badge>
      )}
    </TableCell>
    <TableCell>
      Remaining: {registration.remainingAmount} ISK
      <span className="text-muted-foreground text-sm">
        ({registration.paymentMethod === 'door' ? 'Pay at door' : 'Bank transfer'})
      </span>
    </TableCell>
  </TableRow>
</Table>
```

---

## 📋 Setup Checklist

### Truelayer Setup (FREE)
- [ ] Create account at https://truelayer.com
- [ ] Complete KYB (Know Your Business) verification
- [ ] Create application
- [ ] Get Client ID and Secret
- [ ] Add webhook URL: `https://your-domain.com/api/truelayer/webhook`
- [ ] Test with sandbox environment
- [ ] Go live (FREE tier: 10k transactions/month)

### Bank Account Setup
- [ ] Confirm business bank account details
- [ ] Get IBAN number
- [ ] Verify account name matches business registration
- [ ] Test small transfer to verify

### Card Terminal (for door payments)
- [ ] Choose provider (iZettle/SumUp/Teya)
- [ ] Order terminal (~15,000-30,000 ISK one-time)
- [ ] Set up merchant account
- [ ] Test transactions

### Stripe Optimization
- [ ] Enable Stripe Link (one-click for returning customers)
- [ ] Set up automatic email receipts
- [ ] Configure webhook for deposit payments

---

## 💰 Fee Comparison Summary

| Scenario | Setup | Monthly Fees | Annual Fees | vs Stripe-Only |
|----------|-------|--------------|-------------|----------------|
| **Current (Stripe only)** | Easiest | 7,939 ISK | 95,268 ISK | - |
| **Add "Pay at Door"** | Easy | 3,970 ISK | 47,640 ISK | 50% ↓ |
| **Add Bank Transfer** | Medium | 2,976 ISK | 35,712 ISK | 62% ↓ |
| **Add Deposit System** | Medium | 2,382 ISK | 28,584 ISK | 70% ↓ |
| **🎯 Full Multi-Payment** | Advanced | **1,994 ISK** | **23,928 ISK** | **75% ↓** |

**Annual Savings with Full Strategy: 71,340 ISK (~$520 USD)**

---

## 🎯 Recommended Immediate Actions

### Week 1: Quick Wins
1. Add "Pay at Door" option (0 fees, 2 hours work)
2. Update registration flow to show payment method choice
3. Test with 1-2 classes

### Week 2-3: Bank Integration
1. Create Truelayer account (FREE)
2. Implement bank transfer option
3. Test with Icelandic customers

### Week 4: Optimize
1. Add deposit system (30% online, 70% flexible)
2. Monitor payment method distribution
3. Adjust based on customer preference

---

## 📊 Expected Customer Distribution

Based on Iceland market research:

| Payment Method | Expected % | Reasoning |
|----------------|------------|-----------|
| Pay at Door | 40-50% | Common in Iceland, builds trust |
| Bank Transfer | 20-30% | Very popular with locals |
| Stripe Online | 20-30% | Tourists, last-minute bookings |
| No-shows/Cancels | 5-10% | Industry standard (reduced by deposits) |

---

## 🚨 Risk Mitigation

### No-Show Risk (Pay at Door)
**Problem**: Customer books but doesn't show up
**Solutions**:
1. Require 30% deposit for all "pay at door" bookings
2. Send reminder emails 48h and 24h before class
3. SMS reminder 2 hours before (via Twilio - cheap)
4. Waitlist automation (auto-book next person if cancelled)

### Bank Transfer Delays
**Problem**: Payment takes 1-2 days to verify
**Solutions**:
1. Use Truelayer API for instant verification
2. Allow booking with "payment pending" status
3. Auto-confirm when payment detected
4. Send reminder if payment not received in 24h

### Fraud Prevention
**Problem**: Fake bookings, chargebacks
**Solutions**:
1. Email verification required
2. SMS verification for first booking (optional)
3. Stripe's built-in fraud detection for card payments
4. Admin review for suspicious patterns

---

## 📱 Mobile Payment Options (Future)

### Iceland-Specific Mobile Payments

**Auðkenni App** (Iceland's National eID)
- Used by 95% of Icelanders
- Could integrate for secure payments
- Very low fees
- Requires Icelandic company registration

**Kass (Arion banki mobile payment)**
- Popular in Iceland
- Low fees for merchants
- Easy integration

**Worth exploring in Phase 2!**

---

## 🎓 Resources

### Truelayer
- Docs: https://docs.truelayer.com
- Iceland banks: https://docs.truelayer.com/docs/supported-banks
- Pricing: https://truelayer.com/pricing (FREE tier available)

### Stripe Optimization
- Stripe Link: https://stripe.com/payments/link
- Fee optimization: https://stripe.com/docs/payments/checkout/custom-success-page

### Card Terminals
- iZettle: https://www.zettle.com/is
- SumUp: https://sumup.com/en-is/
- Teya (Saltpay): https://www.teya.com/is/

---

## ✅ Success Metrics

Track these metrics to optimize payment mix:

- Payment method distribution (door/bank/stripe %)
- No-show rate by payment method
- Average processing fee per booking
- Customer preference feedback
- Time to payment confirmation
- Chargeback/dispute rate

**Goal**: Keep total payment processing fees **under 1%** of revenue

---

*Last Updated: October 4, 2025*
*Review quarterly and adjust based on customer behavior*
