// DATA ADAPTER LAYER
// ====================
// Handles switching between Google Sheets and Supabase data sources

// Get configuration
function getDataSource() {
  return DATA_SOURCE;
}

// UNIVERSAL DATA INTERFACE
// ====================

// Get jobs from configured data source
function getJobs(installerKey, crewKeys) {
  if (getDataSource() === 'supabase') {
    return getJobsFromSupabase(installerKey, crewKeys);
  } else {
    return getJobsFromGoogle(installerKey, crewKeys);
  }
}

// Save job status to configured data source
function saveJobStatus(jobId, status, installerKey, notes) {
  if (getDataSource() === 'supabase') {
    return saveJobStatusToSupabase(jobId, status, installerKey, notes);
  } else {
    return saveJobStatusToGoogle(jobId, status, installerKey, notes);
  }
}

// Get installer info from configured data source
function getInstallerInfo(installerKey) {
  if (getDataSource() === 'supabase') {
    return getInstallerInfoFromSupabase(installerKey);
  } else {
    return getInstallerInfoFromGoogle(installerKey);
  }
}

// Save photo metadata to configured data source
function savePhotoMetadata(jobId, photoData, installerKey) {
  if (getDataSource() === 'supabase') {
    return savePhotoMetadataToSupabase(jobId, photoData, installerKey);
  } else {
    return savePhotoMetadataToGoogle(jobId, photoData, installerKey);
  }
}

// Save defect report to configured data source
function saveDefectReport(jobId, defectData, installerKey) {
  if (getDataSource() === 'supabase') {
    return saveDefectReportToSupabase(jobId, defectData, installerKey);
  } else {
    return saveDefectReportToGoogle(jobId, defectData, installerKey);
  }
}

// GOOGLE SHEETS IMPLEMENTATION
// ====================

function getJobsFromGoogle(installerKey, crewKeys) {
  try {
    var spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    var sheet = spreadsheet.getSheetByName('Jobs');
    var data = sheet.getDataRange().getValues();
    
    var jobs = [];
    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      if (shouldShowJobToInstaller(row, installerKey, crewKeys)) {
        jobs.push(mapGoogleRowToJob(row));
      }
    }
    return jobs;
  } catch (error) {
    Logger.log('Error getting jobs from Google: ' + error.toString());
    return [];
  }
}

function saveJobStatusToGoogle(jobId, status, installerKey, notes) {
  try {
    var spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    var sheet = spreadsheet.getSheetByName('JobStatusUpdates');
    
    var timestamp = new Date().toISOString();
    sheet.appendRow([timestamp, jobId, status, installerKey, notes]);
    
    return { success: true, message: 'Status saved to Google Sheets' };
  } catch (error) {
    Logger.log('Error saving status to Google: ' + error.toString());
    return { success: false, message: error.toString() };
  }
}

function getInstallerInfoFromGoogle(installerKey) {
  try {
    var spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    var sheet = spreadsheet.getSheetByName('Installers');
    var data = sheet.getDataRange().getValues();
    
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] === installerKey) {
        return mapGoogleRowToInstaller(data[i]);
      }
    }
    return null;
  } catch (error) {
    Logger.log('Error getting installer info from Google: ' + error.toString());
    return null;
  }
}

// SUPABASE IMPLEMENTATION
// ====================

function getJobsFromSupabase(installerKey, crewKeys) {
  try {
    var url = SUPABASE_URL + '/rest/v1/jobs?select=*&installer_key=eq.' + installerKey;
    var options = {
      'method': 'get',
      'headers': {
        'Authorization': 'Bearer ' + SUPABASE_KEY,
        'apikey': SUPABASE_KEY
      }
    };
    
    var response = UrlFetchApp.fetch(url, options);
    var data = JSON.parse(response.getContentText());
    return data;
  } catch (error) {
    Logger.log('Error getting jobs from Supabase: ' + error.toString());
    return [];
  }
}

