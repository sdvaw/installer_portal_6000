# Armor Vue — Installer Portal
## System Design Document

**Version:** 2.4
**Date:** March 2026
**Status:** Production
**Live URL:** https://installer-portal-6000.web.app

---

## 1. Overview

The Armor Vue Installer Portal is a web-based field operations platform for a window and door installation company. It serves two distinct user groups through separate interfaces:

1. **Installers** — Field technicians who use the portal on-site to document job completions, collect signatures, report defects, upload compliance documents, and update job status.
2. **Management Staff** — Office personnel (Finance, Service, Managers) who use the dashboard to monitor jobs, track collections, manage defects, review analytics, and manage daily operations.

The system integrates with **TeamUp** (a calendar/scheduling SaaS) as the source of truth for job scheduling, and uses **Firebase** as the backend for authentication, data storage, and file hosting. Failed inspection emails are ingested via a **Power Automate** webhook.

---

## 2. Technology Stack

| Layer | Technology |
|-------|-----------|
| Hosting | Firebase Hosting (CDN, HTTPS) |
| Authentication | Firebase Authentication |
| Database | Cloud Firestore (NoSQL) |
| File Storage | Firebase Storage |
| Backend Functions | Firebase Cloud Functions (Node.js) |
| Scheduling Source | TeamUp Calendar API |
| Email Ingestion | Power Automate → Cloud Function webhook |
| Frontend | Vanilla HTML/CSS/JavaScript (no framework) |
| Firebase SDK | Firebase Compat v10 |

No third-party frontend frameworks or npm dependencies are used in the client. All portal pages are self-contained HTML files served statically.

---

## 3. System Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Firebase Hosting                   │
│  installer.html  │  reports.html  │  index.html      │
└──────────────────────────┬──────────────────────────┘
                           │ HTTPS
              ┌────────────▼────────────┐
              │     Firebase Services    │
              │                         │
              │  ┌─────────────────┐    │
              │  │  Firebase Auth   │    │
              │  │  (Email link /  │    │
              │  │  Email+password) │    │
              │  └─────────────────┘    │
              │                         │
              │  ┌─────────────────┐    │
              │  │ Cloud Firestore  │    │
              │  │  (all app data)  │    │
              │  └─────────────────┘    │
              │                         │
              │  ┌─────────────────┐    │
              │  │ Firebase Storage │    │
              │  │ (photos, docs,  │    │
              │  │  signatures)     │    │
              │  └─────────────────┘    │
              │                         │
              │  ┌─────────────────┐    │
              │  │ Cloud Functions  │    │
              │  │  (TeamUp sync +  │    │
              │  │   webhooks)      │    │
              │  └────────┬────────┘    │
              └───────────┼─────────────┘
                          │
              ┌───────────┼─────────────┐
              │           │  REST API   │
              ▼           ▼             │
     TeamUp Calendar   Power Automate   │
  (job scheduling)  (failed inspection  │
                     email ingestion)   │
```

### Data Flow — Job Lifecycle

```
TeamUp (schedule)
    → Cloud Function syncs → Firestore /jobs
    → Installer opens job in installer.html
    → Installer confirms inventory, documents openings, captures signatures
    → Installer submits job record → Firestore /job_records
    → Management reviews in reports.html (Finance / Service / Analytics tabs)
    → Management archives completed records
```

### Data Flow — Failed Inspection

```
Inspection software sends result email
    → Power Automate parses email → POST to Cloud Function webhook
    → Cloud Function writes to Firestore /failed_inspections
    → Installer sees alert on next portal load
    → Manager sees count in Daily Review
