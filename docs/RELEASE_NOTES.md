# Armor Vue — Release Notes

---

## v2.0.0 — Reports Redesign & Security Hardening
**Released:** 2026-03-09

### Overview
Major release introducing a fully redesigned reports portal with Finance, Service, and Materials dashboards, a new defect workflow with actionable tracking, material re-order hopper, and comprehensive security hardening in preparation for corporate IT review.

---

### New Features

#### Finance Dashboard (reports.html)
- **Running Totals Bar** — real-time TODAY / WTD / MTD / YTD collection totals computed from `amountCollected` on job records
- **Monthly Goal Progress** — progress bar showing MTD collections vs. configurable monthly goal with percentage display
- **Upcoming to Collect** — MTD estimate of revenue from jobs this month that have not yet received a finance status
- **Amount Collected Input** — finance staff can set or confirm `amountCollected` directly on each card:
  - `completed_collected` → pre-fills from `balanceDue`, editable
  - `completed_partial` → empty input, required before archiving
  - `completed_not_collected` → shows $0, no input
- **Dashboard / Archive toggle** — Dashboard shows active (not archived) records grouped by status; Archive applies date filters to historical records

#### Service Dashboard (reports.html)
- **Defect Action Cards** — each defect from `openings[].defects[]` renders as an expandable card with customer info, installer, job number, defect type, description, and photo thumbnails
- **Clear action** — marks a defect resolved with `clearedAt` / `clearedBy` / `clearedByName` timestamps; removes from active list
- **Track action** — flags a defect as `tracked: true` with a free-text `trackingNote`; moves to a Tracking section until cleared
- **Re-order action** — creates a `material_orders` document pre-filled with defect and job info; shows confirmation flash
- **Tracking section** — persistent view of all tracked-but-not-cleared defects with their notes

#### Materials Tab (reports.html) — New
- New tab visible to `manager` and `service` roles
- Three lifecycle sections: **Pending → Ordered → Complete**
- Cards show: material description, job number, customer, installer, reported date, reporter name
- **Mark Ordered** — sets `status: 'ordered'` with `orderedAt` timestamp
- **Mark Received** — sets `status: 'complete'` with `completedAt` timestamp
- **Add Note** — saves free-text note to `material_orders.notes`
- Complete section is collapsible/dimmed to reduce noise

#### Daily Review Snapshots (reports.html)
- Finance snapshot (manager only): TODAY collected / not collected counts and dollar totals
- Service snapshot (manager only): open defect count and pending material orders count
- Both rendered as stat-mini boxes in the Daily Review summary bar

#### Monthly Goal Setting (index.html)
- New "Portal Settings" card in admin Settings accordion
- "Monthly Collection Goal" number input saved to `settings/portal.monthlyGoal`
- Used by Finance tab progress bar in reports.html

#### Amount Collected — Installer Input (installer.html)
- When an installer selects `completed_partial`, an "Amount Collected" number input appears (optional)
- When `completed_collected` is selected, the field pre-fills from the job's `balanceDue`
- Value saved as `amountCollected` on the `job_records` document

---

### Security Hardening

#### HTTP Security Headers (firebase.json)
All routes now serve:
- `X-Frame-Options: DENY` — prevents clickjacking via iframe embedding
- `X-Content-Type-Options: nosniff` — prevents MIME-type sniffing attacks
- `Referrer-Policy: strict-origin-when-cross-origin` — limits referrer header leakage
- `Permissions-Policy` — disables camera, microphone, geolocation, and payment APIs
- `Content-Security-Policy` — restricts scripts, styles, images, fonts, and connections to trusted origins only; `frame-ancestors 'none'` as defense-in-depth against framing

#### Firestore Rules (firestore.rules)
- Added `installerOwns(installerId)` helper — cross-references `installers/{id}.firebaseUid` to verify the authenticated user owns the installer record before granting access
- Tightened `job_records`: installers can only read their own records; management retains full access
- Tightened `extra_work_requests`: same ownership pattern applied
- Added `material_orders` collection rules: management users can create (creator must match `request.auth.uid`) and update (immutable `createdBy` / `createdAt` fields enforced server-side)

#### Storage Rules (storage.rules)
- Rewrote with `ownsInstaller(installerId)` helper using `firestore.get()` cross-reference
- Installers scoped to their own paths: `jobs/{jobId}/installers/{installerId}/` and `installers/{installerId}/`
- Management read-all; deny-all catch-all at the bottom

#### XSS Fixes (installer.html)
- Three instances of unescaped `err.message` rendered via `innerHTML` — all wrapped with `esc()` helper

#### Admin UID Removed from Shared Config
- `window.ADMIN_UID` removed from `deploy/js/firebase-config.js` (public, shared across portals)
- `installer.html` auth handler replaced with async `management_users` Firestore lookup — any active management user is routed to preview mode; no hardcoded UID in client-facing JS
- `index.html` retains a local `const ADMIN_UID` scoped only to that file's script block

