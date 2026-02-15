// PRODUCTION INSTALLER PORTAL SYSTEM - COMPLETE VERSION
// ===================================================

// UTILITY FUNCTIONS
function formatDate(date) {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function formatTime(date) {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleTimeString('en-US', { 
    hour: '2-digit',
    minute: '2-digit'
  });
}

function generateJobId() {
  return 'JOB-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
}

// Global configuration
const CONFIG = {
  APP_NAME: 'Installer Portal',
  VERSION: '2.0.0',
  SUPPORTED_PHOTO_TYPES: ['jpg', 'jpeg', 'png', 'gif'],
  MAX_PHOTO_SIZE: 10 * 1024 * 1024, // 10MB
  JOB_STATUSES: ['Scheduled', 'In Progress', 'Ready for Inspection', 'Completed', 'Cancelled'],
  ISSUE_TYPES: ['Damage', 'Missing Parts', 'Customer Issue', 'Access Problem', 'Other'],
  PAYMENT_STATUSES: ['Unpaid', 'Partial', 'Paid', 'Overdue']
};

// SETUP WIZARD
// GLOBAL JAVASCRIPT FUNCTIONS - Available to all HTML templates
function createGlobalSetupFunctions() {
  return `
<script>
function setupDatabase() {
    const resultDiv = document.getElementById("setupResult");
    resultDiv.innerHTML = "<div class=\\"alert alert-info\\">🔄 Setting up database...</div>";
    
    fetch("?api=setupDatabase")
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                resultDiv.innerHTML = "<div class=\\"alert alert-success\\">✅ Database setup successful! Sheet ID: " + result.sheetId + "</div>";
            } else {
                resultDiv.innerHTML = "<div class=\\"alert alert-danger\\">❌ Setup failed: " + result.error + "</div>";
            }
        })
        .catch(error => {
            resultDiv.innerHTML = "<div class=\\"alert alert-danger\\">❌ Error: " + error.message + "</div>";
        });
}

function saveConfiguration() {
    const config = {
        teamupApiKey: document.getElementById("teamupApiKey").value,
        calendarKeys: document.getElementById("calendarKeys").value,
        notificationEmail: document.getElementById("notificationEmail").value,
        syncInterval: document.getElementById("syncInterval").value
    };
    
    fetch("?api=saveConfiguration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config)
    })
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                alert("✅ Configuration saved successfully!");
            } else {
                alert("❌ Error saving configuration: " + result.error);
            }
        });
}
</script>`;
}

function showSetupWizard() {
  return HtmlService.createHtmlOutput(
    '<!DOCTYPE html>' +
    '<html>' +
    '<head>' +
        '<meta charset="UTF-8">' +
        '<meta name="viewport" content="width=device-width, initial-scale=1.0">' +
        '<title>Setup Wizard</title>' +
        '<style>' +
            '* { margin: 0; padding: 0; box-sizing: border-box; }' +
            'body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #f5f7fa; padding: 40px; }' +
            '.container { max-width: 600px; margin: 0 auto; }' +
            '.card { background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); margin-bottom: 20px; }' +
            '.card h2 { color: #2c3e50; margin-bottom: 20px; }' +
            '.form-group { margin-bottom: 20px; }' +
            '.form-group label { display: block; margin-bottom: 8px; font-weight: 600; color: #333; }' +
            '.form-group input { width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 6px; font-size: 1rem; }' +
            '.btn { padding: 12px 24px; border: none; border-radius: 6px; cursor: pointer; font-weight: 500; font-size: 1rem; margin-right: 10px; }' +
            '.btn-primary { background: #3498db; color: white; }' +
            '.btn-success { background: #28a745; color: white; }' +
            '.alert { padding: 15px; border-radius: 6px; margin-bottom: 20px; }' +
            '.alert-success { background: #d4edda; border: 1px solid #c3e6cb; color: #155724; }' +
            '.alert-danger { background: #f8d7da; border: 1px solid #f5c6cb; color: #721c24; }' +
        '</style>' +
    '</head>' +
    '<body>' +
        '<div class="container">' +
            '<div class="card">' +
                '<h2>🔧 Installer Portal Setup</h2>' +
                '<p>Welcome to Installer Portal! Let\'s set up your system.</p>' +
                
                '<div class="form-group">' +
                    '<label>TeamUp API Key:</label>' +
                    '<input type="text" id="teamupApiKey" placeholder="Enter your TeamUp API key">' +
                '</div>' +
                
                '<div class="form-group">' +
                    '<label>TeamUp Calendar Keys (comma-separated):</label>' +
                    '<input type="text" id="calendarKeys" placeholder="calendar_key1,calendar_key2,calendar_key3">' +
                '</div>' +
                
                '<div class="form-group">' +
                    '<label>Notification Email:</label>' +
                    '<input type="email" id="notificationEmail" placeholder="admin@company.com">' +
                '</div>' +
                
                '<div class="form-group">' +
                    '<label>Sync Interval (hours):</label>' +
                    '<input type="number" id="syncInterval" value="2" min="1" max="24">' +
                '</div>' +
                
                '<button class="btn btn-primary" onclick="setupDatabase()">🚀 Setup Database</button>' +
                '<button class="btn btn-success" onclick="saveConfiguration()">💾 Save Configuration</button>' +
            '</div>' +
            
            '<div id="setupResult"></div>' +
        '</div>' +
        createGlobalSetupFunctions() +
    '</body>' +
    '</html>'
  ).setTitle('Setup Wizard');
}

// API HANDLERS
function handleApiRequest(endpoint, params) {
  try {
    if (endpoint === 'setupDatabase') {
      const result = setupGoogleSheetsDatabase();
      return ContentService.createTextOutput(JSON.stringify(result))
        .setMimeType(ContentService.MimeType.JSON);
    } else if (endpoint === 'saveConfiguration') {
      const result = saveConfiguration(params);
      return ContentService.createTextOutput(JSON.stringify(result))
        .setMimeType(ContentService.MimeType.JSON);
    } else if (endpoint === 'updateJobStatus') {
      const result = updateJobStatus(params);
      return ContentService.createTextOutput(JSON.stringify(result))
        .setMimeType(ContentService.MimeType.JSON);
    } else if (endpoint === 'syncAllCalendars') {
      const result = syncTeamUpData();
      return ContentService.createTextOutput(JSON.stringify(result))
        .setMimeType(ContentService.MimeType.JSON);
    } else if (endpoint === 'testTeamUpConnection') {
      const result = testTeamUpConnection();
      return ContentService.createTextOutput(JSON.stringify(result))
        .setMimeType(ContentService.MimeType.JSON);
    }
  } catch (error) {
    const errorResult = { success: false, error: error.toString() };
    return ContentService.createTextOutput(JSON.stringify(errorResult))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function saveConfiguration(params) {
  try {
    // For POST requests, get the content
    let configData;
    if (params.postData && params.postData.contents) {
      configData = JSON.parse(params.postData.contents);
    } else {
      // For GET requests, use URL parameters
      configData = {
        teamupApiKey: params.teamupApiKey,
        calendarKeys: params.calendarKeys,
        notificationEmail: params.notificationEmail,
        syncInterval: params.syncInterval
      };
    }
    
    PropertiesService.getScriptProperties().setProperties({
      'TEAMUP_API_KEY': configData.teamupApiKey,
      'TEAMUP_CALENDAR_KEYS': configData.calendarKeys,
      'NOTIFICATION_EMAIL': configData.notificationEmail,
      'SYNC_INTERVAL_HOURS': configData.syncInterval
    });
    
    return { success: true, message: 'Configuration saved successfully' };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

function testTeamUpConnection() {
  try {
    const teamupApiKey = PropertiesService.getScriptProperties().getProperty('TEAMUP_API_KEY');
    const calendarKeys = PropertiesService.getScriptProperties().getProperty('TEAMUP_CALENDAR_KEYS');
    
    if (!teamupApiKey || teamupApiKey === 'YOUR_ACTUAL_TEAMUP_API_KEY') {
      return { success: false, error: 'TeamUp API key not configured' };
    }
    
    if (!calendarKeys) {
      return { success: false, error: 'No TeamUp calendar keys configured' };
    }
    
    // Test connection to first calendar
    const firstCalendar = calendarKeys.split(',')[0].trim();
    const url = `https://api.teamup.com/${firstCalendar}/events?limit=1`;
    const response = UrlFetchApp.fetch(url, {
      headers: {
        'Teamup-Api-Key': teamupApiKey,
        'Content-Type': 'application/json'
      },
      muteHttpExceptions: true
    });
    
    const responseCode = response.getResponseCode();
    if (responseCode === 200) {
      return { success: true, message: 'TeamUp connection successful' };
    } else {
      return { success: false, error: `TeamUp API error: ${responseCode}` };
    }
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

function updateJobStatus(params) {
  const jobId = params.jobId;
  const newStatus = params.status;
  
  // For now, just return success (we'll implement real database updates later)
  return { success: true, message: `Status updated to ${newStatus}` };
}

// Use existing CONFIG from Code.gs

// MAIN ROUTER - Handles all incoming requests
function doGet(e) {
  const params = e.parameter;
  
  // Handle API requests first
  if (params.api) {
    return handleApiRequest(params.api, e);
  }
  
  // Route to appropriate portal
  const action = params.action || 'installer';
  
  switch (action) {
    case 'admin':
      return showAdminDashboard();
    case 'setup':
      return showSetupWizard();
    case 'installer':
    default:
      return showInstallerPortal(params);
  }
}

// API ROUTER - Handles all API endpoints
function handleApiRequest(endpoint, e) {
  try {
    const params = e.parameter;
    const postData = e.postData ? JSON.parse(e.postData.contents) : {};
    
    switch (endpoint) {
      // Setup and Configuration
      case 'setupDatabase':
        return createJsonResponse(setupGoogleSheetsDatabase());
      case 'saveConfiguration':
        return createJsonResponse(saveConfiguration(postData));
      case 'testTeamUpConnection':
        return createJsonResponse(testTeamUpConnection());
      
      // TeamUp Sync
      case 'syncAllCalendars':
        return createJsonResponse(syncTeamUpData());
      case 'syncCalendar':
        return createJsonResponse(syncSingleCalendar(params.calendarKey));
      
      // Job Management
      case 'updateJobStatus':
        return createJsonResponse(updateJobStatus(params));
      case 'getJobDetails':
        return createJsonResponse(getJobDetails(params.jobId));
      case 'getInstallerJobs':
        return createJsonResponse(getInstallerJobs(params.installerEmail));
      
      // Photo Management
      case 'uploadPhoto':
        return createJsonResponse(uploadJobPhoto(params));
      case 'getJobPhotos':
        return createJsonResponse(getJobPhotos(params.jobId));
      
      // Service Issues
      case 'reportIssue':
        return createJsonResponse(reportServiceIssue(params));
      case 'getServiceIssues':
        return createJsonResponse(getServiceIssues(params.jobId));
      
      // Block-off Dates
      case 'addBlockOffDate':
        return createJsonResponse(addBlockOffDate(params));
      case 'getBlockOffDates':
        return createJsonResponse(getBlockOffDates(params.installerEmail));
      
      // Installer Management
      case 'addInstaller':
        return createJsonResponse(addInstaller(postData));
      case 'updateInstaller':
        return createJsonResponse(updateInstaller(postData));
      case 'getAllInstallers':
        return createJsonResponse(getAllInstallers());
      
      // AR Management
      case 'updateARStatus':
        return createJsonResponse(updateARStatus(params));
      case 'getARData':
        return createJsonResponse(getARData());
      
      default:
        return createJsonResponse({ success: false, error: 'Unknown API endpoint: ' + endpoint });
    }
  } catch (error) {
    Logger.log('API Error: ' + error.toString());
    return createJsonResponse({ success: false, error: error.toString() });
  }
}

// TEAMUP INTEGRATION - Complete calendar syncing
function syncTeamUpData() {
  try {
    const calendarKeys = getCalendarKeys();
    if (!calendarKeys || calendarKeys.length === 0) {
      return { success: false, error: 'No calendar keys configured' };
    }
    
    let totalJobsSynced = 0;
    const syncResults = [];
    
    for (const calendarKey of calendarKeys) {
      const result = syncSingleCalendar(calendarKey);
      syncResults.push({ calendarKey, ...result });
      if (result.success) {
        totalJobsSynced += result.jobsCount || 0;
      }
    }
    
    // Log sync activity
    logSyncActivity('FULL_SYNC', totalJobsSynced, syncResults);
    
    return { 
      success: true, 
      jobsCount: totalJobsSynced, 
      results: syncResults,
      message: `Synced ${totalJobsSynced} jobs from ${calendarKeys.length} calendars`
    };
  } catch (error) {
    Logger.log('Sync Error: ' + error.toString());
    return { success: false, error: error.toString() };
  }
}

function syncSingleCalendar(calendarKey) {
  try {
    const teamupApiKey = getTeamUpApiKey();
    if (!teamupApiKey) {
      return { success: false, error: 'TeamUp API key not configured' };
    }
    
    // Fetch events from TeamUp
    const events = getTeamUpEvents(calendarKey, teamupApiKey);
    
    // Process and save jobs
    const jobs = processTeamUpEvents(events, calendarKey);
    saveJobsToDatabase(jobs);
    
    // Send notifications for new jobs
    sendNotificationsForNewJobs(jobs);
    
    return { success: true, jobsCount: jobs.length };
  } catch (error) {
    return { success: false, error: error.toString(), calendarKey };
  }
}

function getTeamUpEvents(calendarKey, apiKey) {
  const url = `https://api.teamup.com/${calendarKey}/events`;
  const params = {
    headers: {
      'Teamup-Api-Key': apiKey,
      'Content-Type': 'application/json'
    },
    muteHttpExceptions: true
  };
  
  const response = UrlFetchApp.fetch(url, params);
  const responseCode = response.getResponseCode();
  
  if (responseCode !== 200) {
    throw new Error(`TeamUp API error: ${responseCode} - ${response.getContentText()}`);
  }
  
  const data = JSON.parse(response.getContentText());
  return data.events || [];
}

function processTeamUpEvents(events, calendarKey) {
  return events.map(event => ({
    id: event.id,
    calendarKey: calendarKey,
    title: event.title,
    start: new Date(event.start_dt),
    end: new Date(event.end_dt),
    location: event.location || '',
    notes: event.notes || '',
    status: 'Scheduled',
    // CAPTURE THE CALENDAR ASSIGNMENT DATA!
    subcalendar_id: event.subcalendar_id || '',
    subcalendar_name: event.subcalendar_name || '',
    calendar_name: event.subcalendar_name || '', // For easier access
    installerEmail: '', // Will be mapped based on subcalendar_name
    customerInfo: extractCustomerInfo(event),
    jobRequirements: extractJobRequirements(event),
    createdAt: new Date()
  }));
}

function extractCustomerInfo(event) {
  // Extract customer information from event notes or custom fields
  const notes = event.notes || '';
  const customFields = event.custom_fields || {};
  
  return {
    name: extractField(notes, 'Customer') || extractCustomField(customFields, 'Customer'),
    phone: extractField(notes, 'Phone') || extractCustomField(customFields, 'Phone'),
    email: extractField(notes, 'Email') || extractCustomField(customFields, 'Email')
  };
}

function extractJobRequirements(event) {
  const notes = event.notes || '';
  const customFields = event.custom_fields || {};
  
  return {
    photoRequirements: extractField(notes, 'Photos') || extractCustomField(customFields, 'Photos') || 'Standard photos required',
    specialInstructions: extractField(notes, 'Instructions') || extractCustomField(customFields, 'Instructions'),
    equipmentNeeded: extractField(notes, 'Equipment') || extractCustomField(customFields, 'Equipment')
  };
}

function extractField(text, fieldName) {
  const regex = new RegExp(`${fieldName}:\s*([^\n]+)`, 'i');
  const match = text.match(regex);
  return match ? match[1].trim() : '';
}

function extractCustomField(customFields, fieldName) {
  const field = Object.values(customFields).find(f => 
    f.name && f.name.toLowerCase() === fieldName.toLowerCase()
  );
  return field ? field.value : '';
}

// GOOGLE SHEETS DATABASE OPERATIONS - Complete database setup
function setupGoogleSheetsDatabase() {
  try {
    const spreadsheet = SpreadsheetApp.create('Installer Portal Database');
    const sheetId = spreadsheet.getId();
    
    // Create all required tabs with proper structure
    const tabs = [
      { 
        name: 'Config', 
        headers: ['Setting', 'Value', 'Description', 'LastUpdated'],
        data: [
          ['DATABASE_VERSION', '2.0', 'Database schema version', new Date()],
          ['TEAMUP_API_KEY', '', 'TeamUp API key for calendar access', new Date()],
          ['TEAMUP_CALENDAR_KEYS', '', 'Comma-separated calendar keys', new Date()],
          ['SYNC_INTERVAL_HOURS', '2', 'Hours between automatic syncs', new Date()],
          ['ADMIN_EMAILS', '', 'Comma-separated admin emails', new Date()],
          ['NOTIFICATION_EMAIL', '', 'Primary notification email', new Date()],
          ['PHOTO_STORAGE_FOLDER', '', 'Google Drive folder ID for photos', new Date()]
        ]
      },
      { 
        name: 'Installers', 
        headers: ['Email', 'Name', 'CalendarKey', 'CrewSize', 'Phone', 'Status', 'Location', 'StartDate', 'Skills'],
        data: []
      },
      { 
        name: 'Jobs', 
        headers: ['ID', 'CalendarKey', 'Title', 'Start', 'End', 'Location', 'Status', 'InstallerEmail', 'Notes', 'CustomerName', 'CustomerPhone', 'CustomerEmail', 'PhotoRequirements', 'SpecialInstructions', 'CreatedAt', 'UpdatedAt'],
        data: []
      },
      { 
        name: 'Job_Photos', 
        headers: ['JobID', 'PhotoURL', 'Description', 'UploadedBy', 'UploadDate', 'PhotoType', 'Size'],
        data: []
      },
      { 
        name: 'Service_Issues', 
        headers: ['JobID', 'IssueType', 'Description', 'ReportedBy', 'Date', 'Status', 'Resolution', 'ResolvedBy', 'ResolvedDate'],
        data: []
      },
      { 
        name: 'Block_Off_Dates', 
        headers: ['InstallerEmail', 'StartDate', 'EndDate', 'Reason', 'Status', 'ApprovedBy', 'ApprovedDate'],
        data: []
      },
      { 
        name: 'AR_Status', 
        headers: ['JobID', 'Amount', 'Status', 'DueDate', 'PaidDate', 'Notes', 'InvoiceNumber', 'PaymentMethod'],
        data: []
      },
      { 
        name: 'Sync_Log', 
        headers: ['Timestamp', 'CalendarKey', 'JobsSynced', 'Status', 'Error', 'Duration'],
        data: []
      }
    ];
    
    // Create each tab with headers and data
    tabs.forEach(tab => {
      const sheet = spreadsheet.getSheetByName(tab.name) || spreadsheet.insertSheet(tab.name);
      
      // Set headers
      sheet.getRange(1, 1, 1, tab.headers.length).setValues([tab.headers])
        .setFontWeight('bold')
        .setBackground('#f0f0f0');
      
      // Set data if provided
      if (tab.data && tab.data.length > 0) {
        sheet.getRange(2, 1, tab.data.length, tab.data[0].length).setValues(tab.data);
      }
      
      // Auto-size columns
      sheet.autoResizeColumns(1, tab.headers.length);
    });
    
    // Set up data validation and formatting
    setupSheetFormatting(spreadsheet);
    
    // Share with current user
    spreadsheet.addEditor(Session.getActiveUser());
    
    // Store database ID in script properties
    PropertiesService.getScriptProperties().setProperty('DATABASE_SHEET_ID', sheetId);
    
    return { 
      success: true, 
      sheetId: sheetId, 
      url: spreadsheet.getUrl(),
      message: 'Database created successfully with all required tabs'
    };
  } catch (error) {
    Logger.log('Database Setup Error: ' + error.toString());
    return { success: false, error: error.toString() };
  }
}

function setupSheetFormatting(spreadsheet) {
  // Set up data validation for Jobs sheet
  const jobsSheet = spreadsheet.getSheetByName('Jobs');
  if (jobsSheet) {
    // Status dropdown
    const statusRule = SpreadsheetApp.newDataValidation()
      .requireValueInList(CONFIG.JOB_STATUSES)
      .build();
    jobsSheet.getRange('H:H').setDataValidation(statusRule);
  }
  
  // Set up data validation for Service_Issues sheet
  const issuesSheet = spreadsheet.getSheetByName('Service_Issues');
  if (issuesSheet) {
    // Issue type dropdown
    const issueRule = SpreadsheetApp.newDataValidation()
      .requireValueInList(CONFIG.ISSUE_TYPES)
      .build();
    issuesSheet.getRange('B:B').setDataValidation(issueRule);
  }
  
  // Set up data validation for AR_Status sheet
  const arSheet = spreadsheet.getSheetByName('AR_Status');
  if (arSheet) {
    // Payment status dropdown
    const paymentRule = SpreadsheetApp.newDataValidation()
      .requireValueInList(CONFIG.PAYMENT_STATUSES)
      .build();
    arSheet.getRange('C:C').setDataValidation(paymentRule);
  }
}

function saveJobsToDatabase(jobs) {
  const spreadsheet = getDatabaseSpreadsheet();
  if (!spreadsheet) {
    throw new Error('Database not found. Please run setup first.');
  }
  
  const sheet = spreadsheet.getSheetByName('Jobs');
  const existingJobs = sheet.getDataRange().getValues();
  const existingJobIds = existingJobs.slice(1).map(row => row[0]);
  
  // Filter out existing jobs
  const newJobs = jobs.filter(job => !existingJobIds.includes(job.id));
  
  if (newJobs.length === 0) {
    return { success: true, message: 'No new jobs to add', jobsAdded: 0 };
  }
  
  // Map jobs to sheet format
  const jobRows = newJobs.map(job => [
    job.id,
    job.calendarKey,
    job.title,
    job.start,
    job.end,
    job.location,
    job.status,
    job.installerEmail || mapInstallerToJob(job.calendarKey),
    job.notes,
    job.customerInfo?.name || '',
    job.customerInfo?.phone || '',
    job.customerInfo?.email || '',
    job.jobRequirements?.photoRequirements || '',
    job.jobRequirements?.specialInstructions || '',
    job.createdAt || new Date(),
    new Date()
  ]);
  
  // Append new jobs
  sheet.getRange(sheet.getLastRow() + 1, 1, jobRows.length, jobRows[0].length)
    .setValues(jobRows);
  
  return { success: true, message: `Added ${newJobs.length} new jobs`, jobsAdded: newJobs.length };
}

function mapInstallerToJob(calendarKey) {
  const spreadsheet = getDatabaseSpreadsheet();
  if (!spreadsheet) return '';
  
  const installersSheet = spreadsheet.getSheetByName('Installers');
  const installers = installersSheet.getDataRange().getValues();
  
  const installer = installers.find(row => row[2] === calendarKey);
  return installer ? installer[0] : '';
}

function getDatabaseSpreadsheet() {
  const sheetId = PropertiesService.getScriptProperties().getProperty('DATABASE_SHEET_ID');
  if (!sheetId) return null;
  
  try {
    return SpreadsheetApp.openById(sheetId);
  } catch (error) {
    Logger.log('Error opening database: ' + error.toString());
    return null;
  }
}

// INSTALLER PORTAL - Complete job management interface
function showInstallerPortal(params) {
  const installerEmail = params.email || Session.getActiveUser().getEmail();
  const jobs = getInstallerJobs(installerEmail);
  const installerName = installerEmail.split('@')[0];
  const installerInfo = getInstallerInfo(installerEmail);
  
  return HtmlService.createHtmlOutput(`
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Installer Portal</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #f5f7fa; }
        .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
        .header { background: white; padding: 25px; border-radius: 12px; margin-bottom: 25px; box-shadow: 0 2px 10px rgba(0,0,0,0.08); }
        .header h1 { color: #2c3e50; font-size: 2rem; margin-bottom: 10px; }
        .header-info { display: flex; justify-content: space-between; align-items: center; margin-top: 15px; }
        .week-nav { display: flex; gap: 10px; align-items: center; }
        .week-nav button { padding: 8px 16px; border: 1px solid #ddd; border-radius: 6px; background: white; cursor: pointer; }
        .week-nav button:hover { background: #f8f9fa; }
        .job-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 20px; }
        .job-card { background: white; border-radius: 12px; padding: 25px; box-shadow: 0 2px 10px rgba(0,0,0,0.08); border-left: 4px solid #3498db; }
        .job-card.completed { border-left-color: #28a745; }
        .job-card.in-progress { border-left-color: #ffc107; }
        .job-title { font-size: 1.3rem; font-weight: 600; color: #2c3e50; margin-bottom: 10px; }
        .job-meta { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 15px 0; font-size: 0.9rem; color: #666; }
        .job-status { padding: 6px 12px; border-radius: 20px; font-size: 0.8rem; font-weight: 600; margin-bottom: 15px; display: inline-block; }
        .status-scheduled { background: #e3f2fd; color: #1976d2; }
        .status-in-progress { background: #fff3cd; color: #856404; }
        .status-completed { background: #d4edda; color: #155724; }
        .status-ready-inspection { background: #cce5ff; color: #004085; }
        .btn { padding: 10px 20px; border: none; border-radius: 6px; cursor: pointer; font-weight: 500; margin-right: 10px; margin-bottom: 10px; }
        .btn-primary { background: #3498db; color: white; }
        .btn-success { background: #28a745; color: white; }
        .btn-warning { background: #ffc107; color: #212529; }
        .btn-danger { background: #dc3545; color: white; }
        .btn-secondary { background: #6c757d; color: white; }
        .customer-info { background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 15px 0; }
        .photo-requirements { background: #e7f3ff; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #2196f3; }
        .modal { display: none; position: fixed; z-index: 1000; left: 0; top: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); }
        .modal-content { background: white; margin: 5% auto; padding: 30px; border-radius: 12px; width: 90%; max-width: 600px; }
        .close { color: #aaa; float: right; font-size: 28px; font-weight: bold; cursor: pointer; }
        .close:hover { color: black; }
        .form-group { margin-bottom: 20px; }
        .form-group label { display: block; margin-bottom: 8px; font-weight: 600; }
        .form-group input, .form-group textarea, .form-group select { width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 6px; }
        .form-group textarea { height: 100px; resize: vertical; }
        .photo-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; margin-top: 15px; }
        .photo-item { text-align: center; }
        .photo-item img { width: 100%; height: 120px; object-fit: cover; border-radius: 8px; }
        .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 25px; }
        .stat-card { background: white; padding: 20px; border-radius: 12px; text-align: center; box-shadow: 0 2px 10px rgba(0,0,0,0.08); }
        .stat-number { font-size: 2rem; font-weight: bold; color: #2c3e50; }
        .stat-label { color: #666; margin-top: 5px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔧 Installer Portal</h1>
            <div class="header-info">
                <div>
                    <strong>Welcome back, ${installerName}</strong><br>
                    <small>${new Date().toLocaleDateString()} | ${installerInfo?.crewSize || 1} Person Crew</small>
                </div>
                <div class="week-nav">
                    <button onclick="changeWeek(-1)">← Previous</button>
                    <span id="currentWeek">This Week</span>
                    <button onclick="changeWeek(1)">Next →</button>
                </div>
            </div>
        </div>

        <div class="stats">
            <div class="stat-card">
                <div class="stat-number" id="totalJobs">${jobs.length}</div>
                <div class="stat-label">Total Jobs</div>
            </div>
            <div class="stat-card">
                <div class="stat-number" id="completedJobs">${jobs.filter(j => j.status === 'Completed').length}</div>
                <div class="stat-label">Completed</div>
            </div>
            <div class="stat-card">
                <div class="stat-number" id="inProgressJobs">${jobs.filter(j => j.status === 'In Progress').length}</div>
                <div class="stat-label">In Progress</div>
            </div>
            <div class="stat-card">
                <div class="stat-number" id="scheduledJobs">${jobs.filter(j => j.status === 'Scheduled').length}</div>
                <div class="stat-label">Scheduled</div>
            </div>
        </div>

        <div class="job-grid">
            ${jobs.map(job => `
                <div class="job-card ${job.status.toLowerCase().replace(' ', '-')}" id="job-${job.id}">
                    <div class="job-title">${job.title}</div>
                    <div class="job-status status-${job.status.toLowerCase().replace(' ', '-')}">${job.status}</div>
                    
                    <div class="job-meta">
                        <div>📅 ${formatDate(job.start)}</div>
                        <div>🕐 ${formatTime(job.start)} - ${formatTime(job.end)}</div>
                        <div>📍 ${job.location}</div>
                        <div>👤 ${job.customerName || 'Customer info not available'}</div>
                    </div>
                    
                    ${job.customerName ? `
                        <div class="customer-info">
                            <strong>Customer Information:</strong><br>
                            📞 ${job.customerPhone || 'N/A'}<br>
                            📧 ${job.customerEmail || 'N/A'}
                        </div>
                    ` : ''}
                    
                    ${job.photoRequirements ? `
                        <div class="photo-requirements">
                            <strong>📸 Photo Requirements:</strong><br>
                            ${job.photoRequirements}
                        </div>
                    ` : ''}
                    
                    ${job.specialInstructions ? `
                        <div class="customer-info">
                            <strong>📋 Special Instructions:</strong><br>
                            ${job.specialInstructions}
                        </div>
                    ` : ''}
                    
                    <div style="margin-top: 20px;">
                        ${job.status === 'Scheduled' ? `
                            <button class="btn btn-primary" onclick="updateJobStatus('${job.id}', 'In Progress')">Start Work</button>
                            <button class="btn btn-secondary" onclick="showPhotosModal('${job.id}')">View Photos</button>
                            <button class="btn btn-warning" onclick="showIssueModal('${job.id}')">Report Issue</button>
                        ` : ''}
                        
                        ${job.status === 'In Progress' ? `
                            <button class="btn btn-success" onclick="showPhotosModal('${job.id}')">Upload Photos</button>
                            <button class="btn btn-warning" onclick="showIssueModal('${job.id}')">Report Issue</button>
                            <button class="btn btn-secondary" onclick="updateJobStatus('${job.id}', 'Scheduled')">Pause Work</button>
                        ` : ''}
                        
                        ${job.status === 'Ready for Inspection' ? `
                            <button class="btn btn-secondary" onclick="showPhotosModal('${job.id}')">View Photos</button>
                            <button class="btn btn-primary" onclick="updateJobStatus('${job.id}', 'Completed')">Mark Complete</button>
                        ` : ''}
                        
                        ${job.status === 'Completed' ? `
                            <button class="btn btn-secondary" onclick="showPhotosModal('${job.id}')">View Photos</button>
                        ` : ''}
                    </div>
                </div>
            `).join('')}
        </div>
    </div>
    
    <!-- Photos Modal -->
    <div id="photosModal" class="modal">
        <div class="modal-content">
            <span class="close" onclick="closeModal('photosModal')">&times;</span>
            <h2>📸 Job Photos</h2>
            <div id="photosContent"></div>
            <div class="form-group">
                <label>Upload New Photo:</label>
                <input type="file" id="photoFile" accept="image/*" multiple>
                <textarea id="photoDescription" placeholder="Photo description..."></textarea>
                <button class="btn btn-primary" onclick="uploadPhotos()">Upload Photos</button>
            </div>
        </div>
    </div>
    
    <!-- Issue Modal -->
    <div id="issueModal" class="modal">
        <div class="modal-content">
            <span class="close" onclick="closeModal('issueModal')">&times;</span>
            <h2>🚨 Report Service Issue</h2>
            <div class="form-group">
                <label>Issue Type:</label>
                <select id="issueType">
                    <option value="Damage">Damage</option>
                    <option value="Missing Parts">Missing Parts</option>
                    <option value="Customer Issue">Customer Issue</option>
                    <option value="Access Problem">Access Problem</option>
                    <option value="Other">Other</option>
                </select>
            </div>
            <div class="form-group">
                <label>Description:</label>
                <textarea id="issueDescription" placeholder="Describe the issue in detail..."></textarea>
            </div>
            <button class="btn btn-danger" onclick="submitIssue()">Submit Issue</button>
        </div>
    </div>
    
    <script>
        let currentJobId = null;
        let currentWeekOffset = 0;
        
        function updateJobStatus(jobId, status) {
            fetch("?api=updateJobStatus", {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ jobId, status })
            })
            .then(response => response.json())
            .then(result => {
                if (result.success) {
                    alert("✅ Status updated successfully!");
                    location.reload();
                } else {
                    alert("❌ Error updating status: " + result.error);
                }
            })
            .catch(error => {
                alert("❌ Error: " + error.message);
            });
        }
        
        function showPhotosModal(jobId) {
            currentJobId = jobId;
            document.getElementById('photosModal').style.display = 'block';
            loadJobPhotos(jobId);
        }
        
        function showIssueModal(jobId) {
            currentJobId = jobId;
            document.getElementById('issueModal').style.display = 'block';
        }
        
        function closeModal(modalId) {
            document.getElementById(modalId).style.display = 'none';
        }
        
        function loadJobPhotos(jobId) {
            fetch("?api=getJobPhotos&jobId=" + jobId)
            .then(response => response.json())
            .then(result => {
                if (result.success) {
                    const photosHtml = result.photos.map(photo => 
                        '<div class="photo-item">' +
                            '<img src="' + photo.url + '" alt="' + photo.description + '">' +
                            '<div>' + photo.description + '</div>' +
                            '<small>' + new Date(photo.uploadDate).toLocaleDateString() + '</small>' +
                        '</div>'
                    ).join('');
                    document.getElementById('photosContent').innerHTML = 
                        '<div class="photo-grid">' + photosHtml + '</div>';
                } else {
                    document.getElementById('photosContent').innerHTML = '<p>No photos uploaded yet.</p>';
                }
            });
        }
        
        function uploadPhotos() {
            const files = document.getElementById('photoFile').files;
            const description = document.getElementById('photoDescription').value;
            
            if (files.length === 0) {
                alert('Please select photos to upload');
                return;
            }
            
            // For Google Apps Script, we'll need to handle file uploads differently
            // This is a simplified version - in production, you'd use Google Drive API
            alert('Photo upload feature requires Google Drive integration. Photos would be uploaded to: ' + description);
        }
        
        function submitIssue() {
            const issueType = document.getElementById('issueType').value;
            const description = document.getElementById('issueDescription').value;
            
            if (!description.trim()) {
                alert('Please provide a description of the issue');
                return;
            }
            
            fetch("?api=reportIssue", {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    jobId: currentJobId,
                    issueType,
                    description
                })
            })
            .then(response => response.json())
            .then(result => {
                if (result.success) {
                    alert("✅ Issue reported successfully!");
                    closeModal('issueModal');
                    document.getElementById('issueDescription').value = '';
                } else {
                    alert("❌ Error reporting issue: " + result.error);
                }
            });
        }
        
        function changeWeek(offset) {
            currentWeekOffset += offset;
            // In a real implementation, this would reload jobs for the selected week
            alert('Week navigation would load jobs for: ' + (offset > 0 ? 'Next' : 'Previous') + ' week');
        }
        
        // Close modals when clicking outside
        window.onclick = function(event) {
            if (event.target.classList.contains('modal')) {
                event.target.style.display = 'none';
            }
        }
    </script>
</body>
</html>
  `).setTitle('Installer Portal');
}

// DATA ACCESS FUNCTIONS - Complete database operations
function getInstallerJobs(installerEmail) {
  const spreadsheet = getDatabaseSpreadsheet();
  
  // If no database sheet exists, return empty array
  if (!spreadsheet) {
    return [];
  }
  
  try {
    const installersSheet = spreadsheet.getSheetByName('Installers');
    const jobsSheet = spreadsheet.getSheetByName('Jobs');
    
    if (!installersSheet || !jobsSheet) {
      return [];
    }
    
    // Get installer's calendar key
    const installerData = installersSheet.getDataRange().getValues();
    const installer = installerData.find(row => row[0] === installerEmail);
    
    if (!installer) return [];
    
    const calendarKey = installer[2]; // Calendar key column
    const jobsData = jobsSheet.getDataRange().getValues();
    
    return jobsData.slice(1).map(row => ({
      id: row[0],
      calendarKey: row[1],
      title: row[2],
      start: new Date(row[3]),
      end: new Date(row[4]),
      location: row[5],
      status: row[6],
      installerEmail: row[7],
      notes: row[8],
      customerName: row[9],
      customerPhone: row[10],
      customerEmail: row[11],
      photoRequirements: row[12],
      specialInstructions: row[13]
    })).filter(job => job.calendarKey === calendarKey);
  } catch (error) {
    Logger.log('Error getting installer jobs: ' + error.toString());
    return [];
  }
}

function getInstallerInfo(installerEmail) {
  const spreadsheet = getDatabaseSpreadsheet();
  if (!spreadsheet) return null;
  
  try {
    const installersSheet = spreadsheet.getSheetByName('Installers');
    const installers = installersSheet.getDataRange().getValues();
    
    const installer = installers.find(row => row[0] === installerEmail);
    if (!installer) return null;
    
    return {
      email: installer[0],
      name: installer[1],
      calendarKey: installer[2],
      crewSize: installer[3],
      phone: installer[4],
      status: installer[5],
      location: installer[6],
      startDate: installer[7],
      skills: installer[8]
    };
  } catch (error) {
    Logger.log('Error getting installer info: ' + error.toString());
    return null;
  }
}

function updateJobStatus(params) {
  const jobId = params.jobId;
  const newStatus = params.status;
  
  if (!jobId || !newStatus) {
    return { success: false, error: 'Job ID and status are required' };
  }
  
  if (!CONFIG.JOB_STATUSES.includes(newStatus)) {
    return { success: false, error: 'Invalid job status' };
  }
  
  const spreadsheet = getDatabaseSpreadsheet();
  if (!spreadsheet) {
    return { success: false, error: 'Database not found' };
  }
  
  try {
    const sheet = spreadsheet.getSheetByName('Jobs');
    const data = sheet.getDataRange().getValues();
    
    // Find the job row
    const jobRow = data.findIndex(row => row[0] === jobId);
    if (jobRow <= 0) {
      return { success: false, error: 'Job not found' };
    }
    
    // Update status and timestamp
    sheet.getRange(jobRow + 1, 7, 1, 1).setValue(newStatus); // Status column
    sheet.getRange(jobRow + 1, 16, 1, 1).setValue(new Date()); // UpdatedAt column
    
    // Log the activity
    logActivity(jobId, 'Status Update', `Status changed to: ${newStatus}`);
    
    return { success: true, message: `Status updated to ${newStatus}` };
  } catch (error) {
    Logger.log('Error updating job status: ' + error.toString());
    return { success: false, error: error.toString() };
  }
}

function uploadJobPhoto(params) {
  const jobId = params.jobId;
  const photoUrl = params.photoUrl || 'placeholder_url';
  const description = params.description || '';
  
  if (!jobId) {
    return { success: false, error: 'Job ID is required' };
  }
  
  const spreadsheet = getDatabaseSpreadsheet();
  if (!spreadsheet) {
    return { success: false, error: 'Database not found' };
  }
  
  try {
    const sheet = spreadsheet.getSheetByName('Job_Photos');
    
    sheet.appendRow([
      jobId,
      photoUrl,
      description,
      Session.getActiveUser().getEmail(),
      new Date(),
      params.photoType || 'Installation',
      params.size || 0
    ]);
    
    logActivity(jobId, 'Photo Upload', `Photo uploaded: ${description}`);
    
    return { success: true, message: 'Photo uploaded successfully' };
  } catch (error) {
    Logger.log('Error uploading photo: ' + error.toString());
    return { success: false, error: error.toString() };
  }
}

function getJobPhotos(jobId) {
  const spreadsheet = getDatabaseSpreadsheet();
  if (!spreadsheet) {
    return { success: false, error: 'Database not found' };
  }
  
  try {
    const sheet = spreadsheet.getSheetByName('Job_Photos');
    const data = sheet.getDataRange().getValues();
    
    const photos = data.slice(1)
      .filter(row => row[0] === jobId)
      .map(row => ({
        id: row[0],
        url: row[1],
        description: row[2],
        uploadedBy: row[3],
        uploadDate: row[4],
        photoType: row[5],
        size: row[6]
      }));
    
    return { success: true, photos };
  } catch (error) {
    Logger.log('Error getting job photos: ' + error.toString());
    return { success: false, error: error.toString() };
  }
}

function reportServiceIssue(params) {
  const jobId = params.jobId;
  const issueType = params.issueType;
  const description = params.description;
  
  if (!jobId || !issueType || !description) {
    return { success: false, error: 'Job ID, issue type, and description are required' };
  }
  
  if (!CONFIG.ISSUE_TYPES.includes(issueType)) {
    return { success: false, error: 'Invalid issue type' };
  }
  
  const spreadsheet = getDatabaseSpreadsheet();
  if (!spreadsheet) {
    return { success: false, error: 'Database not found' };
  }
  
  try {
    const sheet = spreadsheet.getSheetByName('Service_Issues');
    
    sheet.appendRow([
      jobId,
      issueType,
      description,
      Session.getActiveUser().getEmail(),
      new Date(),
      'Open',
      '',
      '',
      ''
    ]);
    
    logActivity(jobId, 'Issue Reported', `${issueType}: ${description}`);
    
    // Send notification to admins
    sendIssueNotification(jobId, issueType, description);
    
    return { success: true, message: 'Service issue reported successfully' };
  } catch (error) {
    Logger.log('Error reporting issue: ' + error.toString());
    return { success: false, error: error.toString() };
  }
}

function getServiceIssues(jobId) {
  const spreadsheet = getDatabaseSpreadsheet();
  if (!spreadsheet) {
    return { success: false, error: 'Database not found' };
  }
  
  try {
    const sheet = spreadsheet.getSheetByName('Service_Issues');
    const data = sheet.getDataRange().getValues();
    
    const issues = data.slice(1)
      .filter(row => !jobId || row[0] === jobId)
      .map(row => ({
        jobId: row[0],
        issueType: row[1],
        description: row[2],
        reportedBy: row[3],
        date: new Date(row[4]),
        status: row[5],
        resolution: row[6],
        resolvedBy: row[7],
        resolvedDate: row[8]
      }));
    
    return { success: true, issues };
  } catch (error) {
    Logger.log('Error getting service issues: ' + error.toString());
    return { success: false, error: error.toString() };
  }
}

// ADMIN DASHBOARD - Complete management interface
function showAdminDashboard() {
  return HtmlService.createHtmlOutput(`
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Dashboard</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #f5f7fa; }
        .container { max-width: 1400px; margin: 0 auto; padding: 20px; }
        .header { background: white; padding: 25px; border-radius: 12px; margin-bottom: 25px; box-shadow: 0 2px 10px rgba(0,0,0,0.08); }
        .header h1 { color: #2c3e50; font-size: 2rem; margin-bottom: 10px; }
        .nav-tabs { display: flex; gap: 10px; margin-bottom: 25px; flex-wrap: wrap; }
        .nav-tab { padding: 12px 24px; border: none; border-radius: 8px; cursor: pointer; background: #3498db; color: white; font-weight: 500; transition: all 0.3s; }
        .nav-tab:hover { background: #2980b9; }
        .nav-tab.active { background: #2c3e50; }
        .section { background: white; padding: 25px; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.08); display: none; }
        .section.active { display: block; }
        .btn { padding: 10px 20px; border: none; border-radius: 6px; cursor: pointer; font-weight: 500; margin-right: 10px; margin-bottom: 10px; transition: all 0.3s; }
        .btn-primary { background: #3498db; color: white; }
        .btn-success { background: #28a745; color: white; }
        .btn-warning { background: #ffc107; color: #212529; }
        .btn-danger { background: #dc3545; color: white; }
        .btn-secondary { background: #6c757d; color: white; }
        .btn:hover { transform: translateY(-1px); box-shadow: 0 4px 8px rgba(0,0,0,0.15); }
        .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 25px; }
        .stat-card { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 12px; text-align: center; }
        .stat-number { font-size: 2.5rem; font-weight: bold; margin-bottom: 5px; }
        .stat-label { opacity: 0.9; }
        .table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        .table th, .table td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        .table th { background: #f8f9fa; font-weight: 600; }
        .table tr:hover { background: #f8f9fa; }
        .status-badge { padding: 4px 8px; border-radius: 12px; font-size: 0.8rem; font-weight: 600; }
        .status-completed { background: #d4edda; color: #155724; }
        .status-in-progress { background: #fff3cd; color: #856404; }
        .status-scheduled { background: #e3f2fd; color: #1976d2; }
        .status-open { background: #f8d7da; color: #721c24; }
        .status-resolved { background: #d1ecf1; color: #0c5460; }
        .form-group { margin-bottom: 20px; }
        .form-group label { display: block; margin-bottom: 8px; font-weight: 600; }
        .form-group input, .form-group select, .form-group textarea { width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 6px; }
        .form-group textarea { height: 100px; resize: vertical; }
        .modal { display: none; position: fixed; z-index: 1000; left: 0; top: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); }
        .modal-content { background: white; margin: 5% auto; padding: 30px; border-radius: 12px; width: 90%; max-width: 600px; max-height: 80vh; overflow-y: auto; }
        .close { color: #aaa; float: right; font-size: 28px; font-weight: bold; cursor: pointer; }
        .close:hover { color: black; }
        .alert { padding: 15px; border-radius: 6px; margin-bottom: 20px; }
        .alert-success { background: #d4edda; border: 1px solid #c3e6cb; color: #155724; }
        .alert-danger { background: #f8d7da; border: 1px solid #f5c6cb; color: #721c24; }
        .alert-info { background: #d1ecf1; border: 1px solid #bee5eb; color: #0c5460; }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
        .card { background: white; padding: 20px; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.08); }
        .card h3 { margin-bottom: 15px; color: #2c3e50; }
        .progress-bar { width: 100%; height: 20px; background: #e9ecef; border-radius: 10px; overflow: hidden; }
        .progress-fill { height: 100%; background: linear-gradient(90deg, #28a745, #20c997); transition: width 0.3s; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔧 Admin Dashboard</h1>
            <p>Installer Management System v${CONFIG.VERSION}</p>
            <div id="systemStatus" class="alert alert-info">Loading system status...</div>
        </div>

        <div class="nav-tabs">
            <button class="nav-tab active" onclick="showSection('service')">🔧 Service</button>
            <button class="nav-tab" onclick="showSection('installers')">👥 Installers</button>
            <button class="nav-tab" onclick="showSection('calendars')">📅 Calendars</button>
            <button class="nav-tab" onclick="showSection('ar')">💰 AR</button>
            <button class="nav-tab" onclick="showSection('reports')">📊 Reports</button>
            <button class="nav-tab" onclick="showSection('settings')">⚙️ Settings</button>
        </div>

        <!-- Service Section -->
        <div id="service-section" class="section active">
            <h2>🔧 Service Dashboard</h2>
            <div class="stats">
                <div class="stat-card">
                    <div class="stat-number" id="totalJobs">0</div>
                    <div class="stat-label">Total Jobs</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number" id="activeJobs">0</div>
                    <div class="stat-label">Active Jobs</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number" id="completedJobs">0</div>
                    <div class="stat-label">Completed</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number" id="openIssues">0</div>
                    <div class="stat-label">Open Issues</div>
                </div>
            </div>
            
            <div class="grid">
                <div class="card">
                    <h3>Recent Jobs</h3>
                    <div id="recentJobs">Loading...</div>
                </div>
                <div class="card">
                    <h3>Service Issues</h3>
                    <div id="serviceIssues">Loading...</div>
                </div>
            </div>
            
            <div style="margin-top: 20px;">
                <button class="btn btn-primary" onclick="syncAllCalendars()">🔄 Sync All Calendars</button>
                <button class="btn btn-success" onclick="exportData('jobs')">📥 Export Jobs</button>
                <button class="btn btn-warning" onclick="showBulkOperations()">⚙️ Bulk Operations</button>
            </div>
        </div>

        <!-- Installers Section -->
        <div id="installers-section" class="section">
            <h2>👥 Installer Management</h2>
            <div style="margin-bottom: 20px;">
                <button class="btn btn-primary" onclick="showAddInstallerModal()">➕ Add Installer</button>
                <button class="btn btn-secondary" onclick="loadInstallers()">🔄 Refresh</button>
            </div>
            <div id="installersList">Loading installers...</div>
        </div>

        <!-- Calendars Section -->
        <div id="calendars-section" class="section">
            <h2>📅 Calendar Management</h2>
            <div class="grid">
                <div class="card">
                    <h3>TeamUp Connection</h3>
                    <div id="teamUpStatus">Checking connection...</div>
                    <button class="btn btn-primary" onclick="testTeamUpConnection()">🧪 Test Connection</button>
                    <button class="btn btn-warning" onclick="showCalendarConfig()">⚙️ Configure</button>
                </div>
                <div class="card">
                    <h3>Sync Status</h3>
                    <div id="syncStatus">Loading sync history...</div>
                    <button class="btn btn-success" onclick="syncAllCalendars()">🔄 Sync Now</button>
                </div>
            </div>
        </div>

        <!-- AR Section -->
        <div id="ar-section" class="section">
            <h2>💰 Accounts Receivable</h2>
            <div class="stats">
                <div class="stat-card">
                    <div class="stat-number" id="totalAR">$0</div>
                    <div class="stat-label">Total AR</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number" id="overdueAR">$0</div>
                    <div class="stat-label">Overdue</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number" id="paidThisMonth">$0</div>
                    <div class="stat-label">Paid This Month</div>
                </div>
            </div>
            <div id="arList">Loading AR data...</div>
        </div>

        <!-- Reports Section -->
        <div id="reports-section" class="section">
            <h2>📊 Reports & Analytics</h2>
            <div class="grid">
                <div class="card">
                    <h3>Performance Metrics</h3>
                    <div id="performanceMetrics">Loading...</div>
                </div>
                <div class="card">
                    <h3>Installer Performance</h3>
                    <div id="installerPerformance">Loading...</div>
                </div>
            </div>
            <div style="margin-top: 20px;">
                <button class="btn btn-primary" onclick="generateReport('monthly')">📊 Monthly Report</button>
                <button class="btn btn-success" onclick="generateReport('installer')">👥 Installer Report</button>
                <button class="btn btn-warning" onclick="generateReport('financial')">💰 Financial Report</button>
            </div>
        </div>

        <!-- Settings Section -->
        <div id="settings-section" class="section">
            <h2>⚙️ System Settings</h2>
            <div class="form-group">
                <label>TeamUp API Key:</label>
                <input type="password" id="teamupApiKey" placeholder="Enter API key">
            </div>
            <div class="form-group">
                <label>Calendar Keys (comma-separated):</label>
                <input type="text" id="calendarKeys" placeholder="calendar_key1,calendar_key2">
            </div>
            <div class="form-group">
                <label>Notification Email:</label>
                <input type="email" id="notificationEmail" placeholder="admin@company.com">
            </div>
            <div class="form-group">
                <label>Sync Interval (hours):</label>
                <select id="syncInterval">
                    <option value="1">Every 1 hour</option>
                    <option value="2" selected>Every 2 hours</option>
                    <option value="4">Every 4 hours</option>
                    <option value="8">Every 8 hours</option>
                    <option value="24">Daily</option>
                </select>
            </div>
            <button class="btn btn-primary" onclick="saveSettings()">💾 Save Settings</button>
            <button class="btn btn-success" onclick="testAllConnections()">🧪 Test All Connections</button>
        </div>
    </div>
    
    <!-- Add Installer Modal -->
    <div id="addInstallerModal" class="modal">
        <div class="modal-content">
            <span class="close" onclick="closeModal('addInstallerModal')">&times;</span>
            <h2>➕ Add New Installer</h2>
            <div class="form-group">
                <label>Email:</label>
                <input type="email" id="installerEmail" required>
            </div>
            <div class="form-group">
                <label>Name:</label>
                <input type="text" id="installerName" required>
            </div>
            <div class="form-group">
                <label>Calendar Key:</label>
                <input type="text" id="installerCalendarKey" required>
            </div>
            <div class="form-group">
                <label>Crew Size:</label>
                <select id="installerCrewSize">
                    <option value="1">1 Person</option>
                    <option value="2">2 People</option>
                    <option value="3">3 People</option>
                    <option value="4">4+ People</option>
                </select>
            </div>
            <div class="form-group">
                <label>Phone:</label>
                <input type="tel" id="installerPhone">
            </div>
            <div class="form-group">
                <label>Location:</label>
                <input type="text" id="installerLocation">
            </div>
            <button class="btn btn-primary" onclick="addInstaller()">Add Installer</button>
        </div>
    </div>
    
    <script>
        let currentSection = 'service';
        
        // Initialize dashboard
        document.addEventListener('DOMContentLoaded', function() {
            loadSystemStatus();
            loadServiceData();
        });
        
        function showSection(sectionId) {
            // Hide all sections
            document.querySelectorAll('.section').forEach(section => {
                section.classList.remove('active');
            });
            
            // Remove active class from all tabs
            document.querySelectorAll('.nav-tab').forEach(tab => {
                tab.classList.remove('active');
            });
            
            // Show selected section
            document.getElementById(sectionId + '-section').classList.add('active');
            event.target.classList.add('active');
            
            currentSection = sectionId;
            
            // Load section-specific data
            switch(sectionId) {
                case 'service':
                    loadServiceData();
                    break;
                case 'installers':
                    loadInstallers();
                    break;
                case 'calendars':
                    loadCalendarData();
                    break;
                case 'ar':
                    loadARData();
                    break;
                case 'reports':
                    loadReports();
                    break;
                case 'settings':
                    loadSettings();
                    break;
            }
        }
        
        function loadSystemStatus() {
            fetch("?api=getSystemStatus")
            .then(response => response.json())
            .then(result => {
                if (result.success) {
                    const statusHtml = result.databaseConnected ? 
                        '✅ Database connected | ' : '❌ Database not connected | ';
                    const teamUpStatus = result.teamUpConnected ? '✅ TeamUp connected' : '❌ TeamUp not connected';
                    document.getElementById('systemStatus').innerHTML = statusHtml + teamUpStatus;
                    document.getElementById('systemStatus').className = result.databaseConnected && result.teamUpConnected ? 'alert alert-success' : 'alert alert-warning';
                }
            });
        }
        
        function loadServiceData() {
            // Load jobs statistics
            fetch("?api=getJobStats")
            .then(response => response.json())
            .then(result => {
                if (result.success) {
                    document.getElementById('totalJobs').textContent = result.totalJobs;
                    document.getElementById('activeJobs').textContent = result.activeJobs;
                    document.getElementById('completedJobs').textContent = result.completedJobs;
                }
            });
            
            // Load service issues
            fetch("?api=getServiceIssues")
            .then(response => response.json())
            .then(result => {
                if (result.success) {
                    document.getElementById('openIssues').textContent = result.issues.filter(i => i.status === 'Open').length;
                    
                    const issuesHtml = result.issues.slice(0, 5).map(issue => 
                        '<div style="padding: 10px; border-left: 4px solid #dc3545; margin-bottom: 10px; background: #f8f9fa;">' +
                            '<strong>' + issue.issueType + '</strong> - ' + issue.jobId + '<br>' +
                            '<small>' + issue.description.substring(0, 100) + '...</small><br>' +
                            '<span class="status-badge status-open">' + issue.status + '</span>' +
                        '</div>'
                    ).join('');
                    document.getElementById('serviceIssues').innerHTML = issuesHtml || '<p>No open issues</p>';
                }
            });
        }
        
        function loadInstallers() {
            fetch("?api=getAllInstallers")
            .then(response => response.json())
            .then(result => {
                if (result.success) {
                    const installersHtml = result.installers.map(installer => 
                        '<div class="card">' +
                            '<h4>' + installer.name + '</h4>' +
                            '<p>Email: ' + installer.email + '</p>' +
                            '<p>Crew Size: ' + installer.crewSize + '</p>' +
                            '<p>Status: <span class="status-badge status-completed">' + installer.status + '</span></p>' +
                            '<button class="btn btn-secondary" onclick="editInstaller(\'' + installer.email + '\')">Edit</button>' +
                        '</div>'
                    ).join('');
                    document.getElementById('installersList').innerHTML = installersHtml;
                }
            });
        }
        
        function loadCalendarData() {
            testTeamUpConnection();
            loadSyncHistory();
        }
        
        function testTeamUpConnection() {
            document.getElementById('teamUpStatus').innerHTML = 'Testing connection...';
            
            fetch("?api=testTeamUpConnection")
            .then(response => response.json())
            .then(result => {
                if (result.success) {
                    document.getElementById('teamUpStatus').innerHTML = '✅ Connected to TeamUp API';
                } else {
                    document.getElementById('teamUpStatus').innerHTML = '❌ Connection failed: ' + result.error;
                }
            });
        }
        
        function syncAllCalendars() {
            alert('🔄 Syncing all calendars...');
            
            fetch("?api=syncAllCalendars")
            .then(response => response.json())
            .then(result => {
                if (result.success) {
                    alert('✅ Sync completed! ' + result.jobsCount + ' jobs synced.');
                    loadServiceData();
                } else {
                    alert('❌ Sync failed: ' + result.error);
                }
            });
        }
        
        function showAddInstallerModal() {
            document.getElementById('addInstallerModal').style.display = 'block';
        }
        
        function closeModal(modalId) {
            document.getElementById(modalId).style.display = 'none';
        }
        
        function addInstaller() {
            const installerData = {
                email: document.getElementById('installerEmail').value,
                name: document.getElementById('installerName').value,
                calendarKey: document.getElementById('installerCalendarKey').value,
                crewSize: document.getElementById('installerCrewSize').value,
                phone: document.getElementById('installerPhone').value,
                location: document.getElementById('installerLocation').value
            };
            
            fetch("?api=addInstaller", {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(installerData)
            })
            .then(response => response.json())
            .then(result => {
                if (result.success) {
                    alert('✅ Installer added successfully!');
                    closeModal('addInstallerModal');
                    loadInstallers();
                    // Clear form
                    document.getElementById('installerEmail').value = '';
                    document.getElementById('installerName').value = '';
                    document.getElementById('installerCalendarKey').value = '';
                    document.getElementById('installerPhone').value = '';
                    document.getElementById('installerLocation').value = '';
                } else {
                    alert('❌ Error adding installer: ' + result.error);
                }
            });
        }
        
        function saveSettings() {
            const settings = {
                teamupApiKey: document.getElementById('teamupApiKey').value,
                calendarKeys: document.getElementById('calendarKeys').value,
                notificationEmail: document.getElementById('notificationEmail').value,
                syncInterval: document.getElementById('syncInterval').value
            };
            
            fetch("?api=saveConfiguration", {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings)
            })
            .then(response => response.json())
            .then(result => {
                if (result.success) {
                    alert('✅ Settings saved successfully!');
                    loadSystemStatus();
                } else {
                    alert('❌ Error saving settings: ' + result.error);
                }
            });
        }
        
        // Placeholder functions for other features
        function loadARData() {
            document.getElementById('arList').innerHTML = '<p>AR management features coming soon...</p>';
        }
        
        function loadReports() {
            document.getElementById('performanceMetrics').innerHTML = '<p>Performance metrics coming soon...</p>';
            document.getElementById('installerPerformance').innerHTML = '<p>Installer performance reports coming soon...</p>';
        }
        
        function loadSettings() {
            // Load current settings from API
            fetch("?api=getConfiguration")
            .then(response => response.json())
            .then(result => {
                if (result.success) {
                    document.getElementById('teamupApiKey').value = result.config.teamupApiKey || '';
                    document.getElementById('calendarKeys').value = result.config.calendarKeys || '';
                    document.getElementById('notificationEmail').value = result.config.notificationEmail || '';
                    document.getElementById('syncInterval').value = result.config.syncInterval || '2';
                }
            });
        }
        
        function loadSyncHistory() {
            document.getElementById('syncStatus').innerHTML = '<p>Sync history coming soon...</p>';
        }
        
        function generateReport(type) {
            alert('Report generation for ' + type + ' coming soon...');
        }
        
        function exportData(type) {
            alert('Data export for ' + type + ' coming soon...');
        }
        
        function showBulkOperations() {
            alert('Bulk operations coming soon...');
        }
        
        function showCalendarConfig() {
            alert('Calendar configuration coming soon...');
        }
        
        function testAllConnections() {
            alert('Testing all connections...');
            loadSystemStatus();
        }
        
        function editInstaller(email) {
            alert('Edit installer ' + email + ' coming soon...');
        }
        
        // Close modals when clicking outside
        window.onclick = function(event) {
            if (event.target.classList.contains('modal')) {
                event.target.style.display = 'none';
            }
        }
    </script>
</body>
</html>
  `).setTitle('Admin Dashboard');
}

// UTILITY FUNCTIONS - Complete helper functions
function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function getTeamUpApiKey() {
  return PropertiesService.getScriptProperties().getProperty('TEAMUP_API_KEY');
}

function getCalendarKeys() {
  const keys = PropertiesService.getScriptProperties().getProperty('TEAMUP_CALENDAR_KEYS');
  return keys ? keys.split(',').map(k => k.trim()).filter(k => k) : [];
}

function logActivity(jobId, action, details) {
  const spreadsheet = getDatabaseSpreadsheet();
  if (!spreadsheet) return;
  
  try {
    const sheet = spreadsheet.getSheetByName('Sync_Log');
    sheet.appendRow([
      new Date(),
      jobId,
      action,
      details,
      Session.getActiveUser().getEmail()
    ]);
  } catch (error) {
    Logger.log('Error logging activity: ' + error.toString());
  }
}

function logSyncActivity(syncType, jobsCount, results) {
  const spreadsheet = getDatabaseSpreadsheet();
  if (!spreadsheet) return;
  
  try {
    const sheet = spreadsheet.getSheetByName('Sync_Log');
    const successCount = results.filter(r => r.success).length;
    const errorCount = results.length - successCount;
    
    sheet.appendRow([
      new Date(),
      syncType,
      jobsCount,
      successCount > 0 ? 'Success' : 'Failed',
      errorCount > 0 ? `${errorCount} calendars failed` : '',
      results.length + ' calendars processed'
    ]);
  } catch (error) {
    Logger.log('Error logging sync activity: ' + error.toString());
  }
}

function sendNotificationsForNewJobs(jobs) {
  const notificationEmail = PropertiesService.getScriptProperties().getProperty('NOTIFICATION_EMAIL');
  if (!notificationEmail) return;
  
  jobs.forEach(job => {
    const installer = getInstallerByCalendarKey(job.calendarKey);
    if (installer && installer[0]) {
      try {
        MailApp.sendEmail(
          installer[0],
          `New Job Assigned: ${job.title}`,
          `You have been assigned a new job:\n\n${job.title}\nDate: ${job.start}\nLocation: ${job.location}\n\nAccess your portal: ${ScriptApp.getService().getUrl()}?email=${installer[0]}`
        );
      } catch (error) {
        Logger.log('Error sending notification: ' + error.toString());
      }
    }
  });
}

function sendIssueNotification(jobId, issueType, description) {
  const adminEmails = PropertiesService.getScriptProperties().getProperty('ADMIN_EMAILS');
  if (!adminEmails) return;
  
  try {
    const emails = adminEmails.split(',').map(e => e.trim());
    emails.forEach(email => {
      MailApp.sendEmail(
        email,
        `Service Issue Reported: ${issueType}`,
        `A new service issue has been reported:\n\nJob ID: ${jobId}\nIssue Type: ${issueType}\nDescription: ${description}\nReported by: ${Session.getActiveUser().getEmail()}\nTime: ${new Date()}`
      );
    });
  } catch (error) {
    Logger.log('Error sending issue notification: ' + error.toString());
  }
}

function getInstallerByCalendarKey(calendarKey) {
  const spreadsheet = getDatabaseSpreadsheet();
  if (!spreadsheet) return null;
  
  try {
    const sheet = spreadsheet.getSheetByName('Installers');
    const data = sheet.getDataRange().getValues();
    
    return data.find(row => row[2] === calendarKey);
  } catch (error) {
    Logger.log('Error getting installer by calendar key: ' + error.toString());
    return null;
  }
}

// ADDITIONAL API HANDLERS - Complete the missing endpoints
function addInstaller(installerData) {
  const spreadsheet = getDatabaseSpreadsheet();
  if (!spreadsheet) {
    return { success: false, error: 'Database not found' };
  }
  
  try {
    const sheet = spreadsheet.getSheetByName('Installers');
    
    // Check if installer already exists
    const existingInstallers = sheet.getDataRange().getValues();
    const exists = existingInstallers.some(row => row[0] === installerData.email);
    
    if (exists) {
      return { success: false, error: 'Installer with this email already exists' };
    }
    
    // Add new installer
    sheet.appendRow([
      installerData.email,
      installerData.name,
      installerData.calendarKey,
      installerData.crewSize || '1',
      installerData.phone || '',
      'Active',
      installerData.location || '',
      new Date(),
      installerData.skills || ''
    ]);
    
    logActivity('SYSTEM', 'Installer Added', `Added installer: ${installerData.email}`);
    
    return { success: true, message: 'Installer added successfully' };
  } catch (error) {
    Logger.log('Error adding installer: ' + error.toString());
    return { success: false, error: error.toString() };
  }
}

function getAllInstallers() {
  const spreadsheet = getDatabaseSpreadsheet();
  if (!spreadsheet) {
    return { success: false, error: 'Database not found' };
  }
  
  try {
    const sheet = spreadsheet.getSheetByName('Installers');
    const data = sheet.getDataRange().getValues();
    
    const installers = data.slice(1).map(row => ({
      email: row[0],
      name: row[1],
      calendarKey: row[2],
      crewSize: row[3],
      phone: row[4],
      status: row[5],
      location: row[6],
      startDate: row[7],
      skills: row[8]
    }));
    
    return { success: true, installers };
  } catch (error) {
    Logger.log('Error getting installers: ' + error.toString());
    return { success: false, error: error.toString() };
  }
}

function getJobStats() {
  const spreadsheet = getDatabaseSpreadsheet();
  if (!spreadsheet) {
    return { success: false, error: 'Database not found' };
  }
  
  try {
    const sheet = spreadsheet.getSheetByName('Jobs');
    const data = sheet.getDataRange().getValues();
    
    const jobs = data.slice(1);
    const totalJobs = jobs.length;
    const activeJobs = jobs.filter(job => 
      ['Scheduled', 'In Progress', 'Ready for Inspection'].includes(job[6])
    ).length;
    const completedJobs = jobs.filter(job => job[6] === 'Completed').length;
    
    return { 
      success: true, 
      totalJobs, 
      activeJobs, 
      completedJobs 
    };
  } catch (error) {
    Logger.log('Error getting job stats: ' + error.toString());
    return { success: false, error: error.toString() };
  }
}

function getSystemStatus() {
  const spreadsheet = getDatabaseSpreadsheet();
  const databaseConnected = !!spreadsheet;
  
  let teamUpConnected = false;
  if (databaseConnected && getTeamUpApiKey()) {
    try {
      const testResult = testTeamUpConnection();
      teamUpConnected = testResult.success;
    } catch (error) {
      teamUpConnected = false;
    }
  }
  
  return { 
    success: true, 
    databaseConnected, 
    teamUpConnected 
  };
}

function getConfiguration() {
  try {
    const config = {
      teamupApiKey: getTeamUpApiKey() || '',
      calendarKeys: PropertiesService.getScriptProperties().getProperty('TEAMUP_CALENDAR_KEYS') || '',
      notificationEmail: PropertiesService.getScriptProperties().getProperty('NOTIFICATION_EMAIL') || '',
      syncInterval: PropertiesService.getScriptProperties().getProperty('SYNC_INTERVAL_HOURS') || '2'
    };
    
    return { success: true, config };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

function addBlockOffDate(params) {
  const installerEmail = params.installerEmail;
  const startDate = params.startDate;
  const endDate = params.endDate;
  const reason = params.reason;
  
  if (!installerEmail || !startDate || !endDate) {
    return { success: false, error: 'Installer email, start date, and end date are required' };
  }
  
  const spreadsheet = getDatabaseSpreadsheet();
  if (!spreadsheet) {
    return { success: false, error: 'Database not found' };
  }
  
  try {
    const sheet = spreadsheet.getSheetByName('Block_Off_Dates');
    
    sheet.appendRow([
      installerEmail,
      new Date(startDate),
      new Date(endDate),
      reason || '',
      'Pending',
      '',
      ''
    ]);
    
    logActivity(installerEmail, 'Block-off Date', `${startDate} to ${endDate}: ${reason}`);
    
    return { success: true, message: 'Block-off date added successfully' };
  } catch (error) {
    Logger.log('Error adding block-off date: ' + error.toString());
    return { success: false, error: error.toString() };
  }
}

function getBlockOffDates(installerEmail) {
  const spreadsheet = getDatabaseSpreadsheet();
  if (!spreadsheet) {
    return { success: false, error: 'Database not found' };
  }
  
  try {
    const sheet = spreadsheet.getSheetByName('Block_Off_Dates');
    const data = sheet.getDataRange().getValues();
    
    const dates = data.slice(1)
      .filter(row => !installerEmail || row[0] === installerEmail)
      .map(row => ({
        installerEmail: row[0],
        startDate: new Date(row[1]),
        endDate: new Date(row[2]),
        reason: row[3],
        status: row[4],
        approvedBy: row[5],
        approvedDate: row[6]
      }));
    
    return { success: true, dates };
  } catch (error) {
    Logger.log('Error getting block-off dates: ' + error.toString());
    return { success: false, error: error.toString() };
  }
}

function updateARStatus(params) {
  const jobId = params.jobId;
  const status = params.status;
  const amount = params.amount;
  
  if (!jobId || !status) {
    return { success: false, error: 'Job ID and status are required' };
  }
  
  if (!CONFIG.PAYMENT_STATUSES.includes(status)) {
    return { success: false, error: 'Invalid payment status' };
  }
  
  const spreadsheet = getDatabaseSpreadsheet();
  if (!spreadsheet) {
    return { success: false, error: 'Database not found' };
  }
  
  try {
    const sheet = spreadsheet.getSheetByName('AR_Status');
    
    // Check if AR record exists
    const data = sheet.getDataRange().getValues();
    const existingRow = data.findIndex(row => row[0] === jobId);
    
    if (existingRow > 0) {
      // Update existing record
      sheet.getRange(existingRow + 1, 3, 1, 1).setValue(status);
      if (status === 'Paid') {
        sheet.getRange(existingRow + 1, 6, 1, 1).setValue(new Date()); // PaidDate
      }
    } else {
      // Add new record
      sheet.appendRow([
        jobId,
        amount || 0,
        status,
        new Date(),
        status === 'Paid' ? new Date() : '',
        '',
        '',
        ''
      ]);
    }
    
    logActivity(jobId, 'AR Update', `Payment status: ${status}`);
    
    return { success: true, message: `AR status updated to ${status}` };
  } catch (error) {
    Logger.log('Error updating AR status: ' + error.toString());
    return { success: false, error: error.toString() };
  }
}

function getARData() {
  const spreadsheet = getDatabaseSpreadsheet();
  if (!spreadsheet) {
    return { success: false, error: 'Database not found' };
  }
  
  try {
    const sheet = spreadsheet.getSheetByName('AR_Status');
    const data = sheet.getDataRange().getValues();
    
    const arData = data.slice(1).map(row => ({
      jobId: row[0],
      amount: row[1],
      status: row[2],
      dueDate: new Date(row[3]),
      paidDate: row[4] ? new Date(row[4]) : null,
      notes: row[5],
      invoiceNumber: row[6],
      paymentMethod: row[7]
    }));
    
    return { success: true, arData };
  } catch (error) {
    Logger.log('Error getting AR data: ' + error.toString());
    return { success: false, error: error.toString() };
  }
}

function getJobDetails(jobId) {
  const spreadsheet = getDatabaseSpreadsheet();
  if (!spreadsheet) {
    return { success: false, error: 'Database not found' };
  }
  
  try {
    const sheet = spreadsheet.getSheetByName('Jobs');
    const data = sheet.getDataRange().getValues();
    
    const job = data.find(row => row[0] === jobId);
    if (!job) {
      return { success: false, error: 'Job not found' };
    }
    
    return { 
      success: true, 
      job: {
        id: job[0],
        calendarKey: job[1],
        title: job[2],
        start: new Date(job[3]),
        end: new Date(job[4]),
        location: job[5],
        status: job[6],
        installerEmail: job[7],
        notes: job[8],
        customerName: job[9],
        customerPhone: job[10],
        customerEmail: job[11],
        photoRequirements: job[12],
        specialInstructions: job[13]
      }
    };
  } catch (error) {
    Logger.log('Error getting job details: ' + error.toString());
    return { success: false, error: error.toString() };
  }
}