```

---

## 4. Portal Pages

### 4.1 Installer Portal (`installer.html`)

Accessed by field installers via a magic link (passwordless email sign-in). Features:

- **Schedule** — Weekly calendar view of assigned jobs; Today quick-link
- **Job Detail** — Job info, financial balance due, opening counts
- **Job Start Flow** — Inventory confirmation gate (Start Job blocked until product received), start photos
- **Opening Documentation** — Per-opening type/number selection, photos, defect reporting with Next Opening quick-flow
- **Walkthrough Checklist** — Pre-completion checklist with customer signature
- **Certificate of Completion (COC)** — Customer + installer signature capture
- **Status Update** — Mark job collected / partial / not collected / need service etc.; `amountCollected` input required for collected/partial
- **Extra Work Requests** — Submit requests for additional scope
- **Blackout Requests** — Request days off
- **Earnings View** — Installer pay summary by date range; includes approved extra work
- **Performance Page** — Windows rating, kudos/complaints split view
- **Compliance Documents** — Upload and manage required compliance documents (insurance, certifications)
- **Failed Inspection Alerts** — Notification shown on load if a failed inspection is on record

### 4.2 Management Dashboard (`reports.html`)

Accessed by management staff with role-based tab visibility.

| Tab | Visible To | Purpose |
|-----|-----------|---------|
| 📋 Daily Review | Manager | Week view of all jobs with colour-coded status rows; inspection section |
| 💰 Finance | Manager, Finance | Collections tracking, running totals, archiving |
| 🔧 Service | Manager, Service | Defect workflow — clear, track, re-order; inspection scheduling |
| 📦 Materials | Manager, Service | Material re-order lifecycle |
| 📊 Analytics | Manager | Installer performance — windows rating, labor %, earnings |

### 4.3 Admin Portal (`index.html`)

Accessed by the system administrator only. Features:

- **Dashboard** — Sync status, installer count, job count; compliance warnings rollup
- **Installers** — Manage installer accounts by type (Installers / FT Field Techs / Inspection); send portal links; collapsible sections
- **System Settings** — TeamUp API config, job statuses, COC text, photo requirements, defect types, portal settings (monthly goal, analytics thresholds)
- **Staff Accounts** — Manage management user accounts (finance, service, manager roles); welcome email on provisioning
- **Database Tools** — Archive old jobs, clear collections

---

## 5. User Roles & Permissions

### 5.1 Role Hierarchy

```
Administrator (1 account)
    └── Full system access, manages all users and settings

Manager
    └── All dashboard tabs: Daily Review, Finance, Service, Materials, Analytics

Finance
    └── Finance tab only

Service
    └── Service tab + Materials tab
