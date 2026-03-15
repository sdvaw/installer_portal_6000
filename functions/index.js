// ============================================================
// ARMOR VUE — Firebase Cloud Functions
// ============================================================
const { onSchedule }        = require('firebase-functions/v2/scheduler');
const { onCall, onRequest } = require('firebase-functions/v2/https');
const { defineSecret }      = require('firebase-functions/params');
const { logger }            = require('firebase-functions');
const admin            = require('firebase-admin');
const archiver         = require('archiver');
const os               = require('os');
const fs               = require('fs');
const path             = require('path');

admin.initializeApp();
const db = admin.firestore();

const webhookSecret = defineSecret('WEBHOOK_SECRET');

// Admin UID — must match firestore.rules and installer.html
const ADMIN_UID = 'yKCWdsUceONZJtysdweYW2vamFV2';

function requireAdmin(request) {
    if (!request.auth) throw new Error('Unauthenticated');
    if (request.auth.uid !== ADMIN_UID) throw new Error('Forbidden: admin only');
}

// ============================================================
// INSPECTION WEBHOOK — receives failed inspection notices from
// Power Automate and stores them in failed_inspections.
// Secured via X-Webhook-Secret header.
// ============================================================
exports.inspectionWebhook = onRequest({ secrets: [webhookSecret] }, async (req, res) => {
    if (req.method !== 'POST') { res.status(405).json({ error: 'Method Not Allowed' }); return; }

    const secret = webhookSecret.value();
    if (!secret || req.headers['x-webhook-secret'] !== secret) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }

    const { jobNumber, clientName, reason, inspector, fee, date } = req.body || {};

    // Input validation
    if (!jobNumber || !reason) {
        res.status(400).json({ error: 'Missing required fields: jobNumber, reason' }); return;
    }
    if (typeof reason    === 'string' && reason.length    > 2000) { res.status(400).json({ error: 'reason exceeds max length' });    return; }
    if (typeof clientName === 'string' && clientName.length > 500)  { res.status(400).json({ error: 'clientName exceeds max length' }); return; }
    if (typeof inspector  === 'string' && inspector.length  > 500)  { res.status(400).json({ error: 'inspector exceeds max length' });  return; }
    if (fee != null && fee !== '' && isNaN(parseFloat(fee))) {
        res.status(400).json({ error: 'fee must be a number' }); return;
    }

    // Look up jobId by jobNumber
    let jobId = null;
    try {
        const jobSnap = await db.collection('jobs')
            .where('jobNumber', '==', String(jobNumber)).limit(1).get();
        if (!jobSnap.empty) jobId = jobSnap.docs[0].id;
    } catch (e) {
        logger.warn('Could not look up jobId for jobNumber:', jobNumber, e.message);
    }

    const docRef = await db.collection('failed_inspections').add({
        jobId:          jobId,
        jobNumber:      String(jobNumber),
        clientName:     String(clientName || ''),
        reason:         String(reason),
        inspector:      String(inspector || ''),
        fee:            (fee != null && fee !== '') ? (parseFloat(fee) || null) : null,
        inspectionDate: String(date || ''),
        status:         'open',
        notes:          '',
        createdAt:      admin.firestore.FieldValue.serverTimestamp(),
        resolvedAt:     null,
        resolvedBy:     null,
        resolvedByName: null
    });

    logger.info(`Failed inspection created: ${docRef.id} for job #${jobNumber}`);
    res.status(200).json({ success: true, id: docRef.id });
});

