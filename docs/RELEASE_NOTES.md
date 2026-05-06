# Armor Vue — Release Notes

---

## v2.9.0 — Daily Review Status Colors & Late Start Flag
**Released:** 2026-05-06

### Overview
Daily Review gets a visual overhaul: job rows now display the installer's actual status color as a pill badge with a matching background tint. A new configurable Late Start flag highlights jobs with no recorded activity past a threshold, giving managers an at-a-glance view of jobs that haven't started on time.

---

### New Features

#### Daily Review — Status-Color-Coded Job Rows
- Job rows now pull the status color directly from the `_statusOptions` configuration instead of deriving color from flag severity.
- Status label rendered as a colored pill badge with border and RGBA background tint (12% alpha) matching the status color.
- New `hexAlpha(hex, alpha)` helper converts hex color codes to RGBA for dynamic inline styling.

#### Daily Review — Late Start Flag
- New flag type `late_start` (severity 2 = red) fires for any job scheduled today where no activity has been recorded and the elapsed time since the scheduled start exceeds the configured threshold.
- Flag runs for all jobs, including those with no record — previously, no-record rows were evaluated only for general flags.

#### Portal Settings — Late Start Threshold
- New input in the admin portal Portal Settings section: **Late Start Threshold (minutes)**.
- Stored as `settings/portal.lateStartMins` (default: 60). Configurable from 5 to 480 minutes in 5-minute increments.

---

### Bug Fixes

#### No-Record Job Rows Now Use Flag-Driven Color
- No-record job rows were hardcoded grey regardless of flag state.
- Fix: rows without a record now apply flag-driven color (red for Late Start, yellow for warnings, grey if no flags), consistent with rows that have records.

---

### Firestore Changes
- `settings/portal` document: new field `lateStartMins` (number).

---

### Deployment Checklist
- [x] `firebase deploy --only hosting` — reports.html, index.html, installer.html
- [x] No Firestore rule changes
- [x] No Cloud Function changes
- [x] No data migrations required

---

## v2.8.0 — Error Logging, Analytics & Beta Test Guide
**Released:** 2026-04-08

### Overview
Instrumentation release ahead of beta. All three portals now have global error trapping and Firestore-based analytics. Errors are automatically captured and logged without any action from testers. A comprehensive beta test checklist covers every critical flow.

---

### New Features

#### Global Error Logging (All Portals)
- New `js/error-logger.js` shared module loaded by all three portals.
- `window.onerror` and `unhandledrejection` traps catch any uncaught JS error or promise rejection.
- Errors written to `error_logs` Firestore collection with: portal, version, context, message, stack trace, URL, installer ID, and user agent.
- Rate-limited to 15 errors per session; deduplicates identical errors so a loop doesn't spam Firestore.
- Admin-only read access on `error_logs`.

#### Analytics Event Tracking (Installer Portal)
- Key events logged to `analytics_events` collection: `portal_loaded`, `section_viewed`, `job_started`, `coc_completed`, `language_changed`.
- `coc_completed` includes the installation rating given by the customer.
- Admin + management can read `analytics_events` (future: surface in reports dashboard).

#### Beta Test Guide
- `docs/BETA_TEST_GUIDE.md` — comprehensive 15-section checklist covering every installer portal flow with explicit pass/fail criteria.

---

### Firestore Changes
- New collection: `error_logs` — signed-in users can create; admin-only read.
- New collection: `analytics_events` — signed-in users can create; admin + management read.

---

### Deployment Checklist
- [x] `firebase deploy --only hosting` — error-logger.js + all three portal changes
- [x] `firebase deploy --only firestore:rules` — two new collection rules
- [x] No Cloud Function changes
- [x] No data migrations required

---

## v2.7.0 — Multi-Day Job Fixes & Quality Tab Ratings
**Released:** 2026-04-08

### Overview
Fixes multi-day job handling across inventory, earnings, and the schedule. Inspections/Quality tab now shows real data — aggregate customer installation rating pulled from completed COC flows.

---

### New Features

#### Inspections/Quality — Customer Installation Rating
- Replaced empty kudos/complaints sections with an **Installation Rating** aggregate card.
- Reads `job_records.cocRating.install` — the rating customers give during the COC signing flow.
- Displays: large average score, star rating, total count, and a per-star distribution bar chart.
- Both English and Spanish supported.

---

### Bug Fixes

#### Multi-Day Jobs — Earnings & Week Pay Double-Counting
- The dedup key was a regex on the job ID (`^(\d+)-rid-\d+$`). Jobs entered as separate TeamUp events (not recurring series) have unique IDs with no series pattern, so dedup silently failed and pay was counted once per day.
- Fix: use `j.jobNumber` as primary dedup key (falling back to `seriesId` then `id`). Same job number = same job.
- Applies to both the schedule week pay header and the earnings report.

