import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileCheck, Calendar, ClipboardCheck } from 'lucide-react';
import { format } from 'date-fns';

export default function EvidenceSummary({ activities, feedback }) {
  // QAME assessments (activities that have been reviewed/published)
  const qameAssessments = activities.filter(a => 
    a.Workflow_Status === 'Under Review' || a.Workflow_Status === 'Published'
  );

  // PIR reports (could be activities with category PIR or published reports)
  const pirReports = activities.filter(a => a.Category === 'PIR' && a.Workflow_Status === 'Published');

  // Most recent monitoring activity
  const sortedActivities = [...activities]
    .filter(a => a.Workflow_Status === 'Published')
    .sort((a, b) => new Date(b.updated_date || b.created_date) - new Date(a.updated_date || a.created_date));
  
  const mostRecent = sortedActivities[0];
  const mostRecentDate = mostRecent?.updated_date || mostRecent?.created_date;

  const formatDate = (date) => {
    if (!date) return 'N/A';
    try {
      return format(new Date(date), 'MMM d, yyyy');
    } catch {
      return 'N/A';
    }
  };

  return (
    <Card className="shadow-md">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <FileCheck className="h-5 w-5 text-[#1e3a5f]" />
          Evidence & Assurance Summary
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
            <div className="flex items-center gap-3">
              <ClipboardCheck className="h-5 w-5 text-[#0d9488]" />
              <span className="text-sm text-slate-700">QAME Assessments</span>
            </div>
            <Badge className="bg-[#0d9488]">{qameAssessments.length}</Badge>
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
            <div className="flex items-center gap-3">
              <FileCheck className="h-5 w-5 text-purple-600" />
              <span className="text-sm text-slate-700">PIR Reports</span>
            </div>
            <Badge className="bg-purple-600">{pirReports.length}</Badge>
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-blue-600" />
              <span className="text-sm text-slate-700">ARTA Feedback</span>
            </div>
            <Badge className="bg-blue-600">{feedback.length}</Badge>
          </div>

          <div className="pt-3 border-t">
            <p className="text-xs text-slate-500 mb-1">Most Recent Monitoring Activity</p>
            <p className="text-sm font-medium text-slate-800">
              {mostRecent ? mostRecent.Title : 'No published activities'}
            </p>
            <p className="text-xs text-slate-500">{formatDate(mostRecentDate)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}