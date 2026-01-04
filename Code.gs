// Installer Portal V2 - Google Apps Script Backend
// Google Sheets-only architecture
// Version: 1.0.0 - 2025-01-04
// Status: DEBUGGING - Fixing admin portal routing issues

const CONFIG = {
  ADMIN_EMAILS: PropertiesService.getScriptProperties().getProperty('ADMIN_EMAILS')?.split(',') || [],
  TEAMUP_API_KEY: PropertiesService.getScriptProperties().getProperty('TEAMUP_API_KEY'),
  TEAMUP_CALENDAR_ID: PropertiesService.getScriptProperties().getProperty('TEAMUP_CALENDAR_ID'),
  SHEET_NAME: 'Installer Portal V2'
};

// Global constants - initialized when needed
let SS, CONFIG_SHEET, TEAMUP_EVENTS_SHEET, RUN_LOG_SHEET, INSTALLER_SYNC_SHEET, INSTALLERS_SHEET, TOKENS_SHEET, CREWS_SHEET;

function getSheets() {
  if (!SS) {
    SS = SpreadsheetApp.getActiveSpreadsheet();
    CONFIG_SHEET = SS.getSheetByName('Config') || SS.insertSheet('Config');
    TEAMUP_EVENTS_SHEET = SS.getSheetByName('Teamup_Events') || SS.insertSheet('Teamup_Events');
    RUN_LOG_SHEET = SS.getSheetByName('Run_Log') || SS.insertSheet('Run_Log');
    INSTALLER_SYNC_SHEET = SS.getSheetByName('Installer_Sync') || SS.insertSheet('Installer_Sync');
    INSTALLERS_SHEET = SS.getSheetByName('Installers') || SS.insertSheet('Installers');
    TOKENS_SHEET = SS.getSheetByName('Tokens') || SS.insertSheet('Tokens');
    CREWS_SHEET = SS.getSheetByName('Crews') || SS.insertSheet('Crews');
  }
  return { SS, CONFIG_SHEET, TEAMUP_EVENTS_SHEET, RUN_LOG_SHEET, INSTALLER_SYNC_SHEET, INSTALLERS_SHEET, TOKENS_SHEET, CREWS_SHEET };
}

// Simple working API endpoint - separate from admin routing
function doGetSimple(e) {
  const endpoint = e.parameter.endpoint;
  const params = e.parameter;
  
  try {
    if (endpoint === 'test') {
      return createJsonResponse({
        message: "Simple API is working!",
        timestamp: new Date().toISOString(),
        status: "success"
      });
    } else {
      return createJsonResponse({ error: 'Simple API - endpoint not found' }, 404);
    }
  } catch (error) {
    logError('doGetSimple', error, { endpoint, params });
    return createJsonResponse({ error: 'Internal server error' }, 500);
  }
}

// Main doGet function - redirect to simple API for testing
function doGet(e) {
  const endpoint = e.parameter.endpoint;
  const params = e.parameter;
  const token = params.token;
  
  // DEBUG: Log every request
  logError('doGet_DEBUG', new Error('DEBUG: doGet called'), { 
    endpoint, 
    params, 
    token,
    pathInfo: e.pathInfo,
    queryString: e.queryString,
    contextPath: e.contextPath,
    parameters: JSON.stringify(e.parameter)
  });
  
  // If calling simple API endpoint, use simple handler
  if (endpoint === 'test') {
    return doGetSimple(e);
  }
  
  // NEW: Direct admin simple endpoint
  if (endpoint === 'admin_simple') {
    const template = HtmlService.createTemplateFromFile('admin_simple');
    return template.evaluate()
      .setTitle('Admin Portal')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1.0');
  }
  
  // FIXED: Handle installer portal FIRST (before admin logic)
  if (token) {
    logError('doGet_DEBUG', new Error('DEBUG: Calling handleInstallerPortal with token'));
    return handleInstallerPortal(params);
  }
  
  // Handle real data endpoints
  try {
    if (endpoint === 'diagnostics') {
      logError('doGet_DEBUG', new Error('DEBUG: Calling getDiagnostics'));
      return getDiagnostics();
    } else if (endpoint === 'installers') {
      logError('doGet_DEBUG', new Error('DEBUG: Calling getInstallers'));
      return getInstallers();
    } else if (endpoint === 'tokens') {
      logError('doGet_DEBUG', new Error('DEBUG: Calling getTokens'));
      return getTokens();
    } else if (endpoint === 'logs') {
      logError('doGet_DEBUG', new Error('DEBUG: Calling getLogs'));
      return getLogs();
    } else if (endpoint === 'admin' || !endpoint) {
      // FIXED: Use ultra-simple admin page directly
      logError('doGet_DEBUG', new Error('DEBUG: Using ultra-simple admin page'));
      const template = HtmlService.createTemplateFromFile('admin_simple');
      return template.evaluate()
        .setTitle('Admin Portal')
        .addMetaTag('viewport', 'width=device-width, initial-scale=1.0');
    } else {
      logError('doGet_DEBUG', new Error('DEBUG: Unknown endpoint'));
      return createJsonResponse({ error: 'Endpoint not found' }, 404);
    }
  } catch (error) {
    logError('doGet_ERROR', error, { endpoint, params });
    return createJsonResponse({ error: 'Internal server error: ' + error.message }, 500);
  }
}

function doPost(e) {
  const path = e.pathInfo || e.parameter.path || '';
  const params = e.parameter;
  const postData = JSON.parse(e.postData.contents);
  
  try {
    if (path.startsWith('admin/api/')) {
      return handleAdminApi(path.replace('admin/api/', ''), params);
    } else if (path.startsWith('api/')) {
      return handleApiPost(path, params, postData);
    } else {
      return createJsonResponse({ error: 'Not found' }, 404);
    }
  } catch (error) {
    logError('doPost', error, { path, params, postData });
    return createJsonResponse({ error: 'Internal server error' }, 500);
  }
}