---

### Data Model Changes

#### New Firestore Collection: `material_orders`
| Field | Type | Description |
|---|---|---|
| `material` | string | Description of material needed |
| `jobId` | string | Source job document ID |
| `jobNumber` | string | Human-readable job number |
| `customerName` | string | Customer name |
| `installerId` | string | Installer Firestore doc ID |
| `installerName` | string | Installer display name |
| `defectType` | string | Defect type from source defect |
| `defectDesc` | string | Defect description from source defect |
| `status` | string | `pending` / `ordered` / `complete` |
| `notes` | string | Free-text notes |
| `createdAt` | timestamp | Creation timestamp |
| `createdBy` | string | Creator UID |
| `createdByName` | string | Creator display name |
| `orderedAt` | timestamp\|null | When marked ordered |
| `completedAt` | timestamp\|null | When marked received/complete |

#### New Field: `settings/portal.monthlyGoal`
- Type: number
- Set by manager in admin portal Settings → Portal Settings
- Used by Finance tab running totals progress bar

#### New Field: `job_records.amountCollected`
- Type: number
- Set by installer (partial status) or auto-filled from `balanceDue` (collected status)
- Drives all Finance running total calculations

#### New Fields on `job_records.openings[].defects[]`
| Field | Type | Description |
|---|---|---|
| `clearedAt` | timestamp | When defect was cleared |
| `clearedBy` | string | UID of who cleared it |
| `clearedByName` | string | Display name of who cleared it |
| `tracked` | boolean | Whether defect is being tracked |
| `trackingNote` | string | Free-text tracking note |

#### `job_records.amountCollected` derivation rule
| Status | `amountCollected` value |
|---|---|
| `completed_collected` | `balanceDue` (auto-filled) |
| `completed_partial` | User-entered value |
| `completed_not_collected` | 0 |

---

### Reverted / Preserved

#### `contractAmt` Retained in `jobs` Collection
- An earlier draft stripped `contractAmt` from `jobs.financials` to prevent installer exposure.
- **Reverted**: `contractAmt` is stored as part of the full `financials` object in `jobs` for use in management Finance reports.
- Installer exposure is prevented at the UI layer — `installer.html` never displays `contractAmt` in any view.

---

### Role Gating

| Tab | manager | finance | service |
|---|---|---|---|
| Daily Review | Yes | No | No |
| Finance | Yes | Yes | No |
| Service | Yes | No | Yes |
| Materials | Yes | No | Yes |

---

### Breaking Changes / Migration Notes

- **`amountCollected` required for Finance totals** — existing `completed_partial` records without `amountCollected` will show as $0 in running totals until finance staff updates the cards
- **`material_orders` Firestore rules** must be deployed before the Materials tab is used; creating orders without the rules in place will be rejected
- **Storage rules rewrite** — the new rules are more restrictive; any paths not matching `jobs/{jobId}/installers/{installerId}/` or `installers/{installerId}/` will be denied. Verify no legacy paths exist before deploying.
- **Admin preview mode in installer.html** now requires an active `management_users` record. Staff who previously relied on ADMIN_UID matching will need a `management_users` doc with `status: 'active'`.

---

### Deployment Checklist

```
[ ] Deploy Firestore rules:   firebase deploy --only firestore:rules
[ ] Deploy Storage rules:     firebase deploy --only storage
[ ] Deploy Hosting:           firebase deploy --only hosting
[ ] Verify monthly goal loads in reports Finance tab
[ ] Verify running totals compute correctly (set a test amountCollected)
[ ] Verify defect Clear / Track / Re-order persist in Firestore
[ ] Verify Materials tab lifecycle (pending → ordered → complete)
[ ] Verify Daily Review shows finance + service snapshots (manager login)
[ ] Verify role gating: finance user sees only Finance tab
[ ] Verify installer amountCollected field appears on partial/collected status
[ ] Verify HTTP security headers present on all routes (curl -I or DevTools)
[ ] Confirm contractAmt is present in jobs.financials (not stripped)
```

---

## v1.x — Prior Releases

### v1.2 — TeamUp Sync & Extra Work
- TeamUp calendar integration via Cloud Functions (`functions/index.js`)
- Extra work request workflow (installer-initiated, management-approved)
- Defect reporting with photo uploads

### v1.1 — Service & Finance Report Tabs
- Initial reports.html with basic Finance and Service tabs
- Management action logging (`management_actions` collection)
- Archive workflow with date filtering

### v1.0 — Initial Release
- Installer portal with magic link authentication
- Job status flow (scheduled → in-progress → completed variants)
- Opening-by-opening status tracking with photo upload
- Admin portal with job management, installer management, settings
- Firestore-backed data model with role-based auth
