/**
 * Brand constants for HOA Pro Hub.
 *
 * Per docs/plan/DECISIONS.md the product is named "HOA Pro Hub" and the
 * platform domain is `hoaprohub.app`. Use these constants everywhere instead
 * of hard-coding the strings, so a future rename is a one-line change.
 */

export const BRAND = {
  name: "Homeowner Hub",
  shortName: "Homeowner Hub",
  domain: "hoaprohub.app",
  url: "https://hoaprohub.app",
  tagline: "One hub for everything you own.",
  description:
    "Homeowner Hub is the all-in-one platform for homeowners and property managers: HOA management, property management, and eviction workflows — under a single account.",
  supportEmail: "support@hoaprohub.app",
  fromEmail: "noreply@hoaprohub.app",
  // Default tenant brand colors (overridable per-tenant via Stream E).
  primary: "#0F2A47",
  primaryHover: "#1A3A5F",
  accent: "#10B981",
} as const

export type FeatureSlug =
  | "properties"
  | "violations"
  | "letters"
  | "payments"
  | "portal"
  | "documents"

export type FeatureArea = {
  slug: FeatureSlug
  title: string
  short: string
  long: string
  bullets: string[]
}

export const FEATURE_AREAS: FeatureArea[] = [
  {
    slug: "properties",
    title: "Property & resident records",
    short:
      "One source of truth for every lot, unit, and resident — searchable, exportable, and tied to every event in the system.",
    long: "Every property has its own profile: address, owner, tenants, vehicles, violation history, payment ledger, and uploaded documents. No more chasing data across spreadsheets.",
    bullets: [
      "Bulk import from CSV or Excel — auto-detect columns",
      "Resident contact preferences (email / push / mailing)",
      "Audit trail for every edit, with point-in-time history",
      "One-click export to CSV or PDF for board meetings",
    ],
  },
  {
    slug: "violations",
    title: "Violation management",
    short:
      "Photo-driven inspections, configurable categories, automatic escalation, and one-tap letter generation.",
    long: "Catch covenant issues with mobile-first photo capture, route them through review, generate the right letter, and let the system schedule fines and follow-ups.",
    bullets: [
      "Configurable categories tied to your CC&Rs",
      "Inspector mode for board members on foot",
      "Automatic escalation: notice → 2nd notice → fine → ARC",
      "Resident self-service rebuttal portal with deadlines",
    ],
  },
  {
    slug: "letters",
    title: "Automated letters with templates",
    short:
      "Branded notices, fine letters, ARC decisions, and statements — generated in seconds, not hours.",
    long: "Author once with merge fields, send forever. Every letter is generated as a PDF, attached to the property, and emailed or queued for mail.",
    bullets: [
      "Drag-and-drop template editor with merge fields",
      "Per-tenant letterhead, signature block, and footer",
      "Bulk-send statements at month-end with one click",
      "Postal mail handoff via PDF download for your mail house",
    ],
  },
  {
    slug: "payments",
    title: "Payments & dues tracking",
    short:
      "Track assessments, fees, and fines per property — with online payments via Stripe and a clean ledger.",
    long: "A live dues ledger per property, automatic late-fee schedules, and a self-service payment page for residents. Reconcile by export when it's time for the bookkeeper.",
    bullets: [
      "Recurring assessments with proration on close",
      "Online payments via Stripe — ACH and card",
      "Configurable late-fee and interest schedules",
      "CSV export ready for QuickBooks or your accountant",
    ],
  },
  {
    slug: "portal",
    title: "Resident self-service portal",
    short:
      "Residents see their property, dues, violations, documents, and announcements — without calling the board.",
    long: "Strip 80% of the routine board email volume by giving residents a clean self-service window into everything that affects them.",
    bullets: [
      "Pay dues, view statements, download receipts",
      "View open violations and submit a rebuttal",
      "Browse the document library — CC&Rs, bylaws, minutes",
      "Submit ARC requests with photos and drawings",
    ],
  },
  {
    slug: "documents",
    title: "Document knowledge base",
    short:
      "Upload CC&Rs, bylaws, and minutes once — find any clause in a second with full-text search.",
    long: "Drop in your governing documents and the system extracts the text, indexes it, and lets you (or any resident with permission) search every paragraph instantly.",
    bullets: [
      "Upload PDFs, Word docs, or scanned letters",
      "Postgres full-text search across every governing doc",
      "Per-document permissions: board-only, residents, public",
      "Version history so the latest amendment is always on top",
    ],
  },
]

