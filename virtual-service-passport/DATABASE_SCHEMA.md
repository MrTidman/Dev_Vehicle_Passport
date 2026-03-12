# Vehicle Passport - Database Schema Documentation

> Last Updated: 2025-03-12
> 

## Overview

This document describes the Supabase (PostgreSQL) database schema for the Vehicle Passport application. All tables use UUID primary keys and implement Row Level Security (RLS) policies.

---

## Tables

### 1. `cars`

The primary table storing vehicle information.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | UUID | No | Primary key, auto-generated |
| `vin` | VARCHAR(17) | Yes | Vehicle Identification Number |
| `registration` | VARCHAR(20) | Yes | Vehicle registration number |
| `make` | VARCHAR(100) | Yes | Vehicle manufacturer |
| `model` | VARCHAR(100) | Yes | Vehicle model name |
| `year` | INTEGER | Yes | Year of manufacture |
| `fuel_type` | VARCHAR(50) | Yes | Fuel type (petrol, diesel, electric, etc.) |
| `engine_cc` | INTEGER | Yes | Engine displacement in cc |
| `colour` | VARCHAR(50) | Yes | Vehicle colour |
| `notes` | TEXT | Yes | Owner notes about the vehicle |
| `shortcode` | VARCHAR(8) | Yes | Unique shortcode (e.g., VSP-ABC123) |
| `owner_id` | UUID | No | **DEPRECATED** - Use `car_permissions` instead |
| `created_by` | UUID | No | User ID who created the car record |
| `created_at` | TIMESTAMPTZ | No | Timestamp of record creation |

**Indexes:**
- `idx_cars_shortcode` on `shortcode` (UNIQUE)

**Relationships:**
- One-to-many with `car_permissions` (via `car_id`)
- One-to-many with `service_records` (via `car_id`)
- One-to-many with `reminders` (via `car_id`)
- One-to-many with `ownership_transfers` (via `car_id`)
- One-to-many with `note_journal` (via `car_id`)

---

### 2. `car_permissions`

Manages user access to cars with role-based permissions.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | UUID | No | Primary key |
| `car_id` | UUID | No | Foreign key to `cars(id)` |
| `user_id` | UUID | No | Foreign key to `auth.users(id)` |
| `role` | VARCHAR(20) | No | Permission role: `owner`, `mechanic`, or `viewer` |
| `granted_by` | UUID | Yes | User ID who granted this permission |
| `created_at` | TIMESTAMPTZ | No | Timestamp of permission creation |

**Relationships:**
- Many-to-one with `cars` (via `car_id`)
- Many-to-one with `auth.users` (via `user_id` and `granted_by`)

**Roles:**
- `owner` - Full control, can transfer ownership, update notes
- `mechanic` - Can add service records and reminders
- `viewer` - Read-only access

---

### 3. `service_records`

Stores vehicle service and maintenance history.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | UUID | No | Primary key |
| `car_id` | UUID | No | Foreign key to `cars(id)` |
| `added_by` | UUID | No | User who added the record |
| `service_date` | DATE | No | Date of service |
| `service_type` | VARCHAR(100) | Yes | Type of service performed |
| `description` | TEXT | Yes | Service description/notes |
| `mileage` | INTEGER | Yes | Odometer reading at service |
| `cost` | DECIMAL(10,2) | Yes | Cost of service |
| `garage_name` | VARCHAR(255) | Yes | Name of garage/service center |
| `receipts` | TEXT[] | Yes | Array of file URLs for receipts |
| `created_at` | TIMESTAMPTZ | No | Timestamp of record creation |

**Relationships:**
- Many-to-one with `cars` (via `car_id`)

---

### 4. `reminders`

Tracks upcoming due dates for vehicle-related tasks.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | UUID | No | Primary key |
| `car_id` | UUID | No | Foreign key to `cars(id)` |
| `reminder_type` | VARCHAR(20) | No | Type: `MOT`, `tax`, `insurance`, `service`, `custom` |
| `title` | VARCHAR(255) | Yes | Custom title for the reminder |
| `description` | TEXT | Yes | Additional details |
| `due_date` | DATE | No | When the reminder is due |
| `repeat_interval` | VARCHAR(20) | Yes | Repeat: `yearly`, `6month`, `3month`, `monthly` |
| `completed` | BOOLEAN | No | Whether reminder has been completed |
| `created_by` | UUID | No | User who created the reminder |
| `created_at` | TIMESTAMPTZ | No | Timestamp of record creation |

**Relationships:**
- Many-to-one with `cars` (via `car_id`)

---

### 5. `ownership_transfers`

