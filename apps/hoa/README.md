# HOA Management Hub

A multi-tenant HOA management SaaS — properties, residents, violations, letters, payments, leasing, and a resident portal. Built with Next.js 14, Supabase, and Tailwind. Madison Park HOA is the first tenant on the platform.

This is one of three products in the Homeowner Hub family. See `/apps/homeowner-hub/` for the umbrella landing site and `/apps/property/` and `/apps/eviction/` for the sister products.

## System Overview

| Feature | Description |
|---------|-------------|
| **Property Management** | Track all community properties, residents, and occupancy status |
| **Violation Tracking** | Log, escalate, and resolve violations with automated letter workflows |
| **Email Center** | Send templated emails (violation notices, fines, welcome letters) via Resend |
| **Payment Ledger** | Generate quarterly dues, record payments, track overdue accounts |
| **Vendor Management** | Manage vendors and work orders for community maintenance |
| **Announcements** | Publish community announcements with optional email broadcast |
| **Document Library** | Upload and share HOA documents (CC&Rs, meeting minutes, etc.) |
| **Resident Portal** | Residents view their property, violations, payments, and community info |
| **Real-time Notifications** | Bell icon with live notification updates via Supabase Realtime |
| **Global Search** | Command palette (Cmd+K) to search properties, violations, and vendors |

### Role-Based Access

| Role | Access |
|------|--------|
| **Admin** | Full access to all pages including Settings and User Management |
| **Board** | Full access except Settings > User Management |
| **Resident** | Portal only — own property data, violations, payments |
| **Vendor** | Own vendor record and assigned work orders only |

### Tech Stack

- **Framework**: Next.js 14 (App Router, Server Components)
- **Database**: Supabase (PostgreSQL + Auth + Storage + Realtime)
- **Styling**: Tailwind CSS + shadcn/ui components
- **Email**: React Email templates + Resend API
- **Tables**: TanStack React Table
- **Forms**: React Hook Form + Zod validation
- **Charts**: Recharts
- **Deployment**: Vercel (standalone output)

---

## Environment Variables

Create a `.env.local` file in the project root. See `.env.example` for the template.

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL (e.g. `https://xxx.supabase.co`) | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-side only) | Yes |
| `RESEND_API_KEY` | Resend API key for sending emails | Yes |
| `HOA_FROM_EMAIL` | Sender email address (e.g. `noreply@madisonparkhoa.com`) | Yes |
| `NEXT_PUBLIC_HOA_NAME` | Display name for the HOA (defaults to "Madison Park HOA") | No |
| `NEXT_PUBLIC_HOA_LOGO_URL` | URL or path to the HOA logo image | No |
| `SEED_ADMIN_EMAIL` | Admin email for seed script (defaults to `admin@madisonparkhoa.com`) | No |
| `SEED_ADMIN_PASSWORD` | Admin password for seed script (defaults to temp password) | No |
| `SEED_ADMIN_NAME` | Admin display name for seed script | No |

---

## Local Development Setup

### Prerequisites

