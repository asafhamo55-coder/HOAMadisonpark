# 10 — Design System

Used by every stream. Read this before writing UI.

---

## Tokens

```css
:root {
  /* Brand — defaults; tenant-overridable per Stream E */
  --tenant-primary: #0F2A47;     /* deep navy */
  --tenant-primary-fg: #FFFFFF;
  --tenant-accent: #10B981;      /* emerald */
  --tenant-accent-fg: #FFFFFF;

  /* Neutrals */
  --gray-50:  #F8FAFC;
  --gray-100: #F1F5F9;
  --gray-200: #E2E8F0;
  --gray-300: #CBD5E1;
  --gray-500: #64748B;
  --gray-700: #334155;
  --gray-900: #0F172A;

  /* Semantic */
  --success: #10B981;
  --warning: #F59E0B;
  --danger:  #EF4444;
  --info:    #3B82F6;

  /* Typography */
  --font-sans: 'Inter', system-ui, sans-serif;
  --font-display: 'Fraunces', 'Inter', sans-serif;  /* marketing only */
  --font-mono: 'JetBrains Mono', monospace;

  /* Spacing scale (4px base) */
  /* Use Tailwind defaults: space-1 = 4px through space-20 = 80px */

  /* Radius */
  --r-sm: 6px;
  --r:    10px;
  --r-lg: 14px;
  --r-xl: 20px;

  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(15, 23, 42, 0.06);
  --shadow:    0 4px 12px rgba(15, 23, 42, 0.08);
  --shadow-lg: 0 12px 32px rgba(15, 23, 42, 0.12);
}
```

Dark mode: support via `class="dark"` on `<html>`. Tenant primary stays the same; backgrounds invert.

---

## Components

Use shadcn/ui as the base. Customize via `components.json` to use the tenant tokens. Do not introduce a second component library.

### Patterns established

- **Cards** for entities (property, vendor, violation): rounded-lg, soft border, white bg, padding 6
- **Tables** for list views: dense rows, hoverable, sortable headers, bulk-action toolbar above
- **Forms** in slide-overs (right drawer) for quick edits, full pages for complex creates
- **Empty states** with illustration + primary CTA + secondary "learn more" link
- **Badges** for statuses with consistent color mapping:
  - open / active → emerald
  - pending / in-review → amber
  - overdue / urgent → red
  - resolved / completed → slate
  - draft → indigo

### Don't

- Don't use stock iconography for empty states — use simple custom SVGs in tenant primary color
- Don't use multiple shades of the same color in one view (e.g., navy AND blue AND indigo)
- Don't bury primary actions — they go top-right of the page header, never in a hamburger
- Don't write tables wider than the viewport — make low-priority columns togglable

---

## Layouts

### Tenant workspace

```
┌──────────────────────────────────────────────┐
│  [logo] Tenant name                  [user]  │ ← top bar, 56px
├──────┬───────────────────────────────────────┤
│      │                                       │
│ side │              page content             │
│ nav  │                                       │
│ 240px│                                       │
│      │                                       │
└──────┴───────────────────────────────────────┘
```

Sidebar nav items (admin/board view):
Dashboard · Properties · Residents · Violations · Letters · Vendors · Payments · ARC · Requests · Documents · Announcements · Reports · Settings

Resident portal: simplified top-nav, no sidebar.

### Marketing site

Standard centered layout, max-width 1280px, generous whitespace, single sticky top nav.

### Platform console

Dense, dashboard-y, multiple data widgets per row. Different chrome (slate background, "OPS" label) so it's visually distinct from tenant workspaces.

---

## Email design

- 600px max width
- Tenant logo top-left, max height 60px
- Inter, 16px body, 1.5 line-height
- Primary action as a solid button using tenant primary color
- Footer: tenant name, address, unsubscribe link, "Powered by HOA Hub" (removable on Pro+)

Use `react-email` components — already in dependencies.

---

## Letter PDF design

- US Letter, 1-inch margins
- Header: tenant letterhead PNG OR (logo + name + address text) — full width band
- Section headers in tenant primary color, body in dark gray
- Footer with page numbers ("Page X of Y") and tenant contact info
- Signature block with optional digital signature image

Generate via the docx skill or pdf skill — never hand-roll PDF rendering.

---

## Accessibility

- WCAG 2.1 AA minimum
- Color contrast: text on tenant primary must be checked when tenant changes color (warn in branding UI if it fails)
- Keyboard: every interactive element focusable, visible focus ring, escape closes modals
- Screen readers: aria labels on icon buttons, semantic HTML over divs
- Forms: labels for every input, errors announced via `aria-live`

---

## Responsive

- Mobile (<768px): single column, sidebar collapses to a drawer
- Tablet (768–1024): two-column layouts where useful
- Desktop (1024+): full layout

Dashboards prioritize mobile readability for board members on the go.

---

## Iconography

Use Lucide icons exclusively (already imported). Standard size 20px in nav, 16px inline, 24px in empty states.