function saveJobStatusToSupabase(jobId, status, installerKey, notes) {
  try {
    var url = SUPABASE_URL + '/rest/v1/job_status_updates';
    var payload = {
      'job_id': jobId,
      'status': status,
      'installer_key': installerKey,
      'notes': notes,
      'updated_at': new Date().toISOString()
    };
    
    var options = {
      'method': 'post',
      'contentType': 'application/json',
      'headers': {
        'Authorization': 'Bearer ' + SUPABASE_KEY,
        'apikey': SUPABASE_KEY
      },
      'payload': JSON.stringify(payload)
    };
    
    var response = UrlFetchApp.fetch(url, options);
    return { success: true, message: 'Status saved to Supabase' };
  } catch (error) {
    Logger.log('Error saving status to Supabase: ' + error.toString());
    return { success: false, message: error.toString() };
  }
}

function getInstallerInfoFromSupabase(installerKey) {
  try {
    var url = SUPABASE_URL + '/rest/v1/installers?installer_key=eq.' + installerKey + '&limit=1';
    var options = {
      'method': 'get',
      'headers': {
        'Authorization': 'Bearer ' + SUPABASE_KEY,
        'apikey': SUPABASE_KEY
      }
    };
    
    var response = UrlFetchApp.fetch(url, options);
    var data = JSON.parse(response.getContentText());
    return data.length > 0 ? data[0] : null;
  } catch (error) {
    Logger.log('Error getting installer info from Supabase: ' + error.toString());
    return null;
  }
}

// TEAMUP INTEGRATION (shared by both data sources)
// ====================

function getJobsFromTeamUp() {
  try {
    var cache = CacheService.getScriptCache();
    var cachedData = cache.get('teamup_jobs');
    
    if (cachedData != null) {
      return JSON.parse(cachedData);
    }
    
    var url = 'https://api.teamup.com/' + TEAMUP_CALENDAR_ID + '/events';
    var options = {
      'method': 'get',
      'headers': {
        'Teamup-Token': 'YOUR_TEAMUP_API_KEY_HERE' // Use the one from Code.gs
      }
    };
    
    var response = UrlFetchApp.fetch(url, options);
    var events = JSON.parse(response.getContentText());
    var jobs = mapTeamUpEventsToJobs(events.events);
    
    cache.put('teamup_jobs', JSON.stringify(jobs), CACHE_DURATION_MINUTES * 60);
    return jobs;
  } catch (error) {
    Logger.log('Error getting jobs from TeamUp: ' + error.toString());
    return [];
  }
}

// HELPER FUNCTIONS
// ====================

function shouldShowJobToInstaller(jobRow, installerKey, crewKeys) {
  var jobInstaller = jobRow[8]; // Assuming column 9 is installer assignment
  return jobInstaller === installerKey || crewKeys.includes(jobInstaller);
}

function mapGoogleRowToJob(row) {
  return {
    id: row[0],
    customerName: row[1],
    address: row[2],
    phone: row[3],
    email: row[4],
    jobType: row[5],
    status: row[6],
    priority: row[7],
    dueDate: row[8],
    technician: row[9],
    notes: row[10],
    materials: row[11] ? row[11].split(',') : [],
    accessNotes: row[12]
  };
}

function mapGoogleRowToInstaller(row) {
  return {
    installerKey: row[0],
    name: row[1],
    email: row[2],
    crewKeys: row[3] ? row[3].split(',') : []
  };
}

function mapTeamUpEventsToJobs(events) {
  return events.map(function(event) {
    return {
      id: event.id,
      customerName: extractCustomerFromTitle(event.title),
      address: event.location,
      jobType: 'Installation',
      status: mapTeamUpStatusToJobStatus(event),
      priority: 'Medium',
      dueDate: event.start_dt,
      technician: event.who ? event.who[0].name : 'Unassigned',
      notes: event.notes,
      materials: [],
      accessNotes: ''
    };
  });
}

function extractCustomerFromTitle(title) {
  // Extract customer name from TeamUp event title
  // Format: "Installation - Customer Name" or similar
  var parts = title.split('-');
  return parts.length > 1 ? parts[1].trim() : title;
}

function mapTeamUpStatusToJobStatus(event) {
  if (event.subcalendar_id) {
    // Map based on subcalendar or custom fields
    return 'Scheduled';
  }
  return 'Scheduled';
}
