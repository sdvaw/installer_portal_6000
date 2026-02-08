/**
 * Installer Portal v3 - Authentication System
 * Portable, Modular Architecture
 * Token-based authentication (not Firebase Auth)
 */

class AuthManager {
    constructor(config, db) {
        this.config = config;
        this.db = db;
        this.currentUser = null;
        this.tokenExpiryTimer = null;
    }

    // Generate secure random token
    generateToken(length = 32) {
        const chars = this.config.app.tokens.chars;
        let token = '';
        
        // Use crypto API if available
        if (window.crypto && window.crypto.getRandomValues) {
            const array = new Uint32Array(length);
            window.crypto.getRandomValues(array);
            
            for (let i = 0; i < length; i++) {
                token += chars[array[i] % chars.length];
            }
        } else {
            // Fallback to Math.random
            for (let i = 0; i < length; i++) {
                token += chars[Math.floor(Math.random() * chars.length)];
            }
        }
        
        return token;
    }

    // Validate token format
    validateTokenFormat(token) {
        if (!token || typeof token !== 'string') {
            return false;
        }
        
        // Check length
        if (token.length !== this.config.app.tokens.length) {
            return false;
        }
        
        // Check characters
        const validChars = new RegExp(`^[${this.config.app.tokens.chars}]+$`);
        return validChars.test(token);
    }

    // Authenticate installer with token
    async authenticateInstaller(token) {
        try {
            console.log("🔐 Authenticating installer with token...");
            
            // Validate token format
            if (!this.validateTokenFormat(token)) {
                throw new Error("Invalid token format");
            }

            // Get installer by token
            const installer = await this.db.getInstallerByToken(token);
            
            if (!installer) {
                throw new Error("Token not found");
            }

            // Check token expiration
            if (installer.tokenExpires && new Date(installer.tokenExpires) < new Date()) {
                throw new Error("Token expired");
            }

            // Check installer status
            if (installer.status !== 'active') {
                throw new Error("Installer account not active");
            }

            // Set current user
            this.currentUser = installer;
            
            // Set up token expiry check
            this.setupTokenExpiryCheck(installer.tokenExpires);
            
            console.log(`✅ Authentication successful for: ${installer.name}`);
            return installer;
        } catch (error) {
            console.error("❌ Authentication failed:", error);
            throw error;
        }
    }

    // Generate token for installer
    async generateInstallerToken(installerId, expiryDays = 30) {
        try {
            const token = this.generateToken();
            const expires = new Date();
            expires.setDate(expires.getDate() + expiryDays);
            
            // Update installer with new token
            await this.db.updateDocument(this.db.collections.installers, installerId, {
                token: token,
                tokenGenerated: new Date().toISOString(),
                tokenExpires: expires.toISOString()
            });
            
            console.log(`🔑 Token generated for installer: ${installerId}`);
            return token;
        } catch (error) {
            console.error("❌ Token generation failed:", error);
            throw error;
        }
    }

    // Revoke installer token
    async revokeInstallerToken(installerId) {
        try {
            await this.db.updateDocument(this.db.collections.installers, installerId, {
                token: null,
                tokenGenerated: null,
                tokenExpires: null
            });
            
            // Clear current user if it's the same installer
            if (this.currentUser && this.currentUser.id === installerId) {
                this.logout();
            }
            
            console.log(`🔒 Token revoked for installer: ${installerId}`);
            return true;
        } catch (error) {
            console.error("❌ Token revocation failed:", error);
            throw error;
        }
    }

    // Check if current user is authenticated
    isAuthenticated() {
        return this.currentUser !== null;
    }

    // Get current user
    getCurrentUser() {
        return this.currentUser;
    }

    // Logout current user
    logout() {
        if (this.tokenExpiryTimer) {
            clearTimeout(this.tokenExpiryTimer);
            this.tokenExpiryTimer = null;
        }
        
        this.currentUser = null;
        console.log("👋 User logged out");
    }

    // Setup token expiry check
    setupTokenExpiryCheck(expires) {
        if (this.tokenExpiryTimer) {
            clearTimeout(this.tokenExpiryTimer);
        }
        
        if (expires) {
            const expiryTime = new Date(expires).getTime();
            const currentTime = new Date().getTime();
            const timeUntilExpiry = expiryTime - currentTime;
            
            if (timeUntilExpiry > 0) {
                this.tokenExpiryTimer = setTimeout(() => {
                    console.log("⏰ Token expired, logging out...");
                    this.logout();
                    this.onTokenExpired();
                }, timeUntilExpiry);
            }
        }
    }