Handles vehicle ownership transfer tokens.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | UUID | No | Primary key |
| `car_id` | UUID | No | Foreign key to `cars(id)` |
| `seller_id` | UUID | No | Current owner's user ID |
| `new_owner_email` | VARCHAR(255) | No | Email of new owner |
| `token` | VARCHAR(64) | No | Unique transfer acceptance token |
| `accepted` | BOOLEAN | No | Whether transfer has been accepted |
| `created_at` | TIMESTAMPTZ | No | Timestamp of transfer creation |
| `accepted_at` | TIMESTAMPTZ | Yes | When transfer was accepted |

**Relationships:**
- Many-to-one with `cars` (via `car_id`)

---

### 6. `note_journal`

Audit log for changes to car notes.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | UUID | No | Primary key |
| `car_id` | UUID | No | Foreign key to `cars(id)` |
| `user_id` | UUID | No | Foreign key to `auth.users(id)` |
| `content` | TEXT | No | Note content at time of change |
| `created_at` | TIMESTAMPTZ | No | Timestamp of journal entry |

**Relationships:**
- Many-to-one with `cars` (via `car_id`)
- Many-to-one with `auth.users` (via `user_id`)

**Migration Notes:**
- Created in migration `001_note_journal.sql`

---

### 7. `profiles`

Extended user profile information (supplements Supabase auth.users).

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | UUID | No | Primary key (matches auth.users.id) |
| `full_name` | VARCHAR(255) | Yes | User's full name |
| `updated_at` | TIMESTAMPTZ | Yes | Last profile update |

**Note:** This table is referenced but may need to be created separately via Supabase dashboard or additional migration.

---

## Supabase Storage

### Bucket: `vehicle-files`

Storage bucket for uploading vehicle documents (receipts, photos, etc.).

**Path Structure:**
```
${car_id}/${user_id}/${filename}
```

**Constraints:**
- Max file size: 10MB
- Filenames are sanitized to prevent path traversal

---

## Edge Functions

**Status:** No edge functions are currently defined in this codebase. All database operations are performed client-side via the Supabase JavaScript client.

---

## NPM Dependencies

### Production Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@supabase/supabase-js` | ^2.99.0 | Supabase client for database and auth |
| `@tanstack/react-query` | ^5.90.21 | Data fetching and caching |
| `react` | ^19.2.0 | React UI library |
| `react-dom` | ^19.2.0 | React DOM renderer |
| `react-router-dom` | ^7.13.1 | Client-side routing |
| `react-hook-form` | ^7.71.2 | Form handling |
| `@hookform/resolvers` | ^5.2.2 | Zod validation integration |
| `zod` | ^4.3.6 | Schema validation |
| `lucide-react` | ^0.577.0 | Icon library |
| `tailwindcss` | ^3.4.19 | CSS framework |
| `autoprefixer` | ^10.4.27 | CSS post-processing |
| `postcss` | ^8.5.8 | CSS transformation |

### Development Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `typescript` | ~5.9.3 | TypeScript language support |
| `@types/react` | ^19.2.7 | React type definitions |
| `@types/react-dom` | ^19.2.3 | React DOM types |
| `@types/node` | ^24.10.1 | Node.js type definitions |
| `vite` | ^7.3.1 | Build tool and dev server |
| `@vitejs/plugin-react` | ^5.1.1 | Vite React plugin |
| `eslint` | ^9.39.1 | Linting |
| `@eslint/js` | ^9.39.1 | ESLint JavaScript support |
| `typescript-eslint` | ^8.48.0 | TypeScript ESLint support |
| `eslint-plugin-react-hooks` | ^7.0.1 | React hooks linting |
| `eslint-plugin-react-refresh` | ^0.4.24 | React refresh linting |
| `@playwright/test` | ^1.58.2 | E2E testing framework |
| `marked` | ^17.0.4 | Markdown parsing |

---

## Notes & Inconsistencies

### Missing/Documentation Issues

1. **No comprehensive schema documentation exists** - This document was created to fill that gap.

2. **`profiles` table is referenced but not defined** - The code attempts to update `profiles` table, but there's no migration defining it. Either:
   - The table exists in Supabase but wasn't committed to version control
   - It should be created via a new migration

3. **`owner_id` field is deprecated** - The `cars` table has `owner_id` but the codebase now uses `car_permissions` for ownership. This field appears to be unused in current code.

4. **`OwnershipTransfer` TypeScript type differs from database schema** - The type in `src/types/index.ts` has `buyer_id` and `status` fields that don't appear in database operations. Only `seller_id`, `token`, `accepted`, and `accepted_at` are used in the actual queries.

5. **No database triggers for auto-populating fields** - Some values like `created_at` rely on default database values rather than explicit inserts.

### Security

- All tables (except migrations for note_journal) implement Row Level Security (RLS)
- RLS policies enforce that users can only access cars they have permissions for

---

## Row Level Security (RLS) Policies

All tables implement Row Level Security (RLS) to ensure users can only access data they own or have been granted permission to view. RLS is **enabled** on all tables.

### Policy Overview