// ============================================================
// ARCHIVE OLD JOBS — callable from admin dashboard
// Option C: exports job data as JSON + photo manifest ZIP.
// ── Option A migration point is clearly marked below ──
// ============================================================
exports.archiveOldJobs = onCall({ timeoutSeconds: 300 }, async (request) => {
    requireAdmin(request);

    // Load threshold from settings (default 90 days)
    const settingsSnap   = await db.collection('settings').doc('teamup').get();
    const thresholdDays  = Number(settingsSnap.data()?.archiveThresholdDays) || 90;
    const cutoff         = new Date();
    cutoff.setDate(cutoff.getDate() - thresholdDays);

    // Fetch all job records older than threshold that aren't already archived
    const snap = await db.collection('job_records').get();
    const oldDocs = snap.docs.filter(d => {
        const data = d.data();
        if (data.archived) return false;
        const dt = data.updatedAt?.toDate?.() || data.createdAt?.toDate?.() || null;
        return dt && dt < cutoff;
    });

    if (oldDocs.length === 0) return { jobCount: 0, message: 'Nothing to archive.' };

    const records  = oldDocs.map(d => ({ id: d.id, ...d.data() }));
    const dateStr  = new Date().toISOString().slice(0, 10);
    const tmpFile  = path.join(os.tmpdir(), `archive_${dateStr}_${Date.now()}.zip`);

    // Build ZIP
    await new Promise((resolve, reject) => {
        const output  = fs.createWriteStream(tmpFile);
        const archive = archiver('zip', { zlib: { level: 9 } });
        output.on('close', resolve);
        archive.on('error', reject);
        archive.pipe(output);

        // Full job records as JSON
        archive.append(JSON.stringify(records, null, 2), { name: 'job_records.json' });

        // Photo manifest — all Firebase Storage URLs found in each record
        const photoLines = ['jobId,recordId,photoUrl'];
        records.forEach(r => {
            extractPhotoUrls(r).forEach(url => {
                photoLines.push(`${r.jobId || ''},${r.id},${url}`);
            });
        });
        archive.append(photoLines.join('\n'), { name: 'photos_manifest.csv' });

        archive.finalize();
    });

    // Upload ZIP to Storage
    const bucket   = admin.storage().bucket();
    const destPath = `archives/jobs_archive_${dateStr}.zip`;
    await bucket.upload(tmpFile, { destination: destPath, metadata: { contentType: 'application/zip' } });
    fs.unlinkSync(tmpFile);

    // Signed URL valid for 7 days
    const [downloadUrl] = await bucket.file(destPath).getSignedUrl({
        action:  'read',
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000
    });

    // ── OPTION A: GCS Archive storage class ──────────────────
    // To switch from manual ZIP download to automatic storage
    // class migration, comment out the ZIP block above and
    // uncomment the block below. No other changes needed.
    //
    // const photoPaths = records.flatMap(r => extractStoragePaths(r));
    // await Promise.all(photoPaths.map(p =>
    //     bucket.file(p).setMetadata({ storageClass: 'ARCHIVE' })
    // ));
    // ─────────────────────────────────────────────────────────

    // Mark records as archived in Firestore (batched)
    const batchSize = 400;
    for (let i = 0; i < oldDocs.length; i += batchSize) {
        const batch = db.batch();
        oldDocs.slice(i, i + batchSize).forEach(d =>
            batch.update(d.ref, {
                archived:   true,
                archivedAt: admin.firestore.FieldValue.serverTimestamp()
            })
        );
        await batch.commit();
    }

    // Log to Firestore for audit trail
    await db.collection('archive_log').add({
        archivedAt: admin.firestore.FieldValue.serverTimestamp(),
        jobCount:   oldDocs.length,
        zipPath:    destPath,
        thresholdDays
    });

    return { jobCount: oldDocs.length, downloadUrl };
});

// Recursively finds all Firebase Storage URLs in a record object
function extractPhotoUrls(obj) {
    const urls = [];
    function scan(val) {
        if (typeof val === 'string' && val.includes('firebasestorage.googleapis.com')) urls.push(val);
        else if (Array.isArray(val))             val.forEach(scan);
        else if (val && typeof val === 'object') Object.values(val).forEach(scan);
    }
    scan(obj);
    return urls;
}

