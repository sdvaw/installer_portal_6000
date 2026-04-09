# Armor Vue — Beta Test Guide
**Version:** v2.7.0
**Date:** 2026-04-08

This guide covers every critical flow in the installer portal. Work through it with a real installer account on a real device (mobile preferred — that's the production environment).

---

## Setup Checklist
- [ ] Use a real installer account (not admin preview) — magic link login
- [ ] Use a mobile device (iOS Safari or Android Chrome)
- [ ] Have at least one job scheduled for this week in TeamUp
- [ ] Have at least one multi-day job scheduled (same job number, different days)
- [ ] Clear browser cache before starting

---

## 1. Authentication

### Magic Link Login
- [ ] Request a magic link from the login page
- [ ] Open the link on mobile — should go straight to portal (not hang on "Signing in…")
- [ ] Open the link on a different device — should show "confirm your email" screen
- [ ] Open an expired/used link — should show expired message with "Send New Link" option
- [ ] Verify logout works and returns to login screen

### Language Switch
- [ ] Tap **EN | ES** button — all UI labels should switch to Spanish
- [ ] Navigate between tabs — verify all labels, buttons, and messages are in Spanish
- [ ] Switch back to English — everything returns correctly
- [ ] Log in, switch to Spanish, reload page — should remember Spanish preference

---

## 2. Schedule

- [ ] Week shows correct days and job counts per day
- [ ] Prev/Next arrows navigate weeks correctly
- [ ] "Today" button returns to current week
- [ ] Today's date is highlighted in blue
- [ ] Tapping a day shows jobs for that day
- [ ] Week pay total shows correct amount (verify against known pay)
- [ ] **Multi-day job** — appears on both days, pay total counts it only ONCE (not doubled)

---

## 3. Inventory Receipt

### Single-Day Job With Windows
- [ ] Tap job card → action sheet shows **📦 Receive Inventory** button
- [ ] **Start Job button is disabled** (shows "🔒 Receive Product First")
- [ ] Tap Receive Inventory → stepper shows correct unit counts (e.g. "0 of 6 received")
- [ ] Tap + to receive some units → border turns amber, count updates
- [ ] Tap Done → action sheet still shows Receive Inventory (partially received)
- [ ] Start Job is now **enabled** (received ≥ 1 unit)
- [ ] Tap + until all received → modal closes automatically, toast confirms
- [ ] Receive Inventory button disappears from action sheet

### Multi-Day Job
- [ ] Tap day 1 → Receive Inventory shows with correct counts
- [ ] Tap day 2 (different week if applicable) → **same counts appear**, not blank
- [ ] Receive partial on day 1 → start job works
- [ ] Day 2 shows the already-received count from day 1

### Manager Override
- [ ] Open portal in preview mode as a manager
- [ ] Find job with no inventory received → orange **🔓 Override Inventory Block** button appears
- [ ] Tap override → confirm dialog → Start Job unlocks

---

## 4. Starting a Job

- [ ] Start job flow launches camera/photo upload for exterior shot
- [ ] Wide shot saves correctly
- [ ] Pre-existing conditions screen appears (can skip if none)
- [ ] Pre-existing condition photo saves and appears on job detail
- [ ] After start, job status changes to "In Progress"
- [ ] Start photos appear in the job detail start photos section

---

## 5. Progress Photos

- [ ] Tap Progress Photos from job detail
- [ ] First-time tutorial appears (can be dismissed)
- [ ] Tap **+ Add Opening** → can select type (window, door, slider) and number
- [ ] Opening appears in list
- [ ] Tap opening → photo wizard launches with required shots in sequence
- [ ] Photos save and appear as thumbnails on the opening card
- [ ] **Report a defect** on an opening — verify it saves and shows flagged to office
- [ ] Tap **?** to replay tutorial

---

## 6. Walkthrough Checklist

- [ ] Tap Walkthrough Checklist from job detail
- [ ] First-time tutorial appears
- [ ] Check off all items — each tap marks item done
- [ ] Customer signature pad appears after checklist complete
- [ ] Customer signature saves
- [ ] Installer signature pad appears next
- [ ] Installer signature saves
- [ ] Walkthrough shows as ✓ Signed on job detail

---

## 7. Certificate of Completion

- [ ] Tap Certificate of Completion from job detail
- [ ] First-time tutorial appears
- [ ] **Step 1 — Ratings:** all three categories (product, sales, installation) must be rated before Continue is enabled
- [ ] **Step 2 — Agreement:** COC text shows with correct balance amount; customer name and address appear
- [ ] Customer signature pad appears
- [ ] Customer signature saves
- [ ] Installer signature pad appears
- [ ] Signing completes the job — status updates to Completed automatically
- [ ] Ratings appear in Inspections/Quality tab after completion

---

## 8. Job Status

- [ ] Tap Status / Change on job detail
- [ ] Can select: Completed, Not Complete, Partial
- [ ] Completed requires walkthrough + COC signed (blocked otherwise)
- [ ] Not Complete requires a reason text
- [ ] Partial/Collected requires amount entry
- [ ] Status saves and job card updates

---

## 9. Extra Work Requests

- [ ] Tap Extra Work Requests from job detail
- [ ] First-time tutorial appears
- [ ] Tap + New Request → fill description, amount, optional photos
- [ ] Request saves as Pending
- [ ] Submitting request shows in list
- [ ] (Management side) approve/counter/deny the request
- [ ] Installer sees updated status

---

## 10. Days Off

- [ ] Navigate to Days Off tab
- [ ] Select a date and optional reason
- [ ] Tap Request Day Off → appears in My Requests list
- [ ] Can see all past requests with dates

---

## 11. Inspections / Quality

- [ ] Tab loads without errors
- [ ] **Customer Installation Rating** section shows after at least one COC is completed
- [ ] Average score, star display, and distribution bars render correctly
- [ ] In Spanish mode — section header translates correctly
- [ ] Failed Inspections section shows any logged inspections
- [ ] Job Defects section shows defects from progress photos

---

## 12. Earnings Report

- [ ] Navigate to Earnings tab
- [ ] Set a date range covering known completed jobs
- [ ] Tap Run Report
- [ ] **Multi-day job appears once** (not duplicated)
- [ ] Total at bottom matches sum of individual jobs
- [ ] Approved extra work amounts are included
- [ ] Date range shown on multi-day jobs (e.g. Apr 3 – Apr 4 · 2 days)

---

## 13. Documents

- [ ] Documents tab loads (not blank)
- [ ] Required and optional documents show with correct status badges
- [ ] Tap Upload Document → expiry date prompt appears → file picker opens
- [ ] Uploaded document appears with "Pending Review" status
- [ ] In Spanish mode — all labels translate correctly

---

## 14. Language Switch (Full Flow)

Run through any complete flow (start job → COC) entirely in Spanish:
- [ ] All labels, buttons, and messages in Spanish
- [ ] COC agreement text in Spanish
- [ ] Tutorial steps in Spanish
- [ ] Job notes Translate button appears → translation works
- [ ] Toggle back to English mid-flow — no broken state

---

## 15. Edge Cases

- [ ] **No jobs this week** — shows "No jobs scheduled" gracefully
- [ ] **Job with no pay set** — week total doesn't show $0, just blank (expected)
- [ ] **Job with no window/door/sgd counts** — no inventory button (expected)
- [ ] **Tap back during a flow** — returns to correct previous screen
- [ ] **Rotate device** — layout doesn't break
- [ ] **Background the app, return** — portal still works without re-login

---

## What to Report

For any issue found, note:
1. Which step failed
2. What you expected vs what happened
3. Device and browser (e.g. iPhone 14, Safari 17)
4. Screenshot if possible

Errors are automatically logged to Firestore — management can view them in the Firebase console under `error_logs`.
