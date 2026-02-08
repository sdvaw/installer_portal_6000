# INSTALLER PORTAL - RELEASE MANAGEMENT

## 🚀 STABLE RELEASES

### ✅ STABLE v1.0 - Jan 25, 2026 2:05pm
**File**: `index-stable-v1.html`
**Status**: PRODUCTION READY
**Deployed**: https://installer-portal-6000.web.app

**WORKING FEATURES:**
- Admin Portal with terminal theme
- Installer Management (CRUD)
- TeamUp Provisioning System
- Installer Portal with token login
- Blackout Dates (Firebase resolved)
- Job Management & Status Updates
- Mobile Responsive Design

## 🚀 DEVELOPMENT RELEASES

### 🔄 DEV v2.0 - Current Development
**File**: `index-dev-v2.html` 
**Status**: ACTIVE DEVELOPMENT
**Based on**: Stable v1.0

## 📋 WORKFLOW

1. **STABLE RELEASES** - Never modify, locked production code
2. **DEV RELEASES** - Active development, can modify safely
3. **ROLLBACK** - Copy stable file over dev if needed
4. **PROMOTION** - When dev is stable, create new stable release

## 🔄 DEPLOYMENT COMMANDS

### Deploy Stable:
```bash
Copy-Item index-stable-v1.html index.html
firebase deploy --only hosting
```

### Deploy Dev:
```bash
Copy-Item index-dev-v2.html index.html  
firebase deploy --only hosting
```

## 🎯 RELEASE NOTES

### v1.0 Features:
- Complete admin/installer workflow
- TeamUp integration working
- Firebase index issues resolved
- Terminal theme throughout
- Mobile optimized

### v2.0 (In Development):
- [New features will be listed here]