// Converts Firebase Storage URLs to bucket file paths (used by Option A)
function extractStoragePaths(obj) {
    return extractPhotoUrls(obj).map(url => {
        const match = url.match(/\/o\/(.+?)(\?|$)/);
        return match ? decodeURIComponent(match[1]) : null;
    }).filter(Boolean);
}

// ============================================================
// MANUAL SYNC — callable from admin portal by any authenticated user
// Runs server-side so it bypasses Firestore security rules.
// ============================================================
exports.manualTeamUpSync = onCall(async (request) => {
    // Must be admin or an active management user
    if (!request.auth) throw new Error('Unauthenticated');
    if (request.auth.uid !== ADMIN_UID) {
        const mgmtSnap = await db.collection('management_users').doc(request.auth.uid).get();
        if (!mgmtSnap.exists || mgmtSnap.data().status !== 'active') {
            throw new Error('Forbidden: admin or management access required');
        }
    }

    const settingsSnap = await db.collection('settings').doc('teamup').get();
    if (!settingsSnap.exists) throw new Error('TeamUp not configured.');

    const settings = settingsSnap.data();
    if (!settings.apiKey || !settings.calendarId) {
        throw new Error('TeamUp API key or Calendar ID missing.');
    }

    const result = await TeamUp.sync(settings, msg => logger.info('[manualSync]', msg));
    return result;
});

// ============================================================
// SCHEDULED SYNC — runs every 15 minutes, checks syncInterval
// from Firestore settings before doing real work.
// ============================================================
exports.scheduledTeamUpSync = onSchedule('every 15 minutes', async () => {
    try {
        const settingsSnap = await db.collection('settings').doc('teamup').get();
        if (!settingsSnap.exists) { logger.info('TeamUp not configured — skipping.'); return; }

        const settings = settingsSnap.data();
        if (!settings.apiKey || !settings.calendarId) {
            logger.info('TeamUp API key or Calendar ID missing — skipping.');
            return;
        }

        // Check if sync is disabled
        if (!settings.syncInterval || settings.syncInterval === 'off') {
            logger.info('Sync is turned off — skipping.');
            return;
        }

        // Check if enough time has passed since last sync
        const intervalMinutes = Number(settings.syncInterval) || 60;
        const lastSynced      = settings.lastSyncedAt?.toDate?.() || null;
        if (lastSynced) {
            const minutesSince = (Date.now() - lastSynced.getTime()) / 60000;
            if (minutesSince < intervalMinutes) {
                logger.info(`Skipping — ${Math.round(minutesSince)}m since last sync, interval is ${intervalMinutes}m.`);
                return;
            }
        }

        logger.info(`Starting TeamUp sync (interval: ${intervalMinutes}m)…`);
        const result = await TeamUp.sync(settings, msg => logger.info(msg));
        logger.info(`Sync complete — ${result.newInstallers} new installer(s), ${result.jobCount} job(s).`);

    } catch (err) {
        logger.error('Scheduled sync failed:', err.message);
    }
});