```

### 5.2 Installer Authentication

Installers authenticate via **passwordless email magic link**. No password is required or stored. The flow:

1. Admin sends a sign-in link from the admin portal
2. Firebase sends the email; the continue URL includes `?hint=email` for seamless sign-in
3. Installer taps the link → sees a "Sign In to Portal" confirm screen (prevents email scanner consumption)
4. Installer taps the button → `completeMagicLink()` reads email from hint or localStorage
5. Firebase Auth verifies the link and signs them in
6. Portal looks up installer record by `firebaseUid`, binds UID on first login
7. Session persists locally on the device; auth token auto-refreshes every 30 min

### 5.3 Management Authentication

Management staff use **email + password** authentication via Firebase Auth. On sign-in, the portal verifies the user exists in the `management_users` collection with `status: "active"` before granting access.

**Installer portal access for management:** Management users can preview any installer's portal via `installer.html?preview=installerId`. If a management user lands on `installer.html` without a `?preview=` param (e.g., by refreshing after a session), they are immediately signed out and shown the normal installer login screen. The admin picker is never shown to unauthenticated or management-only sessions.

---

## 6. Data Model

### 6.1 Collection: `jobs`

Cached from TeamUp. Read-only from the app's perspective (sync function writes).

```
{
  id:             string,       // TeamUp event ID
  jobNumber:      string,
  customerName:   string,
  address:        string,
  startDt:        timestamp,
  endDt:          timestamp,
  assignedIds:    string[],     // TeamUp subcalendar IDs
  windowCount:    number,
  doorCount:      number,
  sliderCount:    number,
  isServiceCall:  boolean,
  financials: {
    balanceDue:    string,       // Amount installer needs to collect
    paymentMethod: string,
    installerPay:  string,       // Installer compensation
    contractAmt:   string        // Total contract value (management reports only — never shown to installers)
  },
  customerPhone:  string,
  lastSyncedAt:   timestamp
}
```

### 6.2 Collection: `job_records`

Written by installers during job execution. Document ID: `{jobId}_{installerId}`.

```
{
  jobId:           string,
  installerId:     string,
  status:          string,
  statusNote:      string,
  amountCollected: number,       // Required for collected/partial statuses
  openings:        Opening[],
  signatures: {
    walkthrough: { customerAt, installerAt, customerName, installerName, customerSigUrl, installerSigUrl },
    completion:  { customerAt, installerAt, customerName, installerName, customerSigUrl, installerSigUrl }
  },
  financials:        object,     // Copied from job at time of completion
  statusHistory:     HistoryEntry[],
  inventoryReceived: { windows, doors, sliders },
  inventoryIssues:   object[],
  walkthroughIncomplete: boolean,
  startedAt:       timestamp,
  completedAt:     timestamp,
  createdAt:       timestamp,
  updatedAt:       timestamp
}
```

**Opening object:**
```
{
  id:     string,
  type:   'window' | 'door' | 'slider',
  number: string,
  label:  string,
  defects: Defect[]
}
```

**Defect object:**
```
{
  type:          string,
  typeName:      string,
  description:   string,
  photos:        { url: string }[],
  reportedAt:    string,
  needsOrdering: boolean,
  reorderedAt:   timestamp | null,   // Set when material_order created (prevents duplicates)
  clearedAt:     string,
  clearedBy:     string,
  clearedByName: string,
  tracked:       boolean,
  trackingNote:  string,
  trackedAt:     string,
  trackedBy:     string,
  trackedByName: string
}
```

### 6.3 Collection: `installers`

Managed by admin. One document per installer.

```
{
  displayName:      string,
  email:            string,
  phone:            string,
  type:             'installer' | 'ft' | 'inspection',
  firebaseUid:      string,    // Set on first sign-in
  signatureUrl:     string,
  status:           'active' | 'inactive',
  tutorialComplete: boolean,
  lastLogin:        timestamp,
  provisionedAt:    timestamp
}
```

### 6.4 Collection: `management_users`

Managed by admin. Document ID = Firebase Auth UID.

```
{
  displayName: string,
  email:       string,
  role:        'manager' | 'finance' | 'service',
  status:      'active' | 'inactive'
}
```

### 6.5 Collection: `settings`

Two documents: `portal` and `teamup`.

**`settings/portal`:**
```
{
  statuses:               StatusOption[],
  cocAgreementText:       string,
  monthlyGoal:            number,    // Monthly collection goal ($)
  analyticsLaborWarnPct:  number,    // Labor % yellow threshold
  analyticsLaborBadPct:   number     // Labor % red threshold
}
```

**`settings/teamup`:** (admin-only)
```
{
  apiKey:               string,
  calendarId:           string,
  syncInterval:         string,
  archiveThresholdDays: number
}
```

### 6.6 Collection: `material_orders`

Created by service team when a defect requires parts ordering.

```
{
  material:      string,
  jobId:         string,
  jobNumber:     string,
  customerName:  string,
  installerId:   string,
  installerName: string,
  defectType:    string,
  defectDesc:    string,
  openingLabel:  string,
  status:        'pending' | 'ordered' | 'complete',
  notes:         string,
  createdAt:     timestamp,
  createdBy:     string,
  createdByName: string,
  orderedAt:     timestamp | null,
  completedAt:   timestamp | null
}
```

### 6.7 Collection: `installer_documents`

Compliance documents uploaded by installers or admin.

```
{
  installerId:  string,
  type:         string,       // e.g. 'insurance', 'certification'
  fileUrl:      string,       // Firebase Storage download URL
  storagePath:  string,       // UID-based storage path
  uploadedAt:   timestamp,
  expiresAt:    timestamp | null
}
```

### 6.8 Collection: `reviews`

Installer reviews submitted by management.

```
{
  installerId:   string,
  rating:        number,      // 1–5
  note:          string,
  createdBy:     string,
  createdByName: string,
  createdAt:     timestamp
}
```

### 6.9 Collection: `failed_inspections`

Written by Cloud Function when Power Automate webhook delivers a failed inspection.

```
{
  jobId:          string,
  jobNumber:      string,
  installerId:    string,
  inspectionDate: timestamp,
  reason:         string,
  createdAt:      timestamp
}
```

### 6.10 Other Collections

| Collection | Purpose |
|-----------|---------|
| `management_actions` | Archive log — records when a finance/service item was archived |
| `reminders` | Service follow-up reminders keyed to a job record |
| `blackout_requests` | Installer time-off requests |
| `extra_work_requests` | Installer requests for out-of-scope work; approved amounts included in earnings |
| `photo_requirements` | Admin-configured required photo list |
| `defect_types` | Admin-configured defect type options |
| `installer_history` | Audit log (admin only) |

---

## 7. Job Status System

Statuses are configurable by the admin and stored in `settings/portal.statuses`.

| Flag | Purpose |
|------|---------|
| `showInFinance` | Appears in Finance tab |
| `showInService` | Appears in Service tab |
| `countsAsComplete` | Marks job as done |
| `requiresSignatures` | Walkthrough + COC must be signed |
| `requiresNote` | Note field required |
| `collected` | Gates the Archive button in Finance |

**Default statuses:**

| Status Value | Label | Finance | Service |
|-------------|-------|---------|---------|
| `in_progress` | In Progress | — | — |
| `completed_collected` | Completed — Collected | ✓ | — |
| `completed_not_collected` | Completed — Not Collected | ✓ | — |
| `completed_partial` | Complete — Partial Payment | ✓ | — |
| `not_complete_multiday` | Not Complete — Multiday | — | — |
| `not_complete` | Not Complete | — | — |
| `complete_need_service` | Complete — Need Service | — | ✓ |

---

## 8. Finance Tab — Running Totals Logic

**Amount Collected derivation:**
- `completed_collected` → `amountCollected` field (required), falls back to `financials.balanceDue`
- `completed_partial` → `amountCollected` field (required, set by installer or finance staff)
- `completed_not_collected` → $0

**Time buckets:**
- **TODAY** — job `startDt` on today's date
- **WTD** — `startDt` in current week (Mon–Sun)
- **MTD** — `startDt` in current calendar month
- **YTD** — `startDt` in current calendar year

**UPCOMING:** All jobs this month without a finance-status job record — sum of their `financials.balanceDue`.

**Monthly Goal:** `settings/portal.monthlyGoal`. Shown as a progress bar on Finance tab with a projected bar (MTD + UPCOMING vs. goal).

---

## 9. Defect Workflow

```
Reported (installer)
    │
    ├── ✓ Clear ──────────────► Resolved (clearedAt set, removed from active list)
    │
    ├── 📌 Track ─────────────► Tracking section (tracked: true, trackingNote set)
    │       │
    │       └── ✓ Clear ──────► Resolved
    │
    └── 📦 Re-order ──────────► Creates material_orders document
             │                   (defect.reorderedAt set to prevent duplicates)
             └──────────────────► Pending → Ordered → Complete
