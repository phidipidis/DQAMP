import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useFilters } from '@/lib/FilterContext';
import {
  C, FONT, QUARTERS, DIVISIONS, PageHeader, FilterToolbar, FilterLabel, FilterDivider,
  SegBtn, ClearFiltersButton, Panel, DashboardPanel, SectionHead,
  KPIBand, KPITile, StatusSegment, StatusStrip, AlertRow, DashboardTable,
  chartTickStyle, chartTickSmall, chartTooltipStyle, chartGridStroke
} from '@/components/ui/DashboardSystem';
import {
  ClipboardList, FolderKanban, ShieldCheck, PhilippinePeso,
  AlertTriangle, TrendingUp
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

export default function MainDashboard() {
  const { quarters, divisions, toggleQuarter, toggleDivision, clearFilters, matchesFilters } = useFilters();
  const [projectId, setProjectId] = useState('All');
  const hasFilters = quarters.length > 0 || divisions.length > 0 || projectId !== 'All';

  // Data (unchanged)
  const { data: activities = [] } = useQuery({ queryKey: ['activities'], queryFn: () => base44.entities.DQAMPActivity.list() });
  const { data: projects   = [] } = useQuery({ queryKey: ['projects'],   queryFn: () => base44.entities.Project.list() });
  const { data: assessors  = [] } = useQuery({ queryKey: ['assessors'],  queryFn: () => base44.entities.QAME_Assessor.list() });

  // Filtering (unchanged)
  const filteredActivities = activities.filter(activity => {
    if (!matchesFilters(activity)) return false;
    if (projectId !== 'All') {
      const project = projects.find(p => p.id === projectId);
      const isLinked = project?.Linked_Activities?.includes(activity.id) || activity.Linked_Projects?.includes(projectId);
      if (!isLinked) return false;
    }
    return true;
  });
  const filteredProjects = projects.filter(p => matchesFilters(p, 'Project_Start_Date'));

  // Calculations (unchanged)
  const totalActivities = filteredActivities.length;
  const notStartedCount = filteredActivities.filter(a => a.Status === 'Not Started').length;
  const inProgressCount = filteredActivities.filter(a => a.Status === 'In Progress').length;
  const completedCount  = filteredActivities.filter(a => a.Status === 'Completed').length;
  const delayedCount    = filteredActivities.filter(a => a.Status === 'Delayed').length;
  const totalAllocation = filteredActivities.reduce((sum, a) => sum + (a.Financial_Allocation || a.Budget || 0), 0);
  const activeAssessors = assessors.filter(a => a.Is_Active).length;
  const completionRate  = totalActivities > 0 ? Math.round((completedCount / totalActivities) * 100) : 0;

  const divisionData = DIVISIONS.map(div => {
    const divActs = filteredActivities.filter(a => a.Functional_Division === div);
    const divCompleted = divActs.filter(a => a.Status === 'Completed').length;
    const divAlloc = divActs.reduce((sum, a) => sum + (a.Financial_Allocation || 0), 0);
    const rate = divActs.length > 0 ? Math.round((divCompleted / divActs.length) * 100) : 0;
    return { div, total: divActs.length, completed: divCompleted, rate, allocation: divAlloc };
  });

  const delayedActivities   = filteredActivities.filter(a => a.Status === 'Delayed');
  const noEvidenceCompleted = filteredActivities.filter(a => a.Status === 'Completed' && !a.Evidence_Attachments?.length);
  const overBudget          = filteredActivities.filter(a => (a.Financial_Utilization || 0) > (a.Financial_Allocation || 0) && (a.Financial_Allocation || 0) > 0);
  const pendingReview       = filteredActivities.filter(a => a.Workflow_Status === 'Submitted');

  const selectStyle = {
    border: `1px solid ${C.border}`, borderRadius: 6,
    padding: '5px 10px', fontSize: 13, fontWeight: 500,
    color: C.neutral, background: C.surface,
    outline: 'none', cursor: 'pointer', fontFamily: FONT,
  };

  return (
    <div style={{ fontFamily: FONT, color: C.text, display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* 1. Page header */}
      <PageHeader title="Top Management Dashboard" subtitle="Division Quality Assurance & Monitoring — Schools Division of Lucena City" />

      {/* 2. Unified filter toolbar */}
      <FilterToolbar>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <FilterLabel>Quarter</FilterLabel>
          <div style={{ display: 'flex', background: C.bg, borderRadius: 7, padding: 3, gap: 2 }}>
            {QUARTERS.map(q => (
              <SegBtn key={q} label={q} active={quarters.includes(q)} onClick={() => toggleQuarter(q)} />
            ))}
          </div>
        </div>
        <FilterDivider />
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <FilterLabel>Division</FilterLabel>
          <div style={{ display: 'flex', background: C.bg, borderRadius: 7, padding: 3, gap: 2 }}>
            {DIVISIONS.map(d => (
              <SegBtn key={d} label={d} active={divisions.includes(d)} onClick={() => toggleDivision(d)} />
            ))}
          </div>
        </div>
        <FilterDivider />
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <FilterLabel>Project</FilterLabel>
          <select value={projectId} onChange={e => setProjectId(e.target.value)} style={selectStyle}>
            <option value="All">All projects</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.Project_Code} – {p.Project_Title}</option>)}
          </select>
        </div>
        {hasFilters && (
          <>
            <FilterDivider />
            <ClearFiltersButton onClick={() => { clearFilters(); setProjectId('All'); }} />
          </>
        )}
      </FilterToolbar>

      {/* 3. KPI band */}
      <KPIBand>
        <KPITile label="Total activities"  value={totalActivities}                         icon={ClipboardList}  borderLeft={C.brand}      />
        <KPITile label="Active projects"   value={filteredProjects.length}                 icon={FolderKanban}   borderLeft={C.accent}     />
        <KPITile label="Active assessors"  value={activeAssessors}                         icon={ShieldCheck}    borderLeft={C.successBar} />
        <KPITile label="Total allocation"  value={`₱${totalAllocation.toLocaleString()}`} icon={PhilippinePeso} borderLeft={C.warningBar} />
        <KPITile label="Completion rate"   value={`${completionRate}%`}                    icon={TrendingUp}     borderLeft={C.successBar} sub={`${completedCount} of ${totalActivities} activities`} />
      </KPIBand>

      {/* 4. Division performance */}
      <Panel>
        <SectionHead aside={`${filteredActivities.length} activities`}>
          Division performance
        </SectionHead>

        {/* Overall progress bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
          <div style={{ flex: 1, height: 6, background: C.border, borderRadius: 99, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${completionRate}%`, background: `linear-gradient(90deg, ${C.brand}, ${C.accent})`, borderRadius: 99, transition: 'width 0.6s ease' }} />
          </div>
          <span style={{ fontSize: 13, fontWeight: 600, color: C.brand, minWidth: 80, textAlign: 'right' }}>
            {completionRate}% overall
          </span>
        </div>

        {/* Bar chart */}
        <div style={{ height: 190 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={divisionData} barCategoryGap="35%" barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke={chartGridStroke} vertical={false} />
              <XAxis dataKey="div" tick={chartTickStyle} axisLine={false} tickLine={false} />
              <YAxis tick={chartTickSmall} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={chartTooltipStyle} formatter={(val, name) => [val, name === 'total' ? 'Total' : 'Completed']} />
              <Bar dataKey="total"     name="Total"     fill={C.accentSoft} radius={[4,4,0,0]} />
              <Bar dataKey="completed" name="Completed" fill={C.brand}      radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Division detail strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1, background: C.border, border: `1px solid ${C.border}`, borderRadius: 8, overflow: 'hidden', marginTop: 16 }}>
          {divisionData.map(d => (
            <div key={d.div} style={{ background: C.surface, padding: '14px 18px' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 15, fontWeight: 700, color: C.brand }}>{d.div}</span>
                <span style={{ fontSize: 12, fontWeight: 400, color: C.muted }}>{d.total} activities</span>
              </div>
              <div style={{ height: 4, background: C.border, borderRadius: 99, overflow: 'hidden', marginBottom: 8 }}>
                <div style={{ height: '100%', width: `${d.rate}%`, background: d.rate >= 70 ? C.successBar : d.rate >= 40 ? C.warningBar : C.dangerBar, borderRadius: 99 }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                <span style={{ color: C.muted }}>Completion <strong style={{ color: C.text, fontWeight: 600 }}>{d.rate}%</strong></span>
                <span style={{ color: C.muted }}>₱{(d.allocation / 1000).toFixed(0)}k allocated</span>
              </div>
            </div>
          ))}
        </div>
      </Panel>

      {/* 5. Activity status */}
      <DashboardPanel title="Activity status" noPad>
        <StatusStrip>
          <StatusSegment label="Not started" count={notStartedCount} total={totalActivities} color={C.neutral} softBg={C.neutralSoft} />
          <StatusSegment label="In progress" count={inProgressCount} total={totalActivities} color={C.accent}  softBg={C.accentSoft}  />
          <StatusSegment label="Completed"   count={completedCount}  total={totalActivities} color={C.success} softBg={C.successSoft} />
          <StatusSegment label="Delayed"     count={delayedCount}    total={totalActivities} color={C.danger}  softBg={C.dangerSoft}  />
        </StatusStrip>
      </DashboardPanel>

      {/* 6 & 7. Attention + Recent activities */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 20, alignItems: 'start' }}>

        {/* Needs attention */}
        <Panel>
          <SectionHead>Needs attention</SectionHead>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {delayedActivities.length > 0 && (
              <AlertRow icon={AlertTriangle} severity="danger"
                text={`${delayedActivities.length} delayed ${delayedActivities.length === 1 ? 'activity' : 'activities'}`} />
            )}
            {pendingReview.length > 0 && (
              <AlertRow icon={ClipboardList} severity="info"
                text={`${pendingReview.length} ${pendingReview.length === 1 ? 'activity' : 'activities'} pending review`} />
            )}
            {noEvidenceCompleted.length > 0 && (
              <AlertRow icon={AlertTriangle} severity="warning"
                text={`${noEvidenceCompleted.length} completed with no evidence`} />
            )}
            {overBudget.length > 0 && (
              <AlertRow icon={AlertTriangle} severity="danger"
                text={`${overBudget.length} ${overBudget.length === 1 ? 'activity' : 'activities'} over budget`} />
            )}
            {!delayedActivities.length && !pendingReview.length && !noEvidenceCompleted.length && !overBudget.length && (
              <div style={{ textAlign: 'center', padding: '24px 0', color: C.muted }}>
                <div style={{ fontSize: 24, marginBottom: 8 }}>✓</div>
                <span style={{ fontSize: 13, fontWeight: 400 }}>No items need attention</span>
              </div>
            )}
          </div>
        </Panel>

        {/* Recent activities */}
        <DashboardPanel title="Recent activities" aside={filteredActivities.length > 10 ? `Showing 10 of ${filteredActivities.length}` : undefined} noPad>
          <DashboardTable
            headers={[
              { label: 'Activity' },
              { label: 'Division' },
              { label: 'Type' },
              { label: 'Status' },
              { label: 'Allocation', align: 'right' },
            ]}
            rows={filteredActivities.slice(0, 10)}
            emptyMessage="No activities match the selected filters."
            renderRow={(a, i) => (
              <tr key={a.id} style={{ borderTop: `1px solid ${C.border}`, background: i % 2 === 0 ? C.surface : C.bg }}>
                <td style={{ padding: '10px 16px', fontSize: 13, fontWeight: 500, color: C.text, maxWidth: 240, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {a.Activity_Title}
                </td>
                <td style={{ padding: '10px 16px', fontSize: 13, fontWeight: 400, color: C.muted }}>{a.Functional_Division}</td>
                <td style={{ padding: '10px 16px', fontSize: 13, fontWeight: 400, color: C.muted }}>{a.Activity_Type}</td>
                <td style={{ padding: '10px 16px' }}><StatusBadge status={a.Status} /></td>
                <td style={{ padding: '10px 16px', fontSize: 13, fontWeight: 600, color: C.brand, textAlign: 'right' }}>
                  ₱{(a.Financial_Allocation || 0).toLocaleString()}
                </td>
              </tr>
            )}
          />
        </DashboardPanel>
      </div>

    </div>
  );
}