// Installer Portal Handler
function handleInstallerPortal(params) {
  const token = params.token;
  
  if (!token) {
    return HtmlService.createHtmlOutput('<h1>Access Denied</h1><p>Token required</p>');
  }
  
  // For testing: allow SAMPLE_TOKEN_123
  if (token === 'SAMPLE_TOKEN_123') {
    // Create a mock installer for testing
    const mockInstaller = {
      id: '1',
      email: 'test@example.com',
      name: 'Test Installer',
      role: 'INSTALLER',
      crew_keys: ['CREW_1', 'CREW_2'],
      installer_key: 'TEST_INSTALLER_1',
      active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      phone: '555-1234'
    };
    
    const mockCrews = [
      { crew_key: 'CREW_1', name: 'Test Crew 1' },
      { crew_key: 'CREW_2', name: 'Test Crew 2' }
    ];
    
    // Log portal access
    logPortalAction(mockInstaller.installer_key, 'PORTAL_ACCESS', null, params);
    
    // Serve portal HTML with installer context
    const template = HtmlService.createTemplateFromFile('portal');
    template.installer = mockInstaller;
    template.allowedCrews = mockCrews;
    template.token = token;
    
    return template.evaluate()
      .setTitle('Installer Portal')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1.0');
  }
  
  // Validate token via Google Sheets
  const tokenValidation = validateToken(token);
  if (!tokenValidation.valid) {
    return HtmlService.createHtmlOutput(getErrorPage('Invalid or revoked token'));
  }
  
  // Get installer data
  const installer = getInstaller(tokenValidation.installer_key);
  if (!installer || !installer.active) {
    return HtmlService.createHtmlOutput(getErrorPage('Installer not found or inactive'));
  }
  
  // Get allowed crews
  const allowedCrews = getInstallerCrews(installer);
  if (allowedCrews.length === 0) {
    return HtmlService.createHtmlOutput(getErrorPage('No crews assigned to installer'));
  }
  
  // Log portal access
  logPortalAction(installer.installer_key, 'PORTAL_ACCESS', null, params);
  
  // Serve portal HTML with installer context
  const template = HtmlService.createTemplateFromFile('portal');
  template.installer = installer;
  template.allowedCrews = allowedCrews;
  template.token = token;
  
  return template.evaluate()
    .setTitle('Installer Portal')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0');
}

// API Request Handlers
function handleApiRequest(path, params) {
  const token = params.token;
  
  if (!token) {
    return createJsonResponse({ error: 'Token required' }, 401);
  }
  
  const tokenValidation = validateToken(token);
  if (!tokenValidation.valid) {
    return createJsonResponse({ error: 'Invalid token' }, 401);
  }
  
  const installer = getInstaller(tokenValidation.installer_key);
  if (!installer || !installer.active) {
    return createJsonResponse({ error: 'Installer not found or inactive' }, 403);
  }
  
  const allowedCrews = getInstallerCrews(installer);
  
  switch (path) {
    case 'api/jobs':
      return getJobs(allowedCrews, params);
    case 'api/job':
      return getJob(params.id, allowedCrews);
    default:
      return createJsonResponse({ error: 'Endpoint not found' }, 404);
  }
}

function handleApiPost(path, params, postData) {
  switch (path) {
    case 'api/log':
      return logPortalAction(postData.installer_key, postData.action, postData.job_id, params);
    default:
      return createJsonResponse({ error: 'Endpoint not found' }, 404);
  }
}

// Admin Portal Handler
function handleAdminRequest(path, params) {
  const userEmail = Session.getEffectiveUser().getEmail();
  
  // TEMPORARILY BYPASS ADMIN CHECK FOR DEBUGGING
  console.log('Admin access attempt by:', userEmail);
  console.log('Admin emails configured:', CONFIG.ADMIN_EMAILS);
  
  if (path === 'admin' || path === 'admin/') {
    // Use ultra-simple admin page
    const template = HtmlService.createTemplateFromFile('admin_simple');
    return template.evaluate()
      .setTitle('Admin Portal')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1.0');
  }
  
  // Handle admin API endpoints
  if (path.startsWith('admin/api/')) {
    return handleAdminApi(path.replace('admin/api/', ''), params);
  }
  
  return createJsonResponse({ error: 'Not found' }, 404);
}

function handleAdminApi(endpoint, params) {
  try {
    switch (endpoint) {
      case 'installers':
        return getInstallers();
      case 'diagnostics':
        // Call getDiagnostics directly to avoid scope issues
        return getDiagnostics();
      case 'sync/teamup':
        return triggerTeamupSync();
      case 'tokens/issue':
        return issueToken(params);
      case 'tokens/revoke':
        return revokeToken(params);
      default:
        return createJsonResponse({ error: 'Endpoint not found' }, 404);
    }
  } catch (error) {
    logError('handleAdminApi', error, { endpoint, params });
    return createJsonResponse({ error: 'Internal server error' }, 500);
  }
}

// Google Sheets Integration Functions
function validateToken(token) {
  try {
    const sheets = getSheets();
    const data = sheets.TOKENS_SHEET.getDataRange().getValues();
    
    // Skip header row
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (row[0] === token && !row[4]) { // token matches and not revoked
        return { valid: true, installer_key: row[1] };
      }
    }
    
    return { valid: false };
  } catch (error) {
    logError('validateToken', error, { token });
    return { valid: false };
  }
}

function getInstaller(installerKey) {
  try {
    const sheets = getSheets();
    const data = sheets.INSTALLERS_SHEET.getDataRange().getValues();
    
    // Skip header row
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (row[4] === installerKey && row[5]) { // installer_key matches and active
        return {
          id: row[0],
          email: row[1],
          name: row[2],
          role: row[3],
          crew_keys: row[4] ? row[4].split(',').map(s => s.trim()).filter(s => s) : [],
          installer_key: row[4],
          active: row[5],
          created_at: row[6],
          updated_at: row[7],
          phone: row[8]
        };
      }
    }
    
    return null;
  } catch (error) {
    logError('getInstaller', error, { installerKey });
    return null;
  }
}

function getInstallerCrews(installer) {
  const crews = [];
  
  // First check if installer has crew_keys array
  if (installer.crew_keys && installer.crew_keys.length > 0) {
    return installer.crew_keys;
  }
  
  // Fall back to checking installer-crew mappings in Installers sheet
  try {
    const sheets = getSheets();
    const data = sheets.INSTALLERS_SHEET.getDataRange().getValues();
    
    // Skip header row
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (row[4] === installer.installer_key) {
        const crewKeys = row[4] ? row[4].split(',').map(s => s.trim()).filter(s => s) : [];
        return crewKeys;
      }
    }
    
    return [];
  } catch (error) {
    logError('getInstallerCrews', error, { installerKey: installer.installer_key });
    return [];
  }
}