#### Multi-Day Jobs — Inventory Block Missing on Day 2
- `propagateJobCounts()` (added in v2.6.0) copies window/door/sgd counts from the sibling that has them, but only within a single week load. For jobs where day 1 and day 2 fall in different calendar weeks, day 2's cache entry still had null counts.
- Fix: `showJobActions` is now async. If the cached job has no counts, it fetches the job document fresh from Firestore before evaluating the inventory block. Result is written back to the week cache so subsequent taps are instant.

---

### Deployment Checklist
- [x] `firebase deploy --only hosting` — installer.html changes
- [x] No Firestore rule changes
- [x] No Cloud Function changes
- [x] No data migrations required

---

## v2.6.0 — Inventory Partial Receipt, Language & Document Fixes
**Released:** 2026-04-07

### Overview
Inventory receipt redesigned to support partial/multi-day jobs. Spanish/English language switch now covers job note translation. Two bugs fixed: documents tab blank due to JS variable shadowing, and a translate feature added for office-entered job notes.

---

### New Features

#### Inventory — Partial Receipt with Stepper UI
- Inventory modal replaced all-or-nothing checkboxes with per-category `[−] count [+]` steppers showing `n of total received`.
- Row border turns amber on partial receipt, green when fully received.
- **Start Job is now hard-blocked** until at least 1 unit of any category is received. Previously blocking required ALL units — breaking multi-day jobs where only some product is taken on day 1.
- Receive Inventory button remains accessible until all categories are fully received, so installers can log the rest on day 2+.
- Backward compatible: existing records that stored a Timestamp are treated as fully received automatically.

#### Inventory — Manager Override
- When Start Job is blocked (zero inventory received), a manager previewing the installer's portal sees an orange **🔓 Override Inventory Block** button.
- Confirming writes `inventoryOverride: true` (with manager UID + timestamp) to the job_record, unblocking Start Job for the installer immediately.

#### Job Notes — On-Demand Translation
- When language is set to Spanish, a **🌐 Traducir** button appears below job notes.
- Taps the MyMemory free translation API (en→es, no API key required) and replaces the note text in-place.
- Toggle back to original with **Ver Original**. Translation cached per job visit.

---

### Bug Fixes

#### Documents Tab — Blank Page
- `renderDocumentsPage` used `t` as the `.map()` callback parameter, silently shadowing the global `t()` translation function. Every `t('doc_required')` etc. threw a TypeError, leaving the page blank with no visible error.
- Fix: renamed parameter from `t` to `dt`.

---

### Data Model Changes
- `job_records.inventoryReceived.{windows|doors|sgds}` — changed from Timestamp to Number (units received). Backward compatible via `invReceivedCount()` helper.
- `job_records.inventoryOverride` — new Boolean flag (+ `inventoryOverrideBy`, `inventoryOverrideAt`) set by manager to bypass inventory block.

---

### Deployment Checklist
- [x] `firebase deploy --only hosting` — installer.html changes
- [x] No Firestore rule changes
- [x] No Cloud Function changes
- [x] No data migrations required (backward compat handled in JS)

---

## v2.5.0 — Security Hardening & Auth Reliability
**Released:** 2026-04-05

### Overview
Full security audit and auth reliability release. Eliminates XSS vectors, tightens Firebase Storage rules, fixes cross-portal session interference, and resolves the magic link sign-in flow that was leaving installers stuck on "Signing in…" — especially on mobile.

---

### Security Fixes

#### XSS — Firestore Data in Inline Event Handlers
- Opening card HTML was injecting user-writable strings (opening type, notes) directly into `onclick="..."` attribute strings. A malicious value could execute arbitrary JS.
- Fix: Replaced inline `onclick=` attributes with `data-*` attribute delegation using `el.onclick` property assignment. Data never touches HTML attribute strings.

#### XSS — Status Bar Button
- `renderStatusBar` built its button with `onclick="showStatusPicker('${recJobId}', '${status}')"`, injecting the `status` field from Firestore directly into an attribute string.
- Fix: Removed the status value from the inline string; button now uses a direct `addEventListener`.