- Node.js 18+
- npm or pnpm
- [Supabase CLI](https://supabase.com/docs/guides/cli) (for local development)

### 1. Install dependencies

```bash
cd madison-park-hoa
npm install
```

### 2. Start Supabase locally

```bash
supabase start
```

This starts a local Supabase instance with Postgres, Auth, Storage, and Realtime. Copy the output credentials into `.env.local`.

### 3. Apply database migrations

```bash
supabase db push
```

This applies all migrations in `supabase/migrations/` in order:
- `001_init.sql` — Core schema (profiles, properties, residents, violations, letters, vendors, vendor_jobs, announcements, documents, payments, email_templates) + RLS policies
- `002_hoa_settings_and_audit.sql` — HOA settings key-value store + audit log
- `003_requests_table.sql` — Maintenance requests table
- `004_notifications_and_indexes.sql` — Notifications table with real-time, auto-notification triggers, performance indexes
- `005_storage_buckets.sql` — Storage buckets (violations, documents, logos) with access policies

### 4. Seed the admin user

```bash
npx tsx scripts/seed-admin.ts
```

This creates:
- The first admin user with email/password login
- Default email templates
- Default violation categories
- Default HOA settings (name, dues, etc.)

### 5. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and log in with the admin credentials printed by the seed script.

---

## Deployment

### Vercel

1. Push to GitHub and import the repo in Vercel
2. Set the root directory to `madison-park-hoa`
3. Add all environment variables from `.env.example` in the Vercel dashboard
4. Vercel will auto-detect Next.js and use the configuration in `vercel.json`
5. Build command: `next build` (output mode: standalone)

### Supabase Production Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Apply migrations:
   ```bash
   supabase link --project-ref <your-project-ref>
   supabase db push
   ```
3. Enable **Email Auth** in the Supabase dashboard (Authentication > Providers)
4. Storage buckets are created by migration `005`. Verify in the Storage tab:
   - `violations` — private, authenticated only
   - `documents` — public read, authenticated write
   - `logos` — public read, admin write
5. Enable **Realtime** for the `notifications` table (already done via migration)
6. Set up daily backups in Supabase dashboard (Settings > Database > Backups)
7. Run the seed script against production:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co \
   SUPABASE_SERVICE_ROLE_KEY=your-key \
   SEED_ADMIN_EMAIL=your-admin@email.com \
   SEED_ADMIN_PASSWORD=YourSecurePassword123! \
   npx tsx scripts/seed-admin.ts
   ```

### Resend Domain Verification

1. Sign up at [resend.com](https://resend.com) and get your API key
2. Add your domain (e.g. `madisonparkhoa.com`) in the Resend dashboard
3. Add the required DNS records (SPF, DKIM, DMARC) to your domain registrar
4. Wait for domain verification (usually a few minutes)
5. Set `HOA_FROM_EMAIL=noreply@madisonparkhoa.com` in your environment variables

---

## How-To Guides

### Add New Residents

1. Navigate to **Properties & Residents**
2. Click on a property to open its detail page
3. Go to the **Residents** tab
4. Click **Add Resident** and fill in the form
5. If the resident should have portal access, create a Supabase Auth user and link their `profile_id` in the residents table

### Customize Email Templates

Email templates are React components located in:

```
src/emails/templates/
├── violation-notice.tsx
├── warning-letter.tsx
├── fine-notice.tsx
├── welcome-letter.tsx
├── general-announcement.tsx
└── payment-reminder.tsx
```

The base layout is in `src/emails/base-layout.tsx`. Templates use `@react-email/components` for cross-client compatibility.

To preview templates locally:

```bash
npx react-email dev
```

Template registry is in `src/lib/email/templates.ts`. To add a new template:
1. Create a new React component in `src/emails/templates/`
2. Register it in `src/lib/email/templates.ts`
3. Add a subject line in `templateSubjects`

### Add New Violation Categories

Categories are stored in two places:
1. **Database**: `hoa_settings` table under the key `violation_categories` (used for settings page)
2. **Code**: `src/lib/schemas/violation.ts` — the `VIOLATION_CATEGORIES` array (used for form validation)

To add a new category:
1. Add it to the `VIOLATION_CATEGORIES` array in `src/lib/schemas/violation.ts`
2. Update the `violation_categories` setting in the database (via Settings page or directly in Supabase)

### Admin Credentials Setup (First Run)

The seed script (`scripts/seed-admin.ts`) creates the initial admin user. You can customize the credentials via environment variables:

```bash
SEED_ADMIN_EMAIL=admin@yourdomain.com \
SEED_ADMIN_PASSWORD=SecurePassword123! \
SEED_ADMIN_NAME="John Smith" \
npx tsx scripts/seed-admin.ts
```

**Important**: Change the admin password after first login!

### Backup and Restore

**Automated Backups** (Supabase Pro plan):
- Enable daily backups in Supabase Dashboard > Settings > Database > Backups
- Backups are retained for 7 days (Pro) or 30 days (Enterprise)

**Manual Backup**:
```bash
# Export data
supabase db dump -f backup.sql

# Restore
psql -h your-db-host -U postgres -d postgres -f backup.sql
```

**Storage Backup**:
- Use `supabase storage` CLI or the S3-compatible API to sync files
- Storage files in the `violations` and `documents` buckets should be included in your backup strategy

---

## Project Structure

```
madison-park-hoa/
├── public/                  # Static assets (logo, favicon)
├── scripts/
│   └── seed-admin.ts        # First-run seed script
├── src/
│   ├── app/
│   │   ├── (auth)/           # Login, reset-password pages
│   │   ├── (dashboard)/      # Admin/board dashboard
│   │   │   └── dashboard/
│   │   │       ├── announcements/
│   │   │       ├── documents/
│   │   │       ├── email/
│   │   │       ├── payments/
│   │   │       ├── properties/
│   │   │       ├── settings/
│   │   │       ├── vendors/
│   │   │       └── violations/
│   │   ├── (portal)/         # Resident portal
│   │   ├── actions/          # Server actions
│   │   └── api/              # API routes
│   ├── components/
│   │   ├── dashboard/        # App shell, header, sidebar, search
│   │   ├── email/            # Email composer
│   │   ├── ui/               # shadcn/ui components
│   │   └── violations/       # Violation-specific components
│   ├── emails/               # React Email templates
│   └── lib/
│       ├── email/            # Email sending + template registry
│       ├── schemas/          # Zod validation schemas
│       └── supabase/         # Supabase client (server/client/admin)
├── supabase/
│   └── migrations/           # SQL migration files
├── vercel.json               # Vercel deployment config
├── next.config.mjs           # Next.js config (standalone output)
└── .env.example              # Environment variable template
```

---

## License

Private — Madison Park HOA internal use only.
