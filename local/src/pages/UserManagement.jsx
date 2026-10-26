import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import SharedPageContainer from '@/components/ui/SharedPageContainer';
import {
  KPIBand,
  KPITile,
  Panel,
  DashboardPanel,
  DashboardTable,
  C,
  FONT,
} from '@/components/ui/DashboardSystem';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';


import {
  UserPlus,
  Search,
  Users,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import InviteUserDialog from '@/components/users/InviteUserDialog';
import { logAuditEvent } from '@/components/audit/AuditLogger';

const ROLE_CONFIG = {
  admin: { label: 'Administrator', color: C.danger, bg: C.dangerSoft },
  Planning_Admin: { label: 'Planning Admin', color: C.brand, bg: C.accentSoft },
  QA_Assessor: { label: 'QA Assessor', color: C.warning, bg: C.warningSoft },
  Implementer: { label: 'Implementer', color: C.success, bg: C.successSoft },
  user: { label: 'User (Default)', color: C.neutral, bg: C.neutralSoft },
};

const ROLE_VALUES = Object.keys(ROLE_CONFIG);
const DIVISIONS = ['CID', 'SGOD', 'OSDS'];
// Roles that work inside one division. Admins and QA assessors see all divisions.
const DIVISION_ROLES = ['Implementer', 'Planning_Admin'];

function RoleBadge({ role }) {
  const cfg = ROLE_CONFIG[role] || { label: role || 'Unknown', color: C.muted, bg: C.neutralSoft };
  return (
    <span
      style={{
        fontFamily: FONT,
        fontSize: 11,
        fontWeight: 600,
        color: cfg.color,
        background: cfg.bg,
        padding: '3px 10px',
        borderRadius: 999,
        whiteSpace: 'nowrap',
      }}
    >
      {cfg.label}
    </span>
  );
}

function DivisionSelect({ value, onChange, disabled, label }) {
  return (
    <select
      aria-label={label}
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      style={{
        fontFamily: FONT,
        fontSize: 12,
        fontWeight: 600,
        color: C.text,
        padding: '5px 10px',
        borderRadius: 6,
        border: `1px solid ${C.border}`,
        background: C.surface,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
      }}
    >
      {!value && <option value="">Not set</option>}
      {DIVISIONS.map((d) => (
        <option key={d} value={d}>{d}</option>
      ))}
    </select>
  );
}

function RoleSelect({ value, onChange, disabled }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      style={{
        fontFamily: FONT,
        fontSize: 12,
        fontWeight: 600,
        color: C.text,
        padding: '5px 10px',
        borderRadius: 6,
        border: `1px solid ${C.border}`,
        background: C.surface,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
      }}
    >
      {ROLE_VALUES.map((r) => (
        <option key={r} value={r}>
          {ROLE_CONFIG[r].label}
        </option>
      ))}
    </select>
  );
}

