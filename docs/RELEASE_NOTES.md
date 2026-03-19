# Armor Vue — Release Notes

---

## v2.3.0 — Compliance, Reviews, Analytics & Operations
**Released:** 2026-03-19 (unreleased tag — tag after deploy)

### Overview
Major feature release spanning compliance document tracking, installer reviews and ratings, a full Analytics tab, failed inspection email ingestion pipeline, staff management improvements, and significant UI/UX polish across all portals. Also includes a critical magic link login fix for admin-sent sign-in links.

---

### New Features

#### Installer Compliance & Document Tracking (installer.html + index.html)
- Installers can upload and manage compliance documents (insurance, certifications, etc.)
- Admin can define required document types per installer type
- Compliance warnings card on admin dashboard shows installers with missing or expiring documents — collapsible rollup
- Start Job blocked until required product is received (inventory gate)
- Document checks restricted to installer type only — FT Field Techs and Inspection types exempt from window/door installer requirements

#### Installer Reviews & Ratings (installer.html + reports.html)
- Management can submit reviews on installers with star rating and free-text notes
- Reviews visible in installer management section
- Reviews query sorted client-side to avoid composite Firestore index requirement

#### Analytics Tab (reports.html) — New
- New tab visible to `manager` role
- Windows rating breakdown by installer
- Labor percentage metrics with configurable warning/critical thresholds (set in admin settings)
- Approved extra work included in installer earnings totals

#### Failed Inspection Email Ingestion Pipeline (functions/index.js)
- Power Automate webhook receives failed inspection emails from inspection software
- Cloud Function parses and stores to `failed_inspections` Firestore collection
- Installer alerted on next portal load; daily stats surfaced in Daily Review
- See `docs/power-automate-setup.md` for full setup guide

#### Staff Management Improvements (index.html)
- Staff welcome email flow — new staff members receive a sign-in link on provisioning
- Staff edit modal expanded: name, email, and role all editable
- Staff login URL fixed to point to correct portal

#### Daily Review Redesign (reports.html)
- Week view with compact job rows replacing the previous stat-box layout
- Colour-coded rows: green (collected), yellow (warn), red (bad), grey (no activity)
- Inspection section added to daily summary
- `mon` variable scoping fix

#### Inspection Scheduling Workflow (reports.html)
- Service tab now supports scheduling follow-up inspections
- Inspection records linked to jobs and defects

#### Performance Page Redesign (installer.html)
- Windows rating displayed prominently
- Kudos and complaints split into separate sections
- Cleaner layout replacing previous single-column view

---

### Bug Fixes

#### Magic Link Login — Critical Fix
- Admin-sent sign-in links now embed `?hint=email` in the continue URL
- `completeMagicLink()` reads the hint before prompting for manual email entry
- Previously: any email mismatch (including case differences) silently consumed the one-time link and showed "link has expired" — leaving the installer locked out
- Self-serve resend flow unaffected (already stored email in localStorage)

#### Auth & Session
- Stale page state no longer bleeds through login/loading screens (fixed z-index and positioning)
- Nav hidden until auth complete and signature collected
- Auth token auto-refreshes every 30 min + on provision to prevent stale token errors
- `weekOffset` resets correctly on login
- Preview auth fixed; tutorial forced walkthrough on first login restored
- Sync interval corrected

#### Storage & Firestore Rules
- Installer document uploads moved to UID-based storage path
- `installers/{id}` write access restored for installers
- `job_records` read rule fixed for non-existent documents
- Storage rule corrected to allow installer signature upload on first login (before UID binding)
- `installer_documents` create/update permission errors resolved

#### Admin & Sync
- TeamUp sync: broader name matching, FT classification fixed, inactive calendars filtered
- Sync accuracy counts fixed: all installer types included, uses post-sync job count
- Sync diagnostic improved with full calendar breakdown
- Settings save moved to Cloud Function to bypass Firestore client-side rules
- Dashboard stat cards no longer spin indefinitely on query failure

#### Finance
- Multi-day job double-counting in finance totals fixed
- Approved extra work now included in installer earnings totals
- `amountCollected` required when setting collected or partial status

#### Installer Portal UX
- Next Opening button always shows type/number selection modal
- Next Opening quick-flow added to progress photo capture view
- Type and Number dropdowns added to opening and defect modals
- Return to job actions sheet after closing inventory modal
- Start Job no longer disappears after receiving inventory
- Preview mode no longer crashes when installer has no signature
- Redundant Inventory row removed from job detail (counts sufficient)
- SGD renamed to Sliders throughout