// ============================================================
// TEAMUP SYNC — Node.js port of deploy/js/teamup.js
// Uses Firebase Admin SDK (server-side) instead of client SDK.
// ============================================================
const TeamUp = {

    CF: {
        jobNumber:     'job2',
        contractAmt:   'job',
        balanceDue:    'contract_balance',
        paymentMethod: 'pay_type',
        windowCount:   'window_count2',
        doorCount:     'door_count',
        contractorAmt: 'contract_amt',
        serviceCall:   'service'
    },

    async _fetch(url, apiKey) {
        const res = await fetch(url, { headers: { 'Teamup-Token': apiKey } });
        if (!res.ok) {
            const text = await res.text();
            throw new Error(`TeamUp API error ${res.status}: ${text.slice(0, 200)}`);
        }
        return res.json();
    },

    async fetchSubcalendars(settings) {
        const data = await this._fetch(
            `https://api.teamup.com/${settings.calendarId}/subcalendars`,
            settings.apiKey
        );
        if (!Array.isArray(data.subcalendars)) { logger.warn('Unexpected TeamUp subcalendars response'); return []; }
        return data.subcalendars;
    },

    async fetchEvents(settings) {
        const start = new Date(); start.setDate(start.getDate() - 30);
        const end   = new Date(); end.setDate(end.getDate() + 90);
        const fmt   = d => d.toISOString().split('T')[0];
        const data  = await this._fetch(
            `https://api.teamup.com/${settings.calendarId}/events?startDate=${fmt(start)}&endDate=${fmt(end)}`,
            settings.apiKey
        );
        if (!Array.isArray(data.events)) { logger.warn('Unexpected TeamUp events response'); return []; }
        return data.events;
    },

    classifySubcalendar(name) {
        const n = name.toLowerCase().trim();
        // Installer: starts with "installer" followed by any separator (dash, colon, space)
        if (/^installer[\s\-:]+/.test(n)) return 'installer';
        if (n.startsWith('ft -') || n.startsWith('ft-')) return 'fulltime';
        if (n.startsWith('im -') || n.startsWith('im-')) return 'manager';
        if (n.startsWith('om -') || n.startsWith('om-')) return 'operations';
        if (n.includes('inspection'))                    return 'inspection';
        return 'other';
    },

    parseInstallerName(teamupName) {
        // Strip "Installer - ", "Installer: " prefix (FT subs are not installers)
        let name = teamupName.replace(/^installer\s*[\-:]\s*/i, '').trim();
        const m  = name.match(/^(.+?)\s*\((.+)\)\s*$/);
        if (m) return { displayName: m[1].trim(), company: m[2].trim() };
        return { displayName: name, company: '' };
    },

    parseJobNumber(who) {
        if (!who) return null;
        const parts = who.trim().split(/\s+/);
        const last  = parts[parts.length - 1];
        return /^\d+$/.test(last) ? last : null;
    },

    parseCustomerName(who) {
        if (!who) return '';
        const parts = who.trim().split(/\s+/);
        if (/^\d+$/.test(parts[parts.length - 1])) parts.pop();
        return parts.join(' ');
    },

    stripHtml(html) {
        if (!html) return '';
        return html
            .replace(/<[^>]+>/g, ' ')
            .replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/\s+/g, ' ')
            .trim();
    },

    _customField(event, fieldId) {
        if (!fieldId) return '';
        const val = (event.custom || {})[String(fieldId)];
        if (val == null) return '';
        if (Array.isArray(val)) return val.length ? String(val[0]).trim() : '';
        return String(val).trim();
    },

    extractFinancials(event, settings) {
        const s = settings || {};
        const balRaw = this._customField(event, s.finFieldBalanceDue || this.CF.balanceDue);
        const balanceDue = balRaw
            ? balRaw.replace(/[,$\s]/g, '')
            : this._parseBalFromNotes(event.notes || event.notesRaw || '');
        const paymentMethod = this._customField(event, s.finFieldPaymentMethod || this.CF.paymentMethod)
            || this._parsePmFromNotes(event.notes || event.notesRaw || '');
        const installerPay  = this._customField(event, s.finFieldInstallerPay  || this.CF.contractorAmt).replace(/[,$\s]/g, '');
        const contractAmt   = this._customField(event, s.finFieldContractAmt   || this.CF.contractAmt).replace(/[,$\s]/g, '');
        return { balanceDue, paymentMethod, installerPay, contractAmt };
    },

    extractJobFields(event, settings) {
        const s = settings || {};
        const windowCount   = this._customField(event, s.finFieldWindowCount   || this.CF.windowCount);
        const doorCount     = this._customField(event, s.finFieldDoorCount     || this.CF.doorCount);
        const sgdCount      = this._customField(event, s.finFieldSgdCount);
        const customerPhone = this._customField(event, s.finFieldCustomerPhone)
            || this._parsePhoneFromNotes(event.notes || event.notesRaw || '');
        const serviceRaw    = this._customField(event, s.finFieldService       || this.CF.serviceCall);
        return {
            windowCount:  windowCount ? Number(windowCount) : null,
            doorCount:    doorCount   ? Number(doorCount)   : null,
            sgdCount:     sgdCount    ? Number(sgdCount)    : null,
            customerPhone,
            isServiceCall: serviceRaw.toLowerCase() === 'yes'
        };
    },

    _parseBalFromNotes(notesRaw) {
        const text  = this.stripHtml(notesRaw);
        const match = text.match(/balance\s+due\s*[:\-]?\s*\$?([\d,]+\.?\d*)/i);
        return match ? match[1].replace(/,/g, '') : '';
    },

    _parsePmFromNotes(notesRaw) {
        const text  = this.stripHtml(notesRaw);
        const match = text.match(/payment\s+method\s*[:\-]?\s*(\w[\w\s]*)/i);
        return match ? match[1].trim() : '';
    },

    _parsePhoneFromNotes(notesRaw) {
        const text  = this.stripHtml(notesRaw);
        const match = text.match(/\(?\d{3}\)?[\s.\-]\d{3}[\s.\-]\d{4}/);
        return match ? match[0].trim() : '';
    },

    async sync(settings, log = () => {}) {
        log('Fetching subcalendars from TeamUp…');
        const subcalendars = await this.fetchSubcalendars(settings);

        log('Fetching events from TeamUp…');
        const events = await this.fetchEvents(settings);

        log('Syncing installers…');
        const { newCount, fixedCount } = await this._syncInstallers(subcalendars);

        log('Syncing jobs…');
        const jobCount = await this._syncJobs(events, settings);

        const installerSubCount = subcalendars.filter(s => this.classifySubcalendar(s.name) === 'installer').length;
        await db.collection('settings').doc('teamup').update({
            lastSyncedAt:          admin.firestore.FieldValue.serverTimestamp(),
            cachedJobCount:        jobCount,
            cachedInstallerCount:  installerSubCount
        });

        log('Done.');
        // Return subcalendar breakdown for admin diagnostics
        const subBreakdown = subcalendars.map(s => ({
            name: s.name,
            id:   s.id,
            type: this.classifySubcalendar(s.name)
        }));
        return {
            newInstallers:    newCount,
            fixedInstallers:  fixedCount,
            jobCount,
            installerSubsFound: installerSubCount,
            subcalendars:     subBreakdown
        };
    },

    async _syncInstallers(subcalendars) {
        const existing     = await db.collection('installers').get();
        const existingDocs = existing.docs.map(d => ({ _ref: d.ref, _id: d.id, ...d.data() }));

        const installerSubs = subcalendars.filter(s => this.classifySubcalendar(s.name) === 'installer');

        const fixBatch  = db.batch();
        let fixedCount  = 0;
        const knownIds  = new Set();

        for (const sub of installerSubs) {
            const sidStr = String(sub.id);
            let match    = existingDocs.find(d => String(d.teamupId) === sidStr);
            if (!match)  match = existingDocs.find(d => d._id === 'teamup_' + sidStr);
            if (!match)  match = existingDocs.find(d =>
                d.teamupName && d.teamupName.trim().toLowerCase() === sub.name.trim().toLowerCase()
            );
            if (match) {
                knownIds.add(sidStr);
                if (String(match.teamupId) !== sidStr) {
                    fixBatch.update(match._ref, { teamupId: sub.id, teamupName: sub.name });
                    fixedCount++;
                }
            }
        }
        if (fixedCount > 0) await fixBatch.commit();

        const newOnes    = installerSubs.filter(s => !knownIds.has(String(s.id)));
        if (newOnes.length === 0) return { newCount: 0, fixedCount };

        const batchSize  = 400;
        for (let i = 0; i < newOnes.length; i += batchSize) {
            const batch = db.batch();
            newOnes.slice(i, i + batchSize).forEach(sub => {
                const parsed = this.parseInstallerName(sub.name);
                const ref    = db.collection('installers').doc('teamup_' + sub.id);
                batch.set(ref, {
                    teamupId:      sub.id,
                    teamupName:    sub.name,
                    displayName:   parsed.displayName,
                    company:       parsed.company,
                    email:         '',
                    phone:         '',
                    status:        'pending',
                    firebaseUid:   null,
                    provisionedAt: null,
                    lastLogin:     null,
                    createdAt:     admin.firestore.FieldValue.serverTimestamp()
                });
            });
            await batch.commit();
        }

        return { newCount: newOnes.length, fixedCount };
    },

    async _syncJobs(events, settings) {
        const jobs = events.filter(e => e.who || e.location);

        // Write / update all jobs from TeamUp
        const batchSize = 400;
        for (let i = 0; i < jobs.length; i += batchSize) {
            const batch = db.batch();
            jobs.slice(i, i + batchSize).forEach(e => {
                const ref          = db.collection('jobs').doc(String(e.id));
                const financials   = this.extractFinancials(e, settings);
                const jobFields    = this.extractJobFields(e, settings);
                const jobNumber    = this._customField(e, settings.finFieldJobNumber || this.CF.jobNumber)
                    || this.parseJobNumber(e.who);
                const customerName = e.who
                    ? (jobNumber && e.who.trim().endsWith(jobNumber)
                        ? this.parseCustomerName(e.who)
                        : e.who.trim())
                    : '';
                batch.set(ref, {
                    id:             String(e.id),
                    seriesId:       e.series_id ? String(e.series_id) : null,
                    jobNumber,
                    customerName,
                    title:          e.title || '',
                    address:        e.location || '',
                    notes:          this.stripHtml(e.notes || ''),
                    notesRaw:       e.notes || '',
                    assignedIds:    (e.subcalendar_ids || []).map(String),
                    startDt:        e.start_dt ? new Date(e.start_dt) : null,
                    endDt:          e.end_dt   ? new Date(e.end_dt)   : null,
                    officeComments: (e.comments || []).map(c => ({
                        name:    c.name || '',
                        message: this.stripHtml(c.message || ''),
                        date:    c.creation_dt || ''
                    })),
                    financials,
                    customerPhone:  jobFields.customerPhone,
                    windowCount:    jobFields.windowCount,
                    doorCount:      jobFields.doorCount,
                    sgdCount:       jobFields.sgdCount,
                    isServiceCall:  jobFields.isServiceCall,
                    lastSyncedAt:   admin.firestore.FieldValue.serverTimestamp()
                }, { merge: true });
            });
            await batch.commit();
        }

        // Remove stale jobs — any Firestore job whose startDt falls inside the
        // sync window but whose ID is no longer in the TeamUp response has been
        // rescheduled outside the window, cancelled, or deleted in TeamUp.
        const teamupIds = new Set(jobs.map(e => String(e.id)));
        const windowStart = new Date(); windowStart.setDate(windowStart.getDate() - 30);
        const windowEnd   = new Date(); windowEnd.setDate(windowEnd.getDate() + 90);

        const staleSnap = await db.collection('jobs')
            .where('startDt', '>=', windowStart)
            .where('startDt', '<=', windowEnd)
            .get();

        const stale = staleSnap.docs.filter(d => !teamupIds.has(d.id));
        if (stale.length > 0) {
            logger.info(`Removing ${stale.length} stale job(s) no longer in TeamUp`);
            for (let i = 0; i < stale.length; i += batchSize) {
                const batch = db.batch();
                stale.slice(i, i + batchSize).forEach(d => batch.delete(d.ref));
                await batch.commit();
            }
        }

        return jobs.length;
    }
};
