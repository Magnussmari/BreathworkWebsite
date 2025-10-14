-- Performance indexes for Nordic Breath Platform
-- Run with: psql $DATABASE_URL -f scripts/add-performance-indexes.sql

-- User table indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- Registration table indexes (most critical for performance)
CREATE INDEX IF NOT EXISTS idx_registrations_client_id ON registrations(client_id);
CREATE INDEX IF NOT EXISTS idx_registrations_class_id ON registrations(class_id);
CREATE INDEX IF NOT EXISTS idx_registrations_status ON registrations(status);
CREATE INDEX IF NOT EXISTS idx_registrations_payment_status ON registrations(payment_status);
CREATE INDEX IF NOT EXISTS idx_registrations_created_at ON registrations(created_at);
CREATE INDEX IF NOT EXISTS idx_registrations_payment_deadline ON registrations(payment_deadline);

-- Class table indexes
CREATE INDEX IF NOT EXISTS idx_classes_template_id ON classes(template_id);
CREATE INDEX IF NOT EXISTS idx_classes_scheduled_date ON classes(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_classes_status ON classes(status);
CREATE INDEX IF NOT EXISTS idx_classes_current_bookings ON classes(current_bookings);

-- Class template indexes
CREATE INDEX IF NOT EXISTS idx_class_templates_is_active ON class_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_class_templates_is_default ON class_templates(is_default);

-- Booking table indexes (legacy system)
CREATE INDEX IF NOT EXISTS idx_bookings_client_id ON bookings(client_id);
CREATE INDEX IF NOT EXISTS idx_bookings_service_id ON bookings(service_id);
CREATE INDEX IF NOT EXISTS idx_bookings_instructor_id ON bookings(instructor_id);
CREATE INDEX IF NOT EXISTS idx_bookings_time_slot_id ON bookings(time_slot_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON bookings(created_at);

-- Time slot indexes
CREATE INDEX IF NOT EXISTS idx_time_slots_instructor_id ON time_slots(instructor_id);
CREATE INDEX IF NOT EXISTS idx_time_slots_service_id ON time_slots(service_id);
CREATE INDEX IF NOT EXISTS idx_time_slots_start_time ON time_slots(start_time);
CREATE INDEX IF NOT EXISTS idx_time_slots_is_available ON time_slots(is_available);

-- Instructor indexes
CREATE INDEX IF NOT EXISTS idx_instructors_user_id ON instructors(user_id);
CREATE INDEX IF NOT EXISTS idx_instructors_is_active ON instructors(is_active);

-- Availability indexes
CREATE INDEX IF NOT EXISTS idx_availability_instructor_id ON availability(instructor_id);
CREATE INDEX IF NOT EXISTS idx_availability_day_of_week ON availability(day_of_week);
CREATE INDEX IF NOT EXISTS idx_availability_is_active ON availability(is_active);

-- Waitlist indexes
CREATE INDEX IF NOT EXISTS idx_waitlist_client_id ON waitlist(client_id);
CREATE INDEX IF NOT EXISTS idx_waitlist_time_slot_id ON waitlist(time_slot_id);
CREATE INDEX IF NOT EXISTS idx_waitlist_is_active ON waitlist(is_active);
CREATE INDEX IF NOT EXISTS idx_waitlist_position ON waitlist(position);

-- Invoice indexes
CREATE INDEX IF NOT EXISTS idx_customer_invoices_client_id ON customer_invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_customer_invoices_status ON customer_invoices(status);
CREATE INDEX IF NOT EXISTS idx_customer_invoices_created_at ON customer_invoices(created_at);

CREATE INDEX IF NOT EXISTS idx_company_invoices_status ON company_invoices(status);
CREATE INDEX IF NOT EXISTS idx_company_invoices_created_at ON company_invoices(created_at);

-- Voucher indexes
CREATE INDEX IF NOT EXISTS idx_vouchers_code ON vouchers(code);
CREATE INDEX IF NOT EXISTS idx_vouchers_is_active ON vouchers(is_active);
CREATE INDEX IF NOT EXISTS idx_vouchers_valid_until ON vouchers(valid_until);

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_registrations_class_status ON registrations(class_id, status);
CREATE INDEX IF NOT EXISTS idx_classes_scheduled_status ON classes(scheduled_date, status);
CREATE INDEX IF NOT EXISTS idx_time_slots_service_available ON time_slots(service_id, is_available, start_time);

-- Analyze tables to update statistics
ANALYZE users;
ANALYZE registrations;
ANALYZE classes;
ANALYZE class_templates;
ANALYZE bookings;
ANALYZE time_slots;
ANALYZE instructors;
ANALYZE availability;
ANALYZE waitlist;
ANALYZE customer_invoices;
ANALYZE company_invoices;
ANALYZE vouchers;