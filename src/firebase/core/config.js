/**
 * Installer Portal v3 - Core Configuration
 * Portable, Modular Architecture
 * Version: 3.0.0
 */

// Firebase Configuration
const FIREBASE_CONFIG = {
    apiKey: "AIzaSyDYFdyiz_T_0Tsqya_CSKS4wRlWOEckMGk",
    authDomain: "installer-portal-6000.firebaseapp.com",
    projectId: "installer-portal-6000",
    storageBucket: "installer-portal-6000.firebasestorage.app",
    messagingSenderId: "582559700006",
    appId: "1:582559700006:web:e3b795dcf17501e310c2e7",
    measurementId: "G-93D62ZGLEJ"
};

// TeamUp Configuration
const TEAMUP_CONFIG = {
    apiKey: null, // To be set by admin
    calendarId: null, // To be set by admin
    syncInterval: 15 * 60 * 1000, // 15 minutes (configurable: 15min - 12hours)
    baseUrl: "https://api.teamup.com"
};

// Application Configuration
const APP_CONFIG = {
    version: "3.0.0",
    name: "Installer Portal",
    environment: "production", // development, staging, production
    debug: false,
    
    // Portal Types
    portals: {
        installer: "/installer",
        admin: "/admin", 
        office: "/office"
    },
    
    // Token Configuration
    tokens: {
        length: 32,
        expiry: 30 * 24 * 60 * 60 * 1000, // 30 days
        chars: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
    },
    
    // Storage Configuration
    storage: {
        freeTierLimit: 1024 * 1024 * 1024, // 1GB
        backupInterval: 24 * 60 * 60 * 1000, // 24 hours
        cleanupInterval: 30 * 24 * 60 * 60 * 1000, // 30 days
        compression: {
            quality: 0.8,
            maxWidth: 1920,
            maxHeight: 1080
        }
    },
    
    // Sync Configuration
    sync: {
        teamUp: {
            enabled: true,
            interval: 15 * 60 * 1000, // 15 minutes
            retryAttempts: 3,
            retryDelay: 5000
        },
        backup: {
            enabled: true,
            provider: "onedrive", // onedrive, dropbox
            interval: 24 * 60 * 60 * 1000 // 24 hours
        }
    }
};

// Database Collections Schema
const COLLECTIONS = {
    installers: "installers",
    jobs: "jobs", 
    status_updates: "status_updates",
    photos: "photos",
    defects: "defects",
    certificates: "certificates",
    sync_logs: "sync_logs",
    admin_settings: "admin_settings"
};

// UI Configuration (Theme System)
const UI_CONFIG = {
    theme: {
        name: "terminal",
        colors: {
            primary: "#00ff00",
            secondary: "#ffffff", 
            background: "#000000",
            accent: "#ffff00",
            danger: "#ff0000",
            warning: "#ffa500",
            success: "#00ff00"
        },
        fonts: {
            primary: "'Courier New', monospace",
            secondary: "'Monaco', monospace"
        },
        breakpoints: {
            mobile: "640px",
            tablet: "768px", 
            desktop: "1024px"
        }
    },
    
    // Layout Configuration
    layout: {
        header: {
            height: "60px",
            showVersion: true,
            showInstallerName: true
        },
        sidebar: {
            width: "250px",
            collapsible: true
        },
        content: {
            padding: "20px",
            maxWidth: "1200px"
        }
    },
    
    // Component Configuration
    components: {
        jobCard: {
            showStatus: true,
            showPhotos: true,
            showDefects: true,
            actions: ["start", "complete", "photos", "defects"]
        },
        modal: {
            overlayOpacity: 0.9,
            animationDuration: 300,
            closeOnEscape: true
        },
        calendar: {
            view: "week", // day, week, month
            showWeekends: true,
            startDay: "monday"
        }
    }
};

// API Configuration
const API_CONFIG = {
    endpoints: {
        firebase: {
            auth: "/auth",
            firestore: "/firestore",
            storage: "/storage"
        },
        teamup: {
            events: "/events",
            subcalendars: "/subcalendars",
            calendars: "/calendars"
        }
    },
    timeout: 30000,
    retries: 3,
    retryDelay: 1000
};

// Error Configuration
const ERROR_CONFIG = {
    messages: {
        invalidToken: "Access denied. Please contact your administrator.",
        expiredToken: "Your access link has expired. Please contact your administrator.",
        networkError: "Network error. Please check your connection.",
        teamUpError: "Unable to connect to TeamUp. Please try again later.",
        photoUploadError: "Failed to upload photo. Please try again.",
        storageLimit: "Storage limit reached. Please contact administrator."
    },
    logging: {
        enabled: true,
        level: "info", // debug, info, warn, error
        maxLogs: 1000
    }
};

// Feature Flags
const FEATURES = {
    teamUpSync: true,
    photoUpload: true,
    defectReporting: true,
    certificates: true,
    adminPortal: true,
    officePortal: true,
    backupToCloud: true,
    autoCleanup: true,
    realTimeUpdates: true,
    pushNotifications: false // Future feature
};

// Environment Detection
function getEnvironment() {
    const hostname = window?.location?.hostname || "";
    
    if (hostname.includes("localhost") || hostname.includes("127.0.0.1")) {
        return "development";
    } else if (hostname.includes("staging") || hostname.includes("test")) {
        return "staging";
    } else {
        return "production";
    }
}

// Configuration Factory
function getConfig() {
    const env = getEnvironment();
    
    const baseConfig = {
        firebase: FIREBASE_CONFIG,
        teamup: TEAMUP_CONFIG,
        app: APP_CONFIG,
        collections: COLLECTIONS,
        ui: UI_CONFIG,
        api: API_CONFIG,
        error: ERROR_CONFIG,
        features: FEATURES,
        environment: env
    };
    
    // Environment-specific overrides
    if (env === "development") {
        baseConfig.app.debug = true;
        baseConfig.features.realTimeUpdates = false;
    }
    
    return baseConfig;
}

// Configuration Validation
function validateConfig(config) {
    const required = [
        "firebase.apiKey",
        "firebase.projectId",
        "teamup.apiKey",
        "teamup.calendarId"
    ];
    
    const missing = [];
    
    for (const path of required) {
        const value = path.split(".").reduce((obj, key) => obj?.[key], config);
        if (!value || value.includes("YOUR_") || value === null) {
            missing.push(path);
        }
    }
    
    if (missing.length > 0) {
        console.error("Missing required configuration:", missing);
        return false;
    }
    
    return true;
}

// Theme Management
class ThemeManager {
    constructor(config) {
        this.config = config.ui.theme;
        this.currentTheme = this.config.name;
    }
    
    applyTheme(themeName = null) {
        const theme = themeName || this.currentTheme;
        const root = document.documentElement;
        
        // Apply CSS custom properties
        Object.entries(this.config.colors).forEach(([key, value]) => {
            root.style.setProperty(`--color-${key}`, value);
        });
        
        // Apply fonts
        root.style.setProperty('--font-primary', this.config.fonts.primary);
        root.style.setProperty('--font-secondary', this.config.fonts.secondary);
    }
    
    updateTheme(updates) {
        this.config = { ...this.config, ...updates };
        this.applyTheme();
    }
}

// Export for use
if (typeof module !== "undefined" && module.exports) {
    module.exports = {
        getConfig,
        validateConfig,
        ThemeManager,
        getEnvironment
    };
}

// Global assignment
if (typeof window !== "undefined") {
    window.INSTALLER_PORTAL = {
        config: getConfig(),
        validateConfig,
        ThemeManager,
        getEnvironment
    };
}
