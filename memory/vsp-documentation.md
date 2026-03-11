# Virtual Service Passport - Technical Documentation

A comprehensive guide to how the Virtual Service Passport app works. Written for someone who understands tech but isn't a developer.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Authentication](#2-authentication)
3. [Core Features](#3-core-features)
4. [Data Model](#4-data-model)
5. [Security](#5-security)
6. [API / Backend](#6-api--backend)

---

## 1. Architecture Overview

### The Big Picture

Think of this app as a modern web application with three main layers:

```
┌─────────────────────────────────────────────────┐
│                 User's Browser                  │
│         (React + Vite - Frontend)               │
└─────────────────────┬───────────────────────────┘
                      │ HTTP/HTTPS
                      ▼
┌─────────────────────────────────────────────────┐
│              Cloud (Supabase)                   │
│     (Database + Auth + Real-time services)      │
└─────────────────────────────────────────────────┘
```

### Frontend: React + Vite

**React** is the UI library that builds the interactive screens. It's like a modern, component-based version of old-school HTML pages.

**Vite** is the build tool that packages everything up and makes it fast. When you run `npm run dev`, Vite starts a local development server.

The frontend uses:
- **React Router** - Handles navigation between pages (Dashboard → Car Detail → Add Car)
- **React Query** (TanStack Query) - Manages data fetching and caching. Think of it as a smart wrapper around HTTP requests that handles loading states, caching, and refreshing.
- **React Hook Form** - Handles form inputs (like the Add Car form) with built-in validation
- **Zod** - Validates form data (makes sure emails look like emails, years are reasonable, etc.)

### Backend: Supabase

**Supabase** is an open-source Firebase alternative. It's essentially a hosted PostgreSQL database with extra superpowers:

- **Authentication** - Handles sign up, login, sessions, password resets
- **Database** - PostgreSQL relational database
- **Row Level Security (RLS)** - Built-in security that controls who can see/edit what data
- **Real-time subscriptions** - Can push updates to connected clients (not currently used but available)

### How Data Flows: The Journey of Adding a Car

When a user adds a car, here's what happens behind the scenes:

1. **User fills the form** → React Hook Form captures the data
2. **Validation** → Zod checks everything looks correct (VIN is 17 chars, year is reasonable, etc.)
3. **API call** → The `addCar()` function in `lib/cars.ts` is called
4. **HTTP request** → Supabase client sends the data to Supabase's servers
5. **Database insert** → Supabase inserts the car record into the `cars` table
6. **Permission creation** → Another insert adds the user's permission as "owner" in `car_permissions`
7. **Response** → The newly created car comes back from the database
8. **UI update** → React Query invalidates its cache, triggering a refresh of the car list

---

## 2. Authentication

### How Users Sign Up

1. User visits `/register`
2. Enters email, password, and full name
3. `signUp()` function calls Supabase's auth API

```typescript
// What happens under the hood
const { error } = await supabase.auth.signUp({
  email,
  password,
  options: {
    data: { full_name: fullName } // Stored in user's metadata
  }
});
```

Supabase creates a user record and stores the password securely (hashed). The user's ID is a unique UUID.

### How Login Works

1. User visits `/login`
2. Enters email and password
3. `signIn()` function verifies credentials

```typescript
const { error } = await supabase.auth.signInWithPassword({
  email,
  password
});
```

If successful, Supabase returns a **session** containing:
- An **access token** (short-lived, for API requests)
- A **refresh token** (long-lived, to get new access tokens)

### Session Management

The app uses React Context to keep track of authentication state across the entire app:

```typescript
// AuthProvider wraps the entire app
<AuthProvider>
  <App />
</AuthProvider>

// Any component can access auth state
const { user, signOut } = useAuth();
```

On page load, the app:
1. Checks for an existing session with `supabase.auth.getSession()`
2. Sets up a listener for auth changes (`onAuthStateChange`)
3. Updates the UI accordingly

**Key insight**: Sessions are handled entirely by Supabase's client. The app just checks `user` to determine if someone is logged in. If `user` exists, they're in; if not, they're out.

### Protected Routes

The `ProtectedRoute` component in `App.tsx` acts as a gatekeeper:

```typescript
if (!user) {
  return <Navigate to="/" replace />; //Send to landing if not logged in
}
```

---

## 3. Core Features

### Adding a Car

**User flow**: Dashboard → "Add Car" button → Fill form → Submit → Back to Dashboard

**What happens**:
1. User enters VIN, registration, make, model, year, fuel type, colour
2. Form validation ensures VIN is 17 characters, year is reasonable, etc.
3. `addCar()` is called with the form data and user's ID

**Why this matters**: When a car is added, two things happen:
- A **car record** is created
- A **permission record** is created, granting the user "owner" access

This two-step process is crucial for the ownership transfer feature (see below).

### Viewing Car Details

**User flow**: Click a car card on Dashboard → Car Detail page

**What happens**:
1. The page fetches car details, service records, and reminders in parallel
2. Each query checks permissions first - if the user isn't allowed, the query fails
3. The UI displays everything with stats (total spent, service count)

**The permission check**:
```typescript
const permission = await checkCarPermission(carId, userId);
if (!permission) {
  throw new Error('Access denied');
}
```

This ensures users can only see cars they have permission to access.

### Service Records (Adding & Viewing)

Service records track every bit of work done on a car - MOTs, repairs, tyre changes, etc.

**Adding a service record**:
1. User clicks "Add" on the Service History section
2. Fills in date, type, description, mileage, cost, garage name
3. Submits the form
4. `addServiceRecord()` inserts the record

**Who can add?** - Only owners and mechanics. The code explicitly checks:

```typescript
const hasPermission = await checkCarWritePermission(carId, userId);
if (!hasPermission) {
  throw new Error('Access denied: You must be the owner or a mechanic');
}
```

### Reminders

Reminders keep track of upcoming deadlines - MOT, tax, insurance, service, or custom.

**Adding a reminder**:
1. User clicks "Add" on the Reminders section
2. Selects type (MOT, tax, insurance, service, custom)
3. Sets due date and optional repeat interval
4. Submits the form

**Reminder states**:
- **Upcoming** - Due in the future
- **Due Soon** - Due within 30 days (highlighted in amber)
- **Overdue** - Past due date (highlighted in red)
- **Completed** - User clicked the checkmark

**Repeating reminders**: If a repeat interval is set (yearly, 6-month, etc.), the user would need to manually recreate it after completion. (Note: The repeat logic isn't automatically creating new reminders yet - that's a potential enhancement.)

### Ownership Transfer

This is the "secret sauce" that makes the app useful for more than one person.

**How it works**:

1. **Owner initiates transfer**: On the Car Detail page, owner clicks "Transfer Ownership", enters the new owner's email
2. **Token generation**: The app generates a unique 32-character random token
3. **Transfer record created**: A record is saved in `ownership_transfers` with the token, car ID, seller's ID, and new owner's email
4. **Link generated**: A URL like `https://app.example.com/transfer/abc123...` is created
5. **Email sent** (logged, not actually sent yet): The link is given to the new owner

**Accepting transfer**:
1. New owner clicks the link
2. They're taken to `/transfer/:token`
3. If not logged in, they're prompted to sign up/login
4. The app verifies:
   - The token is valid and not already used
   - The logged-in user's email matches the transfer's target email
5. If everything checks out:
   - Transfer is marked as "accepted"
   - A new permission record is created, granting the new user "owner" role

**Why this is clever**: The old owner doesn't lose access automatically (they might want to keep a record). Both users now have owner access. The new owner can then choose to transfer to someone else later.

---

## 4. Data Model

The database has 5 main tables. Here's how they relate to each other:

```
┌──────────────┐       ┌──────────────────┐
│     auth     │       │      cars        │
│   .users     │       │                  │
├──────────────┤       ├──────────────────┤
│ id (UUID)    │       │ id (UUID)        │
│ email        │       │ vin              │
│ created_at   │       │ registration     │
└──────────────┘       │ make             │
                       │ model            │
        │              │ year             │
        │              │ fuel_type        │
        ▼              │ colour           │
┌──────────────────┐   │ created_by       │
│ car_permissions  │   │ created_at       │
├──────────────────┤   └────────┬─────────┘
│ id               │            │
│ car_id ──────────┼────────────┤
│ user_id ─────────┼────────────┤
│ role (owner/     │            │
│   mechanic/      │            │
│   viewer)        │            │
│ granted_by       │            │
│ created_at       │            │
└──────────────────┘            │
       │                        │
       ▼                        ▼
┌──────────────────┐   ┌──────────────────┐
│ service_records  │   │    reminders     │
├──────────────────┤   ├──────────────────┤
│ id               │   │ id               │
│ car_id ──────────┼───┤ car_id ──────────┤
│ added_by         │   │ reminder_type    │
│ service_date     │   │ title            │
│ service_type     │   │ description      │
│ description      │   │ due_date         │
│ mileage          │   │ repeat_interval  │
│ cost             │   │ completed        │
│ garage_name      │   │ created_by       │
│ created_at       │   │ created_at       │
└──────────────────┘   └──────────────────┘

         │
         ▼
┌──────────────────────┐
│ ownership_transfers  │
├──────────────────────┤
│ id                   │
│ car_id ──────────────┼──────┐
│ seller_id            │      │
│ new_owner_email      │      │
│ token                │      │
│ accepted             │      │
│ created_at           │      │
│ accepted_at          │      │
└──────────────────────┘      │
                              │
          ┌───────────────────┘
          │ (these reference cars.id)
          ▼
┌──────────────────┐
│      cars        │
│    (same as above)│
└──────────────────┘
```

### Table Details

#### `cars`
Stores vehicle information. The fields are mostly self-explanatory.

**Key field**: `created_by` tracks who first added the car (usually the original owner).

#### `car_permissions`
This is the **access control table** - arguably the most important one. It answers the question: "Who can do what with this car?"

| Field | Purpose |
|-------|---------|
| `car_id` | Which car |
| `user_id` | Which user |
| `role` | What they can do: `owner`, `mechanic`, or `viewer` |
| `granted_by` | Who gave them this permission (for auditing) |

**Why this design?** It allows flexible sharing:
- Owner → full control
- Mechanic → can add service records and reminders (handy for garage visits)
- Viewer → read-only access (good for family members)

#### `service_records`
Each record represents one service event.

| Field | Purpose |
|-------|---------|
| `car_id` | Which car the service was for |
| `added_by` | Who recorded it (could differ from owner) |
| `service_date` | When it happened |
| `service_type` | MOT, Service, Repair, Tyres, Brakes, Other |
| `description` | What was done (free text) |
| `mileage` | Odometer reading |
| `cost` | How much |
| `garage_name` | Where it was done |

#### `reminders`
Upcoming deadlines and tasks.

| Field | Purpose |
|-------|---------|
| `car_id` | Which car |
| `reminder_type` | MOT, tax, insurance, service, custom |
| `title` | Custom name (optional) |
| `description` | Details |
| `due_date` | When it's due |
| `repeat_interval` | yearly, 6month, 3month, monthly |
| `completed` | Has the user marked it done? |

#### `ownership_transfers`
Handles the ownership transfer workflow.

| Field | Purpose |
|-------|---------|
| `car_id` | Which car |
| `seller_id` | Current owner (initiator) |
| `new_owner_email` | Email of person being transferred to |
| `token` | Unique string for the transfer link |
| `accepted` | Has the new user accepted? |
| `accepted_at` | When they accepted |

---

## 5. Security

### Authorization: Who Can See/Edit What?

The app uses a **permission-based** system. Every data access goes through a permission check:

**Read access (viewing a car)**:
- Must have any role (owner, mechanic, or viewer) in `car_permissions` for that car

**Write access (adding records, completing reminders)**:
- Must have owner OR mechanic role

**Special actions**:
- **Ownership transfer**: Must be the owner

### Where Security Is Enforced

1. **Client-side checks** (in `lib/cars.ts`): Every function checks permissions before returning data or allowing changes. This provides good UX - users get clear error messages.

2. **Supabase Row Level Security (RLS)**: These are database-level rules that actually enforce security. Even if someone bypasses the client-side checks, the database will reject unauthorized queries.

The current RLS setup (if configured) would typically:
- Allow users to read cars they have permissions for
- Allow owners/mechanics to modify records
- Prevent unauthorized access at the database level

### What's Protected

✅ **Car data** - Only people with permissions can see car details  
✅ **Service records** - Same permission check as car data  
✅ **Reminders** - Same permission check  
✅ **Ownership transfers** - Token-based, validates email match  
✅ **Authentication** - Supabase handles this securely

### What's NOT Fully Protected (Current Limitations)

⚠️ **DVLA integration is a mock** - The `fetchMOTHistory()` function returns fake data for demo purposes. A real implementation would need proper API access.

⚠️ **No email sending** - The transfer link is logged to the console, not actually emailed. Production would need an email service (Supabase has built-in email, but it needs configuration).

⚠️ **No real mechani c role management** - There's no UI to add mechanics or viewers. This would need a page to invite other users by email.

---

## 6. API / Backend

### Supabase Client

The Supabase client is initialized in `lib/supabase.ts`:

```typescript
export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey
);
```

The client reads from environment variables:
- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - The "anonymous" key for client-side use

These are set in Vite's environment system (`.env` file).

### The `lib/cars.ts` Functions

This is where all the database interaction happens. Each function has a specific purpose:

#### `getUserCars(userId)`
1. Looks up all `car_permissions` for this user
2. Gets the list of car IDs they're allowed to access
3. Fetches those cars from the database
4. Returns them sorted by creation date (newest first)

**Used on**: Dashboard page

#### `addCar(carData, userId)`
1. Inserts the car into `cars` table
2. Inserts an owner permission into `car_permissions`
3. Returns the newly created car

**Used on**: Add Car page

#### `getCarById(carId, userId)`
1. Checks user has permission to see this car
2. Fetches the car details
3. Returns the car or throws an error

**Used on**: Car Detail page

#### `getServiceRecords(carId, userId)`
1. Checks user has permission (any role)
2. Fetches all service records for this car
3. Sorts by service date (newest first)

**Used on**: Car Detail page - Service History section

#### `addServiceRecord(recordData, userId)`
1. Checks user has owner OR mechanic permission
2. Inserts the service record
3. Returns the created record

**Used on**: Car Detail page - Add Service Record form

#### `getReminders(carId, userId)`
1. Checks user has permission
2. Fetches reminders sorted by due date

**Used on**: Car Detail page - Reminders section

#### `addReminder(reminderData, userId)`
1. Checks user has owner OR mechanic permission
2. Inserts the reminder
3. Returns the created reminder

**Used on**: Car Detail page - Add Reminder form

#### `completeReminder(reminderId, userId)`
1. Fetches the reminder to find its car_id
2. Checks user has owner OR mechanic permission
3. Marks the reminder as completed

**Used on**: Car Detail page - clicking the checkbox on a reminder

#### `transferOwnership(carId, newOwnerEmail, userId)`
1. Checks user is the owner
2. Generates a random token
3. Creates a transfer record in `ownership_transfers`
4. Returns the transfer details and a generated link

**Used on**: Car Detail page - Transfer Ownership button

#### `acceptTransfer(token, userId)`
1. Finds the transfer by token
2. Validates the token exists and isn't accepted
3. Checks the user's email matches the transfer's target email
4. Marks transfer as accepted
5. Creates a new owner permission for the user

**Used on**: Transfer page (`/transfer/:token`)

### Environment Variables

The app expects these in a `.env` file:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

You get these from the Supabase dashboard → Settings → API.

---

## Quick Reference

| Concept | Location |
|---------|----------|
| Auth context | `lib/auth.tsx` |
| Database client | `lib/supabase.ts` |
| Car/business logic | `lib/cars.ts` |
| Main app routes | `App.tsx` |
| Data types | `types/index.ts` |
| Add car page | `pages/AddCar.tsx` |
| Dashboard page | `pages/Dashboard.tsx` |
| Car detail page | `pages/CarDetail.tsx` |
| Transfer page | `pages/Transfer.tsx` |
| Login page | `pages/Login.tsx` |

---

## Potential Enhancements

If you wanted to extend this app, here are some natural next steps:

1. **Email the transfer link** - Use Supabase's built-in email or a service like Resend
2. **Add mechanic/viewer management** - A page to invite others to access a car
3. **Real DVLA integration** - Implement actual MOT history fetching
4. **Reminder notifications** - Push notifications or emails when reminders are due
5. **Photo attachments** - Store receipts and photos in Supabase Storage
6. **Data export** - Export service history as PDF

---

*Document generated for Virtual Service Passport app - main branch*