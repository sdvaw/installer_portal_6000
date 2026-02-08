/**
 * Installer Portal v3 - TeamUp Integration
 * Portable, Modular Architecture
 * Handles all TeamUp API operations with smart sync
 */

class TeamUpManager {
    constructor(config) {
        this.config = config;
        this.apiKey = config.teamup.apiKey;
        this.calendarId = config.teamup.calendarId;
        this.baseUrl = config.teamup.baseUrl;
        this.syncInterval = config.teamup.syncInterval;
        this.lastSync = null;
        this.syncCache = new Map();
    }

    // Validate TeamUp configuration
    validateConfig() {
        if (!this.apiKey || !this.calendarId) {
            throw new Error("TeamUp API key and calendar ID are required");
        }
    }

    // Generic API request method
    async apiRequest(endpoint, method = 'GET', data = null) {
        this.validateConfig();
        
        const url = `${this.baseUrl}/${this.calendarId}${endpoint}`;
        const options = {
            method,
            headers: {
                'Teamup-Token': this.apiKey,
                'Content-Type': 'application/json'
            }
        };

        if (data && method !== 'GET') {
            options.body = JSON.stringify(data);
        }

        try {
            console.log(`🔄 TeamUp API: ${method} ${url}`);
            
            const response = await fetch(url, options);
            
            if (!response.ok) {
                throw new Error(`TeamUp API error: ${response.status} ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error(`❌ TeamUp API request failed:`, error);
            throw error;
        }
    }

    // Get subcalendars (installers/crews)
    async getSubcalendars() {
        try {
            const response = await this.apiRequest('/subcalendars');
            return response.subcalendars || [];
        } catch (error) {
            console.error("❌ Failed to get subcalendars:", error);
            return [];
        }
    }

    // Get events with smart caching
    async getEvents(startDate, endDate, subcalendarIds = null) {
        try {
            const cacheKey = `events_${startDate}_${endDate}_${subcalendarIds?.join(',') || 'all'}`;
            
            // Check cache first
            if (this.syncCache.has(cacheKey)) {
                const cached = this.syncCache.get(cacheKey);
                if (Date.now() - cached.timestamp < this.syncInterval) {
                    console.log("📦 Using cached TeamUp events");
                    return cached.data;
                }
            }

            // Build query parameters
            const params = new URLSearchParams({
                startDate: startDate.toISOString().split('T')[0],
                endDate: endDate.toISOString().split('T')[0]
            });

            if (subcalendarIds && subcalendarIds.length > 0) {
                params.append('subcalendarId', subcalendarIds.join(','));
            }

            const response = await this.apiRequest(`/events?${params}`);
            const events = response.events || [];

            // Cache the results
            this.syncCache.set(cacheKey, {
                data: events,
                timestamp: Date.now()
            });

            console.log(`✅ Retrieved ${events.length} events from TeamUp`);
            return events;
        } catch (error) {
            console.error("❌ Failed to get events:", error);
            return [];
        }
    }

    // Get single event
    async getEvent(eventId) {
        try {
            const response = await this.apiRequest(`/events/${eventId}`);
            return response.event;
        } catch (error) {
            console.error(`❌ Failed to get event ${eventId}:`, error);
            return null;
        }
    }

    // Sync installers from TeamUp to local database
    async syncInstallers(db) {
        try {
            console.log("🔄 Starting installer sync from TeamUp...");
            
            const subcalendars = await this.getSubcalendars();
            const syncResults = {
                added: 0,
                updated: 0,
                errors: []
            };

            for (const subcalendar of subcalendars) {
                try {
                    // Check if installer already exists
                    const existingInstaller = await db.getInstallerByEmail(subcalendar.name);
                    
                    const installerData = {
                        name: subcalendar.name,
                        email: subcalendar.name.toLowerCase().replace(/\s+/g, '.') + '@company.com',
                        teamupCalendarId: subcalendar.id,
                        teamupColor: subcalendar.color,
                        status: existingInstaller ? existingInstaller.status : 'pending_provisioning',
                        lastSync: new Date().toISOString()
                    };

                    if (existingInstaller) {
                        // Update existing installer
                        await db.updateDocument(db.collections.installers, existingInstaller.id, installerData);
                        syncResults.updated++;
                        console.log(`🔄 Updated installer: ${subcalendar.name}`);
                    } else {
                        // Create new installer for provisioning
                        await db.createInstaller(installerData);
                        syncResults.added++;
                        console.log(`➕ Added new installer for provisioning: ${subcalendar.name}`);
                    }
                } catch (error) {
                    syncResults.errors.push({
                        installer: subcalendar.name,
                        error: error.message
                    });
                    console.error(`❌ Error syncing installer ${subcalendar.name}:`, error);
                }
            }

            // Log sync results
            await db.logSync('installer_sync', syncResults, syncResults.errors.length === 0);
            
            console.log(`✅ Installer sync completed: ${syncResults.added} added, ${syncResults.updated} updated, ${syncResults.errors.length} errors`);
            return syncResults;
        } catch (error) {
            console.error("❌ Installer sync failed:", error);
            throw error;
        }
    }

    // Sync jobs from TeamUp to local database
    async syncJobs(db) {
        try {
            console.log("🔄 Starting job sync from TeamUp...");
            
            // Get date range (last 14 days to next 14 days)
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - 14);
            const endDate = new Date();
            endDate.setDate(endDate.getDate() + 14);

            const events = await this.getEvents(startDate, endDate);
            const syncResults = {
                added: 0,
                updated: 0,
                deleted: 0,
                errors: []
            };

            for (const event of events) {
                try {
                    // Skip deleted events
                    if (event.delete_dt) {
                        // Mark job as cancelled in local DB
                        const existingJobs = await db.query(
                            db.collections.jobs,
                            [['teamupEventId', '==', event.id]]
                        );
                        
                        if (existingJobs.length > 0) {
                            await db.updateDocument(db.collections.jobs, existingJobs[0].id, {
                                status: 'cancelled',
                                cancelledAt: new Date().toISOString()
                            });
                            syncResults.deleted++;
                        }
                        continue;
                    }

                    // Map TeamUp event to job structure
                    const jobData = {
                        teamupEventId: event.id,
                        title: event.title,
                        customerName: this.extractCustomerName(event),
                        address: event.location || '',
                        scheduledStart: new Date(event.start_dt),
                        scheduledEnd: new Date(event.end_dt),
                        crewKey: event.subcalendar_ids?.[0] || null,
                        notes: event.notes || '',
                        status: 'not_started',
                        lastSync: new Date().toISOString()
                    };

                    // Check if job already exists
                    const existingJobs = await db.query(
                        db.collections.jobs,
                        [['teamupEventId', '==', event.id]]
                    );

                    if (existingJobs.length > 0) {
                        const existingJob = existingJobs[0];
                        
                        // Check if job needs updating (smart sync)
                        const needsUpdate = this.jobNeedsUpdate(existingJob, jobData);
                        
                        if (needsUpdate) {
                            await db.updateDocument(db.collections.jobs, existingJob.id, jobData);
                            syncResults.updated++;
                            console.log(`🔄 Updated job: ${event.title}`);
                        }
                    } else {
                        // Create new job
                        await db.createJob(jobData);
                        syncResults.added++;
                        console.log(`➕ Added new job: ${event.title}`);
                    }
                } catch (error) {
                    syncResults.errors.push({
                        event: event.id,
                        title: event.title,
                        error: error.message
                    });
                    console.error(`❌ Error syncing job ${event.id}:`, error);
                }
            }

            // Log sync results
            await db.logSync('job_sync', syncResults, syncResults.errors.length === 0);
            
            console.log(`✅ Job sync completed: ${syncResults.added} added, ${syncResults.updated} updated, ${syncResults.deleted} deleted, ${syncResults.errors.length} errors`);
            return syncResults;
        } catch (error) {
            console.error("❌ Job sync failed:", error);
            throw error;
        }
    }

    // Check if job needs updating (smart sync logic)
    jobNeedsUpdate(existingJob, newJobData) {
        // Check critical fields for changes
        const criticalFields = ['title', 'customerName', 'address', 'scheduledStart', 'scheduledEnd', 'notes'];
        
        for (const field of criticalFields) {
            if (existingJob[field] !== newJobData[field]) {
                return true;
            }
        }
        
        return false;
    }

    // Extract customer name from event title or notes
    extractCustomerName(event) {
        // Try to extract from title (format: "Job Name - Customer Name")
        const titleMatch = event.title.match(/- (.+)$/);
        if (titleMatch) {
            return titleMatch[1].trim();
        }
        
        // Try to extract from notes
        if (event.notes) {
            const notesMatch = event.notes.match(/customer[:\s]+(.+)$/i);
            if (notesMatch) {
                return notesMatch[1].trim();
            }
        }
        
        // Fallback to location if available
        return event.location ? 'Customer at ' + event.location : 'Unknown Customer';
    }

    // Get installer jobs from TeamUp
    async getInstallerJobs(installerId, dateRange = null) {
        try {
            // Get installer details to find their calendar
            const installer = await db.getDocument(db.collections.installers, installerId);
            if (!installer || !installer.teamupCalendarId) {
                return [];
            }

            // Set default date range if not provided
            if (!dateRange) {
                const startDate = new Date();
                startDate.setDate(startDate.getDate() - 14);
                const endDate = new Date();
                endDate.setDate(endDate.getDate() + 14);
                dateRange = { start: startDate, end: endDate };
            }

            // Get events for installer's calendar
            const events = await this.getEvents(
                dateRange.start, 
                dateRange.end, 
                [installer.teamupCalendarId]
            );

            // Convert events to job format
            return events.map(event => ({
                id: event.id,
                title: event.title,
                customerName: this.extractCustomerName(event),
                address: event.location || '',
                scheduledStart: new Date(event.start_dt),
                scheduledEnd: new Date(event.end_dt),
                notes: event.notes || '',
                status: 'not_started'
            }));
        } catch (error) {
            console.error("❌ Failed to get installer jobs:", error);
            return [];
        }
    }

    // Clear cache
    clearCache() {
        this.syncCache.clear();
        console.log("🗑️ TeamUp cache cleared");
    }

    // Get sync status
    getSyncStatus() {
        return {
            lastSync: this.lastSync,
            cacheSize: this.syncCache.size,
            nextSync: this.lastSync ? new Date(this.lastSync.getTime() + this.syncInterval) : null
        };
    }

    // Test connection
    async testConnection() {
        try {
            await this.getSubcalendars();
            return { success: true, message: "TeamUp connection successful" };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }
}

// Export for use
if (typeof module !== "undefined" && module.exports) {
    module.exports = TeamUpManager;
}

// Global assignment
if (typeof window !== "undefined") {
    window.INSTALLER_PORTAL_TEAMUP = TeamUpManager;
}
