// ============================================================
// ARMOR VUE — Firebase Configuration
// Shared by admin and installer portals.
// Load this script AFTER the Firebase SDK scripts.
// ============================================================

(function () {
    const config = {
        apiKey:            "AIzaSyDYFdyiz_T_0Tsqya_CSKS4wRlWOEckMGk",
        authDomain:        "installer-portal-6000.firebaseapp.com",
        projectId:         "installer-portal-6000",
        storageBucket:     "installer-portal-6000.firebasestorage.app",
        messagingSenderId: "582559700006",
        appId:             "1:582559700006:web:e3b795dcf17501e310c2e7"
    };

    if (!firebase.apps.length) {
        firebase.initializeApp(config);
    }

    // Expose globals used by all page scripts
    window.auth    = firebase.auth();
    window.db      = firebase.firestore();
    window.storage = typeof firebase.storage === 'function' ? firebase.storage() : null;

    // Expose config for secondary app instances (e.g. staff creation)
    window.FIREBASE_CONFIG = config;

    // Admin UID — used for role checks in the admin portal
    window.ADMIN_UID = 'yKCWdsUceONZJtysdweYW2vamFV2';
})();
