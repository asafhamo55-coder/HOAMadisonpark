# Homeowner Hub

Monorepo for the **Homeowner Hub** family of products. Four independent Next.js apps under `apps/`, plus shared docs.

## Apps

| App | What it is | Domain (planned) |
|---|---|---|
| `apps/homeowner-hub` | Umbrella marketing landing — routes visitors to the three products | `homeowner-hub.app` |
| `apps/hoa` | **HOA Management Hub** — multi-tenant HOA SaaS (the original Madison Park codebase) | `hoa.homeowner-hub.app` |
| `apps/property` | **Property Management** — rental property SaaS | `property.homeowner-hub.app` |
| `apps/eviction` | **Eviction Management** — per-jurisdiction eviction workflow SaaS | `eviction.homeowner-hub.app` |

Each app is **fully independent**: own marketing, own login, own database, own deploy. They share a brand, not a stack.

## Why three products instead of one suite

- HOA boards, landlords, and eviction practitioners have different workflows.
- Buy what you need; no platform fee.
- Independent uptime; a bug in Eviction doesn't take down HOA payments.
- Bring-your-own-data; no forced cross-product reporting.

## Working with the monorepo

There is **no workspace tooling** (no Turbo / pnpm workspaces) — each app has its own `package.json` and `node_modules`. Run an app:

```bash
cd apps/<app-name>
npm install
npm run dev
```

## Deployment

Each app is its own Vercel project pointing at its `apps/<name>` subdirectory. After importing the repo into Vercel:

1. Create 4 projects (one per app)
2. For each, set **Root Directory** to `apps/homeowner-hub`, `apps/hoa`, `apps/property`, or `apps/eviction`
3. For each app that needs a database (HOA, Property, Eviction), create a separate Supabase project and set its env vars

## Repo history

The HOA app inherited the Madison Park HOA codebase including phase-2 multi-tenant work (Streams A-G). Madison Park HOA is the first tenant on `apps/hoa`, not a hardcoded brand. The `docs/` directory at the repo root contains plan and decision history from earlier work.

For the consolidation history, see git log on `restructure/monorepo-four-apps`.