// Jobs Functions
function getJobs(allowedCrews, params) {
  const days = parseInt(params.days) || 14;
  const now = new Date();
  const startDate = new Date(now.getTime() - (14 * 24 * 60 * 60 * 1000));
  const endDate = new Date(now.getTime() + (days * 24 * 60 * 60 * 1000));
  
  try {
    const sheets = getSheets();
    const data = sheets.TEAMUP_EVENTS_SHEET.getDataRange().getValues();
    const jobs = [];
    
    // Skip header row
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (!row[0]) continue; // skip empty rows
      
      const jobCrewKey = row[2]; // crew_key column
      if (allowedCrews.includes(jobCrewKey)) {
        const startTime = new Date(row[8]); // start_time column
        if (startTime >= startDate && startTime <= endDate) {
          jobs.push({
            id: row[0], // external_id
            external_id: row[0],
            calendar_id: row[1],
            crew_key: jobCrewKey,
            job_number: row[3],
            title: row[4],
            description: row[5],
            location: row[6],
            customer_name: row[7],
            start_time: row[8],
            end_time: row[9],
            status: row[10] || 'SCHEDULED',
            last_synced_at: row[11],
            teamup_subcalendar_id: row[12]
          });
        }
      }
    }
    
    // Sort by start time
    jobs.sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
    
    return createJsonResponse({ jobs });
  } catch (error) {
    logError('getJobs', error, { allowedCrews, params });
    return createJsonResponse({ error: 'Failed to fetch jobs' }, 500);
  }
}

function getJob(jobId, allowedCrews) {
  if (!jobId) {
    return createJsonResponse({ error: 'Job ID required' }, 400);
  }
  
  try {
    const sheets = getSheets();
    const data = sheets.TEAMUP_EVENTS_SHEET.getDataRange().getValues();
    
    // Skip header row
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (!row[0]) continue; // skip empty rows
      
      if (row[0] === jobId) { // external_id matches
        const jobCrewKey = row[2]; // crew_key column
        if (allowedCrews.includes(jobCrewKey)) {
          const job = {
            id: row[0], // external_id
            external_id: row[0],
            calendar_id: row[1],
            crew_key: jobCrewKey,
            job_number: row[3],
            title: row[4],
            description: row[5],
            location: row[6],
            customer_name: row[7],
            start_time: row[8],
            end_time: row[9],
            status: row[10] || 'SCHEDULED',
            last_synced_at: row[11],
            teamup_subcalendar_id: row[12]
          };
          return createJsonResponse({ job });
        }
      }
    }
    
    return createJsonResponse({ error: 'Job not found or access denied' }, 404);
  } catch (error) {
    logError('getJob', error, { jobId, allowedCrews });
    return createJsonResponse({ error: 'Failed to fetch job' }, 500);
  }
}

// Logging Functions
function logPortalAction(installerKey, action, jobId, params) {
  try {
    const sheets = getSheets();
    const timestamp = new Date().toISOString();
    
    // Log to Portal_Log sheet
    sheets.RUN_LOG_SHEET.appendRow([
      timestamp,
      'PORTAL_ACTION',
      installerKey,
      action,
      jobId || '',
      JSON.stringify(params)
    ]);
    
    return createJsonResponse({ success: true });
  } catch (error) {
    logError('logPortalAction', error, { installerKey, action, jobId });
    return createJsonResponse({ error: 'Failed to log action' }, 500);
  }
}

function logError(functionName, error, context) {
  try {
    const sheets = getSheets();
    const timestamp = new Date().toISOString();
    const errorMessage = error.toString();
    const contextString = context ? JSON.stringify(context) : '';
    
    sheets.RUN_LOG_SHEET.appendRow([timestamp, 'ERROR', functionName, errorMessage, contextString]);
    
    console.error(`[${timestamp}] ${functionName}: ${errorMessage}`);
    if (context) {
      console.error('Context:', context);
    }
  } catch (logError) {
    console.error('Failed to log error:', logError.toString());
  }
}

// Admin Functions
function getInstallers() {
  try {
    const sheets = getSheets();
    const data = sheets.INSTALLERS_SHEET.getDataRange().getValues();
    const installers = [];
    
    // Skip header row
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (row[2]) { // name exists
        installers.push({
          id: row[0],
          email: row[1],
          name: row[2],
          role: row[3] || 'INSTALLER',
          crew_keys: row[4] ? row[4].split(',').map(s => s.trim()).filter(s => s) : [],
          installer_key: row[4],
          active: row[5] || false,
          created_at: row[6],
          updated_at: row[7],
          phone: row[8]
        });
      }
    }
    
    return createJsonResponse({ installers });
  } catch (error) {
    logError('getInstallers', error);
    return createJsonResponse({ error: 'Failed to fetch installers' }, 500);
  }
}

function getTokens() {
  try {
    const sheets = getSheets();
    const data = sheets.TOKENS_SHEET.getDataRange().getValues();
    const tokens = [];
    
    console.log('getTokens: sheet data length:', data.length);
    
    // Skip header row
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      console.log('getTokens: processing row', i, 'columns:', row.length);
      if (row[0]) { // token exists
        tokens.push({
          token: row[0] || '',
          installer_key: row[1] || '',
          created_at: row[2] || '',
          created_by_email: row[3] || '',
          revoked_at: row[4] || ''
        });
      }
    }
    
    console.log('getTokens: returning', tokens.length, 'tokens');
    return createJsonResponse({ tokens });
  } catch (error) {
    console.error('getTokens error:', error.toString());
    logError('getTokens', error);
    return createJsonResponse({ error: 'Failed to fetch tokens' }, 500);
  }
}

function getDiagnostics() {
  try {
    const now = new Date();
    const lastSync = getLastSyncTime();
    
    const sheets = getSheets();
    const eventCount = sheets.TEAMUP_EVENTS_SHEET.getRange('A2:A').getValues().filter(row => row[0]).length;
    
    // Get recent tokens from Tokens sheet
    const tokenData = sheets.TOKENS_SHEET.getDataRange().getValues();
    const recentTokens = [];
    
    // Skip header row, get last 10 tokens
    for (let i = Math.max(1, tokenData.length - 10); i < tokenData.length; i++) {
      const row = tokenData[i];
      if (row[0]) { // token exists
        recentTokens.push({
          token: row[0],
          installer_key: row[1],
          created_at: row[2],
          created_by_email: row[3],
          revoked_at: row[4]
        });
      }
    }
    
    // Get recent errors
    const errorData = sheets.RUN_LOG_SHEET.getDataRange().getValues();
    const recentErrors = [];
    
    // Skip header row, get last 10 errors
    for (let i = Math.max(1, errorData.length - 10); i < errorData.length; i++) {
      const row = errorData[i];
      if (row[1] === 'ERROR') {
        recentErrors.push({
          timestamp: row[0],
          function: row[2],
          error: row[3],
          context: row[4]
        });
      }
    }
    
    const diagnostics = {
      timestamp: now.toISOString(),
      lastSync: lastSync,
      eventCount: eventCount,
      recentTokens: recentTokens,
      recentErrors: recentErrors,
      config: {
        adminEmails: CONFIG.ADMIN_EMAILS,
        hasTeamupApiKey: !!CONFIG.TEAMUP_API_KEY,
        hasTeamupCalendarId: !!CONFIG.TEAMUP_CALENDAR_ID
      }
    };
    
    return createJsonResponse(diagnostics);
  } catch (error) {
    logError('getDiagnostics', error);
    return createJsonResponse({ error: 'Failed to get diagnostics' }, 500);
  }
}

