# Database Indexes Application Guide

## Option 1: Using psql (Recommended)

If you have direct database access, run the following SQL commands:

```bash
# Connect to your database
psql $DATABASE_URL

# Then run the SQL file
\i scripts/add-performance-indexes.sql
```

## Option 2: Using the Node.js script

When your DATABASE_URL is set, run:

```bash
# Set your database URL
export DATABASE_URL="your-database-connection-string"

# Run the index application script
node scripts/apply-indexes.js
```

## Option 3: Manual SQL Execution

Copy and paste the contents of `scripts/add-performance-indexes.sql` into your database management tool (pgAdmin, DBeaver, etc.).

## Expected Results

After applying the indexes, you should see:
- ✅ 20+ indexes created
- 📈 Significant performance improvement for queries
- 🔍 Faster lookups on frequently queried columns

## Verification

To verify indexes were created, run:

```sql
-- Check indexes on registrations table
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'registrations';

-- Check indexes on classes table  
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'classes';
```

## Performance Impact

These indexes will improve performance for:
- User lookups by email
- Registration queries by class and user
- Class queries by date and status
- Booking queries by various filters
- Time slot availability checks