#### Firebase Storage Rules — Cross-Installer Read Access
- `installer_signatures`, `installer_documents`, and `installers` storage paths had overly broad read rules (any authenticated user could read any installer's files).
- Fix: Read restricted to own UID, admin UID, or verified management user (Firestore cross-check).

#### Camera Policy Blocking Mobile Camera
- `Permissions-Policy: camera=()` blocked camera access on Android Chrome, preventing photo capture.
- Fix: Changed to `camera=(self)`.

#### localStorage — Email After Sign-In
- `installerEmail` was not cleared from localStorage on logout, leaving PII in browser storage.
- Fix: `handleLogout` now clears it explicitly.

---

### Auth Reliability Fixes

#### Magic Link Hanging on "Signing in…" (Mobile)
- Root cause: Firebase fires `onAuthStateChanged` *during* `signInWithEmailLink` with intermediate states. The handler saw the oobCode still in the URL and returned early; after URL cleanup, no further event fired. Portal hung indefinitely.
- Fix: URL is cleaned *before* calling `signInWithEmailLink`. A `_magicLinkInProgress` flag blocks `onAuthStateChanged` for the duration. Routing logic extracted into `handleSignedInUser()` and called directly after sign-in resolves — no dependency on event timing.

#### Cross-Portal Session Interference
- `auth.signOut()` called in `index.html` and `reports.html` when a non-admin user was detected. Since all portals share the same Firebase Auth session on the same origin, this silently killed the installer's session mid-use.
- Fix: Removed `auth.signOut()` from non-admin branches in both management portals. Each portal now shows its own "no access" state without terminating other sessions.

#### "This Portal Is for Installers Only" on Magic Link Click
- When an admin had an active session, `onAuthStateChanged` fired with the admin user before the confirm screen could render, triggering the management-user guard.
- Fix: Magic link URL detection runs before `onAuthStateChanged` registration. If a link is present, confirm screen shows immediately and `onAuthStateChanged` is blocked until sign-in completes.

#### Firestore Permission-Denied on Page Reload
- Reloading the installer portal sometimes produced `Missing or insufficient permissions` on the jobs query because Firestore's internal auth listener hadn't propagated the restored token yet.
- Fix: `loadPortal` force-refreshes the token on `permission-denied` and retries once.

---

### Deployment Checklist
- [x] `firebase deploy --only hosting` — installer.html, index.html changes
- [x] `firebase deploy --only storage` — storage.rules tightened
- [x] No Firestore rule changes
- [x] No Cloud Function changes
- [x] No data migrations required

---

## v2.4.0 — Bug Fix & UX Polish: Auth Security, Series Jobs, Photo Wizard, Status Picker
**Released:** 2026-03-21

### Overview
Critical bug fix release addressing a security vulnerability in the installer portal, multi-day series job record sharing, the status picker being incorrectly locked despite valid signatures, and a full photo capture wizard replacing the flat slot grid.

---

### Security Fix
- **Management user portal exposure:** Refreshing `installer.html` while a management session was active showed the admin installer picker, allowing access to any installer's portal. Fixed: management users without an explicit `?preview=installerId` param are now immediately signed out and shown the normal installer login screen.

### Bug Fixes

#### Status Picker Locked Despite Signed COC + Walkthrough
- Root cause: `updateJobStatus` was overwriting `jobRecordCache[jobId]` with only `{ status: newStatus }`, discarding signatures. `showStatusPicker` then read the stale partial cache entry and saw no signatures.
- Fix: Added `currentJobRec` global that always holds the full displayed record. `showStatusPicker` and `saveNewStatus` now read from `currentJobRec` (what's on screen) instead of the cache. `updateJobStatus` now merges status changes into the full record and passes `recId` back to `renderJobDetail` so `currentJobIdForCapture` stays stable.

#### Multi-Day (Series) Job — Wrong Record / "Starting From Beginning"
- Root cause: Series sibling lookup relied on client-side job cache, which was empty, stale, or incomplete (especially for jobs spanning different calendar weeks or after cache was cleared by a save operation).
- Fix: `openJobDetail` now queries Firestore directly (`where('seriesId', '==', ...)`) to get all series siblings authoritatively. Falls back to client-side cache only if the Firestore query fails.
- Also fixed schedule cards: each day card now checks all series siblings for a record so the correct status shows on Day 2 even when the record is stored under Day 1's ID.

### UX Improvements

#### Photo Capture Wizard (installer.html)
- Replaced the flat photo-slot grid with a step-by-step wizard inside each opening.
- Single-slot photos (e.g., Frame, Sill) auto-advance to the next unfilled slot after capture.
- Multi-photo slots (Bucking, Fasteners) stay on the same slot so the installer can take multiple photos; "→ Next Photo" button advances manually.
- Progress dots show which slots are done and which is active.
- Completion screen at the end offers: "Continue to [Next Opening]", "+ Add Next Opening", "≡ Review / Add Photos", and "← Back to All Openings".
- Overview grid still accessible via ≡ button for retakes or out-of-order captures.

### Deployment Checklist
- [x] `firebase deploy --only hosting` — installer.html changes
- [x] No Firestore rule changes
- [x] No Cloud Function changes
- [x] No data migrations required

---

## v2.3.0 — Compliance, Reviews, Analytics & Operations
**Released:** 2026-03-19

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