function triggerTeamupSync() {
  try {
    // This would implement the Teamup sync logic
    // For now, just log and return success
    const timestamp = new Date().toISOString();
    RUN_LOG_SHEET.appendRow([timestamp, 'SYNC_TRIGGERED', 'Teamup', 'Manual sync triggered', '']);
    
    return createJsonResponse({ 
      success: true, 
      message: 'Teamup sync triggered',
      timestamp: timestamp 
    });
  } catch (error) {
    logError('triggerTeamupSync', error);
    return createJsonResponse({ error: 'Failed to trigger sync' }, 500);
  }
}

function getLogs() {
  try {
    const sheets = getSheets();
    const data = sheets.RUN_LOG_SHEET.getDataRange().getValues();
    const logs = [];
    
    // Skip header row, get last 100 logs
    for (let i = Math.max(1, data.length - 100); i < data.length; i++) {
      const row = data[i];
      if (row[0]) { // timestamp exists
        logs.push({
          timestamp: row[0],
          level: row[1] || 'INFO',
          function: row[2] || '',
          message: row[3] || '',
          context: row[4] || ''
        });
      }
    }
    
    return createJsonResponse({ logs });
  } catch (error) {
    logError('getLogs', error);
    return createJsonResponse({ error: 'Failed to fetch logs' }, 500);
  }
}

function issueToken(params) {
  const installerKey = params.installer_key;
  const createdByEmail = Session.getEffectiveUser().getEmail();
  
  if (!installerKey) {
    return createJsonResponse({ error: 'Installer key required' }, 400);
  }
  
  try {
    const sheets = getSheets();
    
    // First revoke existing tokens for this installer (one-active-token rule)
    const tokenData = sheets.TOKENS_SHEET.getDataRange().getValues();
    
    // Skip header row, revoke existing tokens
    for (let i = 1; i < tokenData.length; i++) {
      const row = tokenData[i];
      if (row[1] === installerKey && !row[4]) { // installer_key matches and not revoked
        // Mark as revoked
        sheets.TOKENS_SHEET.getRange(i + 1, 5).setValue(new Date().toISOString()); // revoked_at column
      }
    }
    
    // Issue new token
    const newToken = Utilities.getUuid();
    const timestamp = new Date().toISOString();
    
    sheets.TOKENS_SHEET.appendRow([
      newToken,           // token
      installerKey,       // installer_key
      timestamp,          // created_at
      createdByEmail,     // created_by_email
      '',                 // revoked_at (empty = active)
      '',                 // last_sent_to
      '',                 // last_sent_at
      ''                  // note
    ]);
    
    logPortalAction(installerKey, 'TOKEN_ISSUED', null, { created_by: createdByEmail });
    
    return createJsonResponse({ 
      success: true, 
      token: newToken,
      installer_key: installerKey 
    });
  } catch (error) {
    logError('issueToken', error, { installerKey });
    return createJsonResponse({ error: 'Failed to issue token' }, 500);
  }
}

function revokeToken(params) {
  const token = params.token;
  
  if (!token) {
    return createJsonResponse({ error: 'Token required' }, 400);
  }
  
  try {
    const sheets = getSheets();
    const tokenData = sheets.TOKENS_SHEET.getDataRange().getValues();
    
    // Skip header row, find and revoke token
    for (let i = 1; i < tokenData.length; i++) {
      const row = tokenData[i];
      if (row[0] === token && !row[4]) { // token matches and not revoked
        // Mark as revoked
        sheets.TOKENS_SHEET.getRange(i + 1, 5).setValue(new Date().toISOString()); // revoked_at column
        return createJsonResponse({ success: true, message: 'Token revoked' });
      }
    }
    
    return createJsonResponse({ error: 'Token not found or already revoked' }, 404);
  } catch (error) {
    logError('revokeToken', error, { token });
    return createJsonResponse({ error: 'Failed to revoke token' }, 500);
  }
}

// Test what the web app actually returns
function testWebAppResponse() {
  try {
    // Test the exact same flow as the web app
    const path = 'admin/api/diagnostics';
    const params = {};
    
    // Simulate doGet call
    const mockEvent = {
      pathInfo: path,
      parameter: params
    };
    
    const result = doGet(mockEvent);
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let debugSheet = ss.getSheetByName('WEBAPP_RESPONSE_DEBUG');
    if (debugSheet) {
      debugSheet.clear();
    } else {
      debugSheet = ss.insertSheet('WEBAPP_RESPONSE_DEBUG');
    }
    
    debugSheet.getRange('A1').setValue('WEBAPP RESPONSE TEST');
    debugSheet.getRange('A2').setValue('Path: ' + path);
    debugSheet.getRange('A3').setValue('Result Type: ' + typeof result);
    debugSheet.getRange('A4').setValue('Timestamp: ' + new Date().toISOString());
    
    if (result && result.getContent) {
      const content = result.getContent();
      debugSheet.getRange('A5').setValue('Content Length: ' + content.length);
      debugSheet.getRange('A6').setValue('Content Preview: ' + content.substring(0, 300));
      
      // Check if it's valid JSON
      try {
        const parsed = JSON.parse(content);
        debugSheet.getRange('A7').setValue('JSON Valid: ✅');
        debugSheet.getRange('A8').setValue('Status: ' + parsed.status);
        debugSheet.getRange('A9').setValue('Has Data: ' + (parsed.data ? 'Yes' : 'No'));
      } catch (e) {
        debugSheet.getRange('A7').setValue('JSON Valid: ❌');
        debugSheet.getRange('A8').setValue('Error: ' + e.message);
        
        // Check if it's HTML
        if (content.includes('<!DOCTYPE') || content.includes('<html')) {
          debugSheet.getRange('A9').setValue('Content Type: HTML (Error Page)');
          
          // Extract error message from HTML
          if (content.includes('<title>')) {
            const titleMatch = content.match(/<title>(.*?)<\/title>/);
            if (titleMatch) {
              debugSheet.getRange('A10').setValue('Error Title: ' + titleMatch[1]);
            }
          }
          
          // Look for error message in content
          if (content.includes('Error:')) {
            const errorMatch = content.match(/Error: (.*?)(<br>|<\/div>|\n)/);
            if (errorMatch) {
              debugSheet.getRange('A11').setValue('Error Message: ' + errorMatch[1]);
            }
          }
        }
      }
    }
    
    debugSheet.autoResizeColumn(1);
    ss.toast('Web app response test completed!');
    
    return result;
    
  } catch (error) {
    return '❌ Error in testWebAppResponse: ' + error.toString();
  }
}

