// Server-side access rules. The browser hides what a role cannot use; these
// checks are what actually stop a request.

export const DIVISIONS = ['CID', 'SGOD', 'OSDS'];

const SEES_ALL_ACTIVITIES = ['Planning_Admin', 'QA_Assessor'];
const DIVISION_WRITERS = ['Planning_Admin', 'Implementer'];
const PLANNING_CHILDREN = ['ProjectOutputs', 'Project_Objectives'];
const DIVISION_RECORDS = ['Project', 'DivisionObjective'];

// Workflow moves and who may make them (admin may make any move).
const WORKFLOW = {
  'Draft>Submitted': ['Implementer'],
  'Returned for Revision>Submitted': ['Implementer'],
  'Submitted>Under Review': ['QA_Assessor'],
  'Under Review>Returned for Revision': ['QA_Assessor'],
  'Under Review>Published': [],
};

// Fields an assessor may change while reviewing.
const QA_FIELDS = new Set([
  'QAME_Evaluation_Form_URL', 'QAME_Report_File', 'QAME_Rating', 'QAME_Rating_Score',
  'QAME_Venue_Rating', 'QAME_Assessor', 'QAME_Remarks', 'Remarks_For_Improvement',
  'Return_For_Revision_Note', 'Reviewed_By', 'Reviewed_Date',
]);

// Fields only a reviewer or admin may set on an activity.
const REVIEW_ONLY = new Set([
  ...QA_FIELDS, 'Published_Date', 'Assigned_Assessors',
]);

const isAdmin = (user) => user.role === 'admin';
const inDivision = (user, division) => Boolean(user.division) && division === user.division;

function parentProjectOf(entity, record, lookup) {
  if (!PLANNING_CHILDREN.includes(entity)) return null;
  const link = Array.isArray(record.Linked_Project) ? record.Linked_Project[0] : record.Linked_Project;
  return link ? lookup('Project', link) : null;
}

function divisionOf(entity, record, lookup) {
  if (entity === 'DQAMPActivity' || DIVISION_RECORDS.includes(entity)) return record.Functional_Division;
  const parent = parentProjectOf(entity, record, lookup);
  return parent ? parent.Functional_Division : undefined;
}

export function canRead(user, entity, record) {
  if (isAdmin(user)) return true;
  if (entity === 'User') return record.id === user.id;
  if (entity === 'Audit_Log') return false;
  if (entity === 'DQAMPActivity') {
    return SEES_ALL_ACTIVITIES.includes(user.role) || inDivision(user, record.Functional_Division);
  }
  return true;
}

function transitionAllowed(user, from, to) {
  if (!to || to === from) return true;
  const allowedRoles = WORKFLOW[`${from}>${to}`];
  return Boolean(allowedRoles && allowedRoles.includes(user.role));
}

export function canCreate(user, entity, data, lookup) {
  if (isAdmin(user)) return true;
  switch (entity) {
    case 'Audit_Log':
      return true;
    case 'DQAMPActivity':
      return user.role === 'Implementer'
        && inDivision(user, data.Functional_Division)
        && (data.Workflow_Status || 'Draft') === 'Draft';
    case 'Project':
    case 'DivisionObjective':
      return DIVISION_WRITERS.includes(user.role) && inDivision(user, data.Functional_Division);
    case 'ProjectOutputs':
    case 'Project_Objectives': {
      if (!DIVISION_WRITERS.includes(user.role)) return false;
      const parent = parentProjectOf(entity, data, lookup);
      return Boolean(parent) && inDivision(user, parent.Functional_Division);
    }
    case 'ARTAFeedback':
    case 'AuditTask':
      return user.role === 'QA_Assessor';
    case 'Document_Library':
      return true;
    default:
      return false;
  }
}

export function canUpdate(user, entity, existing, changes, lookup) {
  if (isAdmin(user)) return true;
  if (entity === 'DQAMPActivity') return canUpdateActivity(user, existing, changes);
  if (DIVISION_RECORDS.includes(entity) || PLANNING_CHILDREN.includes(entity)) {
    if (!DIVISION_WRITERS.includes(user.role)) return false;
    if (!inDivision(user, divisionOf(entity, existing, lookup))) return false;
    if (changes.Functional_Division !== undefined && !inDivision(user, changes.Functional_Division)) return false;
    if (changes.Linked_Project !== undefined) {
      const next = lookup('Project', changes.Linked_Project);
      if (!next || !inDivision(user, next.Functional_Division)) return false;
    }
    return true;
  }
  if (entity === 'ARTAFeedback' || entity === 'AuditTask') return user.role === 'QA_Assessor';
  if (entity === 'Document_Library') return true;
  return false;
}

function canUpdateActivity(user, existing, changes) {
  const from = existing.Workflow_Status || 'Draft';
  const to = changes.Workflow_Status;
  if (!transitionAllowed(user, from, to)) return false;
  const keys = Object.keys(changes).filter((k) => !['Workflow_Status', 'id'].includes(k));

  if (user.role === 'Implementer') {
    if (!inDivision(user, existing.Functional_Division)) return false;
    if (changes.Functional_Division !== undefined && !inDivision(user, changes.Functional_Division)) return false;
    if (!['Draft', 'Submitted', 'Returned for Revision'].includes(from)) return false;
    const submitting = to === 'Submitted';
    return keys.every((k) => !REVIEW_ONLY.has(k) || (k === 'Assigned_Assessors' && submitting));
  }

  if (user.role === 'QA_Assessor') {
    const reviewing = from === 'Under Review' || (from === 'Submitted' && to === 'Under Review');
    if (!reviewing) return keys.length === 0 && Boolean(to);
    return keys.every((k) => QA_FIELDS.has(k));
  }

  return false; // Planning_Admin: read-only on activities
}

export function canDelete(user, entity, existing, lookup) {
  if (isAdmin(user)) return true;
  if (entity === 'Document_Library') return existing.created_by === user.email;
  if (DIVISION_RECORDS.includes(entity) || PLANNING_CHILDREN.includes(entity)) {
    return DIVISION_WRITERS.includes(user.role) && inDivision(user, divisionOf(entity, existing, lookup));
  }
  return false;
}
