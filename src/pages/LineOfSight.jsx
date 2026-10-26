import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Flag, Info } from 'lucide-react';
import {
  C, FONT, PageHeader, FilterToolbar, FilterLabel, FilterDivider, SegBtn,
  DashboardPanel, KPIBand, KPITile
} from '@/components/ui/DashboardSystem';
import GoalResultsMap from '../components/lineofsight/GoalResultsMap';
import ContributionAnalysis from '../components/lineofsight/ContributionAnalysis';
import PerformanceRisks from '../components/lineofsight/PerformanceRisks';
import EvidenceSummary from '../components/lineofsight/EvidenceSummary';

const QUARTERS = ['All', 'Q1', 'Q2', 'Q3', 'Q4'];
const DIVISIONS = ['All', 'CID', 'SGOD', 'OSDS'];

export default function LineOfSight() {
  const [selectedGoal, setSelectedGoal] = useState('');
  const [quarterFilter, setQuarterFilter] = useState('All');
  const [divisionFilter, setDivisionFilter] = useState('All');

  // Fetch all data (unchanged)
  const { data: goals = [] } = useQuery({ queryKey: ['organizationalGoals'], queryFn: () => base44.entities.OrganizationalGoal.list('-created_date') });
  const { data: divisionObjectives = [] } = useQuery({ queryKey: ['divisionObjectives'], queryFn: () => base44.entities.DivisionObjective.list() });
  const { data: outputs = [] } = useQuery({ queryKey: ['outputs'], queryFn: () => base44.entities.ProjectOutputs.list() });
  const { data: projects = [] } = useQuery({ queryKey: ['projects'], queryFn: () => base44.entities.Project.list() });
  const { data: activities = [] } = useQuery({ queryKey: ['activities'], queryFn: () => base44.entities.DQAMPActivity.list() });
  const { data: feedback = [] } = useQuery({ queryKey: ['feedback'], queryFn: () => base44.entities.ARTAFeedback.list() });

  useEffect(() => {
    if (!selectedGoal && goals.length > 0) setSelectedGoal(goals[0].id);
  }, [goals, selectedGoal]);

  const goal = goals.find(g => g.id === selectedGoal);

  // Progress calculation functions (unchanged)
  const getActivityProgress = (activity) => {
    const statusMap = { 'Draft': 5, 'Submitted': 25, 'Returned for Revision': 10, 'Under Review': 60, 'Published': 100 };
    return statusMap[activity.Workflow_Status] || 0;
  };

  const getOutputProgress = (output) => {
    const linkedActivities = activities.filter(a => output.Linked_Activities?.includes(a.id) || a.Linked_Outputs?.includes(output.id));
    if (linkedActivities.length === 0) {
      const statusMap = { 'Not Started': 0, 'In Progress': 50, 'Completed': 100, 'Verified': 100, 'Not Achieved': 0 };
      return statusMap[output.Status] || 0;
    }
    return linkedActivities.reduce((sum, a) => sum + getActivityProgress(a), 0) / linkedActivities.length;
  };

  const getDivisionObjectiveProgress = (objectiveId) => {
    const obj = divisionObjectives.find(o => o.id === objectiveId);
    if (!obj) return 0;
    const linkedOutputs = outputs.filter(o => obj.Linked_Outputs?.includes(o.id) || o.Linked_Division_Objectives?.includes(obj.id));
    if (linkedOutputs.length === 0) {
      const statusMap = { 'Not Started': 0, 'In Progress': 50, 'On Track': 75, 'At Risk': 40, 'Achieved': 100, 'Not Achieved': 0 };
      return statusMap[obj.Status] || obj.Current_Progress || 0;
    }
    return linkedOutputs.reduce((sum, o) => sum + getOutputProgress(o), 0) / linkedOutputs.length;
  };

  // Filter data by goal (unchanged)
  const linkedObjectives = goal ? divisionObjectives.filter(obj => goal.Linked_Division_Objectives?.includes(obj.id) || obj.Linked_Organizational_Goals?.includes(goal.id)) : [];
  const linkedOutputs = outputs.filter(o => linkedObjectives.some(obj => obj.Linked_Outputs?.includes(o.id) || o.Linked_Division_Objectives?.includes(obj.id)));
  const linkedProjects = projects.filter(p => linkedOutputs.some(o => o.Linked_Projects?.includes(p.id) || p.Linked_Outputs?.includes(o.id)));
  const linkedActivities = activities.filter(a => {
    const isLinkedToOutputs = linkedOutputs.some(o => o.Linked_Activities?.includes(a.id) || a.Linked_Outputs?.includes(o.id));
    if (!isLinkedToOutputs) return false;
    if (quarterFilter !== 'All' && a.Planned_Start_Date) {
      const month = new Date(a.Planned_Start_Date).getMonth();
      const q = Math.floor(month / 3) + 1;
      if (`Q${q}` !== quarterFilter) return false;
    }
    if (divisionFilter !== 'All' && a.Functional_Division !== divisionFilter) return false;
    return true;
  });
  const linkedFeedback = feedback.filter(f => linkedActivities.some(a => a.id === f.Linked_Activity));

  // Goal progress (unchanged)
  const goalProgress = linkedObjectives.length > 0
    ? linkedObjectives.reduce((sum, obj) => sum + getDivisionObjectiveProgress(obj.id), 0) / linkedObjectives.length
    : goal?.Current_Progress || 0;

  const riskyObjectives = linkedObjectives.filter(obj => ['At Risk', 'Not Achieved'].includes(obj.Status));
  const riskStatus = linkedObjectives.length === 0 ? goal?.Status || 'N/A' :
    riskyObjectives.length === 0 ? 'On Track' :
    riskyObjectives.length / linkedObjectives.length > 0.3 ? 'Critical' : 'At Risk';

  const riskColors = {
    'On Track': 'bg-emerald-50 text-emerald-700 border-emerald-200',
    'At Risk': 'bg-amber-50 text-amber-700 border-amber-200',
    'Critical': 'bg-red-50 text-red-700 border-red-200',
    'N/A': 'bg-gray-50 text-gray-700 border-gray-200'
  };

  return (
    <div style={{ fontFamily: FONT, color: C.text, display: 'flex', flexDirection: 'column', gap: 24 }}>
      <PageHeader title="Organizational Goal – Line of Sight" subtitle="Theory of Change: Goal → Objective → Output → Project → Activity" />

      {/* Filter toolbar */}
      <FilterToolbar>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 250 }}>
          <FilterLabel>Goal</FilterLabel>
          <select
            value={selectedGoal}
            onChange={e => setSelectedGoal(e.target.value)}
            style={{
              flex: 1, border: `1px solid ${C.border}`, borderRadius: 6,
              padding: '5px 10px', fontSize: 13, fontWeight: 500,
              color: C.neutral, background: C.surface, outline: 'none', cursor: 'pointer', fontFamily: FONT,
            }}
          >
            <option value="">Choose a goal…</option>
            {goals.map(g => <option key={g.id} value={g.id}>{g.Goal_Title}</option>)}
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

      {!selectedGoal ? (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>Select an organizational goal to view its line of sight and progress.</AlertDescription>
        </Alert>
      ) : (
        <>
          {/* Goal Overview — KPI Band style */}
          <KPIBand>
            <KPITile label="Overall progress" value={`${Math.round(goalProgress)}%`} icon={Flag} borderLeft={C.brand} />
            <KPITile label="Objectives" value={linkedObjectives.length} borderLeft={C.accent} />
            <KPITile label="Outputs" value={linkedOutputs.length} borderLeft={C.successBar} />
            <KPITile label="Projects" value={linkedProjects.length} borderLeft={C.warningBar} />
          </KPIBand>

          {/* Goal detail panel */}
          <DashboardPanel title={goal?.Goal_Title} aside={riskStatus} noPad>
            <div style={{ padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Badge className={riskColors[riskStatus]} variant="outline">{riskStatus}</Badge>
                {goal?.Strategic_Priority && (
                  <Badge variant="outline" className="text-slate-600 border-slate-300">{goal.Strategic_Priority} priority</Badge>
                )}
              </div>
              {goal?.Description && (
                <p style={{ fontSize: 14, fontWeight: 400, color: C.muted, lineHeight: 1.5, margin: 0 }}>{goal.Description}</p>
              )}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                  <span style={{ color: C.muted }}>Progress</span>
                  <span style={{ fontWeight: 600, color: C.text }}>{Math.round(goalProgress)}%</span>
                </div>
                <Progress value={goalProgress} className="h-2" />
              </div>
            </div>
          </DashboardPanel>

          {/* Results Map */}
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: C.text, fontFamily: FONT, margin: '0 0 12px', lineHeight: 1.3 }}>
              Line-of-sight results map
            </h3>
            <GoalResultsMap
              goal={goal}
              divisionObjectives={linkedObjectives}
              outputs={linkedOutputs}
              projects={linkedProjects}
              getDivisionObjectiveProgress={getDivisionObjectiveProgress}
              getOutputProgress={getOutputProgress}
            />
          </div>

          {/* Analysis Panels */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20 }}>
            <ContributionAnalysis
              goal={goal}
              divisionObjectives={linkedObjectives}
              outputs={linkedOutputs}
              projects={linkedProjects}
              allGoals={goals}
            />
            <PerformanceRisks
              divisionObjectives={linkedObjectives}
              outputs={linkedOutputs}
              getDivisionObjectiveProgress={getDivisionObjectiveProgress}
              getOutputProgress={getOutputProgress}
            />
            <EvidenceSummary
              activities={linkedActivities}
              feedback={linkedFeedback}
            />
          </div>

          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              This view establishes a strategic "line of sight" from organizational goals to results.
              Click any Project or Objective to open the detailed Results Chain.
            </AlertDescription>
          </Alert>
        </>
      )}
    </div>
  );
}