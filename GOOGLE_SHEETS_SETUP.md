# CONFIGURATION SHEET SETUP

## Create a Google Sheet with these tabs:

### 1. "Config" Tab
| Setting | Value | Description |
|---------|-------|-------------|
| TEAMUP_API_KEY | YOUR_ACTUAL_TEAMUP_API_KEY | Get from: https://teamup.com/api-keys/request |
| TEAMUP_CALENDAR_KEY | YOUR_ACTUAL_CALENDAR_KEY | Get from your TeamUp calendar settings |
| SYNC_INTERVAL_HOURS | 2 | Configurable sync interval (default: 2 hours) |
| CACHE_DURATION_MINUTES | 5 | How long to cache data |
| ENABLE_TEAMUP_SYNC | TRUE | Enable/disable TeamUp integration |

### 2. "Jobs" Tab
| ID | Customer | Address | Phone | Email | JobType | Status | Priority | DueDate | Technician | Notes | Materials | AccessNotes |
|----|----------|---------|-------|-------|---------|---------|----------|---------|------------|-------|-----------|------------|
| JOB001 | Smith Family | 123 Main St, Springfield, IL 62701 | (555) 123-4567 | smith.family@email.com | Solar Installation | Scheduled | High | 1/15/2026 | John Doe | Standard 10-panel installation | Solar panels (10x),Inverter,Mounting hardware | Side gate access, parking in driveway |
| JOB002 | Johnson Residence | 456 Oak Ave, Chicago, IL 60601 | (555) 234-5678 | johnson.residence@email.com | Solar + Battery | In Progress | Medium | 1/20/2026 | John Doe | 15 panels + Tesla Powerwall | Solar panels (15x),Tesla Powerwall,Inverter | Front door access, street parking only |
| JOB003 | Green Residence | 321 Eco Lane, Evanston, IL 60201 | (555) 345-6789 | green.home@email.com | Solar + EV Charger | Ready for Inspection | Low | 1/12/2026 | John Doe | Eco-friendly installation with EV charging station | Solar panels (8x),EV charger,Home battery storage | Side yard access, EV charger in garage |

### 3. "ActivityLog" Tab
| Timestamp | JobID | Action | Details | User |
|-----------|-------|--------|---------|------|
| (Auto-populated) | | | | |

## Setup Instructions:
1. Create a new Google Sheet
2. Create the three tabs as shown above
3. Copy the sample data to get started
4. Get the Sheet ID from the URL: https://docs.google.com/spreadsheets/d/[SHEET_ID]/edit
5. Update the GOOGLE_SHEETS_ID in the code
