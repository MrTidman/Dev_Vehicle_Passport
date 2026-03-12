# Agent Team

- **Moss** — Main AI assistant (me)
- **Terra** — Build agent - builds new features
- **Sage** — QA agent - reviews code for errors (uses qwen2.5:cloud model)
- **Stone** — Security agent - security reviews

## Roles

- **Terra** (Build): Creates new features, implements functionality
- **Sage** (QA): Reviews code, checks for bugs and best practices  
- **Stone** (Security): Reviews for security vulnerabilities

## Project

**Virtual Service Passport** - Car service history tracking app
- Frontend: React + Vite + TypeScript + Tailwind
- Backend: Supabase (PostgreSQL + Auth)
- Hosting: Vercel
- Repo: github.com/MrTidman/Dev_Vehicle_Passport

## Tech Stack

- React 19 + Vite 7
- Supabase (Auth + DB)
- React Query
- React Hook Form + Zod
- Tailwind CSS v3

## Current Features

- User registration/login
- Dashboard with car list
- Add car form
- Car detail page with service records & reminders
- Settings page with password reset
- Ownership transfer workflow
- DVLA MOT history (MOCK - placeholder only)
- Security review GitHub Actions workflow

## Supabase

- URL: https://ytezvbshqktufwgtkbkk.supabase.co
- Tables: cars, car_permissions, service_records, reminders, ownership_transfers

## Workflow (Established)

- **Terra** builds → pushes to `test` branch
- **Sage** QA in `test` → request push to preproduction
- **Stone** security reviews as needed
- **User** authorizes final push to `main`
- **Moss** orchestrates - doesn't do everything solo

## Notes

- Using GitHub token for commits (MrTidman)
- Vercel Hobby plan - public repo required
- RLS policies currently permissive for MVP - PRIORITY: fix before production
- Rule: If exec fails 3x, stop and tell user
- NEVER poll after spawning subagents - wait for completion events

## Security Focus (March 2026)

**Current Security Gaps:**
- RLS is "permissive for MVP" - major risk before public launch
- DVLA API key exposed (client-side) - needs Edge Function
- No server-side validation - trust client too much

**Planned Auth Change:**
- Moving to passwordless SMS OTP (phone number → text code)
- Via Supabase + Twilio
- Better UX, adds identity verification
- Cost: ~$0.008/SMS

## Management Dashboard

- For user to manage app without Vercel/Supabase dashboards
- Key metrics: users, vehicles, service records, ownership transfers, errors
- Implementation: Add `is_admin` flag to users, protect via RLS + Edge Functions

## Roadmap (Revised)

1. Management dashboard (simple, for user)
2. Lock down RLS + add indexes (security first!)
3. Document upload (Phase 2)
4. Real DVLA integration (replace mock)
5. Email notifications (move up - user retention)
6. Passwordless SMS auth
7. Fleet manager view (only if demand)