```

**Implementation note:** Defects are nested inside `job_records.openings[].defects[]`. All defect updates read the full `openings` array, mutate the target defect, and write back the complete array.

---

## 10. Compliance & Document Tracking

Installers are required to maintain up-to-date compliance documents (insurance certificates, trade certifications, etc.). Document requirements are configurable per installer type — FT Field Techs and Inspection types are exempt from window/door installer requirements.

- Documents uploaded via installer portal or admin → stored in Firebase Storage under `installers/{uid}/documents/`
- Expiry dates tracked; compliance warnings surface in admin dashboard as a collapsible rollup
- Start Job is gated until required inventory is received (separate from compliance, but enforced in the same pre-start check)

---

## 11. Analytics Tab

Visible to managers only. Pulls from `job_records` and `extra_work_requests`.

- **Windows Rating** — installer performance score based on defect rate
- **Labor %** — installer labor as a percentage of contract value; thresholds (`analyticsLaborWarnPct`, `analyticsLaborBadPct`) configurable in admin settings; colour-coded yellow/red
- **Earnings** — installer pay totals including approved extra work

---

## 12. Failed Inspection Ingestion Pipeline

Inspection software sends result emails → Power Automate parses and POSTs to a Cloud Function HTTP webhook → Cloud Function writes to `failed_inspections` collection.

Setup guide: `docs/power-automate-setup.md`

---

## 13. TeamUp Sync

A scheduled Cloud Function polls the TeamUp Calendar API and writes jobs to Firestore.

- Sync runs on a configurable interval (5 min – 8 hours)
- Jobs stored in `/jobs/{teamUpEventId}`
- Financial fields extracted from TeamUp custom fields
- Installer assignments matched by subcalendar ID to installer records
- Inactive TeamUp calendars are filtered from sync
- Manual sync available via callable Cloud Function (admin portal)
- `contractAmt` stored in `jobs.financials` for management reporting; never surfaced in installer portal

---

## 14. Security Model

### 14.1 Authentication

- Installers: passwordless magic link with `?hint=email` in continue URL; confirm-screen gate prevents scanner consumption
- Management: email + password; verified against `management_users` collection
- Admin: email + password; identified by fixed Firebase Auth UID in Firestore rules

### 14.2 Firestore Security Rules Summary

| Collection | Installer | Management | Admin |
|-----------|-----------|-----------|-------|
| `jobs` | Read only | Read only | Read + Write |
| `job_records` | Own records only | Read + Write all | Full |
| `extra_work_requests` | Own records only | Read + Write all | Full |
| `installers` | Read own + update limited fields | Read all | Full |
| `installer_documents` | Own only (read/write) | Read all | Full |
| `reviews` | None | Read + Create | Full |
| `failed_inspections` | Read own | Read all | Full |
| `settings/portal` | Read only | Read only | Full |
| `settings/teamup` | None | None | Full |
| `management_users` | None | Read own | Full |
| `management_actions` | None | Read + Create (own) | Full |
| `reminders` | None | Read + Create/Update | Full |
| `material_orders` | None | Read + Create + Update (restricted) | Full |
| `blackout_requests` | Own only | None | Full |

**Installer record ownership** verified via Firestore cross-reference: rules look up the installer document and confirm `firebaseUid == request.auth.uid`.

### 14.3 Storage Security Rules

- `jobs/{jobId}/installers/{installerId}/...` — job photos and signatures
- `installers/{installerId}/...` — installer profile files and compliance documents

Rules use `ownsInstaller()` Firestore cross-reference to verify path ownership. Management can read all; only owning installer or admin can write.

### 14.4 HTTP Security Headers

| Header | Value | Purpose |
|--------|-------|---------|
| `X-Frame-Options` | `DENY` | Prevents clickjacking |
| `X-Content-Type-Options` | `nosniff` | Prevents MIME sniffing |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Limits referrer leakage |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=(), payment=()` | Restricts browser APIs |
| `Content-Security-Policy` | Firebase/Google CDN only; `frame-ancestors 'none'` | Restricts resource loading |