#### Admin UX
- Installer management divided by type: Installers / FT Field Techs / Inspection
- Installer management sections made collapsible roll-ups; provisioned types first
- Pending Provisioning always starts collapsed
- Missing Payment Info moved to bottom of dashboard, collapsed by default
- All collapsible sections default to collapsed
- Today quick-link added to schedule page
- Installer preview link `?preview=` parameter fix

---

### New Firestore Collections / Fields

#### `failed_inspections`
| Field | Type | Description |
|---|---|---|
| `jobId` | string | Linked job ID |
| `jobNumber` | string | Human-readable job number |
| `installerId` | string | Installer Firestore doc ID |
| `inspectionDate` | timestamp | Date of failed inspection |
| `reason` | string | Failure reason from email |
| `createdAt` | timestamp | Ingestion timestamp |

#### `installer_documents`
| Field | Type | Description |
|---|---|---|
| `installerId` | string | Installer Firestore doc ID |
| `type` | string | Document type (insurance, certification, etc.) |
| `fileUrl` | string | Storage download URL |
| `uploadedAt` | timestamp | Upload timestamp |
| `expiresAt` | timestamp\|null | Expiry date if applicable |

#### `reviews`
| Field | Type | Description |
|---|---|---|
| `installerId` | string | Installer Firestore doc ID |
| `rating` | number | 1–5 star rating |
| `note` | string | Free-text review |
| `createdBy` | string | Reviewer UID |
| `createdByName` | string | Reviewer display name |
| `createdAt` | timestamp | Review timestamp |

#### `settings/portal` — New Fields
| Field | Type | Description |
|---|---|---|
| `analyticsLaborWarnPct` | number | Labor % yellow threshold for Analytics |
| `analyticsLaborBadPct` | number | Labor % red threshold for Analytics |

---

### Deployment Checklist

```
[ ] firebase deploy --only hosting,firestore:rules
[ ] Verify magic link works for admin-sent links (test with a real email change)
[ ] Verify compliance document uploads and warnings display
[ ] Verify Analytics tab loads and labor thresholds apply
[ ] Verify failed inspection webhook endpoint is active
[ ] Verify staff welcome email sends on provisioning
[ ] Verify Daily Review week view renders correctly
[ ] Tag release: git tag v2.3.0 && git push origin master:main --tags
```

---

## v2.2.0-pre-compliance — Admin Overhaul & Stability
**Released:** 2026-03-15

### Overview
Comprehensive admin portal reorganisation, security audit pass, session stability fixes, and installer portal UX improvements in preparation for the compliance feature set.

### Changes
- Installer management divided by type (Installers / FT Field Techs / Inspection)
- Collapsible roll-up sections throughout admin; default collapsed
- TeamUp sync accuracy and FT classification fixed
- Settings save moved to Cloud Function
- Security audit: XSS fixes, Firestore rule tightening, input validation
- Function auth hardening; storage rules tightened
- Session: sync interval, preview auth, tutorial walkthrough fixes
- Email sign-in confirm screen added to prevent scanner consumption of one-time links
- Today quick-link on schedule; Next Opening quick-flow in photos
- Auth token auto-refresh every 30 min
- Installer preview link parameter fix
- SGD → Sliders rename throughout
- Production readiness fixes: finance math, job records, UI accuracy

---

## v2.1.1 — COC/Walkthrough Viewer & Defect Fixes
**Released:** 2026-03-11

### Changes
- COC and Walkthrough documents now viewable inline in reports.html (no separate print page)
- Print buttons renamed to "View COC" / "View Walkthrough"
- Print layout: forced page break between walkthrough and COC sections
- Duplicate re-order prevention: defect flagged with `reorderedAt` on first order
- Dashboard stat cards: fixed infinite spinner on query failure
- Admin page: reverted silent sign-out — now shows error message

---

## v2.1.0 — COC Viewer & Failed Inspections Foundation
**Released:** 2026-03-11

### Changes
- `print-job.html` added for COC/Walkthrough print view
- Admin auth fixed for print page
- `failed_inspections` Firestore index added

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
- `installer.html` auth handler replaced with async `management_users` Firestore lookup
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

#### New Field: `job_records.amountCollected`
- Type: number
- Set by installer (partial status) or auto-filled from `balanceDue` (collected status)

#### New Fields on `job_records.openings[].defects[]`
| Field | Type | Description |
|---|---|---|
| `clearedAt` | timestamp | When defect was cleared |
| `clearedBy` | string | UID of who cleared it |
| `clearedByName` | string | Display name of who cleared it |
| `tracked` | boolean | Whether defect is being tracked |
| `trackingNote` | string | Free-text tracking note |

---

### Role Gating

| Tab | manager | finance | service |
|---|---|---|---|
| Daily Review | Yes | No | No |
| Finance | Yes | Yes | No |
| Service | Yes | No | Yes |
| Materials | Yes | No | Yes |

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
