import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Clock, TrendingDown } from 'lucide-react';

export default function VarianceSummary({ activities, outputs }) {
  const today = new Date();
  
  // Find activities behind schedule (past planned completion but not Published)
  const behindScheduleActivities = activities.filter(a => {
    if (!a.Planned_Completion_Date) return false;
    const plannedDate = new Date(a.Planned_Completion_Date);
    return plannedDate < today && a.Workflow_Status !== 'Published';
  });

  // Find outputs past due date and not verified
  const behindScheduleOutputs = outputs.filter(o => {
    if (!o.Due_Date) return false;
    const dueDate = new Date(o.Due_Date);
    return dueDate < today && o.Output_Verification_Status !== 'Verified';
  });

  // Group activities by workflow status for insights
  const statusCounts = activities.reduce((acc, a) => {
    acc[a.Workflow_Status] = (acc[a.Workflow_Status] || 0) + 1;
    return acc;
  }, {});

  const draftCount = statusCounts['Draft'] || 0;
  const submittedCount = statusCounts['Submitted'] || 0;

  const issues = [
    ...behindScheduleActivities.map(a => ({
      type: 'activity',
      title: a.Title,
      issue: 'Behind schedule',
      status: a.Workflow_Status,
      date: a.Planned_Completion_Date
    })),
    ...behindScheduleOutputs.map(o => ({
      type: 'output',
      title: o.Output_Description,
      issue: 'Past due date',
      status: o.Output_Verification_Status,
      date: o.Due_Date
    }))
  ];

  return (
    <Card className="shadow-md">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-500" />
          Risks, Issues & Variance Summary
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center p-3 bg-amber-50 rounded-lg">
            <p className="text-2xl font-bold text-amber-600">{behindScheduleActivities.length}</p>
            <p className="text-xs text-slate-600">Activities Behind</p>
          </div>
          <div className="text-center p-3 bg-red-50 rounded-lg">
            <p className="text-2xl font-bold text-red-600">{behindScheduleOutputs.length}</p>
            <p className="text-xs text-slate-600">Outputs Past Due</p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-gray-600">{draftCount}</p>
            <p className="text-xs text-slate-600">Still in Draft</p>
          </div>
        </div>

        {/* Issues List */}
        {issues.length === 0 ? (
          <div className="text-center py-6 text-slate-500">
            <TrendingDown className="h-8 w-8 mx-auto mb-2 text-emerald-500" />
            <p>No significant variances detected</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {issues.slice(0, 10).map((issue, idx) => (
              <div 
                key={idx} 
                className="flex items-center gap-3 p-2 bg-slate-50 rounded-lg border border-slate-100"
              >
                <div className={`p-1.5 rounded ${issue.type === 'activity' ? 'bg-amber-100' : 'bg-red-100'}`}>
                  {issue.type === 'activity' ? (
                    <Clock className="h-3.5 w-3.5 text-amber-600" />
                  ) : (
                    <AlertTriangle className="h-3.5 w-3.5 text-red-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{issue.title}</p>
                  <p className="text-xs text-slate-500">
                    {issue.issue} • Due: {issue.date}
                  </p>
                </div>
                <Badge variant="outline" className="text-xs">
                  {issue.status}
                </Badge>
              </div>
            ))}
            {issues.length > 10 && (
              <p className="text-xs text-center text-slate-500 pt-2">
                +{issues.length - 10} more issues
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}