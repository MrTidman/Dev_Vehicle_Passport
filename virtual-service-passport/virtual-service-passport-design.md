# Virtual Service Passport - SaaS Application Design

## 1. Feature List

### Core Features
- **User Authentication**: Registration, login, password reset, email verification
- **Car Registration**: Add cars by VIN or registration number (UK: DVLA lookup API optional)
- **Multi-Role Permissions**: Owner, Mechanic, Viewer with distinct access levels
- **Vehicle Dashboard**: Overview of all cars user has access to (as any role)
- **Service History**: Full chronological log of all services, repairs, modifications
- **Expense Tracking**: Cost tracking per service/event with totals and categories
- **Reminders System**: MOT, tax, insurance, service intervals, custom reminders
- **Ownership Transfer**: Seller initiates → buyer accepts workflow
- **Document Storage**: Upload receipts, invoices, photos of work done

### Permission Roles
| Role | View Car Details | Add Service Records | Edit Car Details | Transfer Ownership | Manage Permissions |
|------|------------------|---------------------|-------------------|---------------------|-------------------|
| **Owner** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Mechanic** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Viewer** | ✅ | ❌ | ❌ | ❌ | ❌ |

### Notification Channels
- In-app dashboard notifications
- Email notifications
- (Optional) Webhook/chat integration for power users

---

## 2. Data Model

### Users
```sql
users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email           VARCHAR(255) UNIQUE NOT NULL,
  password_hash   VARCHAR(255) NOT NULL,
  name            VARCHAR(255),
  created_at      TIMESTAMP DEFAULT NOW(),
  email_verified  BOOLEAN DEFAULT FALSE
)
```

### Cars
```sql
cars (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vin             VARCHAR(17) UNIQUE,  -- 17-char VIN
  registration    VARCHAR(20) UNIQUE,  -- UK reg: 7 chars
  make            VARCHAR(50),
  model           VARCHAR(50),
  year            INTEGER,
  fuel_type       VARCHAR(20),
  engine_cc       INTEGER,
  colour          VARCHAR(30),
  created_at      UUID REFERENCES users(id),
  created_at      TIMESTAMP DEFAULT NOW()
)
```

### Car Permissions
```sql
car_permissions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  car_id          UUID REFERENCES cars(id) ON DELETE CASCADE,
  user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
  role            VARCHAR(20) NOT NULL CHECK (role IN ('owner', 'mechanic', 'viewer')),
  granted_by      UUID REFERENCES users(id),
  created_at      TIMESTAMP DEFAULT NOW(),
  UNIQUE(car_id, user_id)
)
```

### Service Records
```sql
service_records (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  car_id          UUID REFERENCES cars(id) ON DELETE CASCADE,
  added_by        UUID REFERENCES users(id),
  service_date    DATE NOT NULL,
  service_type    VARCHAR(100),  -- MOT, repair, oil change, etc.
  description     TEXT,
  mileage         INTEGER,
  cost            DECIMAL(10,2),
  garage_name     VARCHAR(255),
  receipts        TEXT[],  -- Array of file URLs
  created_at      TIMESTAMP DEFAULT NOW()
)
```

### Reminders
```sql
reminders (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  car_id          UUID REFERENCES cars(id) ON DELETE CASCADE,
  reminder_type   VARCHAR(50) NOT NULL,  -- MOT, tax, insurance, service
  title           VARCHAR(255),
  description     TEXT,
  due_date        DATE NOT NULL,
  repeat_interval VARCHAR(50),  -- yearly, 6month, etc.
  completed       BOOLEAN DEFAULT FALSE,
  created_by      UUID REFERENCES users(id),
  created_at      TIMESTAMP DEFAULT NOW()
)
```

