# 🔧 Installer Portal System

**Production-ready Installer Portal with Firebase backend and Google Apps Script backup system.**

## 🚀 Quick Start

### **Firebase Version (Primary)**
```bash
# Deploy to Firebase Hosting
firebase deploy

# Access URL
https://installer-portal-6000.web.app
```

### **Google Apps Script Version (Backup)**
```bash
# Deploy Apps Script
cd src/apps-script
clasp push && clasp deploy
```

## 📁 Project Structure

```
📦 windsurf-project/
├── 🔥 deploy/           # Deployed Firebase application
├── 📝 index.html        # **MAIN DEVELOPMENT FILE**
├── 📁 src/              # Source code components
│   ├── 📁 apps-script/  # Google Apps Script system
│   └── 📁 ui/           # UI components
├── ⚙️ config/           # Configuration files
├── 📚 docs/             # Documentation
├── 🔧 scripts/          # Utility scripts
├── 💾 backup/           # Critical backups
└── 🗃️ archive/          # Archived files
```

## ✅ Features

- **🔧 Installer Portal** - Job management, photo uploads, status updates
- **📊 Admin Dashboard** - Complete system management and analytics
- **🔗 Firebase Integration** - Real-time database and authentication
- **📱 Mobile Responsive** - Works on all devices
- **🔄 Dual System** - Firebase (primary) + Apps Script (backup)

## 🎯 Active Development

**Current File**: `index.html` (378KB)
- **Status**: Active development version
- **Deployment**: Firebase Hosting
- **Version**: v2025.01.28.1833-FIXED

## 📋 Documentation

- **[PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md)** - Complete file organization
- **[docs/](./docs/)** - Full documentation library
- **[SYSTEM_ARCHITECTURE.md](./docs/SYSTEM_ARCHITECTURE.md)** - Technical architecture

## 🔗 Access URLs

### **Firebase Version (Primary)**
- **Main**: https://installer-portal-6000.web.app
- **Admin**: https://installer-portal-6000.web.app/admin
- **Installer**: https://installer-portal-6000.web.app/installer/{token}

### **Google Apps Script Version (Backup)**
- **URL**: [Deployed Apps Script URL]
- **Setup**: ?action=setup
- **Admin**: ?action=admin

## 🛠️ Development Commands

```bash
# Firebase deployment
firebase deploy

# Apps Script deployment
cd src/apps-script
clasp push && clasp deploy

# Install dependencies
npm install

# View documentation
open docs/README.md
```

## 📊 System Status

| Component | Status | Notes |
|-----------|--------|-------|
| **Firebase App** | ✅ Active | Primary production system |
| **Apps Script** | ✅ Ready | Backup system |
| **Documentation** | ✅ Complete | Full documentation library |
| **Configuration** | ✅ Organized | All configs in `config/` |
| **Backups** | ✅ Current | Critical files backed up |

## 🚨 Important Notes

- **Main development file**: `index.html`
- **Deployed version**: `deploy/index.html`
- **Backup system**: `src/apps-script/Code.gs`
- **Configuration**: All in `config/` directory
- **Documentation**: All in `docs/` directory

## 📞 Support

**Dual System Architecture**:
- **Primary**: Firebase Hosting with real-time updates
- **Backup**: Google Apps Script with TeamUp integration

Both systems are fully functional and documented.

---

**🚀 Ready for production deployment!**
