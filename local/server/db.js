import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';

export const ENTITIES = [
  'DQAMPActivity', 'Project', 'ProjectOutputs', 'DivisionObjective', 'OrganizationalGoal',
  'Project_Objectives', 'ARTAFeedback', 'QAME_Assessor', 'Audit_Log', 'AuditTask',
  'ArchivedProject', 'Document_Library', 'SystemSetting', 'User',
];

export function openDb(dataDir) {
  fs.mkdirSync(dataDir, { recursive: true });
  const db = new DatabaseSync(path.join(dataDir, 'dqamp.db'));
  db.exec(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS records (
      entity TEXT NOT NULL,
      id TEXT NOT NULL,
      data TEXT NOT NULL,
      created_date TEXT,
      updated_date TEXT,
      PRIMARY KEY (entity, id)
    );
    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      expires_at INTEGER NOT NULL
    );
  `);
  return db;
}