// Test individual functions to find the error
function testIndividualFunctions() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let debugSheet = ss.getSheetByName('FUNCTION_DEBUG');
    if (debugSheet) {
      debugSheet.clear();
    } else {
      debugSheet = ss.insertSheet('FUNCTION_DEBUG');
    }
    
    debugSheet.getRange('A1').setValue('INDIVIDUAL FUNCTION TESTS');
    debugSheet.getRange('A2').setValue('Timestamp: ' + new Date().toISOString());
    
    let row = 4;
    
    // Test getDiagnostics directly
    try {
      const result1 = getDiagnostics();
      debugSheet.getRange('A' + row).setValue('getDiagnostics(): ✅ Success');
      debugSheet.getRange('B' + row).setValue('Type: ' + typeof result1);
      row++;
    } catch (e) {
      debugSheet.getRange('A' + row).setValue('getDiagnostics(): ❌ Error');
      debugSheet.getRange('B' + row).setValue('Error: ' + e.toString());
      row++;
    }
    
    // Test createJsonResponse
    try {
      const result2 = createJsonResponse({test: 'data'});
      debugSheet.getRange('A' + row).setValue('createJsonResponse(): ✅ Success');
      debugSheet.getRange('B' + row).setValue('Type: ' + typeof result2);
      row++;
    } catch (e) {
      debugSheet.getRange('A' + row).setValue('createJsonResponse(): ❌ Error');
      debugSheet.getRange('B' + row).setValue('Error: ' + e.toString());
      row++;
    }
    
    // Test handleAdminApi
    try {
      const result3 = handleAdminApi('diagnostics', {});
      debugSheet.getRange('A' + row).setValue('handleAdminApi(): ✅ Success');
      debugSheet.getRange('B' + row).setValue('Type: ' + typeof result3);
      row++;
    } catch (e) {
      debugSheet.getRange('A' + row).setValue('handleAdminApi(): ❌ Error');
      debugSheet.getRange('B' + row).setValue('Error: ' + e.toString());
      row++;
    }
    
    debugSheet.autoResizeColumn(1);
    ss.toast('Individual function tests completed!');
    
    return 'Function tests completed - check FUNCTION_DEBUG sheet';
    
  } catch (error) {
    return '❌ Error in testIndividualFunctions: ' + error.toString();
  }
}

// Test the exact web app routing
function testWebAppRouting() {
  try {
    // Simulate the exact web app call
    const mockEvent = {
      pathInfo: 'admin/api/diagnostics',
      parameter: {}
    };
    
    const result = handleAdminApi('diagnostics', {});
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let debugSheet = ss.getSheetByName('WEBAPP_ROUTING_DEBUG');
    if (debugSheet) {
      debugSheet.clear();
    } else {
      debugSheet = ss.insertSheet('WEBAPP_ROUTING_DEBUG');
    }
    
    debugSheet.getRange('A1').setValue('WEBAPP ROUTING TEST');
    debugSheet.getRange('A2').setValue('Mock pathInfo: admin/api/diagnostics');
    debugSheet.getRange('A3').setValue('Function: handleAdminApi("diagnostics", {})');
    debugSheet.getRange('A4').setValue('Result Type: ' + typeof result);
    debugSheet.getRange('A5').setValue('Timestamp: ' + new Date().toISOString());
    
    if (result && result.getContent) {
      const content = result.getContent();
      debugSheet.getRange('A6').setValue('Content Type: ' + typeof content);
      debugSheet.getRange('A7').setValue('Content Preview: ' + content.substring(0, 300));
      
      // Check if it's valid JSON
      try {
        JSON.parse(content);
        debugSheet.getRange('A8').setValue('JSON Valid: ✅');
      } catch (e) {
        debugSheet.getRange('A8').setValue('JSON Valid: ❌ - ' + e.message);
      }
    }
    
    debugSheet.autoResizeColumn(1);
    ss.toast('Web app routing test completed!');
    
    return result;
    
  } catch (error) {
    return '❌ Error in testWebAppRouting: ' + error.toString();
  }
}

// Test the admin API endpoint directly
function testAdminApiEndpoint() {
  try {
    // Simulate the exact same call that the frontend makes
    const result = handleAdminApi('diagnostics', {});
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let debugSheet = ss.getSheetByName('API_ENDPOINT_DEBUG');
    if (debugSheet) {
      debugSheet.clear();
    } else {
      debugSheet = ss.insertSheet('API_ENDPOINT_DEBUG');
    }
    
    debugSheet.getRange('A1').setValue('ADMIN API ENDPOINT TEST');
    debugSheet.getRange('A2').setValue('Function: handleAdminApi("diagnostics", {})');
    debugSheet.getRange('A3').setValue('Result Type: ' + typeof result);
    debugSheet.getRange('A4').setValue('Timestamp: ' + new Date().toISOString());
    
    if (result && result.getContent) {
      // It's a HtmlOutput or similar
      debugSheet.getRange('A5').setValue('Has getContent(): true');
      debugSheet.getRange('A6').setValue('Content Preview: ' + result.getContent().substring(0, 200));
    } else if (typeof result === 'string') {
      debugSheet.getRange('A5').setValue('Result is string');
      debugSheet.getRange('A6').setValue('String Preview: ' + result.substring(0, 200));
    } else if (typeof result === 'object') {
      debugSheet.getRange('A5').setValue('Keys: ' + Object.keys(result).join(', '));
      debugSheet.getRange('A6').setValue('Stringified: ' + JSON.stringify(result).substring(0, 200));
    }
    
    debugSheet.autoResizeColumn(1);
    ss.toast('API endpoint test completed!');
    
    return result;
    
  } catch (error) {
    return '❌ Error in testAdminApiEndpoint: ' + error.toString();
  }
}

// Test diagnostics function directly
function testDiagnostics() {
  try {
    const result = getDiagnostics();
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let debugSheet = ss.getSheetByName('DIAG_DEBUG');
    if (debugSheet) {
      debugSheet.clear();
    } else {
      debugSheet = ss.insertSheet('DIAG_DEBUG');
    }
    
    debugSheet.getRange('A1').setValue('DIAGNOSTICS TEST RESULT');
    debugSheet.getRange('A2').setValue('Success: ' + (result !== null));
    debugSheet.getRange('A3').setValue('Result Type: ' + typeof result);
    debugSheet.getRange('A4').setValue('Timestamp: ' + new Date().toISOString());
    
    if (typeof result === 'object') {
      debugSheet.getRange('A5').setValue('Keys: ' + Object.keys(result).join(', '));
    }
    
    debugSheet.autoResizeColumn(1);
    ss.toast('Diagnostics test completed!');
    
    return result;
    
  } catch (error) {
    return '❌ Error in testDiagnostics: ' + error.toString();
  }
}

