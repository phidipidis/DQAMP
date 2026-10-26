// Local stand-in for the Base44 SDK. It keeps the same `base44` surface the pages
// already use, but every call goes to the DQAMP server running on this PC.

const request = async (method, url, body) => {
  const res = await fetch(url, {
    method,
    credentials: 'same-origin',
    headers: body === undefined ? {} : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = res.status === 204 ? null : await res.json().catch(() => null);
  if (!res.ok) {
    const error = new Error(data?.message || res.statusText);
    error.status = res.status;
    error.data = data;
    throw error;
  }
  return data;
};

const withQuery = (url, params) => {
  const search = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null)
  ).toString();
  return search ? `${url}?${search}` : url;
};

const entityApi = (name) => {
  const base = `/api/entities/${name}`;
  return {
    list: (sort, limit) => request('GET', withQuery(base, { sort, limit })),
    filter: (query, sort, limit) => request('POST', `${base}/filter`, { query, sort, limit }),
    create: (data) => request('POST', base, data),
    bulkCreate: (rows) => request('POST', `${base}/bulk`, rows),
    update: (id, data) => request('PUT', `${base}/${id}`, data),
    delete: (id) => request('DELETE', `${base}/${id}`),
  };
};

const ENTITY_NAMES = [
  'DQAMPActivity', 'Project', 'ProjectOutputs', 'DivisionObjective', 'OrganizationalGoal',
  'Project_Objectives', 'ARTAFeedback', 'QAME_Assessor', 'Audit_Log', 'AuditTask',
  'ArchivedProject', 'Document_Library', 'SystemSetting', 'User',
];

const entities = Object.fromEntries(ENTITY_NAMES.map((name) => [name, entityApi(name)]));

export const base44 = {
  entities,
  auth: {
    me: () => request('GET', '/api/auth/me'),
    isAuthenticated: async () => {
      try {
        await request('GET', '/api/auth/me');
        return true;
      } catch {
        return false;
      }
    },
    login: (email, password) => request('POST', '/api/auth/login', { email, password }),
    logout: async (redirectTo) => {
      await request('POST', '/api/auth/logout').catch(() => {});
      window.location.href = redirectTo || '/login';
    },
    redirectToLogin: () => {
      window.location.href = '/login';
    },
  },
  users: {
    inviteUser: (email, role) => request('POST', '/api/users/invite', { email, role }),
  },
  appLogs: {
    logUserInApp: () => Promise.resolve(),
  },
};
