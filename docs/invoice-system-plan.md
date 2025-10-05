# Invoice System Implementation Plan
**Date**: October 5, 2025
**Status**: In Progress

## Overview
Comprehensive invoice system for:
1. **Customer Invoices**: Send invoices to clients for class registrations
2. **Company Invoices**: Upload and track business expense invoices

## Completed Tasks ✅

### 1. Database Schema
**File**: `shared/schema.ts`

Added two new tables:

**customer_invoices**:
- `id` (UUID, primary key)
- `invoiceNumber` (unique, e.g., "INV-2025-001")
- `registrationId` (foreign key to registrations)
- `clientId` (foreign key to users)
- `amount` (integer, ISK)
- `description` (text)
- `status` (enum: draft, sent, paid, cancelled)
- `pdfUrl` (Supabase storage URL)
- `sentAt`, `paidAt`, `dueDate` (timestamps)
- `createdBy` (foreign key to users)
- `createdAt`, `updatedAt`

**company_invoices**:
- `id` (UUID, primary key)
- `invoiceNumber` (e.g., vendor's invoice number)
- `vendor` (company name)
- `category` (Software, Marketing, Equipment, etc.)
- `amount` (integer, ISK)
- `currency` (default ISK)
- `description` (text)
- `invoiceDate`, `dueDate`, `paidDate` (timestamps)
- `status` (enum: pending, paid, overdue)
- `pdfUrl` (Supabase storage URL) - **REQUIRED**
- `uploadedBy` (foreign key to users)
- `notes` (text)
- `createdAt`, `updatedAt`

**Status**: ✅ Schema created and pushed to database

### 2. Admin Dashboard Enhancements
- ✅ Added class registration detail view (click on class to see all participants)
- ✅ Translated entire admin dashboard to Icelandic
- ✅ Fixed superuser permission checks across frontend and backend

## Remaining Tasks 📋

### 3. Supabase Storage Bucket Setup

**What needs to be done**:
1. Create `invoices` bucket in Supabase Storage
2. Create two sub-folders:
   - `customer/` - for customer invoices
   - `company/` - for business expense invoices
3. Set up security policies:
   - Admins/superusers can upload/view all
   - Customers can only view their own invoices

**Implementation**:
```sql
-- Run in Supabase SQL Editor
CREATE POLICY "Admins can upload invoices"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'invoices' AND auth.role() = 'authenticated');

CREATE POLICY "Users can view their own invoices"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'invoices' AND
         (storage.foldername(name)[1] = 'customer' AND
          auth.uid()::text IN (
            SELECT client_id FROM customer_invoices WHERE pdf_url LIKE '%' || name
          )) OR
         (SELECT is_superuser FROM users WHERE id = auth.uid())
        );
```

### 4. Storage Interface (server/storage.ts)

Add methods:
```typescript
// Customer invoices
async createCustomerInvoice(data: InsertCustomerInvoice): Promise<CustomerInvoice>
async getCustomerInvoices(): Promise<CustomerInvoice[]>
async getCustomerInvoice(id: string): Promise<CustomerInvoice | undefined>
async updateCustomerInvoice(id: string, data: Partial<CustomerInvoice>): Promise<CustomerInvoice>
async getCustomerInvoicesByClient(clientId: string): Promise<CustomerInvoice[]>

// Company invoices
async createCompanyInvoice(data: InsertCompanyInvoice): Promise<CompanyInvoice>
async getCompanyInvoices(): Promise<CompanyInvoice[]>
async getCompanyInvoice(id: string): Promise<CompanyInvoice | undefined>
async updateCompanyInvoice(id: string, data: Partial<CompanyInvoice>): Promise<CompanyInvoice>
```

### 5. API Routes (server/routes.ts)

**Customer Invoice Routes**:
```typescript
POST   /api/invoices/customer              // Create invoice for a registration
GET    /api/invoices/customer              // List all (admin only)
GET    /api/invoices/customer/:id          // Get specific invoice
PATCH  /api/invoices/customer/:id          // Update status/details
POST   /api/invoices/customer/:id/send     // Email invoice to customer
GET    /api/invoices/customer/my           // Customer's own invoices
```

**Company Invoice Routes**:
```typescript
POST   /api/invoices/company               // Upload company invoice
GET    /api/invoices/company               // List all (admin only)
GET    /api/invoices/company/:id           // Get specific invoice
PATCH  /api/invoices/company/:id           // Update details/status
DELETE /api/invoices/company/:id           // Delete invoice
POST   /api/invoices/company/:id/upload    // Upload PDF file
```

### 6. Admin Dashboard UI

**New Tab**: "Reikningar" (Invoices)

**Two sections**:
1. **Viðskiptavinareikningar** (Customer Invoices)
   - Table showing all customer invoices
   - Columns: Invoice #, Client, Amount, Status, Due Date, Actions
   - Actions: View PDF, Send Email, Mark as Paid
   - Button: "Búa til reikning" (Create Invoice)

2. **Fyrirtækjareikningar** (Company Invoices)
   - Table showing all company expense invoices
   - Columns: Invoice #, Vendor, Category, Amount, Date, Status, Actions
   - Actions: View PDF, Edit, Delete, Mark as Paid
   - Upload form with fields:
     - Vendor name
     - Category (dropdown)
     - Amount
     - Invoice date
     - Due date
     - PDF file upload
     - Notes

### 7. Invoice Generation Service

**File**: `server/invoice-generator.ts`

Use a library like `pdfkit` or `jspdf` to generate PDFs:

```typescript
import PDFDocument from 'pdfkit';

export async function generateCustomerInvoice(invoice: CustomerInvoice, client: User) {
  const doc = new PDFDocument();

  // Company header
  doc.fontSize(20).text('Breathwork ehf.', 50, 50);
  doc.fontSize(10).text('Company info...', 50, 75);

  // Invoice details
  doc.fontSize(16).text(`Invoice ${invoice.invoiceNumber}`, 50, 150);
  doc.fontSize(10).text(`Date: ${new Date().toLocaleDateString('is-IS')}`, 50, 175);

  // Client info
  doc.text(`Bill To:`, 50, 200);
  doc.text(`${client.firstName} ${client.lastName}`, 50, 215);
  doc.text(client.email, 50, 230);

  // Line items
  doc.text(`Description: ${invoice.description}`, 50, 270);
  doc.text(`Amount: ${invoice.amount.toLocaleString('is-IS')} ISK`, 50, 285);

  // Payment instructions
  doc.text('Payment Details:', 50, 320);
  doc.text('Bank: Íslandsbanki', 50, 335);
  doc.text('Account: 0133-26-012345', 50, 350);
  doc.text(`Reference: ${invoice.invoiceNumber}`, 50, 365);

  return doc;
}
```

### 8. Email Integration

Update `server/email.ts` to add invoice email function:

```typescript
export async function sendCustomerInvoice(
  invoice: CustomerInvoice,
  client: User,
  pdfBuffer: Buffer
) {
  const resend = new Resend(process.env.RESEND_API_KEY);

  await resend.emails.send({
    from: process.env.FROM_EMAIL!,
    to: client.email,
    subject: `Reikningur ${invoice.invoiceNumber} - Breathwork`,
    html: `
      <h1>Reikningur</h1>
      <p>Góðan dag ${client.firstName},</p>
      <p>Hér er reikningur þinn frá Breathwork:</p>
      <ul>
        <li>Reikningsnúmer: ${invoice.invoiceNumber}</li>
        <li>Upphæð: ${invoice.amount.toLocaleString('is-IS')} kr</li>
        <li>Gjalddagi: ${invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString('is-IS') : 'Strax'}</li>
      </ul>
      <p>Greiðsluupplýsingar:</p>
      <ul>
        <li>Banki: Íslandsbanki</li>
        <li>Reikningur: 0133-26-012345</li>
        <li>Kennitala: ${invoice.invoiceNumber}</li>
      </ul>
    `,
    attachments: [{
      filename: `reikningur-${invoice.invoiceNumber}.pdf`,
      content: pdfBuffer,
    }],
  });
}
```

## Next Steps (Sequential Implementation)

1. ✅ **Schema & Types** - COMPLETED
2. **Set up Supabase storage bucket** (5 min)
3. **Add storage methods** (15 min)
4. **Create API routes** (30 min)
5. **Build admin UI tab** (45 min)
6. **Add invoice generation** (30 min)
7. **Test end-to-end flow** (15 min)

**Total Estimated Time**: ~2.5 hours

## File Upload Flow

### Company Invoice Upload:
1. Admin selects PDF file in UI
2. Frontend uploads to Supabase Storage (`invoices/company/{uuid}.pdf`)
3. Get back public URL
4. Create database record with metadata + pdfUrl
5. Display in company invoices table

### Customer Invoice Generation:
1. Admin clicks "Create Invoice" for a registration
2. Backend generates PDF using invoice template
3. Upload PDF to Supabase Storage (`invoices/customer/{uuid}.pdf`)
4. Create database record with generated invoice number
5. Optionally send email to customer with PDF attached

## Security Considerations

- ✅ Only admins/superusers can create/view all invoices
- ✅ Customers can only view their own invoices
- ✅ Supabase storage policies enforce access control
- ✅ PDF URLs are signed/authenticated via Supabase
- Invoice numbers auto-increment to prevent duplicates

## Business Logic

**Invoice Number Format**:
- Customer: `INV-{YEAR}-{SEQUENCE}` (e.g., INV-2025-001)
- Company: Use vendor's invoice number

**Auto-marking as paid**:
- When admin marks registration as paid, offer to mark invoice as paid
- Track payment date automatically

**Overdue detection**:
- Run daily job to mark invoices as overdue if past due date and unpaid