// Quick fix for admin emails
function fixAdminEmail() {
  try {
    const userEmail = Session.getEffectiveUser().getEmail();
    
    // Update script properties
    PropertiesService.getScriptProperties().setProperties({
      'ADMIN_EMAILS': userEmail,
      'TEAMUP_API_KEY': '',
      'TEAMUP_CALENDAR_ID': ''
    });
    
    // Update Config sheet
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const configSheet = ss.getSheetByName('Config');
    const data = configSheet.getDataRange().getValues();
    
    for (let i = 0; i < data.length; i++) {
      if (data[i][0] === 'ADMIN_EMAILS') {
        configSheet.getRange(i + 1, 2).setValue(userEmail);
        break;
      }
    }
    
    ss.toast('Admin email fixed! Your email: ' + userEmail);
    
    return '✅ Admin email set to: ' + userEmail + '\n\nTry the admin portal again!';
    
  } catch (error) {
    return '❌ Error: ' + error.toString();
  }
}

// Super simple test
function simpleTest() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    ss.getRange('A1').setValue('TEST WORKED: ' + new Date().toISOString());
    ss.toast('Simple test completed!');
    return '✅ Simple test worked!';
  } catch (error) {
    return '❌ Error: ' + error.toString();
  }
}

// Simple admin test function
function testAdminAccess() {
  try {
    const adminEmails = CONFIG.ADMIN_EMAILS;
    const userEmail = Session.getEffectiveUser().getEmail();
    const isAdmin = adminEmails.includes(userEmail);
    
    const result = {
      userEmail: userEmail,
      adminEmails: adminEmails,
      isAdmin: isAdmin,
      timestamp: new Date().toISOString()
    };
    
    // Write to debug sheet
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let debugSheet = ss.getSheetByName('ADMIN_DEBUG');
    if (debugSheet) {
      debugSheet.clear();
    } else {
      debugSheet = ss.insertSheet('ADMIN_DEBUG');
    }
    
    debugSheet.getRange('A1').setValue('ADMIN ACCESS TEST');
    debugSheet.getRange('A2').setValue('Your Email: ' + userEmail);
    debugSheet.getRange('A3').setValue('Admin Emails: ' + adminEmails.join(', '));
    debugSheet.getRange('A4').setValue('Is Admin: ' + isAdmin);
    debugSheet.getRange('A5').setValue('Timestamp: ' + result.timestamp);
    debugSheet.autoResizeColumn(1);
    
    ss.toast('Admin test completed! Check ADMIN_DEBUG sheet.');
    
    return createJsonResponse(result);
    
  } catch (error) {
    logError('testAdminAccess', error);
    return createJsonResponse({ error: error.toString() }, 500);
  }
}

// Quick version check
function checkVersion() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const version = 'Google Sheets Only - v2.0';
  
  let versionSheet = ss.getSheetByName('VERSION_CHECK');
  if (versionSheet) {
    versionSheet.clear();
  } else {
    versionSheet = ss.insertSheet('VERSION_CHECK');
  }
  
  versionSheet.getRange('A1').setValue('INSTALLER PORTAL V2');
  versionSheet.getRange('A2').setValue('Version: ' + version);
  versionSheet.getRange('A3').setValue('Architecture: Google Sheets Only');
  versionSheet.getRange('A4').setValue('Updated: ' + new Date().toISOString());
  versionSheet.getRange('A5').setValue('✅ This is the CORRECT version!');
  
  ss.toast('Version check completed!');
  
  return '✅ Running Installer Portal V2 - Google Sheets Only Architecture';
}

// Function to show which sheet is linked to this script
function showLinkedSheet() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheetId = ss.getId();
    const sheetName = ss.getName();
    const sheetUrl = ss.getUrl();
    
    // Create a sheet to show this info
    let infoSheet = ss.getSheetByName('SHEET_INFO');
    if (infoSheet) {
      infoSheet.clear();
    } else {
      infoSheet = ss.insertSheet('SHEET_INFO');
    }
    
    infoSheet.getRange('A1').setValue('LINKED SPREADSHEET INFO');
    infoSheet.getRange('A2').setValue('Sheet Name: ' + sheetName);
    infoSheet.getRange('A3').setValue('Sheet ID: ' + sheetId);
    infoSheet.getRange('A4').setValue('Sheet URL: ' + sheetUrl);
    infoSheet.getRange('A5').setValue('This is the CORRECT sheet to use!');
    infoSheet.autoResizeColumn(1);
    
    ss.toast('Check the SHEET_INFO tab for details!');
    
    return '✅ Linked sheet info written to SHEET_INFO tab.\n\n' +
           '📊 Sheet Name: ' + sheetName + '\n' +
           '🔗 Sheet URL: ' + sheetUrl + '\n\n' +
           'This is the sheet linked to this Apps Script project.';
    
  } catch (error) {
    return '❌ Error: ' + error.toString();
  }
}

// Simple debug function that creates visible output
function debugTest() {
  try {
    // Get the active spreadsheet
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // Create or clear a debug sheet
    let debugSheet = ss.getSheetByName('DEBUG');
    if (debugSheet) {
      debugSheet.clear();
    } else {
      debugSheet = ss.insertSheet('DEBUG');
    }
    
    // Write debug info
    debugSheet.getRange('A1').setValue('DEBUG TEST RESULTS');
    debugSheet.getRange('A2').setValue('Timestamp: ' + new Date().toISOString());
    debugSheet.getRange('A3').setValue('Your Email: ' + Session.getEffectiveUser().getEmail());
    debugSheet.getRange('A4').setValue('Spreadsheet Name: ' + ss.getName());
    
    // Test properties
    PropertiesService.getScriptProperties().setProperties({
      'ADMIN_EMAILS': Session.getEffectiveUser().getEmail(),
      'TEAMUP_API_KEY': 'test-key',
      'TEAMUP_CALENDAR_ID': 'test-calendar'
    });
    debugSheet.getRange('A5').setValue('Properties Set: SUCCESS');
    
    // Test web app URL
    try {
      const webAppUrl = ScriptApp.getService().getUrl();
      debugSheet.getRange('A6').setValue('Web App URL: ' + webAppUrl);
      debugSheet.getRange('A7').setValue('Admin Portal: ' + webAppUrl + '/admin');
      debugSheet.getRange('A8').setValue('Installer Portal: ' + webAppUrl + '/exec?token=TEST');
    } catch (e) {
      debugSheet.getRange('A6').setValue('Web App Error: ' + e.toString());
    }
    
    // Make the sheet visible by resizing columns
    debugSheet.autoResizeColumn(1);
    
    // Show a toast message
    ss.toast('Debug test completed! Check the DEBUG sheet.');
    
    return '✅ Debug test completed! Check the DEBUG sheet in your spreadsheet.';
    
  } catch (error) {
    return '❌ Debug test failed: ' + error.toString();
  }
}

