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
- RLS policies currently permissive for MVP
- Rule: If exec fails 3x, stop and tell user
- NEVER poll after spawning subagents - wait for completion events

## Todo

- Phase 1: Bug fixes (Sage reviewing test branch now)
- Phase 2: Document upload
- Phase 3: Permission management  
- Phase 4: Email notifications
- Fix DVLA integration (needs paid API or alternative)
