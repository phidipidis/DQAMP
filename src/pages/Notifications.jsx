import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { C, FONT, PageHeader, KPIBand, KPITile, Panel, SectionHead, AlertRow } from '@/components/ui/DashboardSystem';
import { Bell, Clock, ShieldCheck, AlertTriangle, ClipboardList, ExternalLink } from 'lucide-react';

export default function Notifications() {
  const { data: activities = [] } = useQuery({ queryKey: ['activities'], queryFn: () => base44.entities.DQAMPActivity.list() });
  const { data: assessors = [] } = useQuery({ queryKey: ['assessors'], queryFn: () => base44.entities.QAME_Assessor.list() });

  const today = new Date();
  const pendingReview = activities.filter(a => a.Workflow_Status === 'Submitted');
  const pendingQAME = activities.filter(a => a.needs_qame_eval_form !== false && !a.QAME_Rating && a.Workflow_Status === 'Published');
  const delayed = activities.filter(a => a.Status === 'Delayed');
  const overdue = activities.filter(a => {
    if (a.Status === 'Completed') return false;
    const end = a.End_Date || a.Date_Conducted;
    return end && new Date(end) < today;
  });

  const allItems = [
    ...pendingReview.map(a => ({ id: a.id, type: 'Pending Approval', title: a.Activity_Title || a.Title, detail: `Awaiting review · ${a.Functional_Division || '—'}`, severity: 'info', icon: ClipboardList, path: 'Activities' })),
    ...pendingQAME.map(a => ({ id: a.id, type: 'QAME Assessment', title: a.Activity_Title || a.Title, detail: `Pending QAME rating · ${a.Functional_Division || '—'}`, severity: 'warning', icon: ShieldCheck, path: 'Activities' })),
    ...delayed.map(a => ({ id: a.id, type: 'Delayed', title: a.Activity_Title || a.Title, detail: `Status: Delayed · ${a.Functional_Division || '—'}`, severity: 'danger', icon: AlertTriangle, path: 'Activities' })),
    ...overdue.map(a => ({ id: a.id, type: 'Overdue', title: a.Activity_Title || a.Title, detail: `Past end date · ${a.Functional_Division || '—'}`, severity: 'danger', icon: Clock, path: 'Activities' })),
  ];

  return (
    <div style={{ fontFamily: FONT, color: C.text, display: 'flex', flexDirection: 'column', gap: 24 }}>
      <PageHeader title="Quick Notifications" subtitle="Pending approvals, system alerts, and reminders for your tasks" />
      <KPIBand>
        <KPITile label="Pending approvals" value={pendingReview.length} icon={ClipboardList} borderLeft={C.accent} />
        <KPITile label="QAME pending" value={pendingQAME.length} icon={ShieldCheck} borderLeft={C.warningBar} />
        <KPITile label="Delayed" value={delayed.length} icon={AlertTriangle} borderLeft={C.danger} />
        <KPITile label="Overdue" value={overdue.length} icon={Clock} borderLeft={C.danger} />
      </KPIBand>

      <Panel>
        <SectionHead aside={`${allItems.length} total`}>All notifications</SectionHead>
        {allItems.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 0' }}>
            <Bell size={28} color={C.muted} style={{ margin: '0 auto 10px' }} />
            <p style={{ fontSize: 14, color: C.muted }}>You're all caught up — no pending notifications.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {allItems.map(item => {
              const Icon = item.icon;
              const colors = {
                warning: { bg: C.warningSoft, accent: C.warningBar, text: C.warning },
                danger: { bg: C.dangerSoft, accent: C.dangerBar, text: C.danger },
                info: { bg: C.accentSoft, accent: C.accent, text: C.brand },
              }[item.severity];
              return (
                <Link key={item.type + item.id} to={createPageUrl(item.path)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 8, background: colors.bg, border: `1px solid ${colors.accent}22`, textDecoration: 'none' }}>
                  <Icon size={16} color={colors.accent} style={{ flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: colors.text, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{item.type}</span>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: C.text, marginTop: 2 }}>{item.title}</div>
                    <div style={{ fontSize: 12, color: C.muted, marginTop: 1 }}>{item.detail}</div>
                  </div>
                  <ExternalLink size={13} color={C.muted} style={{ flexShrink: 0 }} />
                </Link>
              );
            })}
          </div>
        )}
      </Panel>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'start' }}>
        <Panel>
          <SectionHead>System alerts</SectionHead>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {delayed.length > 0 && <AlertRow icon={AlertTriangle} severity="danger" text={`${delayed.length} delayed activities need attention`} />}
            {overdue.length > 0 && <AlertRow icon={Clock} severity="warning" text={`${overdue.length} activities past their end date`} />}
            {pendingReview.length > 0 && <AlertRow icon={ClipboardList} severity="info" text={`${pendingReview.length} activities awaiting review approval`} />}
            {delayed.length === 0 && overdue.length === 0 && pendingReview.length === 0 && (
              <AlertRow icon={Bell} severity="success" text="No active system alerts" />
            )}
          </div>
        </Panel>
        <Panel>
          <SectionHead>Reminders</SectionHead>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {pendingQAME.length > 0 && <AlertRow icon={ShieldCheck} severity="warning" text={`${pendingQAME.length} activities need QAME assessment`} />}
            <AlertRow icon={ShieldCheck} severity="info" text={`${assessors.filter(a => a.Is_Active).length} active QAME assessors available`} />
            <AlertRow icon={ClipboardList} severity="info" text={`${activities.filter(a => a.Workflow_Status === 'Draft').length} activities still in draft`} />
          </div>
        </Panel>
      </div>
    </div>
  );
}