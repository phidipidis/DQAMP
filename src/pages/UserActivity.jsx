import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { C, FONT, PageHeader, KPIBand, KPITile, Panel, DashboardPanel, DashboardTable } from '@/components/ui/DashboardSystem';
import { History, ClipboardList, ScrollText, UserCog } from 'lucide-react';

export default function UserActivity() {
  const [selectedUser, setSelectedUser] = useState('');
  const { data: users = [] } = useQuery({ queryKey: ['users'], queryFn: () => base44.entities.User.list() });
  const { data: auditLogs = [] } = useQuery({ queryKey: ['auditLogsAll'], queryFn: () => base44.entities.Audit_Log.list('-Timestamp', 500) });
  const { data: activities = [] } = useQuery({ queryKey: ['activities'], queryFn: () => base44.entities.DQAMPActivity.list() });

  // Build user summary from audit logs
  const userStats = {};
  auditLogs.forEach(l => {
    const email = l.User_Email;
    if (!email) return;
    if (!userStats[email]) userStats[email] = { email, actions: 0, lastActivity: null };
    userStats[email].actions += 1;
    if (!userStats[email].lastActivity || new Date(l.Timestamp) > new Date(userStats[email].lastActivity)) userStats[email].lastActivity = l.Timestamp;
  });
  const summary = Object.values(userStats).sort((a, b) => b.actions - a.actions);

  const selectedEmail = selectedUser || (summary[0]?.email || '');
  const userLogs = auditLogs.filter(l => l.User_Email === selectedEmail);
  const userActivities = activities.filter(a => a.Responsible_Person === selectedEmail || a.Reviewed_By === selectedEmail);

  const selectStyle = { border: `1px solid ${C.border}`, borderRadius: 6, padding: '6px 12px', fontSize: 13, fontWeight: 500, color: C.neutral, background: C.surface, outline: 'none', cursor: 'pointer', fontFamily: FONT, minWidth: 260 };

  return (
    <div style={{ fontFamily: FONT, color: C.text, display: 'flex', flexDirection: 'column', gap: 24 }}>
      <PageHeader title="User Activity" subtitle="Individual contribution logs and recent actions for administrative oversight" />
      <KPIBand>
        <KPITile label="Active users" value={summary.length} icon={UserCog} borderLeft={C.brand} />
        <KPITile label="Total actions" value={auditLogs.length} icon={History} borderLeft={C.accent} />
        <KPITile label="Logged activities" value={userActivities.length} icon={ClipboardList} borderLeft={C.successBar} sub={selectedEmail ? `for ${selectedEmail}` : ''} />
        <KPITile label="Audit entries" value={userLogs.length} icon={ScrollText} borderLeft={C.warningBar} sub={selectedEmail ? `for ${selectedEmail}` : ''} />
      </KPIBand>

      <Panel>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: C.muted, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Select user</span>
          <select value={selectedEmail} onChange={e => setSelectedUser(e.target.value)} style={selectStyle}>
            <option value="">Most active</option>
            {summary.map(u => <option key={u.email} value={u.email}>{u.email} ({u.actions} actions)</option>)}
          </select>
        </div>
      </Panel>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'start' }}>
        <DashboardPanel title="Recent actions" aside="audit log" noPad>
          <DashboardTable
            headers={[{ label: 'Timestamp' }, { label: 'Action' }, { label: 'Entity' }, { label: 'Remarks' }]}
            rows={userLogs.slice(0, 20)}
            emptyMessage="No actions recorded for this user."
            renderRow={(l, i) => (
              <tr key={l.id || i} style={{ borderTop: `1px solid ${C.border}`, background: i % 2 === 0 ? C.surface : C.bg }}>
                <td style={{ padding: '10px 16px', fontSize: 12, color: C.muted, whiteSpace: 'nowrap' }}>{l.Timestamp ? new Date(l.Timestamp).toLocaleString() : '—'}</td>
                <td style={{ padding: '10px 16px', fontSize: 13, fontWeight: 600, color: C.text }}>{l.Action_Type}</td>
                <td style={{ padding: '10px 16px', fontSize: 12, color: C.muted }}>{l.Entity}</td>
                <td style={{ padding: '10px 16px', fontSize: 12, color: C.muted, maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{l.Remarks || '—'}</td>
              </tr>
            )}
          />
        </DashboardPanel>

        <DashboardPanel title="Assigned activities" aside={`${userActivities.length} items`} noPad>
          <DashboardTable
            headers={[{ label: 'Activity' }, { label: 'Division' }, { label: 'Status' }, { label: 'Workflow' }]}
            rows={userActivities.slice(0, 20)}
            emptyMessage="No activities assigned to this user."
            renderRow={(a, i) => (
              <tr key={a.id} style={{ borderTop: `1px solid ${C.border}`, background: i % 2 === 0 ? C.surface : C.bg }}>
                <td style={{ padding: '10px 16px', fontSize: 13, fontWeight: 500, color: C.text, maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.Activity_Title || a.Title}</td>
                <td style={{ padding: '10px 16px', fontSize: 12, color: C.muted }}>{a.Functional_Division}</td>
                <td style={{ padding: '10px 16px', fontSize: 12, color: C.muted }}>{a.Status}</td>
                <td style={{ padding: '10px 16px', fontSize: 12, color: C.muted }}>{a.Workflow_Status}</td>
              </tr>
            )}
          />
        </DashboardPanel>
      </div>

      <DashboardPanel title="All user activity summary" noPad>
        <DashboardTable
          headers={[{ label: 'User' }, { label: 'Actions', align: 'right' }, { label: 'Last active' }]}
          rows={summary}
          emptyMessage="No user activity recorded."
          renderRow={(u, i) => (
            <tr key={u.email} style={{ borderTop: `1px solid ${C.border}`, background: i % 2 === 0 ? C.surface : C.bg, cursor: 'pointer' }} onClick={() => setSelectedUser(u.email)}>
              <td style={{ padding: '10px 16px', fontSize: 13, fontWeight: 500, color: C.text }}>{u.email}</td>
              <td style={{ padding: '10px 16px', fontSize: 13, fontWeight: 600, color: C.brand, textAlign: 'right' }}>{u.actions}</td>
              <td style={{ padding: '10px 16px', fontSize: 12, color: C.muted }}>{u.lastActivity ? new Date(u.lastActivity).toLocaleString() : '—'}</td>
            </tr>
          )}
        />
      </DashboardPanel>
    </div>
  );
}