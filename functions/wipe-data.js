// Wipe transactional data from Firestore
// Keeps: installers, management_users, defect_types, photo_requirements, settings
// Deletes everything else (TeamUp data, installer history, days off, etc.)

const admin = require('firebase-admin');

admin.initializeApp({ projectId: 'installer-portal-6000' });
const db = admin.firestore();

const COLLECTIONS_TO_DELETE = [
  'jobs',
  'job_records',
  'failed_inspections',
  'extra_work_requests',
  'blackout_requests',
  'archive_log',
  'installer_history',
  'management_actions',
  'material_orders',
  'reminders',
];

async function deleteCollection(collectionName) {
  const ref = db.collection(collectionName);
  let deleted = 0;

  while (true) {
    const snapshot = await ref.limit(500).get();
    if (snapshot.empty) break;

    const batch = db.batch();
    snapshot.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
    deleted += snapshot.docs.length;
    process.stdout.write(`\r  ${collectionName}: ${deleted} deleted...`);
  }

  console.log(`\r  ${collectionName}: ${deleted} documents deleted.`);
}

async function main() {
  console.log('Starting data wipe...\n');

  for (const col of COLLECTIONS_TO_DELETE) {
    await deleteCollection(col);
  }

  console.log('\nDone. Database is clean.');
  process.exit(0);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
