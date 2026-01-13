// CONFIGURATION SETTINGS
// ====================

// DATA SOURCE CONFIGURATION
// ====================
// Set to 'supabase' for production with full features
// Set to 'google' for free/basic functionality
var DATA_SOURCE = 'google'; // OPTIONS: 'supabase' | 'google'

// SUPABASE CONFIGURATION (only used if DATA_SOURCE = 'supabase')
// ====================
var SUPABASE_URL = 'YOUR_SUPABASE_URL_HERE';
var SUPABASE_KEY = 'YOUR_SUPABASE_KEY_HERE';

// TEAMUP CONFIGURATION (used by both data sources)
// ====================
// Note: TEAMUP_API_KEY is now declared in Code.gs to avoid conflicts
var TEAMUP_CALENDAR_ID = 'YOUR_TEAMUP_CALENDAR_ID_HERE';

// GOOGLE SHEETS CONFIGURATION (only used if DATA_SOURCE = 'google')
// ====================
var SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID_HERE';

// CACHE CONFIGURATION
// ====================
var CACHE_DURATION_MINUTES = 5; // How long to cache TeamUp data

// FEATURE FLAGS
// ====================
var ENABLE_PHOTO_UPLOAD = true;
var ENABLE_DEFECT_REPORTING = true;
var ENABLE_SIGNATURES = false; // Future feature

// AUTHENTICATION CONFIGURATION
// ====================
var TOKEN_AUTH_REQUIRED = false; // Set to true when using tokens
var GOOGLE_AUTH_ALLOWED = true; // Set to false for token-only access
