# Debugging Guide - Breathwork Booking System

## Algengar villur og lausnir

### 1. "Bókun mistókst - Unexpected token" Villa

**Einkennandi:**
- Kemur þegar notandi reynir að bóka tíma
- Frontend sýnir "Bókun mistókst" með "Unexpected token" villumelding
- Backend skilar `200` en frontend getur ekki parsað JSON

**Mögulegar orsakir:**

#### A. Backend skilar tómri response
```javascript
// Backend
res.json(undefined)  // ❌ Skilar tómu
res.json(null)        // ❌ Skilar null
```

**Lausn:** Gakktu úr skugga um að `storage.createRegistration()` skili registr

ation object.

#### B. JSON parse villa í frontend
```javascript
// Frontend
const data = await response.json();  // ❌ Getur kastað villu ef response er ekki JSON
```

**Lausn:** Notaðu betri error handling:
```javascript
const text = await response.text();
if (!text) throw new Error("Engin svar frá bakenda");
const data = JSON.parse(text);
```

#### C. Database query mistókst án þess að kasta villu
```javascript
// Storage
const [item] = await db.insert(table).values(data).returning();
// item gæti verið undefined ef insert mistókst
```

**Lausn:** Bættu við validation:
```javascript
if (!item) throw new Error("Failed to create registration");
return item;
```

### Debugging Steps

**1. Athugaðu backend console:**
```bash
# Leitaðu að:
POST /api/registrations/reserve 200 in Xms

# Ef X < 10ms, þá er eitthvað að
# Normal er 50-500ms
```

**2. Bættu við console.log í backend:**
```typescript
console.log('Reserve request body:', req.body);
console.log('Creating reservation with data:', registrationData);
console.log('Created registration:', registration);
```

**3. Athugaðu browser console:**
```javascript
// Opnaðu DevTools → Console
// Leitaðu að:
// - JSON parse error
// - Network errors
// - Response preview
```

**4. Athugaðu Network tab:**
```
DevTools → Network → Click request → Preview/Response
- Skoðaðu hvað bakendinn er í raun að skila
- Ef tómt → villa í backend
- Ef HTML → villu síða
- Ef JSON → parsing villa í frontend
```

## Algengar Database Villur

### "column does not exist"
```
error: column "client_id" does not exist
```

**Orsök:** Schema breytingar ekki keyrðar á database.

**Lausn:**
```bash
npm run db:push
```

### "relation does not exist"
```
error: relation "registrations" does not exist
```

**Orsök:** Taflan var ekki búin til.

**Lausn:**
```bash
# 1. Athugaðu schema.ts
# 2. Keyrðu db:push
npm run db:push

# 3. Skoðaðu í Drizzle Studio
npm run db:studio
```

### "foreign key constraint violation"
```
error: insert or update on table "registrations" violates foreign key constraint
```

**Orsök:** Reynir að setja FK sem vísar í row sem er ekki til.

**Lausn:**
```sql
-- Athugaðu að classId sé til
SELECT * FROM classes WHERE id = 'uuid-here';

-- Athugaðu að clientId sé til
SELECT * FROM users WHERE id = 'uuid-here';
```

## Authentication Villur

### "Not authenticated"
```json
{"message": "Not authenticated"}
```

**Orsök:** Session cookie vantar eða er útrunnið.

**Lausn:**
```bash
# 1. Athugaðu cookies í DevTools → Application → Cookies
# 2. Leita að session_token
# 3. Ef vantar → login aftur
```

### "Invalid session"
```json
{"message": "Invalid session"}
```

**Orsök:** JWT token er invalid eða secret er vitlaust.

**Lausn:**
```bash
# 1. Athugaðu .env
SESSION_SECRET=your-secret-here

# 2. Restart server
npm run dev

# 3. Login aftur
```

## Email Villur

### Email er ekki sent
**Einkennandi:**
- Bókun virkar
- Engin email berst

**Debugging:**
```bash
# 1. Athugaðu .env
RESEND_API_KEY=re_...
FROM_EMAIL=bookings@breathwork.is

# 2. Athugaðu console
✓ Confirmation email sent to user@example.is
# eða
Failed to send confirmation email: Error...

# 3. Athugaðu Resend dashboard
# https://resend.com/emails
```

**Algengar orsakir:**
- API key vantar eða vitlaust
- Domain ekki verified í Resend
- FROM_EMAIL vitlaust
- Resend free tier limit náð (100/dag)

## Performance Villur

### Slow queries (> 1s)
```
POST /api/registrations/reserve 200 in 2500ms
```

**Orsök:** Engar indexes á oft-notuðum columns.

**Lausn:**
```typescript
// Í schema.ts
export const registrations = pgTable("registrations", {
  // ...
}, (table) => ({
  classIdIdx: index("class_id_idx").on(table.classId),
  clientIdIdx: index("client_id_idx").on(table.clientId),
}));
```

### Memory leak
**Einkennandi:**
- Server hægist á sér
- RAM usage hækkar stöðugt

**Orsök:** Background timers eða intervals ekki clearaðir.

**Lausn:**
```typescript
useEffect(() => {
  const timer = setInterval(() => {...}, 1000);
  return () => clearInterval(timer);  // ✅ Cleanup
}, [deps]);
```

## Testing Checklist

Þegar þú ert að debugga nýja feature:

- [ ] Backend console sýnir request/response
- [ ] Browser console sýnir engar villur
- [ ] Network tab sýnir 200 OK
- [ ] Response er valid JSON
- [ ] Database row var búin til
- [ ] React Query cache uppfærðist
- [ ] UI uppfærðist rétt
- [ ] Email var sent (ef á við)

## Gagnleg tól

### Backend debugging
```bash
# Fylgjast með logs
tail -f server.log

# Athuga hvort port er í notkun
lsof -i :5000

# Kill process á port
lsof -ti:5000 | xargs kill -9
```

### Database debugging
```bash
# Opna Drizzle Studio
npm run db:studio

# Connect til database directly
psql $DATABASE_URL

# Útflutningur data
psql $DATABASE_URL -c "SELECT * FROM registrations" > registrations.csv
```

### Frontend debugging
```javascript
// React Query DevTools (already installed)
// Opnast sjálfkrafa í development

// Skoða state
console.log('User:', user);
console.log('Class:', classItem);
console.log('Registration:', registration);

// Force re-render
queryClient.invalidateQueries();
```

## Neyðarlausnir

### Kerfi algjörlega bilað
```bash
# 1. Stoppa allt
killall node

# 2. Hreinsa dependencies
rm -rf node_modules package-lock.json
npm install

# 3. Reset database (VARÚÐ: eyðir öllu)
# Í Supabase dashboard → Database → Tables → Delete all

# 4. Re-setup
npm run db:push
npx tsx scripts/setup-breathwork.js

# 5. Restart
npm run dev
```

### Git vandamál
```bash
# Discard all changes
git reset --hard HEAD
git clean -fd

# Fara til baka í working commit
git log --oneline
git reset --hard <commit-hash>
```

## Hafa samband

Ef ekkert virkar:
1. Afritaðu nákvæmlega villumelding
2. Taktu screenshot af Network tab
3. Afritaðu backend console output
4. Sendur á magnussmari@gmail.com

---

**Síðast uppfært:** 2025-10-04
