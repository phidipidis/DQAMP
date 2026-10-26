import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { C, FONT, PageHeader, KPIBand, KPITile, Panel, DashboardPanel, DashboardTable } from '@/components/ui/DashboardSystem';
import { KeyRound, ShieldCheck, Users, UserCog } from 'lucide-react';
import { navigationConfig } from '@/components/config/roleBasedNavigation';

const ROLES = [
  { key: 'admin', label: 'Administrator', color: C.danger, icon: UserCog, desc: 'Full system access including user management, audit trail, and all configuration.' },
  { key: 'Planning_Admin', label: 'Planning Admin', color: C.brand, icon: ShieldCheck, desc: 'Manages strategic and operational planning across projects, activities, and reports.' },
  { key: 'QA_Assessor', label: 'QA Assessor', color: C.warningBar, icon: KeyRound, desc: 'Conducts QAME assessments and manages quality assurance feedback.' },
  { key: 'Implementer', label: 'Implementer', color: C.successBar, icon: Users, desc: 'Creates and updates assigned activities, outputs, and evidence.' },
];

export default function UserRoles() {
  const { data: users = [] } = useQuery({ queryKey: ['users'], queryFn: () => base44.entities.User.list() });

  const usersByRole = ROLES.map(r => ({ ...r, count: users.filter(u => u.role === r.key).length }));

  return (
    <div style={{ fontFamily: FONT, color: C.text, display: 'flex', flexDirection: 'column', gap: 24 }}>
      <PageHeader title="User Roles" subtitle="Permission levels and access management for system users" />
      <KPIBand>
        {usersByRole.map(r => (
          <KPITile key={r.key} label={r.label} value={r.count} icon={r.icon} borderLeft={r.color} />
        ))}
      </KPIBand>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'start' }}>
        {ROLES.map(role => {
          const navSections = navigationConfig[role.key]?.sections || [];
          const sectionNames = navSections.map(s => s.name);
          const roleUsers = users.filter(u => u.role === role.key);
          const Icon = role.icon;
          return (
            <Panel key={role.key}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                <div style={{ width: 40, height: 40, borderRadius: 8, background: role.color + '15', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={20} color={role.color} />
                </div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: C.text }}>{role.label}</div>
                  <div style={{ fontSize: 12, color: C.muted }}>{role.count} {role.count === 1 ? 'user' : 'users'}</div>
                </div>
              </div>
              <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.45, marginBottom: 14 }}>{role.desc}</p>
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.muted, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>Navigation access</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {sectionNames.map(s => (
                    <span key={s} style={{ fontSize: 11, fontWeight: 500, padding: '3px 9px', borderRadius: 5, background: C.bg, color: C.neutral, border: `1px solid ${C.border}` }}>{s}</span>
                  ))}
                </div>
              </div>
              {roleUsers.length > 0 && (
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: C.muted, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>Assigned users</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {roleUsers.map(u => (
                      <div key={u.id} style={{ fontSize: 13, color: C.text }}>{u.full_name || u.email}</div>
                    ))}
                  </div>
                </div>
              )}
            </Panel>
          );
        })}
      </div>

      <DashboardPanel title="All users" noPad>
        <DashboardTable
          headers={[{ label: 'Name' }, { label: 'Email' }, { label: 'Role' }]}
          rows={users}
          emptyMessage="No users found."
          renderRow={(u, i) => (
            <tr key={u.id} style={{ borderTop: `1px solid ${C.border}`, background: i % 2 === 0 ? C.surface : C.bg }}>
              <td style={{ padding: '10px 16px', fontSize: 13, fontWeight: 500, color: C.text }}>{u.full_name || '—'}</td>
              <td style={{ padding: '10px 16px', fontSize: 13, color: C.muted }}>{u.email}</td>
              <td style={{ padding: '10px 16px' }}>
                <span style={{ fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 5, background: (ROLES.find(r => r.key === u.role) || {}).color + '15' || C.bg, color: (ROLES.find(r => r.key === u.role) || {}).color || C.neutral }}>
                  {(ROLES.find(r => r.key === u.role) || {}).label || u.role || '—'}
                </span>
              </td>
            </tr>
          )}
        />
      </DashboardPanel>
    </div>
  );
}