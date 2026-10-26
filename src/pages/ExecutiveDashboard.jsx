import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Progress } from "@/components/ui/progress";
import { useFilters } from '@/lib/FilterContext';
import StatusBadge from '@/components/ui/StatusBadge';
import {
  C, FONT, PageHeader, DashboardPanel, KPIBand, KPITile,
  AlertRow
} from '@/components/ui/DashboardSystem';
import {
  Target, FolderKanban, AlertTriangle, TrendingUp, Flag,
  CheckCircle, XCircle
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

// ── Data processing logic preserved exactly ──────────────────────────────────

export default function ExecutiveDashboard() {
  const { matchesFilters } = useFilters();

  const { data: goals = [] } = useQuery({ queryKey: ['goals'], queryFn: () => base44.entities.OrganizationalGoal.list() });
  const { data: divisionObjectives = [] } = useQuery({ queryKey: ['divisionObjectives'], queryFn: () => base44.entities.DivisionObjective.list() });
  const { data: projects = [] } = useQuery({ queryKey: ['projects'], queryFn: () => base44.entities.Project.list() });
  const { data: outputs = [] } = useQuery({ queryKey: ['outputs'], queryFn: () => base44.entities.ProjectOutputs.list() });
  const { data: activities = [] } = useQuery({ queryKey: ['activities'], queryFn: () => base44.entities.DQAMPActivity.list() });

  const getActivityProgress = (a) => {
    const statusMap = { 'Draft': 5, 'Submitted': 25, 'Returned for Revision': 10, 'Under Review': 60, 'Published': 100 };
    return statusMap[a.Workflow_Status] || 0;
  };

  const getOutputProgress = (output) => {
    const linked = activities.filter(a => output.Linked_Activities?.includes(a.id) || a.Linked_Outputs?.includes(output.id));
    if (linked.length === 0) {
      const statusMap = { 'Not Started': 0, 'In Progress': 50, 'Completed': 100, 'Verified': 100, 'Not Achieved': 0 };
      return statusMap[output.Status] || 0;
    }
    return linked.reduce((sum, a) => sum + getActivityProgress(a), 0) / linked.length;
  };

  const getDivisionObjectiveProgress = (obj) => {
    const linked = outputs.filter(o => obj.Linked_Outputs?.includes(o.id) || o.Linked_Division_Objectives?.includes(obj.id));
    if (linked.length === 0) {
      const statusMap = { 'Not Started': 0, 'In Progress': 50, 'On Track': 75, 'At Risk': 40, 'Achieved': 100, 'Not Achieved': 0 };
      return statusMap[obj.Status] || 0;
    }
    return linked.reduce((sum, o) => sum + getOutputProgress(o), 0) / linked.length;
  };

  const getProjectProgress = (project) => {
    const linkedOutputs = outputs.filter(o => project.Linked_Outputs?.includes(o.id) || o.Linked_Projects?.includes(project.id));
    if (linkedOutputs.length === 0) return 0;
    return linkedOutputs.reduce((sum, o) => sum + getOutputProgress(o), 0) / linkedOutputs.length;
  };

  const getProjectStatus = (p) => {
    if (p.Project_Status === 'Completed') return 'On Track';
    const progress = getProjectProgress(p);
    if (progress >= 60) return 'On Track';
    if (progress >= 30) return 'At Risk';
    return 'Critical';
  };

  const getGoalProgress = (goal) => {
    const linkedObjectives = divisionObjectives.filter(obj => goal.Linked_Division_Objectives?.includes(obj.id) || obj.Linked_Organizational_Goals?.includes(goal.id));
    if (linkedObjectives.length === 0) return goal.Current_Progress || 0;
    return linkedObjectives.reduce((sum, obj) => sum + getDivisionObjectiveProgress(obj), 0) / linkedObjectives.length;
  };

  const getGoalStatus = (goal) => {
    const linkedObjectives = divisionObjectives.filter(obj => goal.Linked_Division_Objectives?.includes(obj.id) || obj.Linked_Organizational_Goals?.includes(goal.id));
    if (linkedObjectives.length === 0) return goal.Status || 'N/A';
    const risky = linkedObjectives.filter(obj => !['On Track', 'Achieved'].includes(obj.Status)).length;
    if (risky === 0) return 'On Track';
    if (risky / linkedObjectives.length > 0.3) return 'Critical';
    return 'At Risk';
  };

  // ── KPI calculations (unchanged) ─────────────────────────────────────────
  const filteredProjects = projects.filter(p => matchesFilters(p, 'Project_Start_Date'));
  const activeGoals = goals;
  const goalsOnTrack = activeGoals.filter(g => ['On Track', 'Completed'].includes(getGoalStatus(g))).length;
  const projectsOnTrack = filteredProjects.filter(p => getProjectStatus(p) === 'On Track').length;
  const projectsAtRisk = filteredProjects.filter(p => ['At Risk', 'Critical'].includes(getProjectStatus(p))).length;
  const avgProjectProgress = filteredProjects.length > 0
    ? filteredProjects.reduce((sum, p) => sum + getProjectProgress(p), 0) / filteredProjects.length : 0;

  const portfolioData = [
    { name: 'On Track', value: filteredProjects.filter(p => getProjectStatus(p) === 'On Track').length, color: C.successBar },
    { name: 'At Risk',  value: filteredProjects.filter(p => getProjectStatus(p) === 'At Risk').length,  color: C.warningBar },
    { name: 'Critical', value: filteredProjects.filter(p => getProjectStatus(p) === 'Critical').length, color: C.dangerBar },
  ].filter(d => d.value > 0);

  const projectsNeedingAttention = filteredProjects
    .map(p => ({ ...p, progress: getProjectProgress(p), status: getProjectStatus(p) }))
    .filter(p => p.status !== 'On Track')
    .sort((a, b) => a.progress - b.progress)
    .slice(0, 5);

  const projectsWithEvidence = filteredProjects.filter(p => {
    const linked = activities.filter(a => p.Linked_Activities?.includes(a.id) || a.Linked_Projects?.includes(p.id));
    return linked.some(a => a.Status === 'Completed' && a.Evidence_Attachments?.length > 0);
  }).length;

  const projectsNoEvidence = filteredProjects.filter(p => {
    const linked = activities.filter(a => p.Linked_Activities?.includes(a.id) || a.Linked_Projects?.includes(p.id));
    return !linked.some(a => a.Evidence_Attachments?.length > 0);
  }).length;

  const notStartedActivities = activities.filter(a => a.Workflow_Status === 'Draft').length;
  const behindSchedule = activities.filter(a => {
    if (!a.End_Date || a.Workflow_Status === 'Published') return false;
    return new Date(a.End_Date) < new Date();
  }).length;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ fontFamily: FONT, color: C.text, display: 'flex', flexDirection: 'column', gap: 24 }}>
      <PageHeader title="Performance Tracking" subtitle="Strategic performance overview" />

      {/* KPI Band */}
      <KPIBand>
        <KPITile label="Goals on track"   value={`${activeGoals.length > 0 ? Math.round(goalsOnTrack / activeGoals.length * 100) : 0}%`} sub={`${goalsOnTrack} of ${activeGoals.length} goals`} icon={Flag}         borderLeft={C.successBar} />
        <KPITile label="Projects on track" value={`${filteredProjects.length > 0 ? Math.round(projectsOnTrack / filteredProjects.length * 100) : 0}%`} sub={`${projectsOnTrack} of ${filteredProjects.length} projects`} icon={FolderKanban} borderLeft={C.brand}      />
        <KPITile label="Avg progress"     value={`${Math.round(avgProjectProgress)}%`}                                                                               icon={TrendingUp}   borderLeft={C.accent}     />
        <KPITile label="At risk / critical" value={projectsAtRisk} sub="Projects needing attention"                                                                  icon={AlertTriangle} borderLeft={C.dangerBar}  />
      </KPIBand>

      {/* Mid Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Goals Overview */}
        <DashboardPanel title="Organizational goals" noPad>
          <div style={{ maxHeight: 280, overflowY: 'auto', padding: '8px 0' }}>
            {activeGoals.map(goal => {
              const progress = getGoalProgress(goal);
              const status = getGoalStatus(goal);
              const linkedObjectives = divisionObjectives.filter(obj =>
                goal.Linked_Division_Objectives?.includes(obj.id) || obj.Linked_Organizational_Goals?.includes(goal.id)
              ).length;
              return (
                <div key={goal.id} style={{ padding: '10px 24px', borderTop: `1px solid ${C.border}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, gap: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 500, color: C.text, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {goal.Goal_Title}
                    </span>
                    <StatusBadge status={status} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Progress value={progress} className="flex-1 h-1.5" style={{ flex: 1 }} />
                    <span style={{ fontSize: 12, fontWeight: 600, color: C.text, minWidth: 32 }}>{Math.round(progress)}%</span>
                    <span style={{ fontSize: 11, fontWeight: 400, color: C.muted }}>{linkedObjectives} obj.</span>
                  </div>
                </div>
              );
            })}
            {activeGoals.length === 0 && (
              <div style={{ padding: '40px 24px', textAlign: 'center' }}>
                <Target size={28} color={C.muted} style={{ opacity: 0.4, marginBottom: 8 }} />
                <p style={{ fontSize: 13, color: C.muted }}>No goals found</p>
              </div>
            )}
          </div>
        </DashboardPanel>

        {/* Portfolio Health */}
        <DashboardPanel title="Portfolio health" noPad>
          <div style={{ padding: '16px 24px' }}>
            {portfolioData.length === 0 ? (
              <div style={{ padding: '40px 0', textAlign: 'center' }}>
                <CheckCircle size={28} color={C.muted} style={{ opacity: 0.4, marginBottom: 8 }} />
                <p style={{ fontSize: 13, color: C.muted }}>No project data</p>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                <div style={{ width: 130, height: 130, flexShrink: 0 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={portfolioData} cx="50%" cy="50%" innerRadius={32} outerRadius={52} dataKey="value">
                        {portfolioData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Pie>
                      <Tooltip contentStyle={{ fontSize: 13, fontFamily: FONT, border: `1px solid ${C.border}`, borderRadius: 8 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {portfolioData.map(d => (
                    <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 10, height: 10, borderRadius: 999, background: d.color, flexShrink: 0 }} />
                      <span style={{ fontSize: 13, fontWeight: 400, color: C.text }}>
                        {d.name}: <strong style={{ fontWeight: 600 }}>{d.value}</strong>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DashboardPanel>
      </div>

      {/* Bottom Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20 }}>
        {/* Needs Attention */}
        <DashboardPanel title="Needs attention" noPad>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '12px 24px 18px' }}>
            {projectsNeedingAttention.length === 0 ? (
              <div style={{ padding: '24px 0', textAlign: 'center' }}>
                <CheckCircle size={24} color={C.successBar} style={{ marginBottom: 6 }} />
                <p style={{ fontSize: 13, color: C.muted }}>All projects on track</p>
              </div>
            ) : projectsNeedingAttention.map(p => (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 7, background: C.bg }}>
                <StatusBadge status={p.status} />
                <span style={{ fontSize: 13, fontWeight: 500, color: C.text, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.Project_Code}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: C.muted }}>{Math.round(p.progress)}%</span>
              </div>
            ))}
          </div>
        </DashboardPanel>

        {/* Systemic Risks */}
        <DashboardPanel title="Systemic risks" noPad>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '12px 24px 18px' }}>
            {notStartedActivities > 10 && (
              <AlertRow icon={AlertTriangle} severity="warning" text={`${notStartedActivities} activities not started`} />
            )}
            {behindSchedule > 0 && (
              <AlertRow icon={XCircle} severity="danger" text={`${behindSchedule} activities behind schedule`} />
            )}
            {projectsAtRisk > filteredProjects.length * 0.3 && filteredProjects.length > 0 && (
              <AlertRow icon={XCircle} severity="danger" text={`High risk: ${Math.round(projectsAtRisk / filteredProjects.length * 100)}% of projects at risk`} />
            )}
            {notStartedActivities <= 10 && behindSchedule === 0 && projectsAtRisk <= filteredProjects.length * 0.3 && (
              <div style={{ padding: '24px 0', textAlign: 'center' }}>
                <CheckCircle size={24} color={C.successBar} style={{ marginBottom: 6 }} />
                <p style={{ fontSize: 13, color: C.muted }}>No systemic risks detected</p>
              </div>
            )}
          </div>
        </DashboardPanel>

        {/* Assurance Coverage */}
        <DashboardPanel title="Assurance coverage" noPad>
          <div style={{ padding: '16px 24px 18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 400, color: C.muted }}>Evidence coverage</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>
                {filteredProjects.length > 0 ? Math.round(projectsWithEvidence / filteredProjects.length * 100) : 0}%
              </span>
            </div>
            <Progress value={filteredProjects.length > 0 ? projectsWithEvidence / filteredProjects.length * 100 : 0} className="h-1.5" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                <span style={{ color: C.muted }}>With evidence</span>
                <span style={{ fontWeight: 600, color: C.text }}>{projectsWithEvidence}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                <span style={{ color: C.muted }}>Without evidence</span>
                <span style={{ fontWeight: 600, color: C.text }}>{projectsNoEvidence}</span>
              </div>
            </div>
            {projectsNoEvidence > 0 && (
              <AlertRow icon={AlertTriangle} severity="warning" text={`${projectsNoEvidence} projects need evidence`} />
            )}
          </div>
        </DashboardPanel>
      </div>
    </div>
  );
}