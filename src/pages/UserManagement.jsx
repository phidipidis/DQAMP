import React, { useState } from 'react';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  UserPlus,
  Search,
  Users,
  ShieldCheck,
  Trash2,
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
  const [deleteTarget, setDeleteTarget] = useState(null);
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

  const handleRoleChange = async (userId, newRole, prevRole) => {
    if (newRole === prevRole) return;
    setUpdatingId(userId);
    setActionError('');
    try {
      await base44.entities.User.update(userId, { role: newRole });
      await logAuditEvent({
        actionType: 'Role_Change',
        entity: 'User',
        recordId: userId,
        remarks: `Changed role from ${ROLE_CONFIG[prevRole]?.label || prevRole} to ${ROLE_CONFIG[newRole]?.label || newRole}`,
        previousValues: { role: prevRole },
        newValues: { role: newRole },
      });
      refresh();
    } catch (err) {
      setActionError(err?.message || 'Failed to update user role.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setActionError('');
    try {
      await base44.entities.User.delete(deleteTarget.id);
      await logAuditEvent({
        actionType: 'Delete',
        entity: 'User',
        recordId: deleteTarget.id,
        remarks: `Removed user ${deleteTarget.email}`,
      });
      refresh();
    } catch (err) {
      setActionError(err?.message || 'Failed to remove user.');
    }
    setDeleteTarget(null);
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
    { label: 'Joined', align: 'right' },
    { label: 'Actions', align: 'right' },
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
              onChange={(newRole) => handleRoleChange(u.id, newRole, u.role)}
            />
          )}
        </td>
        <td style={{ padding: '12px 16px', textAlign: 'right', fontFamily: FONT, fontSize: 13, color: C.muted, whiteSpace: 'nowrap' }}>
          {formatDate(u.created_date)}
        </td>
        <td style={{ padding: '12px 16px', textAlign: 'right' }}>
          {self ? (
            <span style={{ fontFamily: FONT, fontSize: 11, color: C.muted, fontStyle: 'italic' }}>
              Cannot remove self
            </span>
          ) : (
            <button
              onClick={() => setDeleteTarget(u)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 6,
                borderRadius: 5,
                color: C.danger,
                display: 'inline-flex',
                alignItems: 'center',
              }}
              title="Remove user"
            >
              <Trash2 size={15} />
            </button>
          )}
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

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove User Access?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget && (
                <>
                  You are about to remove <strong>{deleteTarget.full_name || deleteTarget.email}</strong> from the system.
                  This will revoke their access immediately. This action cannot be undone.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              style={{ background: C.danger, color: '#fff' }}
            >
              Remove User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SharedPageContainer>
  );
}