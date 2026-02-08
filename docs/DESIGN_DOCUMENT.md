# Installer Portal v2 Design Document

## Project Overview
A production-grade internal operations web app for a construction/installation company. **Field-facing operational portal** for installers, NOT a CRM or admin system.

## Core Requirements (FROM ORIGINAL PROMPT)

### 🔹 HIGH-LEVEL PURPOSE
- **Read-only + action-capture portal** for field installers
- **Tied to live scheduling data and job records**
- **Field-facing operational portal** - NOT admin system

### 🔹 MANDATORY TECH STACK
**Frontend:**
- HTML/CSS/Vanilla JS
- Mobile-first, tablet-friendly
- Google Apps Script Web App deployment
- "Inside page" model (no Google UI chrome)

**Backend:**
- Google Apps Script (request routing, auth, rendering)
- **Supabase (Postgres) as system-of-record**
- **Teamup Calendar API as scheduling source**

**Development Workflow:**
- VS Code + clasp + GitHub
- Single canonical repo
- Version numbers incremented consistently

### 🔹 DATA SOURCES & AUTHORITY
**Supabase (Primary System of Record)**
- Installers, Crews, Installer ↔ Crew mappings
- Portal access tokens, Job status updates
- Photos metadata, Defect reports, Completion records
- Certificates & signatures

**Teamup Calendar (Scheduling Authority)**
- Job dates, Time windows, Crew assignments
- **Portal reads from Teamup, never writes**
- Events cached in Sheets for performance
- Filtering by crew keys

### 🔹 AUTHENTICATION MODEL
- **Portal Token Access** (NO Google login)
- Unique tokenized links stored in Supabase
- Tokens map to installer_key, email, crew_keys
- Token states: active, revoked, expired
- **Token validation before any data loads**

### 🔹 CORE FEATURES (MUST WORK)

**1️⃣ Installer Dashboard**
- Installer name, Crew(s)
- Jobs for last 14 days + next 14 days
- Jobs from cached Teamup data
- Clear explanation if no jobs

**2️⃣ Job Detail View**
- Customer name, Address, Scheduled date/time
- Crew assignment, Notes from office

**3️⃣ Job Status Reporting**
Installer can mark jobs as:
- Not Started, In Progress, Completed
- Completed – Ready for Inspection
- Needs Return Trip, Service Required, On Hold
- Each status change: Saves to Supabase, Timestamped, Installer-attributed

**4️⃣ Photo Collection**
- Before/After/Defect/Service issue photos
- Mobile camera friendly, File metadata in Supabase
- Storage-agnostic design

**5️⃣ Defect & Issue Reporting**
- Manufacturer defect, Installer mistake, Missing material, Damage discovered, Other
- Job ID, Category, Description, Photos, Follow-up required flag

**6️⃣ Completion & Certificates (Future-Ready)**
- Customer sign-off, Completion certificates, Walk-through confirmation
- Data model hooks, UI placeholders, Backend endpoints

## Current Implementation Status

### ❌ MAJOR MISALIGNMENT DETECTED
**What I Built:**
- Static HTML with hardcoded job data
- Google account authentication (WRONG - should be token-based)
- Admin/Installer dual portals (WRONG - should be installer-only)
- No Supabase integration
- No TeamUp integration
- No token authentication

**What Should Exist:**
- Token-based authentication
- Supabase as system-of-record
- TeamUp API integration
- Installer-only field portal
- Photo upload capability
- Defect reporting system

## Technical Architecture (CORRECTED)

### Target Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Installer     │    │   Supabase     │    │   TeamUp       │
│   Portal        │    │   (System of   │    │   Calendar      │
│   (Token Auth)  │    │   Record)       │    │   (Scheduling)  │
│                 │    │                 │    │                 │
│ - Dashboard     │    │ - Installers    │    │ - Job Dates     │
│ - Job Details   │    │ - Crews         │    │ - Time Windows   │
│ - Status Update │    │ - Tokens        │    │ - Crew Assign   │
│ - Photos       │    │ - Status Updates │    │ - Events        │
│ - Defects      │    │ - Photos        │    │                 │
│ - Completion    │    │ - Defects       │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │ Google Apps     │
                    │ Script Backend  │
                    │                 │
                    │ - Token Auth    │
                    │ - Data Routing  │
                    │ - Rendering     │
                    └─────────────────┘
```

## Data Flow (CORRECTED)

### Correct Implementation Flow
1. **Token Validation** → Supabase token lookup
2. **Installer Dashboard** → Load installer/crew data from Supabase
3. **Job Data** → Pull from TeamUp API, cache in Sheets
4. **Status Updates** → Save to Supabase (not TeamUp)
5. **Photos** → Upload to Supabase Storage
6. **Defect Reports** → Save to Supabase

## Implementation Plan (COMPLETE REBUILD NEEDED)

### Phase 0: Foundation (Immediate)
- Set up Supabase connection
- Implement token authentication
- Create basic installer dashboard structure

### Phase 1: Core Data Integration
- TeamUp API integration for job data
- Supabase integration for installer/crew data
- Job detail view with real data

### Phase 2: Status & Photos
- Job status reporting to Supabase
- Photo upload functionality
- Defect reporting system

### Phase 3: Advanced Features
- Completion certificates (UI placeholders)
- Customer signatures (data hooks)
- Performance optimization

## Critical Issues to Address

### ❌ Current Problems
1. **Wrong Authentication**: Google login vs token-based
2. **Wrong Data Source**: Static vs Supabase + TeamUp
3. **Wrong Architecture**: Admin/Installer vs Installer-only
4. **Missing Core Features**: No photos, defects, status updates to Supabase
5. **No Error Handling**: Missing graceful error pages

### ✅ Immediate Actions Required
1. **Implement token authentication** before any data loads
2. **Connect to Supabase** as system-of-record
3. **Integrate TeamUp API** for scheduling data
4. **Remove admin portal** (not in requirements)
5. **Add photo upload** and defect reporting

## Success Criteria (CORRECTED)

### Functional Success
- [ ] Token-based authentication working
- [ ] Real TeamUp job data displayed
- [ ] Status updates save to Supabase
- [ ] Photo upload functional
- [ ] Defect reporting working
- [ ] Installer-only portal (no admin)

### Technical Success
- [ ] Supabase integration complete
- [ ] TeamUp API integration working
- [ ] Mobile-responsive maintained
- [ ] Error handling implemented
- [ ] Performance acceptable

## Risk Mitigation

### Technical Risks
- **Supabase Connection**: Proper authentication and error handling
- **TeamUp API Limits**: Implement caching and rate limiting
- **Token Security**: Secure validation and revocation
- **Photo Storage**: Scalable storage solution

### Rollback Plan
- Keep current working version as backup
- Feature flags for new functionality
- Immediate revert capability

---

**Document Status**: COMPLETELY REVISED based on original prompt
**Critical Issue**: Current implementation does NOT match requirements
**Next Step**: Complete rebuild with correct architecture
**Last Updated**: After receiving original comprehensive requirements
