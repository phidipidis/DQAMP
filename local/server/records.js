import crypto from 'node:crypto';

const now = () => new Date().toISOString();

function parseRow(row) {
  return JSON.parse(row.data);
}

function matchesQuery(record, query = {}) {
  return Object.entries(query).every(([key, expected]) => {
    const actual = record[key];
    if (Array.isArray(actual)) return actual.includes(expected);
    return actual === expected;
  });
}

function sortRecords(records, sort) {
  if (!sort) return records;
  const desc = sort.startsWith('-');
  const key = desc ? sort.slice(1) : sort;
  return [...records].sort((a, b) => {
    const x = a[key] ?? '';
    const y = b[key] ?? '';
    if (x === y) return 0;
    const cmp = x > y ? 1 : -1;
    return desc ? -cmp : cmp;
  });
}

export function listRecords(db, entity, { sort, limit, query } = {}) {
  const rows = db.prepare('SELECT data FROM records WHERE entity = ?').all(entity).map(parseRow);
  const matched = query ? rows.filter((r) => matchesQuery(r, query)) : rows;
  const sorted = sortRecords(matched, sort);
  return limit ? sorted.slice(0, Number(limit)) : sorted;
}

export function getRecord(db, entity, id) {
  const row = db.prepare('SELECT data FROM records WHERE entity = ? AND id = ?').get(entity, id);
  return row ? parseRow(row) : null;
}

function save(db, entity, record) {
  db.prepare(`
    INSERT INTO records (entity, id, data, created_date, updated_date)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(entity, id) DO UPDATE SET data = excluded.data, updated_date = excluded.updated_date
  `).run(entity, record.id, JSON.stringify(record), record.created_date, record.updated_date);
  return record;
}

export function createRecord(db, entity, input, actorEmail) {
  const stamp = now();
  const record = {
    ...input,
    id: input.id || crypto.randomUUID(),
    created_date: stamp,
    updated_date: stamp,
    created_by: actorEmail,
  };
  return save(db, entity, record);
}

export function updateRecord(db, entity, id, changes) {
  const existing = getRecord(db, entity, id);
  if (!existing) return null;
  const { id: _ignored, ...rest } = changes;
  return save(db, entity, { ...existing, ...rest, id, updated_date: now() });
}

export function deleteRecord(db, entity, id) {
  db.prepare('DELETE FROM records WHERE entity = ? AND id = ?').run(entity, id);
}

export function createMany(db, entity, rows, actorEmail) {
  db.exec('BEGIN');
  try {
    const created = rows.map((row) => createRecord(db, entity, row, actorEmail));
    db.exec('COMMIT');
    return created;
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}