export default function UserManagement() {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [inviteOpen, setInviteOpen] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
  const [actionError, setActionError] = useState('');

  const queryClient = useQueryClient();

  const { data: currentUser } = useQuery({
    queryKey: ['auth-me'],
    queryFn: () => base44.auth.me(),
    staleTime: 60000,
  });

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['system-users'],
    queryFn: () => base44.entities.User.list(),
    enabled: !!currentUser,
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['system-users'] });

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      (u.full_name || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q);
    const matchesRole = roleFilter === 'All' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const counts = {
    total: users.length,
    admin: users.filter((u) => u.role === 'admin').length,
    planning: users.filter((u) => u.role === 'Planning_Admin').length,
    qa: users.filter((u) => u.role === 'QA_Assessor').length,
    impl: users.filter((u) => u.role === 'Implementer' || u.role === 'user').length,
  };

  const isSelf = (u) => currentUser && u.id === currentUser.id;

  const handleRoleChange = async (user, newRole) => {
    const prevRole = user.role;
    if (newRole === prevRole) return;
    const userId = user.id;
    // Division follows the role: division roles keep or get one, others lose it.
    const newDivision = DIVISION_ROLES.includes(newRole) ? (user.division || 'CID') : null;
    setUpdatingId(userId);
    setActionError('');
    try {
      await base44.entities.User.update(userId, { role: newRole, division: newDivision });
      await logAuditEvent({
        actionType: 'Role_Change',
        entity: 'User',
        recordId: userId,
        remarks: `Changed role from ${ROLE_CONFIG[prevRole]?.label || prevRole} to ${ROLE_CONFIG[newRole]?.label || newRole}`,
        previousValues: { role: prevRole, division: user.division || null },
        newValues: { role: newRole, division: newDivision },
      });
      refresh();
    } catch (err) {
      setActionError(err?.message || 'Failed to update user role.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDivisionChange = async (user, newDivision) => {
    if (newDivision === (user.division || '')) return;
    setUpdatingId(user.id);
    setActionError('');
    try {
      await base44.entities.User.update(user.id, { division: newDivision });
      await logAuditEvent({
        actionType: 'Division_Change',
        entity: 'User',
        recordId: user.id,
        remarks: `Changed division of ${user.email} from ${user.division || 'Not set'} to ${newDivision}`,
        previousValues: { division: user.division || null },
        newValues: { division: newDivision },
      });
      refresh();
    } catch (err) {
      setActionError(err?.message || 'Failed to update division.');
    } finally {
      setUpdatingId(null);
    }
  };


  const formatDate = (d) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  // Access guard
  if (currentUser && currentUser.role !== 'admin') {
    return (
      <SharedPageContainer title="User Management" subtitle="System administration">
        <Panel>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '20px 0' }}>
            <AlertCircle size={20} color={C.danger} />
            <div>
              <p style={{ fontFamily: FONT, fontSize: 15, fontWeight: 600, color: C.text }}>
                Access Restricted
              </p>
              <p style={{ fontFamily: FONT, fontSize: 13, color: C.muted, marginTop: 4 }}>
                Only administrators can manage users. Contact your system administrator if you need access.
              </p>
            </div>
          </div>
        </Panel>
      </SharedPageContainer>
    );
  }

  const headers = [
    { label: 'Name' },
    { label: 'Email' },
    { label: 'Role' },
    { label: 'Division' },
    { label: 'Joined', align: 'right' },
  ];

  const renderRow = (u, i) => {
    const self = isSelf(u);
    return (
      <tr
        key={u.id}
        style={{ borderBottom: i === filtered.length - 1 ? 'none' : `1px solid ${C.border}` }}
      >
        <td style={{ padding: '12px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: C.accentSoft,
                color: C.brand,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 12,
                fontWeight: 700,
                fontFamily: FONT,
                flexShrink: 0,
              }}
            >
              {(u.full_name || u.email || '?').charAt(0).toUpperCase()}
            </div>
            <span style={{ fontFamily: FONT, fontSize: 13, fontWeight: 600, color: C.text }}>
              {u.full_name || '—'}
              {self && (
                <span style={{ fontSize: 11, fontWeight: 500, color: C.muted, marginLeft: 6 }}>
                  (you)
                </span>
              )}
            </span>
          </div>
        </td>
        <td style={{ padding: '12px 16px', fontFamily: FONT, fontSize: 13, color: C.muted }}>
          {u.email || '—'}
        </td>
        <td style={{ padding: '12px 16px' }}>
          {self ? (
            <RoleBadge role={u.role} />
          ) : (
            <RoleSelect
              value={u.role || 'Implementer'}
              disabled={updatingId === u.id}
              onChange={(newRole) => handleRoleChange(u, newRole)}
            />
          )}
        </td>
        <td style={{ padding: '12px 16px', fontFamily: FONT, fontSize: 13 }}>
          {!DIVISION_ROLES.includes(u.role || 'Implementer') ? (
            <span style={{ color: C.muted }}>All divisions</span>
          ) : self ? (
            <span style={{ color: C.text, fontWeight: 600 }}>{u.division || 'Not set'}</span>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-start' }}>
              <DivisionSelect
                label={`Division for ${u.email}`}
                value={u.division}
                disabled={updatingId === u.id}
                onChange={(d) => handleDivisionChange(u, d)}
              />
              {!u.division && (
                <span style={{ fontSize: 11, color: '#92400E' }}>Set a division, or this user sees no records</span>
              )}
            </div>
          )}
        </td>
        <td style={{ padding: '12px 16px', textAlign: 'right', fontFamily: FONT, fontSize: 13, color: C.muted, whiteSpace: 'nowrap' }}>
          {formatDate(u.created_date)}
        </td>
      </tr>
    );
  };

  return (
    <SharedPageContainer
      title="User Management"
      subtitle="Manage system users, access roles, and invitations"
      actions={
        <Button
          onClick={() => setInviteOpen(true)}
          style={{ background: C.brand, color: '#fff' }}
        >
          <UserPlus size={15} style={{ marginRight: 6 }} />
          Invite User
        </Button>
      }
    >
      {actionError && (
        <div
          style={{
            fontFamily: FONT,
            fontSize: 13,
            color: C.danger,
            background: C.dangerSoft,
            border: `1px solid ${C.dangerBar}33`,
            borderRadius: 8,
            padding: '10px 14px',
          }}
        >
          {actionError}
        </div>
      )}

      <KPIBand>
        <KPITile label="Total Users" value={counts.total} icon={Users} borderLeft={C.brand} />
        <KPITile label="Administrators" value={counts.admin} icon={ShieldCheck} borderLeft={C.dangerBar} />
        <KPITile label="Planning Admins" value={counts.planning} borderLeft={C.accent} />
        <KPITile label="QA Assessors" value={counts.qa} borderLeft={C.warningBar} />
        <KPITile label="Implementers" value={counts.impl} borderLeft={C.successBar} />
      </KPIBand>

      <Panel>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
            <Search
              size={15}
              style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: C.muted }}
            />
            <Input
              placeholder="Search by name or email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: 32, fontFamily: FONT, fontSize: 13 }}
            />
          </div>
          <div style={{ display: 'flex', gap: 2, background: C.bg, borderRadius: 7, padding: 3 }}>
            {['All', ...ROLE_VALUES].map((r) => {
              const active = roleFilter === r;
              const label = r === 'All' ? 'All Roles' : ROLE_CONFIG[r].label;
              return (
                <button
                  key={r}
                  onClick={() => setRoleFilter(r)}
                  style={{
                    fontFamily: FONT,
                    fontSize: 12,
                    fontWeight: active ? 600 : 500,
                    color: active ? '#fff' : C.neutral,
                    background: active ? C.brand : 'transparent',
                    border: 'none',
                    borderRadius: 5,
                    padding: '5px 12px',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.13s',
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </Panel>

      <DashboardPanel title="All Users" aside={`${filtered.length} of ${users.length}`}>
        {isLoading ? (
          <div style={{ padding: '40px 0', textAlign: 'center', fontFamily: FONT, fontSize: 13, color: C.muted }}>
            Loading users…
          </div>
        ) : (
          <DashboardTable
            headers={headers}
            rows={filtered}
            renderRow={renderRow}
            emptyMessage="No users found matching your filters."
          />
        )}
      </DashboardPanel>

      <InviteUserDialog
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        onInvited={refresh}
      />
    </SharedPageContainer>
  );
}