    // Called when token expires
    onTokenExpired() {
        // Show token expired message
        if (typeof window !== 'undefined' && window.alert) {
            alert("Your session has expired. Please contact your administrator for a new access link.");
        }
        
        // Redirect to login page
        if (typeof window !== 'undefined') {
            window.location.href = '/';
        }
    }

    // Extract token from URL
    extractTokenFromURL() {
        if (typeof window === 'undefined') return null;
        
        const path = window.location.pathname;
        const tokenMatch = path.match(/\/installer\/([^\/]+)/);
        
        if (tokenMatch) {
            return tokenMatch[1];
        }
        
        // Also check query parameters
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('token');
    }

    // Save authentication state to session storage
    saveAuthState() {
        if (typeof sessionStorage === 'undefined') return;
        
        if (this.currentUser) {
            sessionStorage.setItem('installerPortal_auth', JSON.stringify({
                installer: this.currentUser,
                timestamp: new Date().toISOString()
            }));
        } else {
            sessionStorage.removeItem('installerPortal_auth');
        }
    }

    // Load authentication state from session storage
    loadAuthState() {
        if (typeof sessionStorage === 'undefined') return;
        
        try {
            const authData = sessionStorage.getItem('installerPortal_auth');
            if (authData) {
                const parsed = JSON.parse(authData);
                const installer = parsed.installer;
                
                // Validate session is not too old (1 hour)
                const sessionAge = new Date() - new Date(parsed.timestamp);
                if (sessionAge < 60 * 60 * 1000) { // 1 hour
                    this.currentUser = installer;
                    this.setupTokenExpiryCheck(installer.tokenExpires);
                    console.log("📦 Loaded authentication state from session");
                    return installer;
                } else {
                    sessionStorage.removeItem('installerPortal_auth');
                }
            }
        } catch (error) {
            console.error("❌ Failed to load auth state:", error);
            sessionStorage.removeItem('installerPortal_auth');
        }
        
        return null;
    }

    // Auto-authenticate from URL token
    async autoAuthenticate() {
        try {
            // Try to load from session first
            const sessionInstaller = this.loadAuthState();
            if (sessionInstaller) {
                return sessionInstaller;
            }
            
            // Try to extract token from URL
            const token = this.extractTokenFromURL();
            if (!token) {
                return null;
            }
            
            // Authenticate with token
            const installer = await this.authenticateInstaller(token);
            
            // Save to session
            this.saveAuthState();
            
            return installer;
        } catch (error) {
            console.error("❌ Auto-authentication failed:", error);
            return null;
        }
    }

    // Check installer permissions
    hasPermission(permission) {
        if (!this.currentUser) return false;
        
        // For now, all authenticated installers have the same permissions
        // This can be extended later for role-based permissions
        const permissions = {
            'view_jobs': true,
            'update_status': true,
            'upload_photos': true,
            'report_defects': true,
            'view_certificates': true
        };
        
        return permissions[permission] || false;
    }

    // Refresh token (extend expiry)
    async refreshToken() {
        if (!this.currentUser) {
            throw new Error("No authenticated user");
        }
        
        try {
            const newToken = await this.generateInstallerToken(this.currentUser.id);
            
            // Update current user with new token
            this.currentUser.token = newToken;
            this.currentUser.tokenGenerated = new Date().toISOString();
            this.currentUser.tokenExpires = new Date(Date.now() + (30 * 24 * 60 * 60 * 1000)).toISOString();
            
            // Save to session
            this.saveAuthState();
            
            console.log("🔄 Token refreshed successfully");
            return newToken;
        } catch (error) {
            console.error("❌ Token refresh failed:", error);
            throw error;
        }
    }

    // Validate session
    async validateSession() {
        if (!this.currentUser) {
            return false;
        }
        
        try {
            // Check if installer still exists and is active
            const installer = await this.db.getDocument(this.db.collections.installers, this.currentUser.id);
            
            if (!installer || installer.status !== 'active') {
                this.logout();
                return false;
            }
            
            // Check if token matches
            if (installer.token !== this.currentUser.token) {
                this.logout();
                return false;
            }
            
            // Check token expiry
            if (installer.tokenExpires && new Date(installer.tokenExpires) < new Date()) {
                this.logout();
                return false;
            }
            
            return true;
        } catch (error) {
            console.error("❌ Session validation failed:", error);
            this.logout();
            return false;
        }
    }
}

// Export for use
if (typeof module !== "undefined" && module.exports) {
    module.exports = AuthManager;
}

// Global assignment
if (typeof window !== "undefined") {
    window.INSTALLER_PORTAL_AUTH = AuthManager;
}
