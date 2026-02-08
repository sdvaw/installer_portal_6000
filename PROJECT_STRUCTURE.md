# Installer Portal - Project Structure

## 📁 Organized Directory Structure

```
windsurf-project/
├── 📁 src/                          # Source code
│   ├── 📁 components/               # UI components
│   ├── 📁 firebase/                 # Firebase-specific code
│   ├── 📁 apps-script/              # Google Apps Script system
│   │   ├── Code.gs                  # Main Apps Script application
│   │   ├── appsscript.json         # Apps Script configuration
│   │   ├── clasp.json               # CLASP configuration
│   │   └── .clasp.json              # Alternative CLASP config
│   └── 📁 ui/                       # User interface files
│       ├── AdminDashboard.html      # Admin dashboard UI
│       ├── InstallerPortal.html     # Installer portal UI
│       └── portal.html              # General portal UI
│
├── 📁 config/                       # Configuration files
│   ├── firebase.json                # Firebase configuration
│   ├── firestore.rules              # Firestore security rules
│   ├── cors.json                    # CORS configuration
│   └── CONFIG.js                    # Application configuration
│
├── 📁 deploy/                       # Deployment files
│   ├── index.html                   # **MAIN DEPLOYED APP** (Firebase)
│   ├── index_clean.html             # Clean version without admin features
│   ├── debug-index.js               # Debug utilities
│   └── real-data-patch.js           # Data patching utilities
│
├── 📁 backup/                       # Backup files
│   ├── Code.gs.backup               # Apps Script backup
│   ├── index-stable-v1.html         # Stable HTML backup
│   ├── firebase-working-backup.json # Firebase config backup
│   └── [additional backups as needed]
│
├── 📁 scripts/                      # Utility scripts
│   ├── temp_fix.js                  # Temporary fixes
│   └── DATA_ADAPTER.js              # Data adapter utilities
│
├── 📁 archive/                      # Archived files
│   └── [old/unused files]
│
├── 📁 docs/                         # Documentation
│   └── index.html                   # Documentation site
│
├── 📄 index.html                    # **MAIN DEVELOPMENT FILE**
├── 📄 package.json                  # NPM configuration
├── 📄 package-lock.json             # NPM lock file
├── 📄 .gitignore                    # Git ignore rules
│
├── 📚 Documentation Files:
│   ├── README.md                    # Project overview
│   ├── SYSTEM_ARCHITECTURE.md       # Technical architecture
│   ├── DESIGN_DOCUMENT.md           # Design specifications
│   ├── DEPLOYMENT.md                # Deployment guide
│   ├── GOOGLE_SHEETS_SETUP.md       # Google Sheets setup
│   ├── SETUP_GOOGLE_SHEETS.md       # Alternative Sheets setup
│   └── RELEASE_MANAGEMENT.md        # Release process
│
└── 🔧 Development Tools:
    ├── 📁 .git/                      # Git repository
    ├── 📁 .github/                   # GitHub Actions
    ├── 📁 .firebase/                 # Firebase configuration
    └── 📁 node_modules/              # NPM dependencies
```

## 🎯 File Purposes & Responsibilities

### **🚀 PRODUCTION FILES**
- **`deploy/index.html`** - **ACTIVE DEPLOYED APPLICATION** (Firebase Hosting)
- **`index.html`** - **MAIN DEVELOPMENT VERSION** (editing target)

### **📊 SOURCE SYSTEMS**
- **`src/apps-script/`** - Complete Google Apps Script backup system
- **`src/ui/`** - User interface components
- **`config/`** - All configuration files

### **🔧 UTILITIES**
- **`scripts/`** - Helper scripts and utilities
- **`backup/`** - Critical backup files
- **`archive/`** - Old/unused files

### **📚 DOCUMENTATION**
- **`docs/`** - Documentation website
- **Root `.md` files** - Project documentation

## 🔄 Development Workflow

### **Primary Development**
1. Edit: `index.html` (main development file)
2. Test: Local development server
3. Deploy: `firebase deploy` → `deploy/index.html`

### **Backup System**
1. Alternative: `src/apps-script/Code.gs` (Google Apps Script)
2. Restore: Copy from `backup/` if needed
3. Archive: Move old versions to `archive/`

### **Configuration Management**
- Firebase: `config/firebase.json`
- Firestore: `config/firestore.rules`
- App Settings: `config/CONFIG.js`

## 📋 File Status Summary

| Category | Count | Purpose |
|----------|-------|---------|
| **Production** | 4 files | Deployed application |
| **Development** | 1 file | Main editing target |
| **Source** | 7 files | Component systems |
| **Configuration** | 4 files | App configuration |
| **Documentation** | 8 files | Project docs |
| **Utilities** | 2 files | Helper scripts |
| **Backup** | 3 files | Critical backups |
| **Archive** | 0+ files | Old versions |

## 🎯 Quick Access Commands

### **Development**
```bash
# Edit main file
# Open: index.html

# Deploy to Firebase
firebase deploy

# Deploy Apps Script (backup)
cd src/apps-script
clasp push && clasp deploy
```

### **File Management**
```bash
# Create new backup
copy index.html backup\index-backup-$(date).html

# Archive old files
move old-file.html archive\
```

### **Configuration**
```bash
# Edit Firebase config
# Open: config/firebase.json

# Edit Firestore rules
# Open: config/firestore.rules
```

## 🚨 Important Notes

- **`index.html`** is the main development file (378KB)
- **`deploy/index.html`** is the live deployed version
- **`src/apps-script/Code.gs`** is the complete backup system
- **`backup/`** contains critical recovery files
- **`config/`** contains all configuration files

This structure provides clear separation of concerns and easy maintenance.