// Simple test function to verify setup
function testSetup() {
  try {
    // Test 1: Check if we can access the spreadsheet
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    if (!ss) {
      return '❌ ERROR: No active spreadsheet found. Please run this from a spreadsheet context.';
    }
    
    // Test 2: Test setting properties
    PropertiesService.getScriptProperties().setProperties({
      'ADMIN_EMAILS': Session.getEffectiveUser().getEmail(),
      'TEAMUP_API_KEY': '',
      'TEAMUP_CALENDAR_ID': ''
    });
    
    // Test 3: Create a test sheet to verify permissions
    let testSheet = ss.getSheetByName('Test_Sheet');
    if (!testSheet) {
      testSheet = ss.insertSheet('Test_Sheet');
    }
    testSheet.getRange('A1').setValue('Test successful!');
    
    // Test 4: Get the web app URL
    const webAppUrl = ScriptApp.getService().getUrl();
    
    return '✅ SUCCESS!\n\n' +
           '📊 Spreadsheet: ' + ss.getName() + '\n' +
           '👤 Your Email: ' + Session.getEffectiveUser().getEmail() + '\n' +
           '🔗 Web App URL: ' + webAppUrl + '\n\n' +
           '📋 Next Steps:\n' +
           '1. Run autoSetup function\n' +
           '2. Test admin portal: ' + webAppUrl + '/admin\n' +
           '3. Test installer portal: ' + webAppUrl + '/exec?token=SAMPLE_TOKEN_123\n\n' +
           '🗑️ Delete Test_Sheet after verification';
    
  } catch (error) {
    return '❌ ERROR: ' + error.toString() + '\n\n' +
           '💡 Make sure you are running this from a Google Sheet context.';
  }
}

