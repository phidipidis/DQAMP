import { openDb } from './db.js';
import { hashPassword } from './auth.js';
import { listRecords, updateRecord } from './records.js';
import { defaultPaths } from './app.js';

// Changes a password from the command line. Usage: npm run set-password -- <email> <new password>
const [, , emailArg, password] = process.argv;
if (!emailArg || !password || password.length < 8) {
  console.error('Usage: npm run set-password -- <email> <new password (8+ characters)>');
  process.exit(1);
}

const db = openDb(defaultPaths().dataDir);
const account = listRecords(db, 'User').find((u) => (u.email || '').toLowerCase() === emailArg.trim().toLowerCase());
if (!account) {
  console.error('No account with that email.');
  process.exit(1);
}
updateRecord(db, 'User', account.id, { password_hash: hashPassword(password) });
console.log(`Password updated for ${account.email}.`);
