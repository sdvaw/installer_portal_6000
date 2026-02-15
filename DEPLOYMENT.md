# Installer Portal - Deployment Guide

## 🚀 Complete Production System

This is a **fully functional production-ready Installer Portal** with TeamUp integration, Google Sheets database, and comprehensive admin management.

## ✅ Features Implemented

### 🔧 Installer Portal
- **Job Management**: View, update status, track progress
- **Photo Upload**: Upload and manage job photos (requires Google Drive setup)
- **Service Issues**: Report problems with detailed categorization
- **Customer Information**: View job details and customer data
- **Week Navigation**: Browse jobs by week
- **Real-time Updates**: Live status updates with notifications

### 📊 Admin Dashboard
- **Service Management**: Overview of all jobs, issues, and statistics
- **Installer Management**: Add, edit, and manage installers
- **Calendar Integration**: TeamUp sync and configuration
- **AR Management**: Track payments and accounts receivable
- **Reports & Analytics**: Performance metrics and reporting
- **System Settings**: Configure API keys and preferences

### 🔗 TeamUp Integration
- **Automatic Sync**: Pull jobs from multiple TeamUp calendars
- **Customer Data Extraction**: Parse customer info from event notes
- **Job Requirements**: Extract photo requirements and special instructions
- **Error Handling**: Robust error handling and logging

### 📁 Google Sheets Database
- **8 Integrated Tabs**: Config, Installers, Jobs, Job_Photos, Service_Issues, Block_Off_Dates, AR_Status, Sync_Log
- **Data Validation**: Dropdown menus and formatted cells
- **Automatic Setup**: One-click database creation
- **Relationship Management**: Linked data across sheets

## 🛠️ Deployment Instructions

### Method 1: CLASP (Recommended for Git Repository)

1. **Install CLASP**
   ```bash
   npm install -g @google/clasp
   ```

2. **Login to Google**
   ```bash
   clasp login
   ```

3. **Create Apps Script Project**
   ```bash
   clasp create --title "Installer Portal System"
   ```
   - This creates `clasp.json` with your script ID
   - Commit `clasp.json` to repository (optional)

4. **Push Code to Google**
   ```bash
   npm run push
   # or
   clasp push
   ```

5. **Deploy Web App**
   ```bash
   clasp deploy --description "Production deployment"
   ```

6. **Get Deployment URL**
   ```bash
   clasp deployments
   ```
   - Copy the deployment URL for web app access

### Method 2: Manual (Alternative)

