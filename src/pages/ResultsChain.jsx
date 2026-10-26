import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { GitBranch, Package, ClipboardList, Info, FolderKanban } from 'lucide-react';
import {
  C, FONT, PageHeader, FilterToolbar, FilterLabel, FilterDivider, SegBtn,
  DashboardPanel, KPIBand, KPITile
} from '@/components/ui/DashboardSystem';
import ResultsChainTree from '../components/resultschain/ResultsChainTree';
import VarianceSummary from '../components/resultschain/VarianceSummary';
import EvidencePanel from '../components/resultschain/EvidencePanel';

const QUARTERS = ['All', 'Q1', 'Q2', 'Q3', 'Q4'];
const DIVISIONS = ['All', 'CID', 'SGOD', 'OSDS'];

const statusColors = {
  'Planning':  'bg-gray-50 text-gray-700 border-gray-200',
  'Ongoing':   'bg-blue-50 text-blue-700 border-blue-200',
  'Completed': 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

export default function ResultsChain() {
  const [selectedProject, setSelectedProject] = useState('');
  const [quarterFilter, setQuarterFilter] = useState('All');
  const [divisionFilter, setDivisionFilter] = useState('All');

  // Fetch all data (unchanged)
  const { data: projects = [] } = useQuery({ queryKey: ['projects'], queryFn: () => base44.entities.Project.list('-created_date') });
  const { data: outputs = [] } = useQuery({ queryKey: ['outputs'], queryFn: () => base44.entities.ProjectOutputs.list() });
  const { data: activities = [] } = useQuery({ queryKey: ['activities'], queryFn: () => base44.entities.DQAMPActivity.list() });
  const { data: feedback = [] } = useQuery({ queryKey: ['feedback'], queryFn: () => base44.entities.ARTAFeedback.list() });

  const project = projects.find(p => p.id === selectedProject);

  // Filter data by selected project (unchanged)
  const projectOutputs = outputs.filter(o => project?.Linked_Outputs?.includes(o.id) || o.Linked_Projects?.includes(selectedProject));
  const projectActivities = activities.filter(a => {
    const isLinkedToProject = project?.Linked_Activities?.includes(a.id) || a.Linked_Projects?.includes(selectedProject);
    const isLinkedToOutputs = projectOutputs.some(o => o.Linked_Activities?.includes(a.id) || a.Linked_Outputs?.includes(o.id));
    if (!isLinkedToProject && !isLinkedToOutputs) return false;
    if (quarterFilter !== 'All' && a.Planned_Start_Date) {
      const month = new Date(a.Planned_Start_Date).getMonth();
      const activityQuarter = Math.floor(month / 3) + 1;
      const filterQuarter = parseInt(quarterFilter.replace('Q', ''));
      if (activityQuarter !== filterQuarter) return false;
    }
    if (divisionFilter !== 'All' && a.Functional_Division !== divisionFilter) return false;
    return true;
  });

  const activityIds = projectActivities.map(a => a.id);
  const projectFeedback = feedback.filter(f => activityIds.includes(f.Linked_Activity));

  // Progress calculation (unchanged)
  const getActivityProgress = (a) => {
    const statusMap = { 'Draft': 5, 'Submitted': 25, 'Returned for Revision': 10, 'Under Review': 60, 'Published': 100 };
    return statusMap[a.Workflow_Status] || 0;
  };

  const getOutputProgress = (output) => {
    const linked = projectActivities.filter(a => output.Linked_Activities?.includes(a.id) || a.Linked_Outputs?.includes(output.id));
    if (linked.length === 0) {
      const statusMap = { 'Not Started': 0, 'In Progress': 50, 'Completed': 100, 'Verified': 100, 'Not Achieved': 0 };
      return statusMap[output.Status] || 0;
    }
    return linked.reduce((sum, a) => sum + getActivityProgress(a), 0) / linked.length;
  };

  const projectProgress = projectOutputs.length > 0
    ? projectOutputs.reduce((sum, o) => sum + getOutputProgress(o), 0) / projectOutputs.length
    : 0;

  const completedCount = projectActivities.filter(a => a.Workflow_Status === 'Published').length;
  const verifiedOutputsCount = projectOutputs.filter(o => ['Completed', 'Verified'].includes(o.Status)).length;

  return (
    <div style={{ fontFamily: FONT, color: C.text, display: 'flex', flexDirection: 'column', gap: 24 }}>
      <PageHeader title="Results Chain" subtitle="Theory of Change visualization: Project → Output → Activity" />

      {/* Filter toolbar */}
      <FilterToolbar>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 250 }}>
          <FilterLabel>Project</FilterLabel>
          <select
            value={selectedProject}
            onChange={e => setSelectedProject(e.target.value)}
            style={{
              flex: 1, border: `1px solid ${C.border}`, borderRadius: 6,
              padding: '5px 10px', fontSize: 13, fontWeight: 500,
              color: C.neutral, background: C.surface, outline: 'none', cursor: 'pointer', fontFamily: FONT,
            }}
          >
            <option value="">Choose a project…</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.Project_Code} – {p.Project_Title}</option>)}
          </select>
        </div>
        <FilterDivider />
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <FilterLabel>Quarter</FilterLabel>
          <div style={{ display: 'flex', background: C.bg, borderRadius: 7, padding: 3, gap: 2 }}>
            {QUARTERS.map(q => (
              <SegBtn key={q} label={q === 'All' ? 'All' : q} active={quarterFilter === q} onClick={() => setQuarterFilter(q)} />
            ))}
          </div>
        </div>
        <FilterDivider />
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <FilterLabel>Division</FilterLabel>
          <div style={{ display: 'flex', background: C.bg, borderRadius: 7, padding: 3, gap: 2 }}>
            {DIVISIONS.map(d => (
              <SegBtn key={d} label={d === 'All' ? 'All' : d} active={divisionFilter === d} onClick={() => setDivisionFilter(d)} />
            ))}
          </div>
        </div>
      </FilterToolbar>

      {!selectedProject ? (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>Please select a project to view its results chain and progress tracking.</AlertDescription>
        </Alert>
      ) : (
        <>
          {/* KPI Band */}
          <KPIBand>
            <KPITile label="Overall progress"   value={`${Math.round(projectProgress)}%`}            icon={GitBranch}    borderLeft={C.brand}      />
            <KPITile label="Outputs completed"  value={`${verifiedOutputsCount}/${projectOutputs.length}`} icon={Package}      borderLeft={C.successBar} />
            <KPITile label="Activities completed" value={`${completedCount}/${projectActivities.length}`} icon={ClipboardList} borderLeft={C.accent}     />
            <KPITile label="Feedback responses" value={projectFeedback.length}                       icon={FolderKanban} borderLeft={C.warningBar} />
          </KPIBand>

          {/* Project detail panel */}
          <DashboardPanel title={project?.Project_Title} aside={project?.Project_Code} noPad>
            <div style={{ padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Badge className={statusColors[project?.Project_Status]} variant="outline">{project?.Project_Status}</Badge>
              </div>
              {project?.Project_Description && (
                <p style={{ fontSize: 14, fontWeight: 400, color: C.muted, lineHeight: 1.5, margin: 0 }}>{project.Project_Description}</p>
              )}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                  <span style={{ color: C.muted }}>Progress</span>
                  <span style={{ fontWeight: 600, color: C.text }}>{Math.round(projectProgress)}%</span>
                </div>
                <Progress value={projectProgress} className="h-2" />
              </div>
            </div>
          </DashboardPanel>

          {/* Results Chain Tree */}
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: C.text, fontFamily: FONT, margin: '0 0 12px', lineHeight: 1.3 }}>
              Results hierarchy
            </h3>
            <ResultsChainTree project={project} outputs={projectOutputs} activities={projectActivities} />
          </div>

          {/* Bottom Section */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <VarianceSummary activities={projectActivities} outputs={projectOutputs} />
            <EvidencePanel activities={projectActivities} outputs={projectOutputs} feedback={projectFeedback} />
          </div>

          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Note:</strong> This view supports contribution analysis, not direct attribution.
              Progress percentages are computed from linked records and workflow statuses.
            </AlertDescription>
          </Alert>
        </>
      )}
    </div>
  );
}