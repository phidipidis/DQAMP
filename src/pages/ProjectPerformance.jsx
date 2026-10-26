import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { FolderKanban, Target, Package, CheckCircle, Clock } from 'lucide-react';
import DashboardFilters from '../components/ui/DashboardFilters';
import {
  C, FONT, PageHeader, DashboardPanel, KPIBand, KPITile, chartTickSmall, chartTooltipStyle, chartGridStroke
} from '@/components/ui/DashboardSystem';

const statusBadgeClass = {
  'Planning':  'bg-gray-100 text-gray-700 border-gray-200',
  'Ongoing':   'bg-blue-50 text-blue-700 border-blue-200',
  'On Track':  'bg-emerald-50 text-emerald-700 border-emerald-200',
  'At Risk':   'bg-amber-50 text-amber-700 border-amber-200',
  'Delayed':   'bg-red-50 text-red-700 border-red-200',
  'Completed': 'bg-emerald-100 text-emerald-800 border-emerald-300',
};

export default function ProjectPerformance() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [quarters, setQuarters] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [projectId, setProjectId] = useState('All');

  const { data: projects = [] } = useQuery({ queryKey: ['projects'], queryFn: () => base44.entities.Project.list() });
  const { data: divisionObjectives = [] } = useQuery({ queryKey: ['divisionObjectives'], queryFn: () => base44.entities.DivisionObjective.list() });
  const { data: outputs = [] } = useQuery({ queryKey: ['outputs'], queryFn: () => base44.entities.ProjectOutputs.list() });
  const { data: activities = [] } = useQuery({ queryKey: ['activities'], queryFn: () => base44.entities.DQAMPActivity.list() });

  // Filter projects (unchanged)
  const filteredProjects = projects.filter(project => {
    if (divisions.length > 0 && !divisions.includes(project.Functional_Division)) return false;
    if (projectId !== 'All' && project.id !== projectId) return false;
    return true;
  });

  // Calculate project performance metrics (unchanged)
  const projectMetrics = filteredProjects.map(project => {
    const projectOutputs = outputs.filter(o => project.Linked_Outputs?.includes(o.id));
    const projectActivities = activities.filter(a => a.Linked_Projects?.includes(project.id));
    const completedOutputs = projectOutputs.filter(o => ['Completed', 'Verified'].includes(o.Status)).length;
    const completedActivities = projectActivities.filter(a => a.Workflow_Status === 'Published').length;
    const totalBudget = project.Financial_Allocation || projectActivities.reduce((sum, a) => sum + (a.Financial_Allocation || 0), 0);
    const utilizedBudget = project.Financial_Utilization || projectActivities.reduce((sum, a) => sum + (a.Financial_Utilization || 0), 0);
    return {
      ...project,
      outputsCount: projectOutputs.length,
      completedOutputs,
      outputsProgress: projectOutputs.length > 0 ? (completedOutputs / projectOutputs.length) * 100 : 0,
      activitiesCount: projectActivities.length,
      completedActivities,
      activitiesProgress: projectActivities.length > 0 ? (completedActivities / projectActivities.length) * 100 : 0,
      totalBudget,
      utilizedBudget,
      budgetUtilization: totalBudget > 0 ? (utilizedBudget / totalBudget) * 100 : 0
    };
  });

  // Summary stats (unchanged)
  const totalProjects = filteredProjects.length;
  const completedProjects = filteredProjects.filter(p => p.Project_Status === 'Completed').length;
  const ongoingProjects = filteredProjects.filter(p => p.Project_Status === 'Ongoing').length;
  const planningProjects = filteredProjects.filter(p => p.Project_Status === 'Planning').length;

  // Chart data (unchanged)
  const chartData = projectMetrics.slice(0, 10).map(p => ({
    name: p.Project_Code,
    outputs: p.outputsProgress,
    activities: p.activitiesProgress
  }));

  return (
    <div style={{ fontFamily: FONT, color: C.text, display: 'flex', flexDirection: 'column', gap: 24 }}>
      <PageHeader title="Performance Tracking" subtitle="Track project objectives, outputs, and activity completion" />

      <DashboardFilters
        year={year} setYear={setYear}
        quarters={quarters} setQuarters={setQuarters}
        divisions={divisions} setDivisions={setDivisions}
        projectId={projectId} setProjectId={setProjectId}
        projects={projects}
      />

      {/* KPI Band */}
      <KPIBand>
        <KPITile label="Total projects" value={totalProjects}      icon={FolderKanban} borderLeft={C.brand}      />
        <KPITile label="Planning"       value={planningProjects}   icon={Clock}        borderLeft={C.muted}      />
        <KPITile label="Ongoing"        value={ongoingProjects}    icon={Target}       borderLeft={C.accent}     />
        <KPITile label="Completed"      value={completedProjects}  icon={CheckCircle}  borderLeft={C.successBar} />
      </KPIBand>

      {/* Progress Chart */}
      {chartData.length > 0 && (
        <DashboardPanel title="Project progress comparison (%)" noPad>
          <div style={{ height: 320, padding: '16px 0 0' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartGridStroke} vertical={false} />
                <XAxis dataKey="name" tick={chartTickSmall} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={chartTickSmall} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={chartTooltipStyle} formatter={v => `${v.toFixed(1)}%`} />
                <Legend wrapperStyle={{ fontSize: 12, fontFamily: FONT }} />
                <Bar dataKey="outputs" fill={C.accent} name="Outputs" radius={[4,4,0,0]} />
                <Bar dataKey="activities" fill={C.brand} name="Activities" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </DashboardPanel>
      )}

      {/* Project Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {projectMetrics.map(project => (
          <DashboardPanel key={project.id} noPad>
            <div style={{ padding: '16px 24px', borderBottom: `1px solid ${C.border}` }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                <div style={{ minWidth: 0 }}>
                  <Link
                    to={createPageUrl(`ProjectView?id=${project.id}`)}
                    style={{ fontSize: 15, fontWeight: 700, color: C.brand, textDecoration: 'none', fontFamily: FONT }}
                  >
                    {project.Project_Code}
                  </Link>
                  <p style={{ fontSize: 13, fontWeight: 400, color: C.muted, margin: '2px 0 0' }}>{project.Project_Title}</p>
                </div>
                <Badge className={statusBadgeClass[project.Project_Status]} variant="outline">{project.Project_Status}</Badge>
              </div>
            </div>
            <div style={{ padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Outputs Progress */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: C.text, fontWeight: 500 }}>
                    <Package size={14} color={C.accent} /> Outputs
                  </span>
                  <span style={{ fontWeight: 600, color: C.muted }}>{project.completedOutputs}/{project.outputsCount}</span>
                </div>
                <Progress value={project.outputsProgress} className="h-2" />
              </div>

              {/* Activities Progress */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: C.text, fontWeight: 500 }}>
                    <CheckCircle size={14} color={C.warningBar} /> Activities
                  </span>
                  <span style={{ fontWeight: 600, color: C.muted }}>{project.completedActivities}/{project.activitiesCount}</span>
                </div>
                <Progress value={project.activitiesProgress} className="h-2" />
              </div>

              {/* Budget */}
              <div style={{ paddingTop: 12, borderTop: `1px solid ${C.border}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                  <span style={{ color: C.muted }}>Budget utilization</span>
                  <span style={{ fontWeight: 600, color: C.text }}>
                    ₱{project.utilizedBudget.toLocaleString()} / ₱{project.totalBudget.toLocaleString()}
                  </span>
                </div>
                <Progress value={project.budgetUtilization} className="h-2" />
              </div>
            </div>
          </DashboardPanel>
        ))}
      </div>

      {filteredProjects.length === 0 && (
        <div style={{ padding: '48px 24px', textAlign: 'center', color: C.muted, fontSize: 13, fontFamily: FONT, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10 }}>
          No projects found matching the selected filters.
        </div>
      )}
    </div>
  );
}