import crypto from 'node:crypto';
import { openDb } from './db.js';
import { hashPassword } from './auth.js';
import { createRecord, listRecords } from './records.js';
import { defaultPaths } from './app.js';

// Creates the first administrator. Usage: npm run create-admin -- you@deped.gov.ph "Full Name"
const [, , emailArg, ...nameParts] = process.argv;
const email = (emailArg || '').trim().toLowerCase();
if (!email.includes('@')) {
  console.error('Usage: npm run create-admin -- <email> [full name]');
  process.exit(1);
}

const db = openDb(defaultPaths().dataDir);
if (listRecords(db, 'User').some((u) => (u.email || '').toLowerCase() === email)) {
  console.error('That email already has an account.');
  process.exit(1);
}

const password = crypto.randomBytes(9).toString('base64url');
createRecord(db, 'User', {
  email,
  full_name: nameParts.join(' ') || email,
  role: 'admin',
  password_hash: hashPassword(password),
}, 'setup');

console.log(`Administrator created: ${email}`);
console.log(`Temporary password: ${password}`);
console.log('Sign in, then change it with: npm run set-password -- <email> <new password>');
