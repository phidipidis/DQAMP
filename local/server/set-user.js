import { openDb } from './db.js';
import { updateRecord, listRecords } from './records.js';
import { defaultPaths } from './app.js';
import { DIVISIONS } from './policy.js';

// Usage: npm run set-user -- <email> [--role <role>] [--division <CID|SGOD|OSDS>]
const args = process.argv.slice(2);
const email = (args[0] || '').trim().toLowerCase();
const flag = (name) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : undefined; };
const role = flag('--role');
const division = flag('--division');
const ROLES = ['admin', 'Implementer', 'Planning_Admin', 'QA_Assessor'];

if (!email || (!role && !division)) {
  console.error('Usage: npm run set-user -- <email> [--role <admin|Implementer|Planning_Admin|QA_Assessor>] [--division <CID|SGOD|OSDS>]');
  process.exit(1);
}
if (role && !ROLES.includes(role)) { console.error(`Unknown role: ${role}`); process.exit(1); }
if (division && !DIVISIONS.includes(division)) { console.error(`Unknown division: ${division}`); process.exit(1); }

const db = openDb(defaultPaths().dataDir);
const account = listRecords(db, 'User').find((u) => (u.email || '').toLowerCase() === email);
if (!account) { console.error('No account with that email.'); process.exit(1); }

const changes = {};
if (role) changes.role = role;
if (division) changes.division = division;
updateRecord(db, 'User', account.id, changes);
console.log(`Updated ${account.email}:`, changes);
