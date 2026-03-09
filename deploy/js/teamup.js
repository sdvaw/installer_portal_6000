// ============================================================
// ARMOR VUE — TeamUp Sync Module
// READ ONLY — never writes to TeamUp.
// Pulls subcalendars (people) and events (jobs) then stores
// them in Firestore. Admin dashboard triggers this manually;
// future: Firebase Cloud Function on a schedule.
// ============================================================

const TeamUp = {

    // ---------------------------------------------------------
    // SETTINGS
    // ---------------------------------------------------------
    async getSettings() {
        const doc = await db.collection('settings').doc('teamup').get();
        if (!doc.exists) throw new Error('TeamUp is not configured. Go to Settings first.');
        const d = doc.data();
        if (!d.apiKey || !d.calendarId) throw new Error('TeamUp API key or Calendar ID is missing. Check Settings.');
        return d;
    },

    // ---------------------------------------------------------
    // API CALLS (read-only)
    // ---------------------------------------------------------
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
        return data.subcalendars || [];
    },

    async fetchEvents(settings) {
        // Last 30 days + next 90 days
        const start = new Date();
        start.setDate(start.getDate() - 30);
        const end = new Date();
        end.setDate(end.getDate() + 90);
        const fmt = d => d.toISOString().split('T')[0];

        const data = await this._fetch(
            `https://api.teamup.com/${settings.calendarId}/events?startDate=${fmt(start)}&endDate=${fmt(end)}`,
            settings.apiKey
        );
        return data.events || [];
    },

    // ---------------------------------------------------------
    // CUSTOM FIELD IDs — confirmed from live TeamUp API (updated 2026-03)
    // job2            = Job # (job number)
    // job             = Contract Amt (total contract value)
    // contract_balance= Contract Balance (balance still owed by customer)
    // pay_type        = PAY TYPE (choices field, e.g. cash/check/card)
    // window_count2   = WINDOW COUNT
    // door_count      = DOOR COUNT
    // contract_amt    = Contractor Amt $ (installer pay)
    // ---------------------------------------------------------
    CF: {
        jobNumber:      'job2',
        contractAmt:    'job',               // total contract value
        balanceDue:     'contract_balance',  // balance still owed
        paymentMethod:  'pay_type',
        windowCount:    'window_count2',
        doorCount:      'door_count',
        contractorAmt:  'contract_amt',      // installer pay
        serviceCall:    'service'            // yes/no — is this a service call?
    },

    // ---------------------------------------------------------
    // CLASSIFICATION
    // ---------------------------------------------------------
    classifySubcalendar(name) {
        const n = name.toLowerCase();
        if (n.startsWith('installer -') || n.startsWith('installer-')) return 'installer';
        if (n.startsWith('ft -'))         return 'fulltime';
        if (n.startsWith('im -'))         return 'manager';
        if (n.startsWith('om -'))         return 'operations';
        if (n.includes('inspection'))     return 'inspection';
        return 'other';
    },

    // Parse "Installer - Luis (Brito Windows)" → { displayName: "Luis", company: "Brito Windows" }
    parseInstallerName(teamupName) {
        let name = teamupName.replace(/^installer\s*-\s*/i, '').trim();
        const m = name.match(/^(.+?)\s*\((.+)\)\s*$/);
        if (m) return { displayName: m[1].trim(), company: m[2].trim() };
        return { displayName: name, company: '' };
    },

    // Parse "Morris, Laura 11294" → jobNumber: "11294", customerName: "Morris, Laura"
    parseJobNumber(who) {
        if (!who) return null;
        const parts = who.trim().split(/\s+/);
        const last = parts[parts.length - 1];
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

    // ---------------------------------------------------------
    // MAIN SYNC — call this to run a full sync
    // progressCallback(message) called during sync
    // Returns { newInstallers, fixedInstallers, jobCount }
    // ---------------------------------------------------------
    async sync(progressCallback) {
        const log = progressCallback || function () {};

        log('Loading settings…');
        const settings = await this.getSettings();

        log('Fetching people from TeamUp…');
        const subcalendars = await this.fetchSubcalendars(settings);

        log('Fetching jobs from TeamUp…');
        const events = await this.fetchEvents(settings);

        log('Syncing installers…');
        const { newCount, fixedCount } = await this._syncInstallers(subcalendars);

        log('Syncing jobs…');
        const jobCount = await this._syncJobs(events, settings);

        // Record sync time and counts
        await db.collection('settings').doc('teamup').update({
            lastSyncedAt: firebase.firestore.FieldValue.serverTimestamp(),
            cachedJobCount: jobCount,
            cachedInstallerCount: subcalendars.length
        });

        log('Done.');
        return { newInstallers: newCount, fixedInstallers: fixedCount, jobCount, total: subcalendars.length };
    },

    // ---------------------------------------------------------
    // SYNC INSTALLERS
    // Repairs incorrect teamupId values by cross-referencing
    // live TeamUp subcalendars, matching by doc ID, teamupId,
    // or teamupName as fallbacks. Then adds any new installers.
    // ---------------------------------------------------------
    async _syncInstallers(subcalendars) {
        const existing = await db.collection('installers').get();
        const existingDocs = existing.docs.map(d => ({ _ref: d.ref, _id: d.id, ...d.data() }));

        const installerSubs = subcalendars.filter(s =>
            this.classifySubcalendar(s.name) === 'installer'
        );

        // Phase 1: For every installer subcalendar in TeamUp, find its
        // Firestore doc using three fallback strategies, then fix teamupId
        // if wrong. Track which subcalendar IDs are accounted for.
        const fixBatch = db.batch();
        let fixedCount = 0;
        const knownIds = new Set(); // subcalendar IDs already in Firestore

        for (const sub of installerSubs) {
            const sidStr = String(sub.id);

            // Strategy 1: exact teamupId field match (already correct)
            let match = existingDocs.find(d => String(d.teamupId) === sidStr);

            // Strategy 2: doc ID convention  teamup_{id}
            if (!match) match = existingDocs.find(d => d._id === 'teamup_' + sidStr);

            // Strategy 3: teamupName string match (catches old-format doc IDs)
            if (!match) match = existingDocs.find(d =>
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

        // Phase 2: Add installer subcalendars not yet matched in Firestore
        const newOnes = installerSubs.filter(s => !knownIds.has(String(s.id)));

        if (newOnes.length === 0) return { newCount: 0, fixedCount };

        // Write in batches (Firestore limit: 500 per batch)
        const batchSize = 400;
        for (let i = 0; i < newOnes.length; i += batchSize) {
            const batch = db.batch();
            newOnes.slice(i, i + batchSize).forEach(sub => {
                const parsed = this.parseInstallerName(sub.name);
                const ref = db.collection('installers').doc('teamup_' + sub.id);
                batch.set(ref, {
                    teamupId:    sub.id,
                    teamupName:  sub.name,
                    displayName: parsed.displayName,
                    company:     parsed.company,
                    email:       '',
                    phone:       '',
                    status:      'pending',
                    firebaseUid: null,
                    provisionedAt: null,
                    lastLogin:   null,
                    createdAt:   firebase.firestore.FieldValue.serverTimestamp()
                });
            });
            await batch.commit();
        }

        return { newCount: newOnes.length, fixedCount };
    },

    // ---------------------------------------------------------
    // EXTRACT FINANCIALS
    // Priority: TeamUp custom fields (when field IDs are saved
    // in Settings) → fallback to plain-text notes parsing.
    // To switch: enter field IDs in Admin → Settings.
    // ---------------------------------------------------------
    // Helper: get a custom field value by ID (returns '' if not found)
    // Handles both scalar values and array-type choice fields.
    _customField(event, fieldId) {
        if (!fieldId) return '';
        const val = (event.custom || {})[String(fieldId)];
        if (val == null) return '';
        if (Array.isArray(val)) return val.length ? String(val[0]).trim() : '';
        return String(val).trim();
    },

    // Financial fields: Balance Due, Payment Method, Installer Pay
    // Uses known custom field IDs (CF.*) with settings overrides, then notes fallback.
    extractFinancials(event, settings) {
        const s = settings || {};

        const balRaw = this._customField(event, s.finFieldBalanceDue || this.CF.balanceDue);
        const balanceDue = balRaw
            ? balRaw.replace(/[,$\s]/g, '')
            : this._parseBalFromNotes(event.notes || event.notesRaw || '');

        const paymentMethod = this._customField(event, s.finFieldPaymentMethod || this.CF.paymentMethod)
            || this._parsePmFromNotes(event.notes || event.notesRaw || '');

        const installerPay = this._customField(event, s.finFieldInstallerPay || this.CF.contractorAmt)
            .replace(/[,$\s]/g, '');

        const contractAmt = this._customField(event, s.finFieldContractAmt || this.CF.contractAmt)
            .replace(/[,$\s]/g, '');

        return { balanceDue, paymentMethod, installerPay, contractAmt };
    },

    // Job detail fields: counts + customer phone
    extractJobFields(event, settings) {
        const s = settings || {};

        const windowCount   = this._customField(event, s.finFieldWindowCount || this.CF.windowCount);
        const doorCount     = this._customField(event, s.finFieldDoorCount   || this.CF.doorCount);
        const sgdCount      = this._customField(event, s.finFieldSgdCount);
        const customerPhone = this._customField(event, s.finFieldCustomerPhone)
            || this._parsePhoneFromNotes(event.notes || event.notesRaw || '');

        const serviceRaw = this._customField(event, s.finFieldService || this.CF.serviceCall);
        const isServiceCall = serviceRaw.toLowerCase() === 'yes';

        return {
            windowCount:  windowCount ? Number(windowCount) : null,
            doorCount:    doorCount   ? Number(doorCount)   : null,
            sgdCount:     sgdCount    ? Number(sgdCount)    : null,
            customerPhone,
            isServiceCall
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

    // ---------------------------------------------------------
    // SYNC JOBS
    // Upserts all events into the jobs collection.
    // merge:true preserves any linked job_records.
    // ---------------------------------------------------------
    async _syncJobs(events, settings) {
        // Filter to real job events (have a location or customer)
        const jobs = events.filter(e => e.who || e.location);
        if (jobs.length === 0) return 0;

        const batchSize = 400;
        for (let i = 0; i < jobs.length; i += batchSize) {
            const batch = db.batch();
            jobs.slice(i, i + batchSize).forEach(e => {
                const ref       = db.collection('jobs').doc(String(e.id));
                const financials  = this.extractFinancials(e, settings);
                const jobFields   = this.extractJobFields(e, settings);
                const jobNumber = this._customField(e, settings.finFieldJobNumber || this.CF.jobNumber)
                    || this.parseJobNumber(e.who); // fallback: parse from who field (legacy format)
                const customerName = e.who
                    ? (jobNumber && e.who.trim().endsWith(jobNumber)
                        ? this.parseCustomerName(e.who)  // legacy: job# was in who field
                        : e.who.trim())                   // new: who is pure customer name
                    : '';
                batch.set(ref, {
                    id:           String(e.id),
                    seriesId:     e.series_id ? String(e.series_id) : null,
                    jobNumber,
                    customerName,
                    title:        e.title || '',
                    address:      e.location || '',
                    notes:        this.stripHtml(e.notes || ''),
                    notesRaw:     e.notes || '',
                    assignedIds:  (e.subcalendar_ids || []).map(String),
                    startDt:      e.start_dt ? new Date(e.start_dt) : null,
                    endDt:        e.end_dt   ? new Date(e.end_dt)   : null,
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
                    lastSyncedAt: firebase.firestore.FieldValue.serverTimestamp()
                }, { merge: true });
            });
            await batch.commit();
        }

        return jobs.length;
    },

    // ---------------------------------------------------------
    // TEST CONNECTION — just fetches subcalendars to verify creds
    // ---------------------------------------------------------
    async testConnection(apiKey, calendarId) {
        const data = await this._fetch(
            `https://api.teamup.com/${calendarId}/subcalendars`,
            apiKey
        );
        return data.subcalendars ? data.subcalendars.length : 0;
    }
};