| Table | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| `cars` | ✅ | ✅ | ✅ | ❌ (owner only via app logic) |
| `car_permissions` | ✅ | ✅ | ✅ | ❌ |
| `service_records` | ✅ | ✅ | ✅ | ✅ |
| `reminders` | ✅ | ✅ | ✅ | ✅ |
| `ownership_transfers` | ✅ | ✅ | ✅ | ✅ |
| `note_journal` | ✅ | ✅ | ❌ | ❌ |

### Detailed Policies

#### 1. `cars`

Users can only access cars they created.

```sql
-- SELECT: User can only see their own cars
CREATE POLICY "Users can view their own cars" ON cars
  FOR SELECT USING (created_by = auth.uid());

-- INSERT: User can only create cars for themselves
CREATE POLICY "Users can insert their own cars" ON cars
  FOR INSERT WITH CHECK (created_by = auth.uid());

-- UPDATE: User can only update their own cars
CREATE POLICY "Users can update their own cars" ON cars
  FOR UPDATE USING (created_by = auth.uid());
```

#### 2. `car_permissions`

Users can view permissions where they are the grantee, OR view permissions for cars they own.

```sql
-- SELECT: See permissions if you're the user OR you own the car
CREATE POLICY "Users can view permissions they own or are granted" ON car_permissions
  FOR SELECT USING (
    user_id = auth.uid() OR 
    car_id IN (SELECT id FROM cars WHERE created_by = auth.uid())
  );

-- INSERT: Same logic
CREATE POLICY "Users can insert permissions for their cars" ON car_permissions
  FOR INSERT WITH CHECK (
    user_id = auth.uid() OR 
    car_id IN (SELECT id FROM cars WHERE created_by = auth.uid())
  );

-- UPDATE: Same logic
CREATE POLICY "Users can update permissions for their cars" ON car_permissions
  FOR UPDATE USING (
    user_id = auth.uid() OR 
    car_id IN (SELECT id FROM cars WHERE created_by = auth.uid())
  );
```

#### 3. `service_records`

Users can access service records for cars they have any permission on (owner, mechanic, or viewer).

```sql
-- SELECT, INSERT, UPDATE, DELETE: Via car_permissions
CREATE POLICY "Users can manage service records for permitted cars" ON service_records
  FOR ALL USING (
    car_id IN (SELECT car_id FROM car_permissions WHERE user_id = auth.uid())
  );
```

#### 4. `reminders`

Users can access reminders for cars they have any permission on. Uses `car_permissions` rather than `created_by` for consistency with other tables.

```sql
-- SELECT, INSERT, UPDATE, DELETE: Via car_permissions
CREATE POLICY "Users can manage reminders for permitted cars" ON reminders
  FOR ALL USING (
    car_id IN (SELECT car_id FROM car_permissions WHERE user_id = auth.uid())
  );
```

#### 5. `ownership_transfers`

Users can access ownership transfers for cars they have any permission on.

```sql
-- SELECT, INSERT, UPDATE, DELETE: Via car_permissions
CREATE POLICY "Users can manage ownership transfers for permitted cars" ON ownership_transfers
  FOR ALL USING (
    car_id IN (SELECT car_id FROM car_permissions WHERE user_id = auth.uid())
  );
```

**Note:** The application layer should verify `seller_id = auth.uid()` before creating transfer requests to ensure only the current owner can initiate transfers.

#### 6. `note_journal`

Audit log for car notes. Users can view their own journal entries OR entries for cars they have permission on. INSERT requires the user to be creating their own entry.

```sql
-- SELECT: Own entries OR entries for permitted cars
CREATE POLICY "Users can view note journal for permitted cars" ON note_journal
  FOR SELECT USING (
    user_id = auth.uid() OR 
    car_id IN (SELECT car_id FROM car_permissions WHERE user_id = auth.uid())
  );

-- INSERT: Must be creating your own entry
CREATE POLICY "Users can insert their own note journal entries" ON note_journal
  FOR INSERT WITH CHECK (user_id = auth.uid());
```

### Known Policy Gaps

1. **No DELETE policy on `car_permissions`** - Orphaned permissions could remain if not cleaned up at application level
2. **No UPDATE policy on `note_journal`** - Intentional; audit logs should be immutable
3. **`ownership_transfers` doesn't verify seller** - Application must check `seller_id = auth.uid()` before creating transfers
4. **`service_records`/`reminders` allow deletion by any permission holder** - Could be tightened to only owner/mechanic roles

### Security Considerations

- RLS policies use `auth.uid()` which is set by Supabase after authentication
- The `car_permissions` table is the central hub for access control across all related tables
- Role-based access (`owner`, `mechanic`, `viewer`) is enforced at application level, not database level
- Consider adding role-specific policies for stricter access control (e.g., only `owner` can delete)

---

## Environment Variables

```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```