### Ownership Transfers (Pending)
```sql
ownership_transfers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  car_id          UUID REFERENCES cars(id) ON DELETE CASCADE,
  seller_id       UUID REFERENCES users(id),
  buyer_id        UUID REFERENCES users(id),
  status          VARCHAR(20) DEFAULT 'pending',  -- pending, accepted, rejected, cancelled
  token           UUID UNIQUE,  -- Secret token for buyer to accept
  created_at      TIMESTAMP DEFAULT NOW(),
  completed_at    TIMESTAMP
)
```

### Notifications (Optional)
```sql
notifications (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
  car_id          UUID REFERENCES cars(id) ON DELETE SET NULL,
  type            VARCHAR(50),
  title           VARCHAR(255),
  message         TEXT,
  read            BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMP DEFAULT NOW()
)
```

---

## 3. Tech Stack

### Recommended: Supabase + React

| Layer | Technology | Rationale |
|-------|------------|-----------|
| **Backend/DB** | Supabase (PostgreSQL) | Built-in auth, RLS policies, real-time, simple API |
| **Frontend** | React + Vite | Fast dev, large ecosystem |
| **Styling** | Tailwind CSS | Rapid UI development |
| **State** | React Query (TanStack) | Server state management |
| **Forms** | React Hook Form + Zod | Validation schema |
| **Routing** | React Router v6 | Standard routing |
| **Deployment** | Vercel / Netlify | Free tier, easy CI/CD |

### Alternative Stack
- **Stack**: Next.js + Prisma + PostgreSQL (if you need more control)
- **Full SaaS**: Flutter (mobile) or T3 Stack

### External APIs (UK)
- DVLA Vehicle Enquiry API (optional - for auto-populating car details from reg)
- Email: Supabase Auth (or Resend for custom emails)

---

## 4. UI Structure

### Pages

```
/
├── Login / Register
├── Dashboard (/)
│   ├── My Cars (as Owner)
│   ├── Working On (as Mechanic)
│   └── Watching (as Viewer)
│   └── Upcoming Reminders
├── Car Detail (/car/:id)
│   ├── Vehicle Info
│   ├── Service History
│   ├── Expenses Summary
│   ├── Reminders
│   ├── Documents/Gallery
│   └── Permission Management (Owner only)
├── Add Car (/cars/new)
├── Transfer Ownership (/car/:id/transfer)
├── Accept Transfer (/transfer/:token)
├── Settings (/settings)
│   ├── Profile
│   └── Notifications
└── Notifications (/notifications)
```

### Component Hierarchy

```
App
├── AuthGuard
│   ├── Layout
│   │   ├── Header
│   │   │   ├── Logo
│   │   │   ├── Nav
│   │   │   └── UserMenu
│   │   └── Outlet
│   └── Page Components...
```

### Dashboard Layout
```
┌─────────────────────────────────────────────┐
│  Dashboard                                  │
├─────────────────────────────────────────────┤
│  ┌─────────┐ ┌─────────┐ ┌─────────┐       │
│  │ 🚗 Car1 │ │ 🚗 Car2 │ │ + Add   │       │
│  │ Owner   │ │ Mechanic│ │  Car    │       │
│  └─────────┘ └─────────┘ └─────────┘       │
│                                             │
│  Upcoming Reminders                         │
│  ┌─────────────────────────────────────┐    │
│  │ ⚠️ MOT due in 14 days   BMW X5      │    │
│  │ 📅 Tax due 01/04/2026   Golf        │    │
│  └─────────────────────────────────────┘    │
└─────────────────────────────────────────────┘
```

