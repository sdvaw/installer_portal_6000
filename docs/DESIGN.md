# Armor Vue — Installer Portal
## System Design Document

**Version:** 2.0
**Date:** March 2026
**Status:** Production
**Live URL:** https://installer-portal-6000.web.app

---

## 1. Overview

The Armor Vue Installer Portal is a web-based field operations platform for a window and door installation company. It serves two distinct user groups through separate interfaces:

1. **Installers** — Field technicians who use the portal on-site to document job completions, collect signatures, report defects, and update job status.
2. **Management Staff** — Office personnel (Finance, Service, Managers) who use the dashboard to monitor jobs, track collections, manage defects, and review daily operations.

The system integrates with **TeamUp** (a calendar/scheduling SaaS) as the source of truth for job scheduling, and uses **Firebase** as the backend for authentication, data storage, and file hosting.

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
              │  │ (photos, sigs)   │    │
              │  └─────────────────┘    │
              │                         │
              │  ┌─────────────────┐    │
              │  │ Cloud Functions  │    │
              │  │  (TeamUp sync)   │    │
              │  └────────┬────────┘    │
              └───────────┼─────────────┘
                          │ REST API
              ┌───────────▼─────────────┐
              │     TeamUp Calendar      │
              │  (job scheduling source) │
              └─────────────────────────┘
```

### Data Flow — Job Lifecycle

```
TeamUp (schedule)
    → Cloud Function syncs → Firestore /jobs
    → Installer opens job in installer.html
    → Installer submits job record → Firestore /job_records
    → Management reviews in reports.html (Finance / Service tabs)
    → Management archives completed records
```

---

## 4. Portal Pages

### 4.1 Installer Portal (`installer.html`)

Accessed by field installers via a magic link (passwordless email sign-in). Features:

- **Schedule** — Weekly calendar view of assigned jobs
- **Job Detail** — Job info, financial balance due, opening counts
- **Job Start Flow** — Inventory confirmation, start photos
- **Opening Documentation** — Per-window/door photos, defect reporting
- **Walkthrough Checklist** — Pre-completion checklist with customer signature
- **Certificate of Completion (COC)** — Customer + installer signature capture
- **Status Update** — Mark job as collected, partial, not collected, need service, etc.
- **Extra Work Requests** — Submit requests for additional scope
- **Blackout Requests** — Request days off
- **Earnings View** — Installer pay summary by date range

### 4.2 Management Dashboard (`reports.html`)

Accessed by management staff with role-based tab visibility.

| Tab | Visible To | Purpose |
|-----|-----------|---------|
| 📋 Daily Review | Manager | Snapshot of all jobs on a selected date |
| 💰 Finance | Manager, Finance | Collections tracking, running totals, archiving |
| 🔧 Service | Manager, Service | Defect workflow — clear, track, re-order |
| 📦 Materials | Manager, Service | Material re-order lifecycle |

### 4.3 Admin Portal (`index.html`)

Accessed by the system administrator only. Features:

- **Dashboard** — Sync status, installer count, job count
- **Installers** — Manage installer accounts, send portal links
- **System Settings** — TeamUp API config, job statuses, COC text, photo requirements, defect types, portal settings (monthly goal)
- **Staff Accounts** — Manage management user accounts (finance, service, manager roles)
- **Database Tools** — Archive old jobs, clear collections

---

## 5. User Roles & Permissions

### 5.1 Role Hierarchy

```
Administrator (1 account)
    └── Full system access, manages all users and settings

Manager
    └── All dashboard tabs: Daily Review, Finance, Service, Materials

Finance
    └── Finance tab only

Service
    └── Service tab + Materials tab
```

### 5.2 Installer Authentication

Installers authenticate via **passwordless email magic link**. No password is required or stored. The flow:

1. Admin sends a sign-in link from the admin portal
2. Installer taps the link on their device
3. Firebase Auth verifies the link and signs them in
4. The portal looks up their installer record by `firebaseUid` field
5. Session persists locally on the device

### 5.3 Management Authentication

Management staff use **email + password** authentication via Firebase Auth. On sign-in, the portal verifies the user exists in the `management_users` collection with `status: "active"` before granting access.

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
  sgdCount:       number,
  isServiceCall:  boolean,
  financials: {
    balanceDue:    string,       // Amount installer needs to collect
    paymentMethod: string,
    installerPay:  string,       // Installer compensation
    contractAmt:   string        // Total contract value (management reports only)
  },
  customerPhone:  string,
  lastSyncedAt:   timestamp
}
```

> **Note:** `contractAmt` is available for management reporting but is never displayed in the installer portal.

