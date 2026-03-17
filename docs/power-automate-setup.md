# Power Automate — Failed Inspection Email Ingestion
## Setup Guide

---

## Overview

When a "Failed Inspection" email arrives in your Outlook folder, Power Automate
automatically sends it to the app. The Cloud Function parses the email, matches
the installer by name, and creates the failed inspection record. Installers see
it immediately in their Defects tab.

---

## Step 1 — Outlook Rule (one-time setup)

1. In Outlook, right-click your Inbox → **New Folder** → name it `Failed Inspections`
2. Go to **File → Manage Rules & Alerts → New Rule**
3. Start from: **"Apply rule on messages I receive"** → Next
4. Condition: **"with specific words in the subject"** → click the link → type `Failed Inspection` → Add → OK → Next
5. Optional but recommended: also check **"from people or public group"** → add the service coordinator's email address
6. Action: **"move it to the specified folder"** → select `Failed Inspections` → OK → Next
7. No exceptions needed → Next
8. Name it `Failed Inspection Routing` → **Finish**

---

## Step 2 — Get Your Webhook Secret

Run this command in your terminal (from the project folder):

```
firebase functions:secrets:access WEBHOOK_SECRET --project installer-portal-6000
```

Copy the value — you'll need it in Step 4.

---

## Step 3 — Create the Power Automate Flow

1. Go to **flow.microsoft.com**
2. Click **Create** → **Automated cloud flow**
3. Name it: `Failed Inspection Ingestion`
4. Trigger: search for **"When a new email arrives (V3)"** → select it → Create

---

## Step 4 — Configure the Trigger

In the trigger settings:
- **Folder:** `Failed Inspections`
- **Include Attachments:** No
- **Only with Attachments:** No
- Leave everything else as default

---

## Step 5 — Add the HTTP Action

1. Click **+ New step**
2. Search for **"HTTP"** → select it
3. Configure as follows:

**Method:** `POST`

**URI:**
```
https://us-central1-installer-portal-6000.cloudfunctions.net/ingestEmailInspection
```

**Headers:**
| Key | Value |
|-----|-------|
| `Content-Type` | `application/json` |
| `x-webhook-secret` | *(paste your secret from Step 2)* |

**Body:**
```json
{
  "subject": @{triggerOutputs()?['body/subject']},
  "body": @{triggerOutputs()?['body/body']}
}
```

> Note: The `@{...}` expressions are Power Automate dynamic content — type them
> exactly as shown or use the dynamic content picker to select Subject and Body
> from the email trigger.

4. Click **Save**

---

## Email Format Required

The emails must follow this structure for the parser to extract fields correctly:

```
Subject: Failed Inspection

Client: John Smith 1234
Installer: Bob Jones
Reason: Missing flashing at head jamb
Date: 03/15/2026
Fee: $150
```

- **Client:** Name followed by the job number (space-separated)
- **Installer:** Must match the installer's display name in the app (case-insensitive)
- **Fee:** Optional — include `$` or just the number, both work

---

## What Happens After Setup

| Scenario | Result |
|----------|--------|
| Installer name matches exactly (case-insensitive) | Record created, status `open`, installer sees it in Defects tab immediately |
| Installer name does not match | Record created, status `unmatched`, appears in admin dashboard **Unmatched Inspections** card for manual assignment |
| Same job number + same date submitted twice | Duplicate detected, second email ignored |

---

## Admin — Handling Unmatched Inspections

If an installer name in the email doesn't match any installer in the app:

1. Go to the **Admin Dashboard**
2. Look for the **"⚠ Unmatched Failed Inspections"** card
3. For each unmatched record, select the correct installer from the dropdown
4. Click **Assign** — the record is immediately visible to that installer

---

## Installer Experience

Installers see failed inspections in their **Defects tab** (⚠️ icon in bottom nav):

- Shows job number, client name, inspection date, failure reason, and any fee
- Tap **"Mark Status"** to update:
  - **✅ Fixed** — issue has been resolved
  - **⏳ Not Fixed** — still pending, with a note explaining why
- Status updates are visible to management immediately in the reports portal

---

## Troubleshooting

**Flow not triggering:**
- Confirm the Outlook rule is moving emails to the correct folder
- Check the flow run history in Power Automate for errors

**Getting 401 Unauthorized:**
- The `x-webhook-secret` header value doesn't match — re-run the secret access command and copy carefully

**Getting 400 Bad Request:**
- The email body doesn't contain a `Reason:` field — check the email format

**Installer shows as unmatched:**
- Check spelling of the installer's name in the email vs their Display Name in the app (Admin → Installers → edit)

---

## Endpoint Reference

| Item | Value |
|------|-------|
| Function URL | `https://us-central1-installer-portal-6000.cloudfunctions.net/ingestEmailInspection` |
| Method | POST |
| Auth header | `x-webhook-secret` |
| Secret name | `WEBHOOK_SECRET` (Firebase secret) |
| Firebase project | `installer-portal-6000` |
