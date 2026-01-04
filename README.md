# Installer Portal V2

A secure installer-facing portal + office admin portal built with Google Apps Script and Google Sheets integration.

## Architecture

- **Backend**: Google Apps Script Web App
- **Frontend**: HTML + Vanilla JavaScript
- **Data Store**: Google Sheets (all data - auth, tokens, jobs, logs)
- **Schedule Source**: Teamup Calendar → Google Sheets cache
- **Tooling**: clasp + VS Code + GitHub

## Features

### Installer Portal
- Mobile-first responsive design
- Token-based authentication via Google Sheets
- Crew-based job filtering (server-side only)
- Job viewing with details
- Scaffolded sections for future features

### Admin Portal
- Installer management
- Token issuance and revocation
- Teamup sync control
- System diagnostics and logging
- Access restricted to admin emails

## Setup Instructions

### 1. Google Apps Script Setup

1. Create a new Google Apps Script project
2. Copy all files to the project
3. Set up script properties:

```javascript
// Run this in the Apps Script editor
PropertiesService.getScriptProperties().setProperties({
  'ADMIN_EMAILS': 'admin1@company.com,admin2@company.com',
  'TEAMUP_API_KEY': 'your-teamup-api-key',
  'TEAMUP_CALENDAR_ID': 'your-teamup-calendar-id'
});
```

### 2. Google Sheets Setup

The app automatically creates these sheets when first run:

- **Config** - App configuration
- **Installers** - Installer records and crew assignments
- **Tokens** - Token management
- **Crews** - Crew definitions
- **Teamup_Events** - Cached Teamup calendar events
- **Run_Log** - Execution logs
- **Installer_Sync** - Installer sync status

### 3. Initial Data Setup

After running the app for the first time, populate these sheets:

**Installers Sheet:**
```
id | email | name | role | crew_keys | installer_key | active | created_at | updated_at | phone
---|-------|------|------|-----------|---------------|--------|------------|------------|------
   |       | John | INSTALLER | CREW_A,CREW_B | JOHN_KEY | TRUE |            |            | 555-1234
```

**Crews Sheet:**
```
id | crew_key | name | active | created_at | updated_at | notes
---|----------|------|--------|------------|------------|------
   | CREW_A   | Crew A | TRUE |            |            | 
   | CREW_B   | Crew B | TRUE |            |            |
```

### 4. Deployment

1. In Apps Script editor, go to **Deploy > New Deployment**
2. Select **Web App**
3. Set:
   - Description: "Installer Portal V2"
   - Execute as: "User deploying"
   - Who has access: "Anyone"
4. Deploy and copy the Web App URL

### 5. Access URLs

- **Installer Portal**: `{WEB_APP_URL}/exec?token={TOKEN}`
- **Admin Portal**: `{WEB_APP_URL}/admin`

## API Endpoints

### Installer Portal APIs
- `GET /api/jobs?token={token}&days={14}` - Get filtered jobs
- `GET /api/job/{id}?token={token}` - Get job details
- `POST /api/log` - Log portal actions

### Admin Portal APIs
- `GET /admin/api/installers` - List installers
- `GET /admin/api/diagnostics` - System diagnostics
- `POST /admin/api/tokens/issue` - Issue new token
- `POST /admin/api/tokens/revoke` - Revoke token
- `POST /admin/api/sync/teamup` - Trigger Teamup sync

## Google Sheets Schema

### Installers Sheet
- `id` - Unique identifier
- `email` - Installer email
- `name` - Installer name
- `role` - Role (INSTALLER/ADMIN)
- `crew_keys` - Comma-separated crew assignments
- `installer_key` - Unique key for authentication
- `active` - Active status
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp
- `phone` - Phone number

### Tokens Sheet
- `token` - Authentication token
- `installer_key` - Associated installer
- `created_at` - Creation timestamp
- `created_by_email` - Who created it
- `revoked_at` - Revocation timestamp (empty = active)
- `last_sent_to` - Last email sent to
- `last_sent_at` - Last sent timestamp
- `note` - Notes

### Crews Sheet
- `id` - Unique identifier
- `crew_key` - Crew key
- `name` - Crew name
- `active` - Active status
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp
- `notes` - Additional notes

### Teamup_Events Sheet
- `external_id` - Teamup event ID
- `calendar_id` - Calendar ID
- `crew_key` - Assigned crew
- `job_number` - Job number
- `title` - Job title
- `description` - Job description
- `location` - Job location
- `customer_name` - Customer name
- `start_time` - Start time
- `end_time` - End time
- `status` - Job status
- `last_synced_at` - Last sync timestamp
- `teamup_subcalendar_id` - Teamup subcalendar ID

## Security Features

- **Token Validation**: All installer actions require valid token
- **Crew Filtering**: Server-side job filtering by assigned crews
- **Admin Access**: Admin portal restricted to configured emails
- **Audit Logging**: All actions logged to Google Sheets
- **One Token Per Installer**: Enforced via app logic

## Future Features (Scaffolded)

The app includes placeholder sections for:

- **Status Reporting**: Job status updates with history
- **Defects & Service Tracking**: Issue tracking and resolution
- **Photos & Documents**: File attachments per job
- **Completion Certificates**: Customer-signed walkthroughs

## Troubleshooting

### Common Issues

1. **"Token required" error**: Ensure token is passed as URL parameter
2. **"Invalid token" error**: Check token exists in Tokens sheet and not revoked
3. **"No crews assigned" error**: Verify installer has crew assignments
4. **Admin access denied**: Check ADMIN_EMAILS configuration
5. **Sheet access errors**: Ensure script has permission to access spreadsheet

### Debugging

- Check **Run_Log** sheet for detailed error messages
- Use browser developer tools for frontend debugging
- Verify sheet data matches expected format
- Check Apps Script execution logs

## Maintenance

- **Regular sync**: Set up time-driven triggers for Teamup sync
- **Token cleanup**: Regularly revoke old unused tokens
- **Log rotation**: Archive old logs periodically
- **Monitor errors**: Check Run_Log for recurring issues

## Benefits of Google Sheets Architecture

- **Completely free** - No database costs
- **Simple setup** - No external services needed
- **Easy backup** - Sheets can be exported easily
- **Familiar interface** - Easy for non-technical users
- **Real-time collaboration** - Multiple users can view data
- **Built-in formulas** - Can add calculations and reporting

## Support

For issues or questions:
1. Check the Run_Log sheet for detailed error messages
2. Verify all configuration properties are set correctly
3. Ensure sheet data matches expected format
4. Test with a fresh token if authentication issues occur