### 6.2 Collection: `job_records`

Written by installers during job execution. Document ID: `{jobId}_{installerId}`.

```
{
  jobId:           string,
  installerId:     string,       // Installer Firestore document ID
  status:          string,       // See Status Values below
  statusNote:      string,
  amountCollected: number,       // Actual amount collected (set by installer or finance)
  openings:        Opening[],
  signatures: {
    walkthrough: { customerAt, installerAt, customerName, installerName, customerSigUrl, installerSigUrl },
    completion:  { customerAt, installerAt, customerName, installerName, customerSigUrl, installerSigUrl }
  },
  financials:      object,       // Copied from job at time of completion
  statusHistory:   HistoryEntry[],
  inventoryReceived: { windows, doors, sgds },
  inventoryIssues: object[],
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
  id:       string,
  type:     'window' | 'door' | 'sgd',
  label:    string,
  defects:  Defect[]
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
  // Set by service team actions:
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
  displayName:  string,
  email:        string,
  phone:        string,
  firebaseUid:  string,      // Set on first sign-in
  signatureUrl: string,
  status:       'active' | 'inactive',
  lastLogin:    timestamp
}
```

### 6.4 Collection: `management_users`

Managed by admin. One document per staff member, document ID = Firebase Auth UID.

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
  statuses:          StatusOption[],    // Configurable job status list
  cocAgreementText:  string,
  monthlyGoal:       number             // Monthly collection goal ($)
}
```

**`settings/teamup`:** (admin-only, not readable by management)
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

### 6.7 Other Collections

| Collection | Purpose |
|-----------|---------|
| `management_actions` | Archive log — records when a finance/service item was archived |
| `reminders` | Service follow-up reminders keyed to a job record |
| `blackout_requests` | Installer time-off requests |
| `extra_work_requests` | Installer requests for out-of-scope work |
| `photo_requirements` | Admin-configured required photo list |
| `defect_types` | Admin-configured defect type options |
| `installer_history` | Audit log (admin only) |

---

## 7. Job Status System

Statuses are configurable by the admin and stored in `settings/portal.statuses`. Each status has flags that control behavior:

| Flag | Purpose |
|------|---------|
| `showInFinance` | Appears in Finance tab |
| `showInService` | Appears in Service tab |
| `countsAsComplete` | Marks job as done |
| `requiresSignatures` | Walkthrough + COC must be signed before selecting |
| `requiresNote` | Note field required |
| `collected` | Gates the Archive button in Finance |

**Default built-in statuses:**

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

The Finance dashboard computes running totals from all `job_records` with finance statuses.

**Amount Collected derivation:**
- `completed_collected` → `amountCollected` field, or falls back to `financials.balanceDue`
- `completed_partial` → `amountCollected` field (set by installer or finance staff)
- `completed_not_collected` → $0

**Time buckets:**
- **TODAY** — records where job `startDt` falls on today's date
- **WTD** — records where `startDt` falls in the current week (Mon–Sun)
- **MTD** — records where `startDt` falls in the current calendar month
- **YTD** — records where `startDt` falls in the current calendar year

**UPCOMING:**
All jobs scheduled this month (`startDt` within current month) that do NOT yet have a finance-status job record. Sum of their `financials.balanceDue` values.

**Monthly Goal:**
Set by admin in Settings → Portal Settings → Monthly Collection Goal. Stored as `settings/portal.monthlyGoal`. Displayed as a progress bar on the Finance tab. A secondary projected bar shows MTD + UPCOMING vs. goal.

---

## 9. Defect Workflow

Defects are reported by installers per-opening during job documentation. The service team processes them through three actions:

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
                                 (Pending → Ordered → Complete)
```

**Implementation note:** Defects are nested inside `job_records.openings[].defects[]`. Firestore does not support updating nested array elements directly. All defect updates read the full `openings` array, mutate the target defect object, and write back the complete array.

---

## 10. TeamUp Sync

A scheduled Cloud Function polls the TeamUp Calendar API and writes jobs to Firestore.

- Sync runs on a configurable interval (5 min – 8 hours), set in admin settings
- Jobs are stored in `/jobs/{teamUpEventId}`
- Financial fields are extracted from TeamUp custom fields (configurable field mapping in admin settings)
- Installer assignments are matched by TeamUp subcalendar IDs to installer records
- `contractAmt` (total contract value) is stored in `jobs.financials` for management reporting but is never surfaced in the installer portal UI

---

## 11. Security Model

### 11.1 Authentication

