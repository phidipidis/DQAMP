// Which role may move an activity into each workflow status.
// Mirrors the server rules in server/policy.js; administrators may make any move.
const MOVE_ROLES = {
  'Submitted': ['Implementer'],
  'Under Review': ['QA_Assessor'],
  'Returned for Revision': ['QA_Assessor'],
  'Published': [],
};

export function canMoveTo(role, status) {
  if (role === 'admin') return true;
  return Boolean(MOVE_ROLES[status]?.includes(role));
}
