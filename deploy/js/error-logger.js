// ============================================================
// ARMOR VUE — Error Logger & Analytics
// Shared by all portals. Load AFTER firebase-config.js.
//
// Globals exposed:
//   window._initLogger(portal)          — call once on page load
//   window._logError(context, err)      — log a caught error
//   window._logEvent(eventName, data)   — log an analytics event
// ============================================================

(function () {
    const APP_VERSION = 'v2.7.0';
    let _portal       = 'unknown';
    let _errorCount   = 0;
    const MAX_ERRORS  = 15;          // cap writes per session
    const _seenErrors = new Set();   // deduplicate identical errors

    // ── Helpers ───────────────────────────────────────────────

    function uid()         { try { return firebase.auth().currentUser?.uid || null; } catch(e) { return null; } }
    function installerId() { try { return window.currentInstaller?.id    || null; } catch(e) { return null; } }
    function installerName() { try { return window.currentInstaller?.displayName || null; } catch(e) { return null; } }

    function write(collection, data) {
        try {
            if (!window.db) return;
            window.db.collection(collection).add({
                ...data,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });
        } catch(e) { /* never throw from the logger */ }
    }

    // ── Error logging ─────────────────────────────────────────

    window._logError = function (context, err, extra) {
        if (_errorCount >= MAX_ERRORS) return;
        const msg = (err && (err.message || String(err))) || 'Unknown error';
        const key = context + ':' + msg;
        if (_seenErrors.has(key)) return;
        _seenErrors.add(key);
        _errorCount++;

        write('error_logs', {
            portal:       _portal,
            version:      APP_VERSION,
            context,
            message:      msg,
            stack:        (err?.stack || '').slice(0, 1500) || null,
            url:          window.location.pathname + window.location.search,
            uid:          uid(),
            installerId:  installerId(),
            installerName: installerName(),
            userAgent:    navigator.userAgent,
            ...(extra || {})
        });
    };

    // ── Analytics events ──────────────────────────────────────

    window._logEvent = function (eventName, data) {
        write('analytics_events', {
            event:         eventName,
            portal:        _portal,
            version:       APP_VERSION,
            uid:           uid(),
            installerId:   installerId(),
            installerName: installerName(),
            ...(data || {})
        });
    };

    // ── Global error traps ────────────────────────────────────

    window.onerror = function (msg, src, line, col, err) {
        window._logError('window_onerror', err || { message: msg, stack: '' }, { src, line, col });
        return false; // don't suppress default behaviour
    };

    window.addEventListener('unhandledrejection', function (e) {
        const reason = e.reason;
        const err = reason instanceof Error ? reason : { message: String(reason), stack: '' };
        window._logError('unhandled_rejection', err);
    });

    // ── Init ──────────────────────────────────────────────────

    window._initLogger = function (portal) {
        _portal = portal;
    };

})();