- Installers: passwordless magic link (Firebase Email Link Auth)
- Management: email + password (Firebase Email/Password Auth)
- Admin: email + password; account is identified by a fixed Firebase Auth UID enforced in Firestore rules

### 11.2 Firestore Security Rules Summary

| Collection | Installer | Management | Admin |
|-----------|-----------|-----------|-------|
| `jobs` | Read only | Read only | Read + Write |
| `job_records` | Own records only (read/write) | Read + Write all | Read + Write |
| `extra_work_requests` | Own records only | Read + Write all | Read + Write |
| `installers` | Read own + update 3 fields | Read all | Full |
| `settings/portal` | None | Read only | Full |
| `settings/teamup` | None | None | Full |
| `management_users` | None | Read own | Full |
| `management_actions` | None | Read + Create (own) | Full |
| `reminders` | None | Read + Create/Update status | Full |
| `material_orders` | None | Read + Create + Update (restricted) | Full |
| `blackout_requests` | Own only | None | Full |

**Installer record ownership** is verified via a Firestore cross-reference: rules look up the installer document and confirm `firebaseUid == request.auth.uid`. This prevents installers from accessing records owned by other installers even if they know the document ID format.

### 11.3 Storage Security Rules

Storage paths follow the structure:
- `jobs/{jobId}/installers/{installerId}/...` — job photos and signatures
- `installers/{installerId}/...` — installer profile files

Rules use Firestore cross-reference (`ownsInstaller()`) to verify the `installerId` in the path belongs to the authenticated user. Management users can read all paths for reporting. Only the owning installer or admin can write.

### 11.4 HTTP Security Headers

All responses include:

| Header | Value | Purpose |
|--------|-------|---------|
| `X-Frame-Options` | `DENY` | Prevents clickjacking via iframes |
| `X-Content-Type-Options` | `nosniff` | Prevents MIME-type sniffing |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Limits referrer data leakage |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=(), payment=()` | Restricts browser APIs |
| `Content-Security-Policy` | See below | Restricts resource loading |

**CSP:** Allows scripts from `self` and Firebase/Google CDN only. Restricts connections to Firebase endpoints. Blocks iframes (`frame-ancestors 'none'`), objects, and external base URIs. `'unsafe-inline'` is required for scripts because all JavaScript is inline — refactoring to external files would eliminate this.

### 11.5 Firebase API Key

The Firebase web API key is public in the client-side configuration. This is the standard and documented Firebase architecture — the key is a project identifier, not a credential. Access control is enforced entirely by Firestore and Storage security rules, not the API key.

---

## 12. Known Limitations & Future Considerations

| Item | Notes |
|------|-------|
| `'unsafe-inline'` in CSP | Would require refactoring all JS to external files to eliminate. Low priority given no user-supplied HTML is rendered without escaping. |
| Admin identified by hardcoded UID | Works reliably. Long-term: replace with Firebase Custom Claims for easier admin rotation. |
| Firestore rules use cross-reference `get()` calls | Adds one Firestore read per security evaluation for installer-owned collections. At current scale this is negligible. |
| No rate limiting on write operations | Firebase quota limits apply. Custom rate limiting could be added via Cloud Functions if abuse becomes a concern. |
| Installer portal JS is inline | All portal JS is embedded in HTML files. Works well at this scale; moving to external `.js` files would improve CSP posture and cacheability. |
| Defects stored as nested arrays | Updating requires read-modify-write of the full `openings` array. Works reliably; at scale, a subcollection would be more efficient. |

---

## 13. Deployment

### Prerequisites
- Firebase CLI installed (`npm install -g firebase-tools`)
- Authenticated (`firebase login`)
- Project: `installer-portal-6000`

### Deploy Commands

```bash
# Deploy everything (hosting + rules + functions)
firebase deploy

# Deploy hosting + rules only (most common)
firebase deploy --only hosting,firestore:rules,storage

# Deploy functions only
firebase deploy --only functions
```

### Repository Structure

```
Installer_Portal/
├── deploy/                  # Static hosting files
│   ├── index.html           # Admin portal
│   ├── installer.html       # Installer portal
│   ├── reports.html         # Management dashboard
│   ├── management.html      # (legacy/supplemental)
│   ├── js/
│   │   └── firebase-config.js
│   └── css/
│       └── styles.css
├── functions/               # Cloud Functions
│   └── index.js             # TeamUp sync function
├── docs/                    # Documentation
│   ├── DESIGN.md            # This document
│   └── RELEASE_NOTES.md
├── firestore.rules
├── firestore.indexes.json
├── storage.rules
└── firebase.json
```
