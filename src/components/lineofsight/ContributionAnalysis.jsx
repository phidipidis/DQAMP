import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, CheckCircle, Info } from 'lucide-react';

export default function ContributionAnalysis({ goal, divisionObjectives, outputs, projects, allGoals }) {
  const linkedObjectives = divisionObjectives || [];
  const linkedOutputs = outputs || [];
  const linkedProjects = projects || [];

  // Find orphaned objectives (not linked to any goal)
  const allLinkedObjectiveIds = (allGoals || []).flatMap(g => g.Linked_Division_Objectives || []);
  const orphanedObjectives = (divisionObjectives || []).filter(o => !allLinkedObjectiveIds.includes(o.id));
  
  // Find orphaned outputs (not linked to any division objective)
  const allLinkedOutputIds = (divisionObjectives || []).flatMap(obj => obj.Linked_Outputs || []);
  const orphanedOutputs = (outputs || []).filter(o => !allLinkedOutputIds.includes(o.id));

  // Check concentration risk (>50% outputs from single objective)
  const objectiveContributions = linkedObjectives.map(obj => ({
    objective: obj,
    outputCount: (outputs || []).filter(o => obj.Linked_Outputs?.includes(o.id) || o.Linked_Division_Objectives?.includes(obj.id)).length
  }));
  const totalOutputs = linkedOutputs.length;
  const concentrationRisk = objectiveContributions.some(oc => 
    totalOutputs > 0 && (oc.outputCount / totalOutputs) > 0.5
  );

  const issues = [];
  if (orphanedObjectives.length > 0) issues.push({ type: 'warning', text: `${orphanedObjectives.length} objectives not linked to any goal` });
  if (orphanedOutputs.length > 0) issues.push({ type: 'warning', text: `${orphanedOutputs.length} outputs not linked to any objective` });
  if (concentrationRisk) issues.push({ type: 'risk', text: 'High concentration: >50% from single objective' });
  if (linkedObjectives.length === 0) issues.push({ type: 'critical', text: 'No objectives linked to this goal' });

  return (
    <Card className="shadow-md">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Info className="h-5 w-5 text-[#1e3a5f]" />
          Contribution & Coverage Analysis
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center p-3 bg-slate-50 rounded-lg">
            <p className="text-2xl font-bold text-[#0d9488]">{linkedObjectives.length}</p>
            <p className="text-xs text-slate-600">Division Objectives</p>
          </div>
          <div className="text-center p-3 bg-slate-50 rounded-lg">
            <p className="text-2xl font-bold text-amber-600">{linkedOutputs.length}</p>
            <p className="text-xs text-slate-600">Linked Outputs</p>
          </div>
          <div className="text-center p-3 bg-slate-50 rounded-lg">
            <p className="text-2xl font-bold text-[#1e3a5f]">{linkedProjects.length}</p>
            <p className="text-xs text-slate-600">Contributing Projects</p>
          </div>
        </div>

        {issues.length === 0 ? (
          <div className="flex items-center gap-2 p-3 bg-emerald-50 rounded-lg text-emerald-700">
            <CheckCircle className="h-4 w-4" />
            <span className="text-sm">Good coverage with no gaps detected</span>
          </div>
        ) : (
          <div className="space-y-2">
            {issues.map((issue, idx) => (
              <div 
                key={idx} 
                className={`flex items-center gap-2 p-2 rounded-lg text-sm ${
                  issue.type === 'critical' ? 'bg-red-50 text-red-700' :
                  issue.type === 'risk' ? 'bg-amber-50 text-amber-700' :
                  'bg-yellow-50 text-yellow-700'
                }`}
              >
                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                <span>{issue.text}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}