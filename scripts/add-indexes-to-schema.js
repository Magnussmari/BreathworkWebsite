import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the current schema file
const schemaPath = path.join(__dirname, '../shared/schema.ts');
let schemaContent = fs.readFileSync(schemaPath, 'utf8');

// Add index definitions to the schema
const indexDefinitions = `
// Performance indexes
export const userIndexes = {
  email: index("idx_users_email").on(users.email),
  role: index("idx_users_role").on(users.role),
  createdAt: index("idx_users_created_at").on(users.createdAt),
};

export const registrationIndexes = {
  clientId: index("idx_registrations_client_id").on(registrations.clientId),
  classId: index("idx_registrations_class_id").on(registrations.classId),
  status: index("idx_registrations_status").on(registrations.status),
  paymentStatus: index("idx_registrations_payment_status").on(registrations.paymentStatus),
  createdAt: index("idx_registrations_created_at").on(registrations.createdAt),
  paymentDeadline: index("idx_registrations_payment_deadline").on(registrations.paymentDeadline),
  classStatus: index("idx_registrations_class_status").on(registrations.classId, registrations.status),
};

export const classIndexes = {
  templateId: index("idx_classes_template_id").on(classes.templateId),
  scheduledDate: index("idx_classes_scheduled_date").on(classes.scheduledDate),
  status: index("idx_classes_status").on(classes.status),
  currentBookings: index("idx_classes_current_bookings").on(classes.currentBookings),
  scheduledStatus: index("idx_classes_scheduled_status").on(classes.scheduledDate, classes.status),
};

export const classTemplateIndexes = {
  isActive: index("idx_class_templates_is_active").on(classTemplates.isActive),
  isDefault: index("idx_class_templates_is_default").on(classTemplates.isDefault),
};

export const bookingIndexes = {
  clientId: index("idx_bookings_client_id").on(bookings.clientId),
  serviceId: index("idx_bookings_service_id").on(bookings.serviceId),
  instructorId: index("idx_bookings_instructor_id").on(bookings.instructorId),
  timeSlotId: index("idx_bookings_time_slot_id").on(bookings.timeSlotId),
  status: index("idx_bookings_status").on(bookings.status),
  createdAt: index("idx_bookings_created_at").on(bookings.createdAt),
};

export const timeSlotIndexes = {
  instructorId: index("idx_time_slots_instructor_id").on(timeSlots.instructorId),
  serviceId: index("idx_time_slots_service_id").on(timeSlots.serviceId),
  startTime: index("idx_time_slots_start_time").on(timeSlots.startTime),
  isAvailable: index("idx_time_slots_is_available").on(timeSlots.isAvailable),
  serviceAvailable: index("idx_time_slots_service_available").on(timeSlots.serviceId, timeSlots.isAvailable, timeSlots.startTime),
};

export const instructorIndexes = {
  userId: index("idx_instructors_user_id").on(instructors.userId),
  isActive: index("idx_instructors_is_active").on(instructors.isActive),
};

export const availabilityIndexes = {
  instructorId: index("idx_availability_instructor_id").on(availability.instructorId),
  dayOfWeek: index("idx_availability_day_of_week").on(availability.dayOfWeek),
  isActive: index("idx_availability_is_active").on(availability.isActive),
};

export const waitlistIndexes = {
  clientId: index("idx_waitlist_client_id").on(waitlist.clientId),
  timeSlotId: index("idx_waitlist_time_slot_id").on(waitlist.timeSlotId),
  isActive: index("idx_waitlist_is_active").on(waitlist.isActive),
  position: index("idx_waitlist_position").on(waitlist.position),
};

export const customerInvoiceIndexes = {
  clientId: index("idx_customer_invoices_client_id").on(customerInvoices.clientId),
  status: index("idx_customer_invoices_status").on(customerInvoices.status),
  createdAt: index("idx_customer_invoices_created_at").on(customerInvoices.createdAt),
};

export const companyInvoiceIndexes = {
  status: index("idx_company_invoices_status").on(companyInvoices.status),
  createdAt: index("idx_company_invoices_created_at").on(companyInvoices.createdAt),
};

export const voucherIndexes = {
  code: index("idx_vouchers_code").on(vouchers.code),
  isActive: index("idx_vouchers_is_active").on(vouchers.isActive),
  validUntil: index("idx_vouchers_valid_until").on(vouchers.validUntil),
};
`;

// Add the index definitions before the relations section
const relationsIndex = schemaContent.indexOf('// Relations');
if (relationsIndex !== -1) {
  schemaContent = schemaContent.slice(0, relationsIndex) + indexDefinitions + '\n' + schemaContent.slice(relationsIndex);
} else {
  // If no relations section found, add at the end
  schemaContent += '\n' + indexDefinitions;
}

// Write the updated schema
fs.writeFileSync(schemaPath, schemaContent);
console.log('✅ Added index definitions to schema.ts');
console.log('📊 Run "npm run db:push" to apply the indexes to the database');