/**
 * Installer Portal v3 - Database Layer
 * Portable, Modular Architecture
 * Handles all Firebase Firestore operations
 */

class DatabaseManager {
    constructor(config) {
        this.config = config;
        this.db = null;
        this.initialized = false;
    }

    // Initialize Firebase and Firestore
    async initialize() {
        try {
            // Initialize Firebase
            if (!window.firebase) {
                throw new Error("Firebase SDK not loaded");
            }

            firebase.initializeApp(this.config.firebase);
            this.db = firebase.firestore();
            
            // Enable offline persistence
            await this.db.enablePersistence({
                synchronizeTabs: true
            });

            this.initialized = true;
            console.log("✅ Database initialized successfully");
            return true;
        } catch (error) {
            console.error("❌ Database initialization failed:", error);
            return false;
        }
    }

    // Generic document operations
    async createDocument(collection, data, id = null) {
        if (!this.initialized) throw new Error("Database not initialized");
        
        try {
            const docRef = id ? 
                this.db.collection(collection).doc(id) :
                this.db.collection(collection).doc();
            
            const document = {
                ...data,
                created_at: firebase.firestore.FieldValue.serverTimestamp(),
                updated_at: firebase.firestore.FieldValue.serverTimestamp()
            };

            await docRef.set(document);
            return { id: docRef.id, ...document };
        } catch (error) {
            console.error(`❌ Create document failed in ${collection}:`, error);
            throw error;
        }
    }

    async getDocument(collection, id) {
        if (!this.initialized) throw new Error("Database not initialized");
        
        try {
            const doc = await this.db.collection(collection).doc(id).get();
            
            if (!doc.exists) {
                return null;
            }
            
            return { id: doc.id, ...doc.data() };
        } catch (error) {
            console.error(`❌ Get document failed in ${collection}:`, error);
            throw error;
        }
    }

    async updateDocument(collection, id, data) {
        if (!this.initialized) throw new Error("Database not initialized");
        
        try {
            const document = {
                ...data,
                updated_at: firebase.firestore.FieldValue.serverTimestamp()
            };

            await this.db.collection(collection).doc(id).update(document);
            return { id, ...document };
        } catch (error) {
            console.error(`❌ Update document failed in ${collection}:`, error);
            throw error;
        }
    }

    async deleteDocument(collection, id) {
        if (!this.initialized) throw new Error("Database not initialized");
        
        try {
            await this.db.collection(collection).doc(id).delete();
            return true;
        } catch (error) {
            console.error(`❌ Delete document failed in ${collection}:`, error);
            throw error;
        }
    }

    // Query operations
    async query(collection, whereConditions = [], orderBy = null, limit = null) {
        if (!this.initialized) throw new Error("Database not initialized");
        
        try {
            let query = this.db.collection(collection);
            
            // Apply where conditions
            whereConditions.forEach(condition => {
                const [field, operator, value] = condition;
                query = query.where(field, operator, value);
            });
            
            // Apply ordering
            if (orderBy) {
                const [field, direction = 'asc'] = orderBy;
                query = query.orderBy(field, direction);
            }
            
            // Apply limit
            if (limit) {
                query = query.limit(limit);
            }
            
            const snapshot = await query.get();
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error(`❌ Query failed in ${collection}:`, error);
            throw error;
        }
    }

    // Real-time listeners
    onDocumentChange(collection, id, callback) {
        if (!this.initialized) throw new Error("Database not initialized");
        
        return this.db.collection(collection).doc(id)
            .onSnapshot((doc) => {
                if (doc.exists) {
                    callback({ id: doc.id, ...doc.data() });
                } else {
                    callback(null);
                }
            }, (error) => {
                console.error(`❌ Real-time listener failed in ${collection}:`, error);
                callback(null, error);
            });
    }

    onQueryChange(collection, whereConditions = [], callback) {
        if (!this.initialized) throw new Error("Database not initialized");
        
        let query = this.db.collection(collection);
        
        // Apply where conditions
        whereConditions.forEach(condition => {
            const [field, operator, value] = condition;
            query = query.where(field, operator, value);
        });
        
        return query.onSnapshot((snapshot) => {
            const documents = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            callback(documents);
        }, (error) => {
            console.error(`❌ Real-time query failed in ${collection}:`, error);
            callback([], error);
        });
    }