### Car Detail Layout
```
┌─────────────────────────────────────────────┐
│  BMW X5 (ABC123)           [Transfer] [Edit]│
├─────────────────────────────────────────────┤
│  ┌──────────────┐ ┌──────────────────────┐  │
│  │ Vehicle Info │ │ Quick Stats          │  │
│  │ Make: BMW    │ │ Total Spent: £4,250  │  │
│  │ Model: X5    │ │ Services: 12         │  │
│  │ Year: 2019   │ │ Next MOT: 14 days    │  │
│  │ VIN: ...     │ │                      │  │
│  └──────────────┘ └──────────────────────┘  │
│                                             │
│  Service History         [+ Add Service]    │
│  ┌─────────────────────────────────────┐    │
│  │ 15/02/2026 - MOT + Service - £450   │    │
│  │ 10/08/2025 - Oil Change - £85       │    │
│  │ 20/01/2025 - Tyres - £320           │    │
│  └─────────────────────────────────────┘    │
│                                             │
│  Permissions               [Manage]         │
│  👤 John Smith (Owner)                      │
│  🔧 Mike's Garage (Mechanic)                │
│  👁️ Jane Doe (Viewer)                       │
└─────────────────────────────────────────────┘
```

---

## 5. Ownership Transfer Flow

### Step-by-Step Process

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   SELLER     │     │    SYSTEM    │     │   BUYER      │
└──────┬───────┘     └──────┬───────┘     └──────┬───────┘
       │                    │                    │
       │ 1. Initiates       │                    │
       │ transfer           │                    │
       │───────────────────>│                    │
       │                    │ 2. Creates        │
       │                    │ secret token       │
       │                    │───────────────────>│
       │                    │ 3. Sends email     │
       │                    │    with link       │
       │                    │────────────────────│
       │                    │                    │
       │                    │ 4. Clicks link,   │
       │                    │    views car,      │
       │                    │    accepts         │
       │                    │<───────────────────│
       │                    │                    │
       │ 5. Notified of     │                    │
       │    acceptance      │                    │
       │<───────────────────│                    │
       │                    │                    │
```

### Detailed Flow

1. **Seller initiates** (Owner only)
   - Go to Car Detail → "Transfer Ownership"
   - Enter buyer's email
   - Confirm action
   - System generates unique token, sends email to buyer

2. **Buyer receives email**
   - Contains link: `https://app.com/transfer/abc-123-token`
   - Link shows car details, asks to accept/reject

3. **Buyer accepts**
   - Click "Accept Transfer"
   - Logged in → auto-accepts, redirected to car
   - Not logged in → prompted to register/login first

4. **Transfer completes**
   - Seller's role changes: Owner → Viewer (can be removed)
   - Buyer's role becomes: Owner
   - Both get notifications
   - Service history stays with car (unchanged)

5. **Edge Cases**
   - Buyer rejects: Transfer cancelled, seller notified
   - Token expires: After 7 days, seller can re-initiate
   - Seller cancels: Before buyer accepts, can withdraw

---

## 6. Implementation Notes

### Row Level Security (Supabase)
```sql
-- Users can only see cars they have permissions for
CREATE POLICY "Users can view their cars"
ON cars FOR SELECT
USING (
  id IN (
    SELECT car_id FROM car_permissions WHERE user_id = auth.uid()
  )
);
```

### Reminder Logic
- Background job checks daily for upcoming reminders
- Create notifications for:
  - 30 days before due
  - 7 days before due
  - 1 day before due
  - On due date
  - Overdue

### Cost Aggregation (PostgreSQL View)
```sql
CREATE VIEW car_expenses AS
SELECT 
  c.id,
  c.registration,
  SUM(sr.cost) as total_spent,
  COUNT(sr.id) as service_count
FROM cars c
LEFT JOIN service_records sr ON c.id = sr.car_id
GROUP BY c.id;
```

---

## 7. MVP vs Full Feature

### MVP (Month 1)
- [x] User auth (Supabase)
- [x] Add car (manual entry)
- [x] Add service record
- [x] View car + service history
- [x] Basic reminders (manual)
- [x] Role-based view access

### Phase 2 (Month 2)
- [ ] Ownership transfer flow
- [ ] Reminder system (automated)
- [ ] Expense totals
- [ ] Document upload

### Phase 3 (Month 3)
- [ ] DVLA auto-fill
- [ ] Email notifications
- [ ] Analytics/dashboard charts
- [ ] API for third-party (garages)

---

*Design completed for Virtual Service Passport SaaS*
*Generated: 2026-03-09*
