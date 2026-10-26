import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createApp } from './app.js';
import { createRecord, updateRecord, getRecord } from './records.js';
import { createSession, hashPassword } from './auth.js';
import { openDb } from './db.js';

let server, base, db, tokens = {}, ids = {};

const call = async (who, method, url, body) => {
  const res = await fetch(base + url, {
    method,
    headers: { 'Content-Type': 'application/json', Cookie: `dqamp_session=${tokens[who]}` },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = res.status === 204 ? null : await res.json().catch(() => null);
  return { status: res.status, data };
};

before(async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dqamp-test-'));
  const app = createApp({ dataDir: dir, distDir: null });
  db = app.locals.db;
  const user = (email, role, division) => createRecord(db, 'User', {
    email, role, division, full_name: email, password_hash: hashPassword('x'),
  }, 'test');
  const people = {
    admin: user('admin@t.test', 'admin', null),
    impl: user('impl@t.test', 'Implementer', 'CID'),
    planning: user('plan@t.test', 'Planning_Admin', 'CID'),
    qa: user('qa@t.test', 'QA_Assessor', null),
  };
  for (const [who, u] of Object.entries(people)) {
    tokens[who] = createSession(db, u.id).token;
    ids[who] = u.id;
  }
  const act = (title, division, status) => createRecord(db, 'DQAMPActivity', {
    Activity_Title: title, Functional_Division: division, Workflow_Status: status,
  }, 'test').id;
  ids.actCidDraft = act('CID draft', 'CID', 'Draft');
  ids.actSgodDraft = act('SGOD draft', 'SGOD', 'Draft');
  ids.actCidSubmitted = act('CID submitted', 'CID', 'Submitted');
  ids.actCidReview = act('CID under review', 'CID', 'Under Review');
  ids.projCid = createRecord(db, 'Project', { Project_Code: 'CID-01', Project_Title: 'CID project', Functional_Division: 'CID' }, 'test').id;
  ids.projSgod = createRecord(db, 'Project', { Project_Code: 'SGOD-01', Project_Title: 'SGOD project', Functional_Division: 'SGOD' }, 'test').id;

  await new Promise((resolve) => { server = app.listen(0, '127.0.0.1', resolve); });
  base = `http://127.0.0.1:${server.address().port}`;
});

after(() => server?.close());

test('implementer sees and edits only their division', async () => {
  const list = await call('impl', 'GET', '/api/entities/DQAMPActivity');
  assert.ok(list.data.every((a) => a.Functional_Division === 'CID'));
  assert.equal((await call('impl', 'GET', `/api/entities/DQAMPActivity/${ids.actSgodDraft}`)).status, 404);
  assert.equal((await call('impl', 'PUT', `/api/entities/DQAMPActivity/${ids.actSgodDraft}`, { Activity_Title: 'x' })).status, 404);
  assert.equal((await call('impl', 'PUT', `/api/entities/DQAMPActivity/${ids.actCidDraft}`, { Activity_Title: 'Edited' })).status, 200);
});

test('implementer can create only Draft activities in their division', async () => {
  assert.equal((await call('impl', 'POST', '/api/entities/DQAMPActivity', { Functional_Division: 'CID', Activity_Title: 'new' })).status, 201);
  assert.equal((await call('impl', 'POST', '/api/entities/DQAMPActivity', { Functional_Division: 'SGOD', Activity_Title: 'no' })).status, 403);
  assert.equal((await call('impl', 'POST', '/api/entities/DQAMPActivity', { Functional_Division: 'CID', Workflow_Status: 'Published' })).status, 403);
});

test('implementer submits, but cannot review, publish or edit after review', async () => {
  assert.equal((await call('impl', 'PUT', `/api/entities/DQAMPActivity/${ids.actCidDraft}`, { Workflow_Status: 'Submitted', Assigned_Assessors: [] })).status, 200);
  assert.equal((await call('impl', 'PUT', `/api/entities/DQAMPActivity/${ids.actCidDraft}`, { QAME_Rating: 'Excellent' })).status, 403);
  assert.equal((await call('impl', 'PUT', `/api/entities/DQAMPActivity/${ids.actCidReview}`, { Activity_Title: 'x' })).status, 403);
  assert.equal((await call('impl', 'PUT', `/api/entities/DQAMPActivity/${ids.actCidReview}`, { Workflow_Status: 'Published' })).status, 403);
});

test('QA assessor sees every activity, reviews, but cannot change planning content', async () => {
  const list = await call('qa', 'GET', '/api/entities/DQAMPActivity');
  assert.equal(list.data.length, 5);
  assert.equal((await call('qa', 'PUT', `/api/entities/DQAMPActivity/${ids.actCidReview}`, { QAME_Rating: 'Very Satisfactory', QAME_Rating_Score: 4 })).status, 200);
  assert.equal((await call('qa', 'PUT', `/api/entities/DQAMPActivity/${ids.actCidReview}`, { Activity_Title: 'x' })).status, 403);
  assert.equal((await call('qa', 'PUT', `/api/entities/DQAMPActivity/${ids.actCidReview}`, { Workflow_Status: 'Published' })).status, 403);
  assert.equal((await call('qa', 'PUT', `/api/entities/DQAMPActivity/${ids.actCidReview}`, { Workflow_Status: 'Returned for Revision', Return_For_Revision_Note: 'Fix budget' })).status, 200);
  assert.equal((await call('qa', 'POST', '/api/entities/DQAMPActivity', { Functional_Division: 'CID' })).status, 403);
  assert.equal((await call('qa', 'POST', '/api/entities/Project', { Project_Code: 'Q', Functional_Division: 'CID' })).status, 403);
});

test('planning admin reads all activities but edits none', async () => {
  assert.equal((await call('planning', 'GET', '/api/entities/DQAMPActivity')).data.length, 5);
  assert.equal((await call('planning', 'PUT', `/api/entities/DQAMPActivity/${ids.actCidDraft}`, { Activity_Title: 'x' })).status, 403);
  assert.equal((await call('planning', 'POST', '/api/entities/DQAMPActivity', { Functional_Division: 'CID' })).status, 403);
});

test('planning admin edits planning records only in their division', async () => {
  assert.equal((await call('planning', 'PUT', `/api/entities/Project/${ids.projCid}`, { Project_Title: 'Renamed' })).status, 200);
  assert.equal((await call('planning', 'PUT', `/api/entities/Project/${ids.projSgod}`, { Project_Title: 'x' })).status, 403);
  assert.equal((await call('planning', 'POST', '/api/entities/Project', { Project_Code: 'C2', Functional_Division: 'SGOD' })).status, 403);
  assert.equal((await call('planning', 'POST', '/api/entities/ProjectOutputs', { Linked_Project: ids.projSgod, Output_Title: 'x' })).status, 403);
  assert.equal((await call('planning', 'POST', '/api/entities/ProjectOutputs', { Linked_Project: ids.projCid, Output_Title: 'ok' })).status, 201);
});

test('only admin publishes, deletes activities, changes organizational goals and manages users', async () => {
  assert.equal((await call('admin', 'PUT', `/api/entities/DQAMPActivity/${ids.actCidReview}`, { Workflow_Status: 'Published' })).status, 200);
  assert.equal((await call('admin', 'DELETE', `/api/entities/DQAMPActivity/${ids.actSgodDraft}`)).status, 204);
  assert.equal((await call('planning', 'DELETE', `/api/entities/DQAMPActivity/${ids.actCidDraft}`)).status, 403);
  assert.equal((await call('admin', 'POST', '/api/entities/OrganizationalGoal', { Goal_Title: 'G' })).status, 201);
  assert.equal((await call('planning', 'POST', '/api/entities/OrganizationalGoal', { Goal_Title: 'G' })).status, 403);
  assert.equal((await call('impl', 'POST', '/api/users/invite', { email: 'x@t.test', role: 'Implementer', division: 'CID' })).status, 403);
});

test('people only see their own account, and audit history is admin-only', async () => {
  const users = await call('impl', 'GET', '/api/entities/User');
  assert.equal(users.data.length, 1);
  assert.equal(users.data[0].email, 'impl@t.test');
  assert.equal((await call('admin', 'GET', '/api/entities/User')).data.length, 4);
  assert.equal((await call('impl', 'GET', '/api/entities/Audit_Log')).data.length, 0);
});

test('client feedback: implementers record it for their division only', async () => {
  const cid = (await call('admin', 'POST', '/api/entities/DQAMPActivity', { Activity_Title: 'CID event', Functional_Division: 'CID' })).data.id;
  const sgod = (await call('admin', 'POST', '/api/entities/DQAMPActivity', { Activity_Title: 'SGOD event', Functional_Division: 'SGOD' })).data.id;
  assert.equal((await call('impl', 'POST', '/api/entities/ARTAFeedback', { Linked_Activity: cid, Average_SQD_Score: 4.5 })).status, 201);
  assert.equal((await call('impl', 'POST', '/api/entities/ARTAFeedback', { Linked_Activity: sgod, Average_SQD_Score: 4.5 })).status, 403);
  assert.equal((await call('planning', 'POST', '/api/entities/ARTAFeedback', { Linked_Activity: cid })).status, 403);
  assert.equal((await call('qa', 'POST', '/api/entities/ARTAFeedback', { Linked_Activity: sgod })).status, 201);
});

test('invites need a division for implementers and planning admins', async () => {
  assert.equal((await call('admin', 'POST', '/api/users/invite', { email: 'n@t.test', role: 'Implementer' })).status, 400);
  assert.equal((await call('admin', 'POST', '/api/users/invite', { email: 'n@t.test', role: 'Implementer', division: 'CID' })).status, 201);
});