### 14.5 Firebase API Key

The Firebase web API key is public by design — it is a project identifier, not a credential. All access control is enforced by Firestore and Storage security rules.

---

## 15. Known Limitations & Future Considerations

| Item | Notes |
|------|-------|
| `'unsafe-inline'` in CSP | All JS is inline in HTML files. Refactoring to external `.js` files would eliminate this and improve cacheability. |
| Admin identified by hardcoded UID | Works reliably. Long-term: replace with Firebase Custom Claims. |
| Firestore rules use cross-reference `get()` calls | One extra read per security evaluation for installer-owned collections. Negligible at current scale. |
| Defects stored as nested arrays | Read-modify-write required for all defect updates. At scale, a subcollection would be more efficient. |
| No rate limiting on writes | Firebase quota limits apply. Cloud Function rate limiting could be added if needed. |

---

## 16. Deployment

### Prerequisites
- Firebase CLI installed (`npm install -g firebase-tools`)
- Authenticated (`firebase login`)
- Project: `installer-portal-6000`

### Deploy Commands

```bash
# Most common — hosting + Firestore rules
firebase deploy --only hosting,firestore:rules

# Include storage rules
firebase deploy --only hosting,firestore:rules,storage

# Functions only
firebase deploy --only functions

# Everything
firebase deploy
```

### Git & Versioning

```bash
# Commit changes
git add <files>
git commit -m "Description of change"

# Tag a release
git tag v2.x.x
git push origin master:main --tags
```

GitHub: https://github.com/sdvaw/installer_portal_6000

### Repository Structure

```
Installer_Portal/
├── deploy/                    # Static hosting files
│   ├── index.html             # Admin portal
│   ├── installer.html         # Installer portal
│   ├── reports.html           # Management dashboard
│   ├── print-job.html         # COC/Walkthrough print view
│   ├── js/
│   │   └── firebase-config.js
│   └── css/
│       └── styles.css
├── functions/                 # Cloud Functions
│   └── index.js               # TeamUp sync + webhook handlers
├── docs/                      # Documentation
│   ├── DESIGN.md              # This document
│   ├── RELEASE_NOTES.md       # Version history
│   └── power-automate-setup.md
├── firestore.rules
├── firestore.indexes.json
├── storage.rules
└── firebase.json
```
