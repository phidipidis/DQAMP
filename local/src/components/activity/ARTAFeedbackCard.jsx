import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, Lock, ClipboardCheck } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { useNavigate } from 'react-router-dom';

export default function ARTAFeedbackCard({ activityId, feedbackCount, hasQameReport, isAdmin, isReviewer }) {
  const navigate = useNavigate();

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-[#1B2A8F] flex items-center gap-2 text-base">
          <ClipboardCheck className="h-4 w-4" />ARTA Customer Satisfaction Feedback
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-slate-600 text-sm">{feedbackCount} feedback record(s) collected for this activity.</p>
        <div className="flex flex-wrap gap-3 items-center">
          <Button variant="outline" className="gap-2"
            onClick={() => navigate(createPageUrl(`ARTAFeedback?activity=${activityId}`))}>
            <ExternalLink className="h-4 w-4" />
            {feedbackCount > 0 ? 'View / Add Feedback' : 'Submit ARTA Feedback'}
          </Button>
          {hasQameReport && feedbackCount === 0 && !isAdmin && !isReviewer && (
            <span className="flex items-center gap-1 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-1.5">
              <Lock className="h-3.5 w-3.5" />Feedback required to download QAME Report
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}