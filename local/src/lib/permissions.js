// What the signed-in user may change. Mirrors server/policy.js, so controls the
// server would refuse are not shown.
const DIVISION_WRITERS = ['Planning_Admin', 'Implementer'];

export const canCreateActivity = (user) => ['admin', 'Implementer'].includes(user?.role);

// Pass a record's division to check one record; leave it out to ask "can this user create here at all".
export function canEditPlanning(user, division) {
  if (user?.role === 'admin') return true;
  if (!DIVISION_WRITERS.includes(user?.role) || !user.division) return false;
  return division === undefined || division === user.division;
}

export const canEditGoals = (user) => user?.role === 'admin';
