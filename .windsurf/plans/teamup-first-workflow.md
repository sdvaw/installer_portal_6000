# TeamUp-First Installer Workflow Plan

This plan restructures the installer portal to use a TeamUp-first approach where the system only reads from TeamUp, automatically detects new installers, and handles provisioning through the admin dashboard with email/SMS notifications.

## Current State Analysis

**Current Issues:**
- Sync logic writes to Firebase but doesn't follow TeamUp-first principle
- Manual provisioning process without automated notifications
- No email/SMS integration for installer onboarding
- Inconsistent installer name mapping between TeamUp and Firebase

**Existing Components:**
- TeamUp API integration for events and subcalendars
- Installer token generation system
- Pending installer detection in admin dashboard
- Manual token generation interface

## Proposed Workflow

### 1. TeamUp-First Data Flow
- **Read-only from TeamUp**: System queries TeamUp API but never writes
- **Automatic sync**: Daily/hourly sync of events and subcalendars
- **Installer mapping**: Subcalendar ID → Name mapping from TeamUp
- **Job assignment**: Jobs mapped to installers via subcalendar IDs

### 2. Auto-Detection of New Installers
- **Subcalendar monitoring**: Sync process detects new subcalendars
- **Pending installer list**: Auto-populates admin dashboard with unprovisioned installers
- **Installer details**: Pull name, email, phone from TeamUp subcalendar data
- **Job count tracking**: Shows pending job count for each unprovisioned installer

### 3. Admin Provisioning Process
- **Pending installer dashboard**: Shows all installers with jobs but no Firebase record
- **One-click provisioning**: Admin can provision installer with single click
- **Manual override**: Ability to manually add/edit installer details
- **Bulk provisioning**: Option to provision multiple installers at once

### 4. Automated Installer Notifications
- **Email integration**: Send provisioning emails with portal links
- **SMS integration**: Send text messages with access tokens
- **Portal link generation**: Unique token-based URLs for each installer
- **Welcome message**: Include instructions and support contact info

### 5. Installer Portal Access
- **Token-based authentication**: Secure access via unique tokens
- **Direct portal links**: No login required, just token access
- **Auto-login**: Token automatically logs installer to their portal
- **Session persistence**: Installer stays logged in across sessions

## Implementation Plan

### Phase 1: TeamUp-First Sync Enhancement
1. Modify sync to be read-only from TeamUp
2. Implement automatic subcalendar detection
3. Fix installer name mapping consistency
4. Add pending installer detection logic

### Phase 2: Admin Dashboard Improvements
1. Enhance pending installer interface
2. Add one-click provisioning functionality
3. Include TeamUp-sourced installer details
4. Add bulk provisioning capabilities

### Phase 3: Notification System
1. Integrate email service (SendGrid/SES)
2. Integrate SMS service (Twilio)
3. Create notification templates
4. Add manual resend functionality

### Phase 4: Portal Access Optimization
1. Improve token generation and management
2. Enhance portal link generation
3. Add session management
4. Implement token refresh system

## Technical Requirements

### API Integrations
- **TeamUp API**: Events and subcalendars (read-only)
- **Email Service**: SendGrid or AWS SES
- **SMS Service**: Twilio or similar
- **Firebase**: Installer records and tokens

### Database Schema Changes
```javascript
// Installers collection - enhanced
{
  name: "Installer - Edy",           // From TeamUp subcalendar
  teamupId: 15180021,               // From TeamUp subcalendar
  email: "edy@example.com",         // From TeamUp or admin
  phone: "+15551234567",            // From TeamUp or admin
  status: "active",                 // active/inactive/suspended
  token: "6WKGDE57",               // Auto-generated
  token_generated_at: "2026-02-05T...",
  provisioned_at: "2026-02-05T...", // When provisioned
  last_notified_at: "2026-02-05T...", // Last notification sent
  notification_method: "email",     // email/sms/both
  auto_sync: true                   // Enable auto-sync
}
```

### New Functions Needed
- `syncSubcalendars()` - Pull installer data from TeamUp
- `detectPendingInstallers()` - Find unprovisioned installers
- `provisionInstaller()` - Create Firebase record
- `sendInstallerNotification()` - Email/SMS portal link
- `generateInstallerLink()` - Create portal URL
- `resendInstallerLink()` - Manual resend functionality

## Success Metrics

1. **Time to provision**: < 2 minutes from detection to notification
2. **Installer activation**: > 90% activation within 24 hours
3. **Data consistency**: 100% matching between TeamUp and Firebase
4. **Admin efficiency**: < 5 clicks to provision new installer
5. **Support reduction**: 50% reduction in access-related support tickets

## Risk Mitigation

1. **API rate limits**: Implement proper caching and rate limiting
2. **Data conflicts**: Handle TeamUp data changes gracefully
3. **Notification failures**: Implement retry logic and fallback
4. **Security**: Secure token generation and validation
5. **Compliance**: GDPR/CCPA compliance for installer data

## Next Steps

1. **Phase 1**: Implement TeamUp-first sync with subcalendar detection
2. **Phase 2**: Enhance admin dashboard with provisioning workflow
3. **Phase 3**: Add email/SMS notification system
4. **Phase 4**: Optimize portal access and user experience

This plan ensures the system follows the TeamUp-first principle while maintaining efficient installer provisioning and onboarding processes.