1. **Open Google Apps Script**
   - Go to [script.google.com](https://script.google.com)
   - Click "New Project"

2. **Replace Code**
   - Delete all existing code
   - Copy entire `Code.gs` file content
   - Paste into the editor

3. **Save Project**
   - Save project (Ctrl+S)
   - Give it a name like "Installer Portal System"

4. **Deploy as Web App**
   - Click "Deploy" → "New deployment"
   - Type: "Web app"
   - Execute as: "Me" (your Google account)
   - Who has access: "Anyone with Google account" (or "Anyone" for public access)
   - Click "Deploy"
   - Authorize permissions
   - Copy the Web app URL

### 3. Initial Setup

1. **Access Setup Wizard**
   - Open your deployment URL
   - Add `?action=setup` to the URL
   - Example: `https://script.google.com/macros/s/YOUR_ID/exec?action=setup`

2. **Configure System**
   - **TeamUp API Key**: Get from TeamUp API settings
   - **Calendar Keys**: Enter comma-separated TeamUp calendar keys
   - **Notification Email**: Admin email for notifications
   - **Sync Interval**: How often to sync calendars

3. **Setup Database**
   - Click "🚀 Setup Database" button
   - This creates the Google Sheets database with all tabs
   - Save the configuration

### 4. Add Installers

1. **Access Admin Dashboard**
   - Go to your deployment URL with `?action=admin`
   - Example: `https://script.google.com/macros/s/YOUR_ID/exec?action=admin`

2. **Add Installers**
   - Click "👥 Installers" tab
   - Click "➕ Add Installer"
   - Enter installer details:
     - Email (for login)
     - Name
     - TeamUp Calendar Key
     - Crew Size
     - Phone, Location, Skills

### 5. Test the System

1. **Installer Portal Access**
   - Installers can access: `https://script.google.com/macros/s/YOUR_ID/exec?email=installer@company.com`
   - Should see their assigned jobs

2. **Admin Dashboard**
   - Access: `https://script.google.com/macros/s/YOUR_ID/exec?action=admin`
   - Should see system overview and management options

3. **TeamUp Sync**
   - In Admin Dashboard, click "🔄 Sync All Calendars"
   - Should pull jobs from TeamUp into Google Sheets

## 🔧 API Endpoints

The system supports these API endpoints (add `?api=` to URL):

### Setup & Configuration
- `setupDatabase` - Creates Google Sheets database
- `saveConfiguration` - Saves system settings
- `testTeamUpConnection` - Tests TeamUp API connection

### Job Management
- `updateJobStatus` - Updates job status
- `getJobDetails` - Gets detailed job information
- `getInstallerJobs` - Gets jobs for specific installer

### Photo Management
- `uploadPhoto` - Uploads job photos
- `getJobPhotos` - Gets photos for a job

### Service Issues
- `reportIssue` - Reports a service issue
- `getServiceIssues` - Gets service issues

### Block-off Dates
- `addBlockOffDate` - Adds installer unavailability
- `getBlockOffDates` - Gets block-off dates

### Installer Management
- `addInstaller` - Adds new installer
- `getAllInstallers` - Gets all installers

### AR Management
- `updateARStatus` - Updates payment status
- `getARData` - Gets AR data

### System Status
- `getSystemStatus` - Gets system connection status
- `getJobStats` - Gets job statistics
- `getConfiguration` - Gets current configuration

## 📱 Mobile Access

The system is mobile-responsive and works on:
- **iOS devices** (iPhone, iPad)
- **Android devices** (phones, tablets)
- **Desktop browsers** (Chrome, Firefox, Safari, Edge)

## 🔒 Security Features

- **Google Authentication**: Uses Google account login
- **Role-based Access**: Separate installer and admin interfaces
- **Data Validation**: Input validation and sanitization
- **Error Logging**: Comprehensive error tracking
- **Permission Control**: Granular access to features

## 🚨 Troubleshooting

### Common Issues

1. **"Database not found" error**
   - Run the setup wizard first
   - Check if Google Sheets was created properly

2. **"TeamUp connection failed"**
   - Verify API key is correct
   - Check calendar keys are valid
   - Ensure TeamUp API access is enabled

3. **"No jobs showing"**
   - Run calendar sync
   - Check installer calendar assignments
   - Verify TeamUp events exist

4. **Permission errors**
   - Re-deploy the web app
   - Ensure all permissions are granted
   - Check Google Sheets sharing settings

### Debug Mode

Add `?debug=true` to any URL to see detailed error information.

## 📞 Support

This system includes:
- **Comprehensive logging** in Google Sheets (Sync_Log tab)
- **Error notifications** via email
- **Status indicators** in admin dashboard
- **Connection testing** tools

## 🔄 Maintenance

### Regular Tasks
1. **Monitor sync logs** for errors
2. **Backup Google Sheets** regularly
3. **Review installer performance** metrics
4. **Update TeamUp API keys** if needed

### Scaling
- **Multiple calendars**: Add comma-separated calendar keys
- **More installers**: Use admin dashboard to add
- **Additional features**: Extend with new API endpoints

## 🎯 Next Steps

This system is production-ready and includes:
- ✅ All core functionality
- ✅ TeamUp integration
- ✅ Google Sheets database
- ✅ Installer and admin portals
- ✅ Photo management
- ✅ Service issue tracking
- ✅ AR management
- ✅ Reporting and analytics

You can deploy this immediately and start using it for your installer management needs!
