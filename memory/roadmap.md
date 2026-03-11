# VSP Roadmap - Planned Work

## Phase 1: Bug Fixes (Current)
- [ ] Fix ESLint: `permission: any` return type (cars.ts:338)
- [ ] Fix ESLint: `err: any` type (Transfer.tsx:40)
- [ ] Fix: Email verification in acceptTransfer (security)
- [ ] QA: Sage reviews in test branch
- [ ] Deploy to preproduction for testing
- [ ] User authorizes push to main

## Phase 2: Document Upload + Vehicle Notes
- [ ] Implement document/receipt upload UI
- [ ] Set up Supabase Storage bucket: `vehicle-files`
- [ ] Folder structure: `{car_id}/{user_id}/{photos,receipts}`
- [ ] Link uploads to service records
- [ ] Add vehicle notes section (owner-only editable)
- [ ] QA + Security review
- [ ] Deploy to preproduction
- [ ] User authorizes push to main

## Phase 3: Permission Management
- [ ] UI for owners to add mechanic/viewer
- [ ] Invite by email flow
- [ ] QA + Security review
- [ ] Deploy to preproduction
- [ ] User authorizes push to main

## Phase 4: Email Notifications
- [ ] Set up email service (Resend or Supabase)
- [ ] Ownership transfer emails
- [ ] Reminder due date emails
- [ ] QA + Security review
- [ ] Deploy to preproduction
- [ ] User authorizes push to main

## Future / Backlog
- Fix DVLA integration (paid API or alternative)
- Expense charts/analytics on dashboard
- Mobile app (out of scope for now)