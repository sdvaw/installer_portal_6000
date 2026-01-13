# 🔧 Installer Portal System

**Production-ready Installer Portal with TeamUp integration, Google Sheets database, and comprehensive admin management.**

## 🚀 Quick Start with CLASP

```bash
# Install CLASP
npm install -g @google/clasp

# Clone this repository
git clone <repository-url>
cd installer-portal

# Login to Google
clasp login

# Create Apps Script project
clasp create --title "Installer Portal System"

# Push code to Google
npm run push

# Deploy web app
clasp deploy --description "Production deployment"
```

## ✅ Features

- **🔧 Installer Portal** - Job management, photo uploads, issue reporting
- **📊 Admin Dashboard** - Complete system management and analytics  
- **🔗 TeamUp Integration** - Automatic calendar syncing and job parsing
- **📁 Google Sheets Database** - 8 integrated tabs with data validation
- **📱 Mobile Responsive** - Works on all devices
- **🔒 Secure** - Google authentication and role-based access

## 📁 Project Structure

```
installer-portal/
├── Code.gs                    # Complete production system (2,200+ lines)
├── clasp.json                 # CLASP configuration
├── package.json                # NPM scripts for deployment
├── DEPLOYMENT.md              # Detailed deployment guide
├── .github/workflows/deploy.yml # GitHub Actions for CI/CD
└── .gitignore                 # Git ignore rules
```

## 🛠️ Available Scripts

```bash
npm run login      # Login to Google Apps Script
npm run create     # Create new Apps Script project
npm run push       # Push code to Google
npm run deploy     # Push and deploy web app
npm run logs       # View execution logs
npm run status     # Check deployment status
npm run setup      # Full setup (login + create + push)
```

## 🔗 Access URLs

After deployment:

- **Setup**: `YOUR_URL?action=setup`
- **Admin**: `YOUR_URL?action=admin`
- **Installer**: `YOUR_URL?email=installer@company.com`

## 📋 Requirements

- **Node.js** 14+ (for CLASP)
- **Google Account** with Google Drive access
- **TeamUp API Key** (for calendar integration)
- **Google Sheets** access (automatically created)

## 📖 Documentation

- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Complete deployment guide
- **[API Documentation](./DEPLOYMENT.md#-api-endpoints)** - All available endpoints

## 🔄 CI/CD

Includes GitHub Actions workflow for automatic deployment when pushing to main/master branch.

**Required Secrets:**
- `CLASP_ID` - Google Apps Script project ID
- `CLASP_CREDENTIALS` - CLASP authentication credentials

## 📞 Support

Built with Google Apps Script - free hosting, automatic scaling, and enterprise-grade security.

---

**Ready for production deployment!** 🚀
