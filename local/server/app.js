import express from 'express';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { ENTITIES, openDb } from './db.js';
import {
  hashPassword, verifyPassword, createSession, deleteSession,
  userForToken, publicUser, readCookie,
} from './auth.js';
import {
  listRecords, getRecord, createRecord, updateRecord, deleteRecord, createMany,
} from './records.js';

const ROLES = ['admin', 'Implementer', 'Planning_Admin', 'QA_Assessor'];
const COOKIE = 'dqamp_session';

export function createApp({ dataDir, distDir }) {
  const db = openDb(dataDir);
  const app = express();
  app.use(express.json({ limit: '5mb' }));

  const requireUser = (req, res, next) => {
    const user = userForToken(db, readCookie(req, COOKIE));
    if (!user) return res.status(401).json({ message: 'Authentication required' });
    req.user = user;
    next();
  };

  const requireAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Admins only' });
    next();
  };

  const knownEntity = (req, res, next) => {
    if (!ENTITIES.includes(req.params.entity)) return res.status(404).json({ message: 'Unknown table' });
    next();
  };

  const sanitize = (entity, record) => (entity === 'User' ? publicUser(record) : record);

  // ---- auth ----
  app.post('/api/auth/login', (req, res) => {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '');
    const account = listRecords(db, 'User').find((u) => (u.email || '').toLowerCase() === email);
    if (!account || !account.password_hash || !verifyPassword(password, account.password_hash)) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    const session = createSession(db, account.id);
    res.setHeader('Set-Cookie', `${COOKIE}=${session.token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${session.maxAgeSeconds}`);
    res.json(publicUser(account));
  });

  app.post('/api/auth/logout', (req, res) => {
    deleteSession(db, readCookie(req, COOKIE));
    res.setHeader('Set-Cookie', `${COOKIE}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0`);
    res.json({ ok: true });
  });

  app.get('/api/auth/me', requireUser, (req, res) => res.json(publicUser(req.user)));

  // ---- user administration (admin only) ----
  app.post('/api/users/invite', requireUser, requireAdmin, (req, res) => {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const role = ROLES.includes(req.body?.role) ? req.body.role : 'Implementer';
    if (!email.includes('@')) return res.status(400).json({ message: 'A valid email is required' });
    const exists = listRecords(db, 'User').some((u) => (u.email || '').toLowerCase() === email);
    if (exists) return res.status(409).json({ message: 'That email already has an account' });
    const temporaryPassword = Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 6);
    const user = createRecord(db, 'User', {
      email, role, full_name: email.split('@')[0], password_hash: hashPassword(temporaryPassword),
    }, req.user.email);
    res.status(201).json({ user: publicUser(user), temporaryPassword });
  });

  // ---- entities ----
  app.get('/api/entities/:entity', requireUser, knownEntity, (req, res) => {
    const rows = listRecords(db, req.params.entity, { sort: req.query.sort, limit: req.query.limit });
    res.json(rows.map((r) => sanitize(req.params.entity, r)));
  });

  app.post('/api/entities/:entity/filter', requireUser, knownEntity, (req, res) => {
    const rows = listRecords(db, req.params.entity, {
      query: req.body?.query, sort: req.body?.sort, limit: req.body?.limit,
    });
    res.json(rows.map((r) => sanitize(req.params.entity, r)));
  });

  app.post('/api/entities/:entity/bulk', requireUser, knownEntity, (req, res) => {
    if (req.params.entity === 'User') return res.status(403).json({ message: 'Use the invite form to add users' });
    const rows = Array.isArray(req.body) ? req.body : [];
    res.status(201).json(createMany(db, req.params.entity, rows, req.user.email));
  });

  app.post('/api/entities/:entity', requireUser, knownEntity, (req, res) => {
    const entity = req.params.entity;
    if (entity === 'User') return res.status(403).json({ message: 'Use the invite form to add users' });
    res.status(201).json(createRecord(db, entity, req.body || {}, req.user.email));
  });

  app.put('/api/entities/:entity/:id', requireUser, knownEntity, (req, res) => {
    const { entity, id } = req.params;
    const changes = { ...(req.body || {}) };
    if (entity === 'User') {
      if (req.user.role !== 'admin' && req.user.id !== id) return res.status(403).json({ message: 'Admins only' });
      if (req.user.role !== 'admin') delete changes.role;
      if (changes.password) {
        changes.password_hash = hashPassword(String(changes.password));
        delete changes.password;
      }
    }
    const updated = updateRecord(db, entity, id, changes);
    if (!updated) return res.status(404).json({ message: 'Record not found' });
    res.json(sanitize(entity, updated));
  });

  app.delete('/api/entities/:entity/:id', requireUser, knownEntity, (req, res) => {
    const { entity, id } = req.params;
    if (entity === 'User') return res.status(403).json({ message: 'Users cannot be deleted here' });
    deleteRecord(db, entity, id);
    res.status(204).end();
  });

  app.get('/api/entities/:entity/:id', requireUser, knownEntity, (req, res) => {
    const record = getRecord(db, req.params.entity, req.params.id);
    if (!record) return res.status(404).json({ message: 'Record not found' });
    res.json(sanitize(req.params.entity, record));
  });

  // ---- static frontend ----
  if (distDir && fs.existsSync(distDir)) {
    app.use(express.static(distDir));
    app.get(/^(?!\/api\/).*/, (req, res) => res.sendFile(path.join(distDir, 'index.html')));
  }

  app.locals.db = db;
  return app;
}

export function defaultPaths() {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const root = path.resolve(here, '..');
  return { dataDir: path.join(root, 'data'), distDir: path.join(root, 'dist') };
}
