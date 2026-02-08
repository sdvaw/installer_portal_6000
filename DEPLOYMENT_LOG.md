# Installer Portal Deployment Log

## Current Live Version
**Version**: v3.6.0-REAL-TEAMUP-API  
**Deployed**: 2026-01-29 10:56 AM  
**URL**: https://installer-portal-6000.web.app  
**File**: deploy_clean/index.html  

## Features in Current Version
✅ **TeamUp-Driven Workflow**
- ⚙️ Sync Settings (15min-12hr intervals)
- 📅 Sync TeamUp Now (manual pull)
- ⏳ Pending Installers (auto-detected from TeamUp)
- 👥 Manage Installers (full CRUD operations)
- 📅 View Jobs (TeamUp jobs only)

## NEW: Real TeamUp API Integration (DOCUMENTATION-BASED)
✅ **Correct TeamUp API Implementation**
- **Authentication**: `Teamup-Token: API_KEY` header (no Content-Type)
- **Events Endpoint**: `/{calendarKey}/events` - CORRECT
- **Subcalendars Endpoint**: `/{calendarKey}/subcalendars` - CORRECT
- **Response Structure**: `{ "events": [...] }` and `{ "subcalendars": [...] }`
- **Field Names**: `subcalendar_ids`, `start_dt`, `end_dt`, `creation_dt`, `update_dt`

✅ **Correct Installer Assignment**
- **Installers are subcalendars** (not separate entities)
- **Events use `subcalendar_ids`** (array of integers)
- **No assignee_ids field** - Installers ARE subcalendars
- **Proper installer mapping** from subcalendar data

✅ **Fixed DOM Targeting**
- **Uses `content` element** consistently
- **Fixed provisioning flow** with proper navigation
- **Added installerId field** to installer records
- **Proper back button navigation**

## API Structure (From Documentation)
```javascript
// Events Response
{
  "events": [
    {
      "title": "Job Title",
      "subcalendar_ids": [12345, 67890],
      "start_dt": "2026-01-30T09:00:00Z",
      "end_dt": "2026-01-30T17:00:00Z",
      "location": "123 Main St",
      "notes": "Job notes"
    }
  ]
}

// Subcalendars Response  
{
  "subcalendars": [
    {
      "id": 12345,
      "name": "John's Schedule",
      "color": 17,
      "active": true,
      "type": 0,
      "overlap": true
    }
  ]
}
```

## Expected Behavior
- **Real API calls** to TeamUp endpoints
- **Proper authentication** with Teamup-Token header
- **Correct field mapping** from documentation
- **Installer detection** from subcalendar_ids
- **Provisioning with installerId** from TeamUp

## Previous Versions
- v3.5.0: TeamUp API structure (wrong field names)
- v3.4.0: Clean testing environment (removed token fallback)
- v3.3.1: Fixed token routing (added fallback)
- v3.3.0: Proper navigation (broken token routing)
- v3.2.2: Back buttons added (wrong navigation logic)
- v3.2.1: Cache-busting deployment (edit function fixed)
- v3.2.0: Better UX design (provisioning fixed)
- v3.1.1: Edit function fixed (clunky UX)
- v3.1.0: Full provisioning (broken edit function)
- v3.0.0: Basic TeamUp workflow (limited fields)
- v2.0.0: Manual job creation (REMOVED)
- v1.0.0: Basic installer creation (REMOVED)

## Deployment Commands
```bash
# Deploy current version
firebase deploy --only hosting --public deploy_clean

# Check deployment
firebase hosting:sites:list
```
