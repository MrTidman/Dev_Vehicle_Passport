# Testing Regime - Virtual Service Passport

## Overview

This document outlines the comprehensive testing approach for the Virtual Service Passport application, focusing on PDF export functionality and service record management.

---

## 1. Test Data Requirements

### 1.1 Test User Credentials

The test suite uses a pre-configured test user:

```typescript
export const TEST_USER = {
  email: 'agentsage@example.com',
  password: '5KoKVs69cC3K2Jky02OK',
};
```

**Note**: This user must exist in Supabase and have email confirmation bypassed (for local testing).

### 1.2 Test Vehicle (Test VIN)

**✓ Valid Test VIN**: `1HGBH41JXMN109186`

- **Check Digit**: Valid (X = 10, correctly calculated)
- **Manufacturer**: Honda (1HG)
- **Model Year**: M = 1991
- **Format**: 17 characters, uppercase, no I/O/Q

This VIN passes the validation check in `src/lib/vin.ts`.

### 1.3 Test Service Records

The PDF export requires service records with the following structure:

```typescript
interface ServiceRecord {
  id: string;           // UUID
  car_id: string;       // UUID
  service_date: string; // ISO date
  service_type: string; // e.g., "Oil Change", "MOT", "Tyre Replacement"
  description: string;  // Service notes
  mileage: number;      // Odometer reading
  cost: number;         // Cost in GBP
  garage_name: string;  // Service center name
  receipts?: string[];  // Array of receipt URLs
  created_at: string;   // Timestamp
}
```

**Recommended Test Data Set**:

| Date | Type | Description | Mileage | Cost | Garage |
|------|------|-------------|---------|------|--------|
| 2025-12-15 | MOT | Annual MOT test | 45,230 | £54.00 | AA Motoring |
| 2025-10-02 | Oil Change | Full service + oil change | 44,800 | £89.99 | Quick Lube Ltd |
| 2025-08-20 | Tyre Replacement | Front tyres (Michelin) | 44,200 | £220.00 | TyrePro |
| 2025-06-10 | Brake Service | Front brake pads replacement | 43,500 | £150.00 | MOTMaster |
| 2025-03-05 | Air Con Service | Re-gas and filter change | 42,800 | £75.00 | CoolAir Services |
| 2024-11-20 | Battery Replacement | New battery (75Ah) | 41,200 | £120.00 | AutoParts Direct |
| 2024-08-14 | Exhaust Repair | Catalytic converter replacement | 39,800 | £450.00 | ExhaustMaster |

**Total Test Expenses**: £1,158.99

### 1.4 Test Journal Entries

```typescript
interface HistoryLogEntry {
  id: string;
  car_id: string;
  user_id: string;
  content: string;      // Note content
  entry_type: string;   // 'NOTE', 'SERVICE', etc.
  created_at: string;
}
```

**Recommended Test Entries**:
- "Vehicle purchased from previous owner. Full service history available."
- "Noted minor scratch on rear bumper - scheduled for repair"
- "Excellent condition for its age. All original panels."

### 1.5 Test Receipts

For testing the receipts appendix in PDF:
- Add at least one receipt URL to a service record
- Supported formats: PNG, JPG, PDF (up to 10MB)
- Store in Supabase Storage bucket: `receipts/`

---

## 2. PDF Export Tests

### 2.1 Test Scenarios

| Scenario | Description | Expected Output |
|----------|-------------|------------------|
| Basic PDF Export | Car with 3+ service records | PDF downloads with all records |
| Masked VIN | Verify VIN is masked | VIN shows `*********109186` |
| Empty Service History | Car with no records | PDF shows "Total Services: 0" |
| With Journal Notes | Car with journal entries | Additional pages with notes |
| With Receipts | Include receipts in export | Receipts appendix at end |
| Large Dataset | 20+ service records | Paginated PDF with proper formatting |

### 2.2 PDF Content Verification

The generated PDF must include:
- [ ] Header: "Virtual Service Passport - Service History Report"
- [ ] Generated date
- [ ] Vehicle details section (masked VIN displayed)
- [ ] Service summary (total services, total spent)
- [ ] Service records table (sorted by date descending)
- [ ] Journal notes (if any)
- [ ] Receipts appendix (if receipts exist and option enabled)
- [ ] Footer on all pages

### 2.3 Testing PDF Masking

The VIN masking function `maskVIN()` should:
- Take any 17-character VIN
- Return last 6 characters visible, rest masked with `*`
- Example: `1HGBH41JXMN109186` → `*********109186`

---

## 3. Test Execution

### 3.1 Running Tests

```bash
# Run all tests
npm test

# Run specific E2E test
npm test -- --grep "PDF"

# Run with visible browser
npm run test:headed

# Open Playwright UI
npm run test:ui
```

### 3.2 Environment Setup

1. **Supabase Configuration**:
   ```bash
   # Create .env file
   cp .env.example .env
   
   # Fill in your Supabase credentials
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

2. **Test User Setup**:
   - Create user in Supabase Auth
   - Or disable email confirmation in Supabase project settings

3. **Database Setup**:
   - Run migrations in `supabase/migrations/`
   - Ensure RLS policies allow test operations

### 3.3 Manual PDF Test Flow

1. Login to the app
2. Add a new car with test VIN `1HGBH41JXMN109186`
3. Add service records (see recommended test data)
4. Navigate to car detail page
5. Click "Export to PDF" button
6. Verify PDF downloads correctly
7. Open PDF and verify:
   - VIN is masked (last 6 digits only)
   - All service records present
   - Total cost calculated correctly
   - Any journal notes included

---

## 4. Known Test Gaps

### 4.1 Current TODO Items

- [ ] Service record display tests (need existing car)
- [ ] Expense summary calculation tests
- [ ] PDF export E2E test
- [ ] Receipt upload and display

### 4.2 Manual Testing Required

Some features require manual verification:
- Email notifications (reminder emails)
- Push notifications
- Transfer acceptance flow (requires two users)
- Real receipt image embedding in PDF

---

## 5. Test Data Scripts

### 5.1 Seed Test Data (via Supabase SQL)

```sql
-- Insert test car
INSERT INTO cars (id, vin, registration, make, model, year, created_by)
VALUES (
  gen_random_uuid(),
  '1HGBH41JXMN109186',
  'TEST001',
  'Honda',
  'Civic',
  1991,
  (SELECT id FROM auth.users WHERE email = 'agentsage@example.com')
);

-- Insert service records (replace car_id with actual car UUID)
INSERT INTO service_records (car_id, added_by, service_date, service_type, description, mileage, cost, garage_name)
VALUES 
  (car_id, user_id, '2025-12-15', 'MOT', 'Annual MOT test', 45230, 54.00, 'AA Motoring'),
  (car_id, user_id, '2025-10-02', 'Oil Change', 'Full service + oil change', 44800, 89.99, 'Quick Lube Ltd'),
  (car_id, user_id, '2025-08-20', 'Tyre Replacement', 'Front tyres (Michelin)', 44200, 220.00, 'TyrePro');
```

---

## 6. Test VIN Reference

| VIN | Status | Notes |
|-----|--------|-------|
| `1HGBH41JXMN109186` | ✓ VALID | Test VIN - Honda Civic 1991 |
| `1G1YY22G965108523` | ✓ VALID | Used in cars.spec.ts |

---

*Last Updated: 2026-03-16*