    // Batch operations
    async batch(operations) {
        if (!this.initialized) throw new Error("Database not initialized");
        
        const batch = this.db.batch();
        const results = [];
        
        try {
            operations.forEach(operation => {
                const { type, collection, id, data } = operation;
                const docRef = this.db.collection(collection).doc(id);
                
                switch (type) {
                    case 'create':
                    case 'set':
                        batch.set(docRef, {
                            ...data,
                            created_at: firebase.firestore.FieldValue.serverTimestamp(),
                            updated_at: firebase.firestore.FieldValue.serverTimestamp()
                        });
                        results.push({ type, collection, id });
                        break;
                        
                    case 'update':
                        batch.update(docRef, {
                            ...data,
                            updated_at: firebase.firestore.FieldValue.serverTimestamp()
                        });
                        results.push({ type, collection, id });
                        break;
                        
                    case 'delete':
                        batch.delete(docRef);
                        results.push({ type, collection, id });
                        break;
                        
                    default:
                        throw new Error(`Unknown batch operation: ${type}`);
                }
            });
            
            await batch.commit();
            return results;
        } catch (error) {
            console.error("❌ Batch operation failed:", error);
            throw error;
        }
    }

    // Transaction operations
    async transaction(updateFunction) {
        if (!this.initialized) throw new Error("Database not initialized");
        
        try {
            return await this.db.runTransaction(updateFunction);
        } catch (error) {
            console.error("❌ Transaction failed:", error);
            throw error;
        }
    }
}

// Specialized database operations for Installer Portal
class InstallerPortalDB extends DatabaseManager {
    constructor(config) {
        super(config);
        this.collections = config.collections;
    }

    // Installer operations
    async createInstaller(installerData) {
        return this.createDocument(this.collections.installers, installerData);
    }

    async getInstallerByToken(token) {
        const installers = await this.query(
            this.collections.installers,
            [['token', '==', token]],
            null,
            1
        );
        return installers.length > 0 ? installers[0] : null;
    }

    async getInstallerByEmail(email) {
        const installers = await this.query(
            this.collections.installers,
            [['email', '==', email]],
            null,
            1
        );
        return installers.length > 0 ? installers[0] : null;
    }

    async updateInstallerStatus(installerId, status) {
        return this.updateDocument(this.collections.installers, installerId, { status });
    }

    async getProvisioningInstallers() {
        return this.query(
            this.collections.installers,
            [['status', '==', 'pending_provisioning']]
        );
    }

    // Job operations
    async createJob(jobData) {
        return this.createDocument(this.collections.jobs, jobData);
    }

    async getInstallerJobs(installerId, dateRange = null) {
        let whereConditions = [['assignedInstaller', '==', installerId]];
        
        if (dateRange) {
            whereConditions.push(['scheduledDate', '>=', dateRange.start]);
            whereConditions.push(['scheduledDate', '<=', dateRange.end]);
        }
        
        return this.query(
            this.collections.jobs,
            whereConditions,
            ['scheduledDate', 'asc']
        );
    }

    async updateJobStatus(jobId, status, installerId, notes = null) {
        const updateData = { status };
        if (notes) updateData.statusNotes = notes;
        
        // Create status update record
        await this.createDocument(this.collections.status_updates, {
            jobId,
            installerId,
            status,
            notes,
            timestamp: new Date().toISOString()
        });
        
        return this.updateDocument(this.collections.jobs, jobId, updateData);
    }

    // Photo operations
    async uploadPhoto(jobId, installerId, file, photoType, description = null) {
        // This would integrate with Firebase Storage
        // For now, return a placeholder
        return this.createDocument(this.collections.photos, {
            jobId,
            installerId,
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type,
            photoType,
            description,
            uploadedAt: new Date().toISOString()
        });
    }

    async getJobPhotos(jobId) {
        return this.query(
            this.collections.photos,
            [['jobId', '==', jobId]],
            ['uploadedAt', 'desc']
        );
    }

    // Defect operations
    async createDefect(defectData) {
        return this.createDocument(this.collections.defects, defectData);
    }

    async getJobDefects(jobId) {
        return this.query(
            this.collections.defects,
            [['jobId', '==', jobId]],
            ['reportedAt', 'desc']
        );
    }

    // Certificate operations
    async createCertificate(certificateData) {
        return this.createDocument(this.collections.certificates, certificateData);
    }

    // Sync operations
    async logSync(type, details, success = true) {
        return this.createDocument(this.collections.sync_logs, {
            type,
            details,
            success,
            timestamp: new Date().toISOString()
        });
    }

    // Admin settings operations
    async getAdminSettings() {
        const settings = await this.query(this.collections.admin_settings);
        return settings.length > 0 ? settings[0] : null;
    }

    async updateAdminSettings(settings) {
        const existing = await this.getAdminSettings();
        if (existing) {
            return this.updateDocument(this.collections.admin_settings, existing.id, settings);
        } else {
            return this.createDocument(this.collections.admin_settings, settings);
        }
    }
}

// Export for use
if (typeof module !== "undefined" && module.exports) {
    module.exports = {
        DatabaseManager,
        InstallerPortalDB
    };
}

// Global assignment
if (typeof window !== "undefined") {
    window.INSTALLER_PORTAL_DB = InstallerPortalDB;
}
