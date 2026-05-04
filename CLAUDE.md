# Stoop — Claude Code session guide

## Read these first, every session

1. [`docs/PROJECT_FOUNDATION.md`](./docs/PROJECT_FOUNDATION.md) — product, wedge, ICP, pricing, modules, constraints, risks.
2. [`docs/MULTI_TENANCY_MIGRATION.md`](./docs/MULTI_TENANCY_MIGRATION.md) — technical plan to convert Madison Park (single-tenant) into tenant #1 of the multi-tenant SaaS.

If a decision contradicts either document, ask before acting and update the doc afterward.

## Repo layout

- `madison-park-hoa/` — the Next.js 14 app (Supabase, Resend, shadcn/ui). This is the production codebase that today serves Madison Park HOA single-tenant. It becomes tenant #1 of Stoop after the migration.
- `docs/` — strategic and technical foundation. Source of truth for cross-session context.

## Branch convention

- `claude/create-project-foundation-fAHmG` — current branch; foundation docs live here.
- `claude/multi-tenancy-migration` — to be created when migration work begins (don't start without explicit go-ahead).

## Working notes for Claude

- Default to editing existing files in `madison-park-hoa/` rather than creating new ones.
- Never push to `main` without explicit instruction.
- The pricing tier "above 50" in user input was interpreted as "100+" — confirm with the founder before locking in.
- The "Stoop" name is a working title pending trademark/domain check.
- The NICE non-compete read is the founder's, not legal counsel's. Treat as open.