export const NAV_LINKS = [
  { href: "/products/hoa", label: "HOA Hub" },
  { href: "/products/property", label: "Property Mgmt" },
  { href: "/products/eviction", label: "Eviction Hub" },
  { href: "/pricing", label: "Pricing" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
] as const

/**
 * Homeowner Hub umbrella: three products positioned together.
 * HOA Hub = the original HOA Pro Hub feature set.
 */
export type ProductSlug = "hoa" | "property" | "eviction"

export type Product = {
  slug: ProductSlug
  name: string
  tagline: string
  description: string
  bullets: string[]
}

export const PRODUCTS: Product[] = [
  {
    slug: "hoa",
    name: "HOA Hub",
    tagline: "Run your homeowners association.",
    description:
      "Properties, residents, violations, letters, payments, and a resident self-service portal — built for HOAs, condos, and master-planned communities.",
    bullets: [
      "Resident & property records",
      "Violations & automated letters",
      "Online dues & payments",
      "Resident portal",
    ],
  },
  {
    slug: "property",
    name: "Property Management",
    tagline: "Tenants, leases, rent, maintenance.",
    description:
      "Manage every property you own or operate: units, tenants, leases, rent collection, vendors, utilities, and maintenance requests.",
    bullets: [
      "Tenants & leases",
      "Rent & late fees",
      "Vendors & maintenance",
      "Utilities tracking",
    ],
  },
  {
    slug: "eviction",
    name: "Eviction Hub",
    tagline: "Stage-by-stage workflow per jurisdiction.",
    description:
      "Eviction is hyperlocal. We model the steps, deadlines, and notices for each state and county — starting with Georgia: Rockdale County and DeKalb County (Decatur).",
    bullets: [
      "State + county playbooks",
      "Deadline tracking",
      "Document generation (coming)",
      "Audit trail",
    ],
  },
]

export const FOOTER_LINKS = {
  product: [
    { href: "/features/properties", label: "Properties" },
    { href: "/features/violations", label: "Violations" },
    { href: "/features/letters", label: "Letters" },
    { href: "/features/payments", label: "Payments" },
    { href: "/features/portal", label: "Resident portal" },
    { href: "/features/documents", label: "Documents" },
    { href: "/pricing", label: "Pricing" },
    { href: "/demo", label: "Demo" },
  ],
  company: [
    { href: "/about", label: "About" },
    { href: "/contact", label: "Contact" },
  ],
  legal: [
    { href: "/legal/terms", label: "Terms of Service" },
    { href: "/legal/privacy", label: "Privacy Policy" },
    { href: "/legal/dpa", label: "Data Processing Addendum" },
  ],
} as const

export type Plan = {
  slug: "trial" | "starter" | "standard" | "pro"
  name: string
  description: string
  monthly: number | null // null = custom / talk-to-us / free
  annual: number | null // already discounted at 17% if applicable
  properties: string
  seats: string
  highlights: string[]
  cta: { label: string; href: string }
  featured?: boolean
}

// Annual = 17% off monthly, billed yearly. Stored as the *monthly equivalent*
// price the customer sees displayed (i.e. 49 -> 41, 129 -> 107, 299 -> 248).
const annualEquivalent = (monthly: number) =>
  Math.round(monthly * (1 - 0.17))

export const PLANS: Plan[] = [
  {
    slug: "trial",
    name: "Free Trial",
    description: "Kick the tires for 14 days, no card required.",
    monthly: 0,
    annual: 0,
    properties: "Up to 50",
    seats: "Up to 3 admins",
    highlights: [
      "Full Standard plan features",
      "Sample data + onboarding wizard",
      "No credit card required",
      "Cancel anytime — your data exports cleanly",
    ],
    cta: { label: "Start free trial", href: "/signup?plan=trial" },
  },
  {
    slug: "starter",
    name: "Starter",
    description: "Self-managed boards running their first community online.",
    monthly: 49,
    annual: annualEquivalent(49),
    properties: "Up to 100",
    seats: "3 admin seats",
    highlights: [
      "Properties + residents + violations",
      "Letter templates + PDF export",
      "Resident portal with dues view",
      "Email support, 2-business-day SLA",
    ],
    cta: { label: "Start with Starter", href: "/signup?plan=starter" },
  },
  {
    slug: "standard",
    name: "Standard",
    description: "Mid-size HOAs and condo associations with active boards.",
    monthly: 129,
    annual: annualEquivalent(129),
    properties: "Up to 350",
    seats: "10 admin seats",
    highlights: [
      "Everything in Starter, plus:",
      "Online payments via Stripe (ACH + card)",
      "Automated late fees + escalation rules",
      "ARC module + voting & elections",
      "Priority email + chat support",
    ],
    cta: { label: "Start with Standard", href: "/signup?plan=standard" },
    featured: true,
  },
  {
    slug: "pro",
    name: "Pro",
    description: "Master-planned communities and management companies.",
    monthly: 299,
    annual: annualEquivalent(299),
    properties: "Up to 1,500",
    seats: "Unlimited admins",
    highlights: [
      "Everything in Standard, plus:",
      "Open API access + webhooks",
      "Vendor portal & maintenance marketplace",
      "Insurance / document expiration tracking",
      "Custom domain (CNAME) + white-label footer removal",
      "Phone support + dedicated migration help",
    ],
    cta: { label: "Start with Pro", href: "/signup?plan=pro" },
  },
]

export const ENTERPRISE = {
  name: "Enterprise",
  description: "Multi-property management firms with 1,500+ doors.",
  cta: { label: "Talk to us", href: "/contact?topic=enterprise" },
}

// Comparison matrix sections — used by /pricing.
export const COMPARISON_MATRIX: Array<{
  group: string
  rows: Array<{
    label: string
    trial: string | boolean
    starter: string | boolean
    standard: string | boolean
    pro: string | boolean
  }>
}> = [
  {
    group: "Core",
    rows: [
      { label: "Properties", trial: "50", starter: "100", standard: "350", pro: "1,500" },
      { label: "Admin seats", trial: "3", starter: "3", standard: "10", pro: "Unlimited" },
      { label: "Resident logins", trial: "Unlimited", starter: "Unlimited", standard: "Unlimited", pro: "Unlimited" },
      { label: "Audit log", trial: true, starter: true, standard: true, pro: true },
      { label: "Data export (CSV/PDF)", trial: true, starter: true, standard: true, pro: true },
    ],
  },
  {
    group: "Operations",
    rows: [
      { label: "Property + resident records", trial: true, starter: true, standard: true, pro: true },
      { label: "Violation management", trial: true, starter: true, standard: true, pro: true },
      { label: "Letter templates + PDF", trial: true, starter: true, standard: true, pro: true },
      { label: "Online payments (Stripe)", trial: true, starter: false, standard: true, pro: true },
      { label: "Automated late fees", trial: true, starter: false, standard: true, pro: true },
      { label: "ARC module", trial: true, starter: false, standard: true, pro: true },
      { label: "Voting & elections", trial: true, starter: false, standard: true, pro: true },
      { label: "Vendor portal", trial: false, starter: false, standard: false, pro: true },
      { label: "Insurance & doc expiration", trial: false, starter: false, standard: false, pro: true },
    ],
  },
  {
    group: "Resident experience",
    rows: [
      { label: "Resident self-service portal", trial: true, starter: true, standard: true, pro: true },
      { label: "PWA mobile app", trial: true, starter: true, standard: true, pro: true },
      { label: "Document knowledge base (full-text search)", trial: true, starter: true, standard: true, pro: true },
      { label: "Public community page", trial: false, starter: false, standard: true, pro: true },
    ],
  },
  {
    group: "Admin & branding",
    rows: [
      { label: "Tenant branding (logo + colors)", trial: true, starter: true, standard: true, pro: true },
      { label: "Custom domain (CNAME)", trial: false, starter: false, standard: false, pro: true },
      { label: "Remove \"Powered by HOA Pro Hub\" footer", trial: false, starter: false, standard: false, pro: true },
      { label: "Open API + webhooks", trial: false, starter: false, standard: false, pro: true },
    ],
  },
  {
    group: "Support",
    rows: [
      { label: "Email support", trial: true, starter: "2 BD SLA", standard: "1 BD SLA", pro: "Same-day" },
      { label: "Chat support", trial: false, starter: false, standard: true, pro: true },
      { label: "Phone support", trial: false, starter: false, standard: false, pro: true },
      { label: "Dedicated migration help", trial: false, starter: false, standard: false, pro: true },
    ],
  },
]

export const ADDONS = [
  {
    name: "Extra properties",
    price: "$0.25 / property / month",
    description:
      "Going past your plan's cap? Add doors in any quantity, prorated to the day.",
  },
  {
    name: "Extra email volume",
    price: "$10 / 1,000 emails",
    description:
      "Standard plans include 5,000 outbound emails per month. Buy a top-up if you blow past it during a special assessment vote.",
  },
  {
    name: "Custom domain",
    price: "$25 / month",
    description:
      "Serve your portal from `community.example.com` instead of `your-slug.hoaprohub.app`. Free on Pro.",
  },
  {
    name: "White-label footer removal",
    price: "$25 / month",
    description:
      "Remove the \"Powered by HOA Pro Hub\" line from emails and PDF letters. Free on Pro.",
  },
  {
    name: "Onboarding concierge",
    price: "$499 one-time",
    description:
      "We import your existing properties, residents, and governing docs from your spreadsheets and PDFs. White-glove migration with a 1:1 kick-off call.",
  },
]

export const FAQ_HOME: Array<{ q: string; a: string }> = [
  {
    q: "Is my community's data safe?",
    a: "Your data lives in your own isolated tenant inside our Postgres database, protected by row-level security. We never share data between communities, and every change is captured in a tamper-evident audit log. You can export everything to CSV or PDF at any time, and you own it.",
  },
  {
    q: "Will you help us migrate from spreadsheets?",
    a: "Yes. The onboarding wizard imports CSVs from any tool — QuickBooks, Buildium, AppFolio, or your own spreadsheets. For Pro plans, we offer hands-on migration help. Smaller communities usually self-serve in under an hour.",
  },
  {
    q: "How does billing work?",
    a: "Monthly or annual via Stripe. Annual saves you 17% — about two months free. There is no contract; cancel any time and keep access through the end of your billing period. The 14-day trial does not require a credit card.",
  },
  {
    q: "What happens if we cancel?",
    a: "Your data is preserved for 30 days post-cancellation so you can export everything you need. After that, we anonymize personally identifiable information and archive aggregate data, then hard-delete after 7 years per our DPA.",
  },
  {
    q: "Can one person manage multiple communities?",
    a: "Yes. Property managers can log in once and switch between communities they have memberships in. Each community is a fully isolated tenant with its own data, branding, and billing.",
  },
  {
    q: "Can we white-label HOA Pro Hub?",
    a: "Pro plans support custom-domain branding (your portal at `community.example.com`) and remove the \"Powered by HOA Pro Hub\" footer from emails and letters. Custom logo and colors are available on every plan.",
  },
  {
    q: "Do you support condo associations and master-planned communities?",
    a: "Yes. The platform models HOAs, COAs, master-planned communities, and townhome associations. The terminology in the UI adjusts based on the community type you pick during onboarding.",
  },
  {
    q: "Do residents pay anything?",
    a: "Residents never pay HOA Pro Hub directly. The community pays a flat monthly subscription. If you collect dues online via Stripe, residents only see standard payment processing fees on their statement.",
  },
]

export const FAQ_BILLING: Array<{ q: string; a: string }> = [
  {
    q: "Is a credit card required for the trial?",
    a: "No. The 14-day trial requires only an email and a community name. We will email you 3 days before the trial ends; if you do nothing, your account simply pauses — your data is preserved for 30 days while you decide.",
  },
  {
    q: "What happens if we exceed our property cap?",
    a: "We never block you mid-month. You can add extra properties as an add-on at $0.25/property/month, or you can upgrade plans on the spot. We email the board admin when usage hits 90% of cap.",
  },
  {
    q: "Are there setup fees or contracts?",
    a: "No setup fees. Month-to-month with no contract on every plan. Annual billing is offered as an optional discount, not a lock-in — refunds are pro-rated if you cancel mid-term.",
  },
  {
    q: "What payment methods do you accept?",
    a: "Credit card and ACH via Stripe. Annual subscribers can also pay by check on request.",
  },
  {
    q: "Can we get a refund?",
    a: "Within 30 days of any new charge, yes — full refund, no questions. After that, monthly subscriptions are non-refundable for the current period; annual subscriptions are pro-rated.",
  },
  {
    q: "Do prices include tax?",
    a: "Prices shown are pre-tax. Sales tax may apply depending on your community's address; Stripe calculates and adds it at checkout.",
  },
]

export const TESTIMONIALS = [
  {
    quote:
      "We replaced a Word doc, a Google Sheet, and three email threads with one screen. Our board's monthly meeting now ends 45 minutes earlier.",
    author: "Asaf Hamou",
    role: "Board Member, Madison Park HOA",
  },
]
