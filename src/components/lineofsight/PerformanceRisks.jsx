import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, TrendingDown, CheckCircle } from 'lucide-react';

export default function PerformanceRisks({ divisionObjectives, outputs, getDivisionObjectiveProgress, getOutputProgress }) {
  const objectives = divisionObjectives || [];
  const outputsList = outputs || [];

  // Objectives behind target
  const riskyObjectives = objectives.filter(o => {
    if (['Achieved', 'Not Started'].includes(o.Status)) return false;
    return getDivisionObjectiveProgress(o.id) < 50;
  });

  // Outputs behind target
  const riskyOutputs = outputsList.filter(o => {
    if (['Completed', 'Verified', 'Not Started'].includes(o.Status)) return false;
    return getOutputProgress(o) < 50;
  });

  // Identify patterns
  const patterns = [];
  if (riskyObjectives.length > objectives.length * 0.3 && objectives.length > 0) {
    patterns.push('Multiple objectives showing slow progress');
  }
  if (riskyOutputs.length > outputsList.length * 0.4 && outputsList.length > 0) {
    patterns.push('Widespread output achievement delays');
  }

  const totalRisks = riskyObjectives.length + riskyOutputs.length;

  return (
    <Card className="shadow-md">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-500" />
          Performance Risks & Bottlenecks
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="text-center p-3 bg-red-50 rounded-lg">
            <p className="text-2xl font-bold text-red-600">{riskyObjectives.length}</p>
            <p className="text-xs text-slate-600">Objectives at Risk</p>
          </div>
          <div className="text-center p-3 bg-amber-50 rounded-lg">
            <p className="text-2xl font-bold text-amber-600">{riskyOutputs.length}</p>
            <p className="text-xs text-slate-600">Outputs Behind</p>
          </div>
        </div>

        {patterns.length > 0 && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm font-medium text-red-800 mb-1">Systemic Issues Detected:</p>
            {patterns.map((p, i) => (
              <p key={i} className="text-sm text-red-700">• {p}</p>
            ))}
          </div>
        )}

        {totalRisks === 0 ? (
          <div className="flex items-center gap-2 p-3 bg-emerald-50 rounded-lg text-emerald-700">
            <CheckCircle className="h-4 w-4" />
            <span className="text-sm">All linked items on track</span>
          </div>
        ) : (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {riskyObjectives.slice(0, 3).map(o => (
              <div key={o.id} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
                <TrendingDown className="h-4 w-4 text-red-500" />
                <span className="text-sm flex-1 truncate">{o.Objective_Title?.slice(0, 50) || o.Objective_Code}</span>
                <Badge variant="outline" className="text-xs">{Math.round(getDivisionObjectiveProgress(o.id))}%</Badge>
              </div>
            ))}
            {riskyOutputs.slice(0, 3).map(o => (
              <div key={o.id} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
                <TrendingDown className="h-4 w-4 text-amber-500" />
                <span className="text-sm flex-1 truncate">{o.Output_Title?.slice(0, 50)}</span>
                <Badge variant="outline" className="text-xs">{Math.round(getOutputProgress(o))}%</Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}