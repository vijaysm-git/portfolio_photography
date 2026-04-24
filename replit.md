# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

This workspace currently contains the **Lumière Studio** photography portfolio:
a public marketing site (home, portfolio with category filter + lightbox, project
detail, contact form with WhatsApp) and a private studio admin (dashboard, projects
CRUD with image upload, testimonials, inquiries).

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite + wouter + TanStack Query + Tailwind v4 + shadcn/ui + framer-motion
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Storage**: Replit Object Storage (two-step presigned URL upload)
- **Auth**: Hardcoded admin login backed by `ADMIN_EMAIL` + `ADMIN_PASSWORD` env vars,
  `express-session` cookie (MemoryStore, sameSite: lax). Kept simple by request.

## Domain models

- `portfolio` — projects with category (wedding/events/portrait/studio), cover, gallery, featured flag
- `testimonials` — name, rating, review, optional photo
- `contact_submissions` — name, phone, optional email, eventType, message

## Routes

Public: `/`, `/portfolio`, `/portfolio/:id`, `/contact`
Admin: `/admin/login`, `/admin`, `/admin/portfolio`, `/admin/testimonials`, `/admin/inquiries`

## Theming

Dark mode is locked on (`document.documentElement.classList.add("dark")` in App).
Palette is a warm cinematic ink + ivory + burnished gold accent. Headings use
Cormorant Garamond, body uses Inter.

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/db exec tsc` — rebuild lib/db's `.d.ts` outputs (project references)
- `pnpm --filter @workspace/api-server run dev` — run API server locally
- `pnpm --filter @workspace/portfolio run dev` — run portfolio web app locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