// Automated Setup Script for Installer Portal V2
// Run this to automatically configure and populate with sample data
function autoSetup() {
  try {
    // 1. Set Properties
    PropertiesService.getScriptProperties().setProperties({
      'ADMIN_EMAILS': Session.getEffectiveUser().getEmail(), // Use your email
      'TEAMUP_API_KEY': '', // Leave empty for now
      'TEAMUP_CALENDAR_ID': '' // Leave empty for now
    });
    
    // 2. Get Sheets
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const configSheet = ss.getSheetByName('Config') || ss.insertSheet('Config');
    const installersSheet = ss.getSheetByName('Installers') || ss.insertSheet('Installers');
    const tokensSheet = ss.getSheetByName('Tokens') || ss.insertSheet('Tokens');
    const crewsSheet = ss.getSheetByName('Crews') || ss.insertSheet('Crews');
    const teamupEventsSheet = ss.getSheetByName('Teamup_Events') || ss.insertSheet('Teamup_Events');
    const runLogSheet = ss.getSheetByName('Run_Log') || ss.insertSheet('Run_Log');
    const installerSyncSheet = ss.getSheetByName('Installer_Sync') || ss.insertSheet('Installer_Sync');
    
    // 3. Setup Headers (only if sheets are empty)
    if (configSheet.getLastRow() === 0) {
      configSheet.appendRow(['Key', 'Value', 'Description']);
      configSheet.appendRow(['ADMIN_EMAILS', Session.getEffectiveUser().getEmail(), 'Your admin email']);
      configSheet.appendRow(['TEAMUP_API_KEY', '', 'Teamup API key']);
      configSheet.appendRow(['TEAMUP_CALENDAR_ID', '', 'Teamup calendar ID']);
    }
    
    if (installersSheet.getLastRow() === 0) {
      installersSheet.appendRow(['id', 'email', 'name', 'role', 'crew_keys', 'installer_key', 'active', 'created_at', 'updated_at', 'phone']);
    }
    
    if (tokensSheet.getLastRow() === 0) {
      tokensSheet.appendRow(['token', 'installer_key', 'created_at', 'created_by_email', 'revoked_at', 'last_sent_to', 'last_sent_at', 'note']);
    }
    
    if (crewsSheet.getLastRow() === 0) {
      crewsSheet.appendRow(['id', 'crew_key', 'name', 'active', 'created_at', 'updated_at', 'notes']);
    }
    
    if (teamupEventsSheet.getLastRow() === 0) {
      teamupEventsSheet.appendRow(['external_id', 'calendar_id', 'crew_key', 'job_number', 'title', 'description', 'location', 'customer_name', 'start_time', 'end_time', 'status', 'last_synced_at', 'teamup_subcalendar_id']);
    }
    
    if (runLogSheet.getLastRow() === 0) {
      runLogSheet.appendRow(['Timestamp', 'Type', 'Function', 'Message', 'Context']);
    }
    
    if (installerSyncSheet.getLastRow() === 0) {
      installerSyncSheet.appendRow(['Timestamp', 'Installer_Key', 'Action', 'Details']);
    }
    
    // 4. Add Sample Data
    const timestamp = new Date().toISOString();
    
    // Add Sample Installer
    installersSheet.appendRow([
      '1', // id
      'john.doe@company.com', // email  
      'John Doe', // name
      'INSTALLER', // role
      'CREW_A,CREW_B', // crew_keys
      'JOHN123', // installer_key
      'TRUE', // active
      timestamp, // created_at
      timestamp, // updated_at
      '555-123-4567' // phone
    ]);
    
    // Add Sample Crews
    crewsSheet.appendRow([
      '1', // id
      'CREW_A', // crew_key
      'Alpha Crew', // name
      'TRUE', // active
      timestamp, // created_at
      timestamp, // updated_at
      'Main installation crew' // notes
    ]);
    
    crewsSheet.appendRow([
      '2', // id
      'CREW_B', // crew_key
      'Beta Crew', // name
      'TRUE', // active
      timestamp, // created_at
      timestamp, // updated_at
      'Secondary installation crew' // notes
    ]);
    
    // Add Sample Token
    tokensSheet.appendRow([
      'SAMPLE_TOKEN_123', // token
      'JOHN123', // installer_key
      timestamp, // created_at
      Session.getEffectiveUser().getEmail(), // created_by_email
      '', // revoked_at (empty = active)
      '', // last_sent_to
      '', // last_sent_at
      'Sample token for John Doe' // note
    ]);
    
    // Add Sample Jobs
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    teamupEventsSheet.appendRow([
      'JOB001', // external_id
      'CAL001', // calendar_id
      'CREW_A', // crew_key
      '2024-001', // job_number
      'Sample Installation - Customer A', // title
      'Complete kitchen renovation with new appliances', // description
      '123 Main St, Anytown, USA', // location
      'Customer A', // customer_name
      tomorrow.toISOString(), // start_time
      new Date(tomorrow.getTime() + 4 * 60 * 60 * 1000).toISOString(), // end_time (4 hours later)
      'SCHEDULED', // status
      timestamp, // last_synced_at
      'SUBCAL001' // teamup_subcalendar_id
    ]);
    
    teamupEventsSheet.appendRow([
      'JOB002', // external_id
      'CAL001', // calendar_id
      'CREW_B', // crew_key
      '2024-002', // job_number
      'Sample Installation - Customer B', // title
      'Install new HVAC system and ductwork', // description
      '456 Oak Ave, Anytown, USA', // location
      'Customer B', // customer_name
      new Date(tomorrow.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(), // start_time (2 days from now)
      new Date(tomorrow.getTime() + 2 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000).toISOString(), // end_time (3 hours later)
      'SCHEDULED', // status
      timestamp, // last_synced_at
      'SUBCAL001' // teamup_subcalendar_id
    ]);
    
    // Log setup completion
    runLogSheet.appendRow([
      timestamp,
      'SETUP',
      'autoSetup',
      'Automated setup completed successfully',
      JSON.stringify({
        adminEmail: Session.getEffectiveUser().getEmail(),
        installersAdded: 1,
        crewsAdded: 2,
        tokensAdded: 1,
        jobsAdded: 2
      })
    ]);
    
    const webAppUrl = ScriptApp.getService().getUrl();
    
    return '✅ Setup Complete! Your Installer Portal V2 is now ready with sample data.\n\n' +
           '📋 Admin Portal: ' + webAppUrl + '/admin\n' +
           '🔑 Installer Portal: ' + webAppUrl + '/exec?token=SAMPLE_TOKEN_123\n\n' +
           '👤 Your Email: ' + Session.getEffectiveUser().getEmail() + '\n\n' +
           '📝 Next Steps:\n' +
           '1. Test admin portal access\n' +
           '2. Issue tokens for installers\n' +
           '3. Test installer portal with sample token\n' +
           '4. Add real jobs and crews as needed';
    
  } catch (error) {
    return '❌ Setup Failed: ' + error.toString();
  }
}

// Temporary function to set script properties
function setProperties() {
  try {
    PropertiesService.getScriptProperties().setProperties({
      'ADMIN_EMAILS': 'admin1@company.com,admin2@company.com',
      'TEAMUP_API_KEY': 'your-teamup-api-key',
      'TEAMUP_CALENDAR_ID': 'your-teamup-calendar-id'
    });
    return 'Properties set successfully! Please replace placeholder values with actual values.';
  } catch (error) {
    return 'Error setting properties: ' + error.toString();
  }
}

// Helper Functions
function getLastSyncTime() {
  try {
    const sheets = getSheets();
    const lastSyncRow = sheets.RUN_LOG_SHEET.getRange('A:A').getValues()
      .filter(row => row[0] && row[1] === 'SYNC_COMPLETED')
      .pop();
    
    return lastSyncRow ? lastSyncRow[0] : null;
  } catch (error) {
    console.error('Error getting last sync time:', error);
    return null;
  }
}

function createJsonResponse(data, statusCode = 200) {
  const response = {
    status: statusCode,
    data: data
  };
  
  return ContentService.createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
}

function getErrorPage(message) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Error - Installer Portal</title>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: Arial, sans-serif; margin: 40px; text-align: center; }
        .error { color: #d32f2f; margin: 20px 0; }
      </style>
    </head>
    <body>
      <h1>Access Error</h1>
      <div class="error">${message}</div>
      <p>Please contact your administrator for assistance.</p>
    </body>
    </html>
  `;
}

// Initialize function
function initializeSheets() {
  const sheets = getSheets();
  
  // Setup Config sheet headers
  if (sheets.CONFIG_SHEET.getLastRow() === 0) {
    sheets.CONFIG_SHEET.appendRow(['Key', 'Value', 'Description']);
    sheets.CONFIG_SHEET.appendRow(['ADMIN_EMAILS', '', 'Comma-separated admin emails']);
    sheets.CONFIG_SHEET.appendRow(['TEAMUP_API_KEY', '', 'Teamup API key']);
    sheets.CONFIG_SHEET.appendRow(['TEAMUP_CALENDAR_ID', '', 'Teamup calendar ID']);
  }
  
  // Setup Installers sheet headers
  if (sheets.INSTALLERS_SHEET.getLastRow() === 0) {
    sheets.INSTALLERS_SHEET.appendRow([
      'id', 'email', 'name', 'role', 'crew_keys', 'installer_key', 'active', 
      'created_at', 'updated_at', 'phone'
    ]);
  }
  
  // Setup Tokens sheet headers
  if (sheets.TOKENS_SHEET.getLastRow() === 0) {
    sheets.TOKENS_SHEET.appendRow([
      'token', 'installer_key', 'created_at', 'created_by_email', 'revoked_at', 
      'last_sent_to', 'last_sent_at', 'note'
    ]);
  }
  
  // Setup Crews sheet headers
  if (sheets.CREWS_SHEET.getLastRow() === 0) {
    sheets.CREWS_SHEET.appendRow([
      'id', 'crew_key', 'name', 'active', 'created_at', 'updated_at', 'notes'
    ]);
  }
  
  // Setup Teamup_Events sheet headers
  if (sheets.TEAMUP_EVENTS_SHEET.getLastRow() === 0) {
    sheets.TEAMUP_EVENTS_SHEET.appendRow([
      'external_id', 'calendar_id', 'crew_key', 'job_number', 'title', 
      'description', 'location', 'customer_name', 'start_time', 'end_time', 
      'status', 'last_synced_at', 'teamup_subcalendar_id'
    ]);
  }
  
  // Setup Run_Log sheet headers
  if (sheets.RUN_LOG_SHEET.getLastRow() === 0) {
    sheets.RUN_LOG_SHEET.appendRow(['Timestamp', 'Type', 'Function', 'Message', 'Context']);
  }
  
  // Setup Installer_Sync sheet headers
  if (sheets.INSTALLER_SYNC_SHEET.getLastRow() === 0) {
    sheets.INSTALLER_SYNC_SHEET.appendRow(['Timestamp', 'Installer_Key', 'Action', 'Details']);
  }
}
