# Armor Vue — Installer Portal
## Claude Working Rules

These rules apply in every session. Follow them without being asked.

---

## After Every Change

1. **Commit to git** — descriptive one-liner, Co-Authored-By footer
2. **Push to GitHub** — `git push origin master:main`
3. **Update docs** — if the change adds a feature or fixes something significant:
   - Add to `docs/RELEASE_NOTES.md` under the current unreleased version section
   - Update `docs/DESIGN.md` if architecture, data model, or auth flow changed
4. **Tag releases** — when deploying a logical feature group, tag with semver: `git tag vX.Y.Z && git push origin master:main --tags`

Never leave uncommitted changes. Never leave docs behind the code.

---

## Deploy Command

```bash
firebase deploy --only hosting,firestore:rules
```

Run from project root (`C:\Users\sdvjs\projects\Installer_Portal`).

---

## GitHub

- Remote: https://github.com/sdvaw/installer_portal_6000
- Push: `git push origin master:main` (local branch is `master`, remote is `main`)
- Include tags: `git push origin master:main --tags`

---

## Versioning

- Semantic versioning: `vMAJOR.MINOR.PATCH`
- Current: v2.3.0 (unreleased as of 2026-03-19)
- Tag after each deploy of a logical feature group
- `RELEASE_NOTES.md` must have an entry before tagging

---

## Documentation Files

| File | Update When |
|------|------------|
| `docs/RELEASE_NOTES.md` | Every feature or significant fix |
| `docs/DESIGN.md` | Architecture, data model, auth flow, or new collections change |
| `docs/power-automate-setup.md` | Power Automate / webhook integration changes |

---

## Project Context

- Firebase project: `installer-portal-6000`
- Live URL: https://installer-portal-6000.web.app
- Stack: Firebase Hosting + Firestore + Auth + Storage + Cloud Functions; vanilla JS; no framework
- Auth: installers → magic link; management → email/password
- Roles: `manager`, `finance`, `service` (in `management_users` collection)
- `contractAmt` in `jobs.financials` — NEVER display to installers
- Defect updates require read-modify-write of full `openings` array (Firestore limitation)
