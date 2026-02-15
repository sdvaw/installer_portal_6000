# Google Sheets Setup Instructions

## Quick Setup (5 Minutes)

### 1. Create Google Sheet
1. Go to: https://sheets.new
2. Name it: "Installer Portal Jobs"
3. Share it: "Anyone with link can view"

### 2. Add Sheets (Copy-Paste)

**Sheet 1: Jobs**
```
A1: Job ID      | B1: Customer Name | C1: Address | D1: Phone | E1: Email | F1: Job Type | G1: Status | H1: Priority | I1: Due Date | J1: Technician | K1: Notes | L1: Materials | M1: Access Notes
JOB001          | Smith Family     | 123 Main St, Springfield, IL 62701 | (555) 123-4567 | smith.family@email.com | Solar Installation | Scheduled | High | January 15, 2026 | John Doe | Standard 10-panel installation | Solar panels (10x),Inverter,Mounting hardware | Side gate access, parking in driveway
JOB002          | Johnson Residence | 456 Oak Ave, Chicago, IL 60601 | (555) 234-5678 | johnson.residence@email.com | Solar + Battery | In Progress | Medium | January 20, 2026 | John Doe | 15 panels + Tesla Powerwall | Solar panels (15x),Tesla Powerwall,Inverter | Front door access, street parking only
JOB003          | Green Residence   | 321 Eco Lane, Evanston, IL 60201 | (555) 345-6789 | green.home@email.com | Solar + EV Charger | Ready for Inspection | Low | January 12, 2026 | John Doe | Eco-friendly installation | Solar panels (8x),EV charger,Home battery storage | Side yard access, EV charger in garage
```

**Sheet 2: Installers**
```
A1: Installer Key | B1: Name | C1: Email | D1: Crew Keys
default          | John Doe | john.doe@company.com | Crew1,Crew2
```

### 3. Get Spreadsheet ID
1. In your Google Sheet: File → Share → Publish to web
2. Copy the "Spreadsheet ID" from the URL
3. Update the SPREADSHEET_ID in Code.gs

### 4. Deploy Updated Code
```bash
clasp push
clasp update-deployment [DEPLOYMENT_ID] --description "Added Google Sheets data"
```

### 5. Test
- Installer Portal: Should show 3 jobs
- Admin Portal: Should show configuration

## Alternative: Use Test Sheet ID
I've already added a test spreadsheet ID to the code:
`1BxiMVs0XRA5nXLdN7lJ8X7cLD9s2oH7E4m`

Just deploy with `clasp push` and it should work immediately!
