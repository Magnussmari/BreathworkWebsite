# Stripe Payment Setup Guide

This guide walks you through setting up Stripe for processing payments in ISK (Iceland Króna) for the Nordic Breath application.

## 💳 Why Stripe?

- **No Monthly Fees**: Pay only per transaction
- **ISK Support**: Native Iceland Króna currency support
- **Multiple Payment Methods**: Cards, Apple Pay, Google Pay
- **Secure**: PCI compliance handled by Stripe
- **Developer-Friendly**: Excellent API and documentation
- **Test Mode**: Safe testing environment

## 🚀 Step-by-Step Setup

### 1. Create Stripe Account

1. Go to [stripe.com](https://stripe.com)
2. Click "Start now" or "Sign up"
3. Fill in your information:
   - Email address
   - Full name
   - Country: **Iceland** (IS)
   - Account type: **Individual** or **Company**
4. Verify your email address

### 2. Complete Business Profile

**For Testing (Optional Initially)**:
- You can skip this and use Test Mode immediately

**For Production (Required Eventually)**:
1. Go to **Settings** → **Business settings**
2. Fill in:
   - Business name: Nordic Breath
   - Business type: Sole Proprietorship / Company
   - Business address in Iceland
   - Bank account details (for payouts)
   - Tax ID (if applicable)
3. Submit required documents for verification

### 3. Enable ISK Currency

1. Go to **Settings** → **Payment methods**
2. Click **Add currency**
3. Select **ISK (Iceland Króna)**
4. Save changes

**Important**: ISK is a **zero-decimal currency**
- Amounts must be in whole króna (no fractional amounts)
- In Stripe API: `4500` = 4,500 ISK (not 45.00 ISK)

### 4. Get API Keys

#### Test Mode (Development)

1. Go to **Developers** → **API keys**
2. Ensure **Test mode** toggle is ON (top-right)
3. Copy the following keys:

```
Publishable key: pk_test_xxxxxxxxxxxxxxxxxxxxx
Secret key: sk_test_xxxxxxxxxxxxxxxxxxxxx
```

4. Add to `.env`:

```bash
VITE_STRIPE_PUBLIC_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxx
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxx
```

#### Live Mode (Production)

1. Toggle to **Live mode** (after account verification)
2. Copy live keys:

```
Publishable key: pk_live_xxxxxxxxxxxxxxxxxxxxx
Secret key: sk_live_xxxxxxxxxxxxxxxxxxxxx
```

3. Update `.env` with live keys (use separate environment)

### 5. Configure Payment Methods

1. Go to **Settings** → **Payment methods**
2. Enable the following for Iceland:
   - ✅ **Card payments** (Visa, Mastercard, Amex)
   - ✅ **Apple Pay**
   - ✅ **Google Pay**
   - ✅ **Link** (Stripe's express checkout)

3. Set currency priority:
   - Primary: **ISK**
   - Backup: EUR (optional for international customers)

### 6. Set Up Webhooks (Production Only)

Webhooks notify your app when payments succeed or fail.

#### During Development (Skip This)
- Webhooks not needed for local testing
- Test payments work without webhook configuration

#### For Production Deployment

1. Go to **Developers** → **Webhooks**
2. Click **Add endpoint**
3. Enter your webhook URL:
   ```
   https://your-domain.com/api/payments/webhook
   ```
4. Select events to listen for:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
5. Click **Add endpoint**
6. Copy the **Webhook signing secret**:
   ```
   whsec_xxxxxxxxxxxxxxxxxxxxx
   ```
7. Add to `.env`:
   ```bash
   STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxx
   ```

### 7. Test the Integration

#### Use Stripe Test Cards

**Successful Payment:**
```
Card Number: 4242 4242 4242 4242
Expiry: Any future date (e.g., 12/34)
CVC: Any 3 digits (e.g., 123)
ZIP: Any 5 digits (e.g., 12345)
```

**Card Declined:**
```
Card Number: 4000 0000 0000 0002
Expiry: Any future date
CVC: Any 3 digits
```

**3D Secure Authentication:**
```
Card Number: 4000 0027 6000 3184
Expiry: Any future date
CVC: Any 3 digits
```

#### Test Payment Flow

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Create a booking:
   - Select a service (e.g., "Introduction to Breathwork" - 4,500 ISK)
   - Choose date and time
   - Fill in customer details
   - Click "Pay with Stripe"

3. Use test card `4242 4242 4242 4242`

4. Verify success:
   - Should redirect to confirmation page
   - Check booking status in admin dashboard
   - Check Stripe dashboard → **Payments** (should show test payment)

### 8. Verify ISK Handling

**Critical**: ISK must be whole numbers only (no decimals)

Our implementation already handles this:

```typescript
// In server/routes.ts (payment creation)
const amountInISK = Math.round(Number(service.price));
```

**Test Cases**:
- 4,500 ISK → ✅ Works
- 7,900 ISK → ✅ Works
- 4,500.50 ISK → ❌ Should be rounded to 4,501 ISK

## 💰 Pricing & Fees

### Transaction Fees (Iceland)

| Card Type | Fee Structure |
|-----------|---------------|
| **European cards** | 1.4% + 30 ISK |
| **Non-European cards** | 2.9% + 30 ISK |

### Real-World Examples

#### Example 1: 4,500 ISK Booking (European Card)
```
Service Price: 4,500 ISK
Stripe Fee: 1.4% + 30 ISK = 63 + 30 = 93 ISK
You Receive: 4,407 ISK
Effective Rate: 2.07%
```

#### Example 2: 12,500 ISK Booking (Non-EU Card)
```
Service Price: 12,500 ISK
Stripe Fee: 2.9% + 30 ISK = 363 + 30 = 393 ISK
You Receive: 12,107 ISK
Effective Rate: 3.14%
```

#### Monthly Estimate (20 bookings, avg 8,000 ISK)

Assumptions:
- 70% European cards, 30% non-European
- Average booking: 8,000 ISK
- 20 bookings/month

```
Revenue: 20 × 8,000 ISK = 160,000 ISK

European (14 bookings):
  Fee per booking: 142 ISK
  Total: 1,988 ISK

Non-European (6 bookings):
  Fee per booking: 262 ISK
  Total: 1,572 ISK

Total Fees: 3,560 ISK/month
Effective Rate: 2.23%
Net Revenue: 156,440 ISK
```

### Additional Fees

| Fee Type | Amount |
|----------|--------|
| **Monthly/Setup** | 0 ISK (Free) |
| **Chargeback** | ~2,070 ISK ($15 USD) |
| **Currency Conversion** | 2% (if settling in non-ISK) |
| **Instant Payout** | Varies by country |
| **Refund** | Fee is returned |

## 🔒 Security Best Practices

### API Key Security

✅ **DO**:
- Store keys in `.env` file
- Never commit `.env` to git
- Use different keys for dev/staging/production
- Rotate keys periodically
- Use test keys for development

❌ **DON'T**:
- Hardcode keys in source code
- Share secret keys publicly
- Use production keys in development
- Store keys in client-side code (except publishable keys)

### PCI Compliance

Stripe handles PCI compliance for you:
- ✅ Never store card numbers
- ✅ Use Stripe Checkout (redirects to Stripe)
- ✅ Card data never touches your server
- ✅ Stripe Elements if you need custom forms

### Fraud Prevention

Enable **Stripe Radar** (included free):
1. Go to **Radar** → **Rules**
2. Enable default fraud protection
3. Consider adding custom rules:
   - Block payments from high-risk countries
   - Flag large transactions for review
   - Require 3D Secure for international cards

## 🔧 Common Issues

### Issue: "Invalid API Key"

**Cause**: Wrong or expired API key

**Solutions**:
1. Verify you're using the correct environment (test vs live)
2. Check for typos in `.env` file
3. Regenerate keys in Stripe dashboard
4. Restart your development server after updating `.env`

### Issue: "Amount must be at least 100"

**Cause**: Amount too small (Stripe minimum is usually 100 in smallest currency unit)

**For ISK**: Minimum is **1 ISK** (represented as `100` in API due to zero-decimal handling)

**Solution**: Ensure minimum booking price is at least 1 ISK

### Issue: "Invalid currency"

**Cause**: ISK not enabled or using wrong currency code

**Solutions**:
1. Enable ISK in Stripe dashboard (Settings → Payment methods)
2. Verify currency code is `"isk"` (lowercase)
3. Check your account supports ISK (Iceland-based accounts)

### Issue: Webhook Not Receiving Events

**Causes**:
- Incorrect webhook URL
- URL not publicly accessible
- Firewall blocking Stripe IPs
- Wrong signing secret

**Solutions**:
1. Verify webhook URL is publicly accessible
2. Use tools like [webhook.site](https://webhook.site) to test
3. Check webhook logs in Stripe dashboard
4. Verify signing secret matches `.env` file
5. For local testing, use [Stripe CLI](https://stripe.com/docs/stripe-cli)

## 📊 Monitoring Payments

### Stripe Dashboard

1. Go to **Payments** to view all transactions
2. Click on any payment for details:
   - Customer info
   - Payment method
   - Fee breakdown
   - Timeline of events

### Filters

- By date range
- By amount
- By status (succeeded, failed, refunded)
- By payment method

### Export Data

1. Go to **Balance** → **Payouts**
2. Download CSV of transactions
3. Use for accounting/bookkeeping

## 🔄 Handling Refunds

### Full Refund

1. Go to **Payments** in Stripe dashboard
2. Click on the payment
3. Click **Refund payment**
4. Select **Full refund**
5. Add optional reason
6. Click **Refund**

**Note**: Stripe fee is also refunded

### Partial Refund

1. Same as above
2. Select **Partial refund**
3. Enter amount to refund (in ISK)
4. Click **Refund**

### Programmatic Refund

Our app already supports this (admin dashboard):

```typescript
// In your backend
const refund = await stripe.refunds.create({
  payment_intent: 'pi_xxxxxxxxxxxxx',
  amount: 4500, // ISK amount to refund
});
```

## 📈 Going Live Checklist

Before switching to live mode:

- [ ] Business profile completed and verified
- [ ] Bank account added for payouts
- [ ] ISK currency enabled
- [ ] Payment methods configured
- [ ] Webhooks set up and tested
- [ ] Test mode thoroughly tested
- [ ] Fraud protection enabled (Radar)
- [ ] Legal pages added (Terms, Privacy Policy)
- [ ] Refund policy defined
- [ ] Customer support email set up

## 📚 Additional Resources

- [Stripe Documentation](https://stripe.com/docs)
- [Stripe ISK Currency Guide](https://stripe.com/docs/currencies#zero-decimal)
- [Stripe Checkout Guide](https://stripe.com/docs/payments/checkout)
- [Stripe Testing Cards](https://stripe.com/docs/testing)
- [Stripe Radar (Fraud Prevention)](https://stripe.com/docs/radar)

## 🆘 Getting Help

- [Stripe Support](https://support.stripe.com)
- [Stripe Discord](https://discord.gg/stripe)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/stripe-payments)

---

**Next Steps**: Test your payment flow end-to-end in test mode before going live!
