import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { logAuditEvent } from '../components/audit/AuditLogger';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import OneDriveLinkInput from '@/components/ui/OneDriveLinkInput';
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import WorkflowBadge from '../components/ui/WorkflowBadge';
import {
  ArrowLeft, Edit, Send, CheckCircle, FileDown, AlertCircle,
  Calendar, DollarSign, Building2, FolderKanban, Users,
  ClipboardCheck, Lock, ExternalLink, RotateCcw, Paperclip
} from 'lucide-react';
import { format } from 'date-fns';

// CRITICAL-4: Rating → numeric score mapping
const RATING_SCORE_MAP = {
  'Outstanding': 4,
  'Very Satisfactory': 3,
  'Satisfactory': 2,
  'Needs Improvement': 1,
  'Not Rated': null
};

export default function ActivityView() {
  const urlParams = new URLSearchParams(window.location.search);
  const activityId = urlParams.get('id');
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [transitionDialogOpen, setTransitionDialogOpen] = useState(false);
  const [targetStatus, setTargetStatus] = useState('');

  // CRITICAL-1: Unified to Activity entity
  const { data: activityData, isLoading } = useQuery({
    queryKey: ['activity', activityId],
    queryFn: () => base44.entities.DQAMPActivity.filter({ id: activityId })
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => base44.entities.Project.list()
  });

  const { data: assessors = [] } = useQuery({
    queryKey: ['assessors'],
    queryFn: () => base44.entities.QAME_Assessor.list()
  });

  // CRITICAL-2: Fixed ARTAFeedback
  const { data: feedback = [] } = useQuery({
    queryKey: ['feedback', activityId],
    queryFn: () => base44.entities.ARTAFeedback.filter({ Linked_Activity: activityId })
  });

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const activity = activityData?.[0];
  const isAdmin = currentUser?.role === 'admin';
  const isReviewer = ['QA_Assessor'].includes(currentUser?.role);

  const formatDate = (d) => {
    if (!d || isNaN(new Date(d).getTime())) return '-';
    return format(new Date(d), 'MMM d, yyyy');
  };

  const getProject = (pid) => projects.find(p => p.id === pid);
  const getAssessorNames = (ids) => {
    if (!ids?.length) return [];
    return ids.map(id => assessors.find(a => a.id === id)?.Name).filter(Boolean);
  };

  // CRITICAL-1: Unified to Activity entity
  const transitionMutation = useMutation({
    mutationFn: async ({ newStatus }) => {
      const today = new Date().toISOString().split('T')[0];
      const extra = {};
      if (newStatus === 'Under Review') { extra.Reviewed_By = currentUser?.email; extra.Reviewed_Date = today; }
      if (newStatus === 'Published') { extra.Published_Date = today; }
      return base44.entities.DQAMPActivity.update(activityId, { Workflow_Status: newStatus, ...extra });
    },
    onSuccess: async (_, { newStatus }) => {
      await logAuditEvent({
        actionType: newStatus === 'Published' ? 'Publish' : 'Review',
        entity: 'DQAMPActivity', recordId: activityId,
        remarks: `Transitioned to ${newStatus}`
      });
      queryClient.invalidateQueries(['activity', activityId]);
      setTransitionDialogOpen(false);
    }
  });

  // CRITICAL-1 + CRITICAL-4: Activity entity + QAME_Rating_Score persisted
  const qameMutation = useMutation({
    mutationFn: (data) => base44.entities.DQAMPActivity.update(activityId, data),
    onSuccess: () => queryClient.invalidateQueries(['activity', activityId])
  });

  const handleQameReportLink = async (url) => {
    await qameMutation.mutateAsync({ QAME_Report_File: url });
    await logAuditEvent({ actionType: 'Upload', entity: 'DQAMPActivity', recordId: activityId, remarks: 'Linked QAME Report' });
  };

  const [movUrl, setMovUrl] = useState('');
  const [movSaving, setMovSaving] = useState(false);
  const [qameFormUrl, setQameFormUrl] = useState('');
  const [editingQameUrl, setEditingQameUrl] = useState(false);

  useEffect(() => {
    // Evidence/MOV card reads from Evidence_Attachments[0]
    const existing = activity?.Evidence_Attachments?.[0] || '';
    setMovUrl(existing);
  }, [activity?.id]);
  // NOTE: Depend on activity.id instead of Evidence_Attachments so
  // the field only resets when a NEW activity is loaded, not on every
  // background refresh. This prevents wiping the user's in-progress typing.

  useEffect(() => {
    const existing = activity?.QAME_Evaluation_Form_URL || '';
    setQameFormUrl(existing);
  }, [activity?.QAME_Evaluation_Form_URL]);

  // Permission flags
  const canDownloadReport = isAdmin || isReviewer || feedback.length > 0;
  // MINOR-9 fix: reviewers/assessors see the QAME panel regardless of ARTA gate
  const canSeeQAMEPanel = isAdmin || isReviewer || canDownloadReport;
  // CRITICAL-4: Both admin and reviewer can edit QAME when Under Review
  const canEditQAME = isAdmin || (isReviewer && activity?.Workflow_Status === 'Under Review');

  // MAJOR-5: "Return for Revision" is now included
  const getNextStatus = () => {
    switch (activity?.Workflow_Status) {
      case 'Submitted': return 'Under Review';
      case 'Returned for Revision': return 'Submitted';
      case 'Under Review': return 'Published';
      default: return null;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 bg-slate-200 rounded w-1/3" />
        <div className="grid grid-cols-2 gap-6">
          <div className="h-48 bg-slate-100 rounded-xl" />
          <div className="h-48 bg-slate-100 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!activity) {
    return <div className="flex items-center justify-center h-64 text-slate-500">Activity not found.</div>;
  }

  const handleSaveMOV = async () => {
    setMovSaving(true);
    // Save to Evidence_Attachments array
    const updatedAttachments = movUrl ? [movUrl] : [];
    await base44.entities.DQAMPActivity.update(activityId, { Evidence_Attachments: updatedAttachments });
    await logAuditEvent({ actionType: 'Update', entity: 'DQAMPActivity', recordId: activityId, remarks: 'Updated Evidence/MOV link' });
    queryClient.invalidateQueries(['activity', activityId]);
    setMovSaving(false);
  };

  // CRITICAL-1: Linked_Projects is now an array
  const project = getProject(activity.Linked_Projects?.[0]);
  const assignedAssessorNames = getAssessorNames(activity.Assigned_Assessors);
  const nextStatus = getNextStatus();
  const canReturnRevision = (isAdmin || isReviewer) && activity.Workflow_Status === 'Under Review';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate(createPageUrl('Activities'))}>
            <ArrowLeft className="h-4 w-4 mr-2" />Back
          </Button>
          <div>
            {/* CRITICAL-1: Activity entity uses Activity_Title */}
            <h1 className="text-2xl font-bold text-[#1B2A8F]">{activity.Activity_Title}</h1>
            <div className="flex items-center gap-2 mt-1">
              <WorkflowBadge status={activity.Workflow_Status} />
              {activity.Functional_Division && <Badge variant="outline">{activity.Functional_Division}</Badge>}
            </div>
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          {activity.Workflow_Status !== 'Published' && (
            <Button variant="outline" onClick={() => navigate(createPageUrl(`ActivityForm?id=${activityId}`))}>
              <Edit className="h-4 w-4 mr-2" />Edit
            </Button>
          )}
          {nextStatus && (
            <Button onClick={() => { setTargetStatus(nextStatus); setTransitionDialogOpen(true); }}
              className="bg-[#1B2A8F] hover:bg-[#1B2A8F]/90">
              {nextStatus === 'Under Review' && <CheckCircle className="h-4 w-4 mr-2" />}
              {nextStatus === 'Published' && <Send className="h-4 w-4 mr-2" />}
              Move to {nextStatus}
            </Button>
          )}
          {/* MAJOR-5: Return for Revision button */}
          {canReturnRevision && (
            <Button variant="outline" className="border-amber-400 text-amber-700 hover:bg-amber-50"
              onClick={() => { setTargetStatus('Returned for Revision'); setTransitionDialogOpen(true); }}>
              <RotateCcw className="h-4 w-4 mr-2" />Return for Revision
            </Button>
          )}
          {/* QAME Report download — gated by ARTA feedback */}
          {(activity.QAME_Report_URL || activity.QAME_Report_File) && (
            canDownloadReport ? (
              <Button variant="outline" onClick={() => window.open(activity.QAME_Report_URL || activity.QAME_Report_File, '_blank')}>
                <FileDown className="h-4 w-4 mr-2" />Download Report
              </Button>
            ) : !isAdmin && !isReviewer && (
              <Button variant="outline" className="border-amber-400 text-amber-700 hover:bg-amber-50"
                onClick={() => navigate(createPageUrl(`ARTAFeedback?activity=${activityId}`))}>
                <Lock className="h-4 w-4 mr-2" />Submit Feedback to Unlock
              </Button>
            )
          )}
        </div>
      </div>

      {(activity.QAME_Report_URL || activity.QAME_Report_File) && !canDownloadReport && !isAdmin && !isReviewer && (
        <Alert className="border-amber-300 bg-amber-50">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            A QAME Report is available for this activity. Please{' '}
            <a href={createPageUrl(`ARTAFeedback?activity=${activityId}`)}
              className="font-semibold underline hover:text-amber-900">
              submit your ARTA CSM feedback
            </a>{' '}
            to unlock the report download.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Information */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="text-[#1B2A8F] flex items-center gap-2">
              <Building2 className="h-5 w-5" />Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-slate-500">Description</p>
              <p className="mt-1">{activity.Description || '-'}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {/* CRITICAL-1: Category → Activity_Type */}
              <div>
                <p className="text-sm text-slate-500">Activity Type</p>
                <p className="mt-1 font-medium">{activity.Activity_Type || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Funding Source</p>
                <p className="mt-1 font-medium">{activity.Funding_Source || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Division</p>
                <p className="mt-1 font-medium">{activity.Functional_Division || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Responsible Person</p>
                <p className="mt-1 font-medium">{activity.Responsible_Person || '-'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Schedule & Financial */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="text-[#1B2A8F] flex items-center gap-2">
              <Calendar className="h-5 w-5" />Schedule & Financial
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {/* CRITICAL-1: Schedule_Start_Date → Planned_Start_Date */}
              <div>
                <p className="text-sm text-slate-500">Planned Start Date</p>
                <p className="mt-1 font-medium">{formatDate(activity.Planned_Start_Date)}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">End Date</p>
                <p className="mt-1 font-medium">{formatDate(activity.End_Date)}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Date Conducted</p>
                <p className="mt-1 font-medium">{formatDate(activity.Date_Conducted)}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Venue</p>
                <p className="mt-1 font-medium">{activity.Venue || '-'}</p>
              </div>
            </div>
            <div className="pt-2 border-t">
              <p className="text-sm text-slate-500 flex items-center gap-1">
                <DollarSign className="h-4 w-4" />Financial Allocation
              </p>
              <p className="mt-1 text-xl font-bold text-[#1B2A8F]">
                ₱{(activity.Financial_Allocation || 0).toLocaleString()}
              </p>
              {activity.Financial_Utilization != null && (
                <p className="text-sm text-slate-500 mt-1">
                  Utilized: <span className="font-medium text-slate-700">₱{(activity.Financial_Utilization || 0).toLocaleString()}</span>
                  {activity.Variance != null && (
                    <span className={`ml-2 font-medium ${activity.Variance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      (Variance: ₱{activity.Variance.toLocaleString()})
                    </span>
                  )}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Project Linkage */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="text-[#1B2A8F] flex items-center gap-2">
              <FolderKanban className="h-5 w-5" />Project Linkage
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {project ? (
              <div>
                <p className="text-sm text-slate-500">Linked Project</p>
                <p className="mt-1 font-medium">{project.Project_Code} – {project.Project_Title}</p>
              </div>
            ) : (
              <p className="text-slate-500">No project linked.</p>
            )}
            {activity.Remarks && (
              <div>
                <p className="text-sm text-slate-500">Remarks</p>
                <p className="mt-1">{activity.Remarks}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Assigned Assessors */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="text-[#1B2A8F] flex items-center gap-2">
              <Users className="h-5 w-5" />Assigned QAME Assessors
            </CardTitle>
          </CardHeader>
          <CardContent>
            {assignedAssessorNames.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {assignedAssessorNames.map((name, idx) => (
                  <Badge key={idx} variant="secondary">{name}</Badge>
                ))}
              </div>
            ) : (
              <p className="text-slate-500">No assessors assigned yet. Auto-assigned upon submission.</p>
            )}
          </CardContent>
        </Card>

        {/* Evidence / MOV Attachments */}
        <Card className="shadow-md lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-[#1B2A8F] flex items-center gap-2">
              <Paperclip className="h-5 w-5" />Evidence / MOV Attachments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 items-start">
              <Input
                type="url"
                value={movUrl}
                onChange={(e) => setMovUrl(e.target.value)}
                placeholder="https://drive.google.com/..."
                className="flex-1"
              />
              {movUrl && (
                <Button variant="outline" size="icon" asChild>
                  <a href={movUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              )}
              <Button
                onClick={handleSaveMOV}
                disabled={movSaving || movUrl === (activity.Evidence_Attachments?.[0] || '')}
                className="bg-[#1B2A8F] hover:bg-[#1B2A8F]/90"
              >
                {movSaving ? 'Saving...' : 'Save'}
              </Button>
            </div>
            <p className="text-xs text-slate-400 mt-1">Paste a Google Drive folder or document link. Changes are saved immediately.</p>
          </CardContent>
        </Card>

        {/* ARTA Feedback */}
        <Card className="shadow-md lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-[#1B2A8F] flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5" />ARTA Customer Satisfaction Feedback
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-slate-600">{feedback.length} feedback record(s) collected for this activity.</p>
            <div className="flex flex-wrap gap-3">
              {/* Always show the ARTA feedback link */}
              <Button variant="outline" className="gap-2"
                onClick={() => navigate(createPageUrl(`ARTAFeedback?activity=${activityId}`))}>
                <ExternalLink className="h-4 w-4" />
                {feedback.length > 0 ? 'View / Add Feedback' : 'Submit ARTA Feedback'}
              </Button>
              {/* If QAME Report exists and no feedback yet, show a reminder */}
              {(activity.QAME_Report_URL || activity.QAME_Report_File) && feedback.length === 0 && !isAdmin && !isReviewer && (
                <span className="flex items-center gap-1 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-1.5">
                  <Lock className="h-3.5 w-3.5" />Feedback required to download QAME Report
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* QAME Evaluation */}
        <Card className="shadow-md lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-[#1B2A8F] flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5" />QAME Evaluation
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* MINOR-9 fix: Reviewers always see the panel; implementers need ARTA CSM */}
            {!canSeeQAMEPanel ? (
              <div className="flex items-center gap-2 p-4 bg-amber-50 rounded-lg border border-amber-200">
                <Lock className="h-5 w-5 text-amber-600 flex-shrink-0" />
                <p className="text-amber-700 font-medium text-sm">
                  🔒 Submit ARTA CSM feedback to unlock QAME report access.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <p className="text-sm text-slate-500 mb-1">QAME Rating</p>
                  {/* CRITICAL-4 + MAJOR-4: Assessors can rate; score auto-persisted */}
                  {canEditQAME ? (
                    <Select
                      value={activity.QAME_Rating || ''}
                      onValueChange={(v) => qameMutation.mutate({
                        QAME_Rating: v,
                        QAME_Rating_Score: RATING_SCORE_MAP[v] ?? null
                      })}
                    >
                      <SelectTrigger><SelectValue placeholder="Set rating" /></SelectTrigger>
                      <SelectContent>
                        {Object.keys(RATING_SCORE_MAP).map(r => (
                          <SelectItem key={r} value={r}>{r}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="font-medium">{activity.QAME_Rating || 'Not yet rated'}</p>
                  )}
                  {activity.QAME_Rating_Score != null && (
                    <p className="text-xs text-slate-400 mt-1">Numeric score: {activity.QAME_Rating_Score} / 4</p>
                  )}
                </div>

                <div>
                  <p className="text-sm text-slate-500 mb-1">Evaluation Form</p>
                  {activity.QAME_Evaluation_Form_URL && !editingQameUrl ? (
                    <div className="flex items-center gap-2">
                      <a href={activity.QAME_Evaluation_Form_URL} target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-blue-600 hover:underline text-sm">
                        <ExternalLink className="h-4 w-4" />Open Form
                      </a>
                      {canEditQAME && (
                        <Button variant="ghost" size="sm"
                          onClick={() => { setQameFormUrl(activity.QAME_Evaluation_Form_URL); setEditingQameUrl(true); }}>
                          Edit
                        </Button>
                      )}
                    </div>
                  ) : canEditQAME ? (
                    <Input
                      placeholder="Paste evaluation form URL"
                      value={qameFormUrl}
                      onChange={(e) => setQameFormUrl(e.target.value)}
                      onBlur={() => {
                        if (qameFormUrl !== (activity?.QAME_Evaluation_Form_URL || '')) {
                          qameMutation.mutate({ QAME_Evaluation_Form_URL: qameFormUrl });
                        }
                        setEditingQameUrl(false);
                      }}
                    />
                  ) : (
                    <p className="text-slate-400 text-sm">Not linked</p>
                  )}
                </div>

                <div>
                  <p className="text-sm text-slate-500 mb-1">QAME Report</p>
                  {(activity.QAME_Report_URL || activity.QAME_Report_File) ? (
                    canDownloadReport ? (
                      <a href={activity.QAME_Report_URL || activity.QAME_Report_File} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1 text-blue-600 hover:underline text-sm">
                        <FileDown className="h-4 w-4" />Download Report
                      </a>
                    ) : (
                      <span className="flex items-center gap-1 text-sm text-amber-700">
                        <Lock className="h-3.5 w-3.5" />Submit feedback to unlock
                      </span>
                    )
                  ) : canEditQAME ? (
                    <div>
                      <OneDriveLinkInput onAdd={handleQameReportLink} buttonLabel="Save link" />
                    </div>
                  ) : (
                    <p className="text-slate-400 text-sm">No report uploaded yet</p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Transition Dialog */}
      <AlertDialog open={transitionDialogOpen} onOpenChange={setTransitionDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Workflow Transition</AlertDialogTitle>
            <AlertDialogDescription>
              Move this activity from <strong>"{activity.Workflow_Status}"</strong> to <strong>"{targetStatus}"</strong>?
              This action will be audit-logged.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => transitionMutation.mutate({ newStatus: targetStatus })}
              className={targetStatus === 'Returned for Revision' ? 'bg-amber-600 hover:bg-amber-700' : 'bg-[#1B2A8F] hover:bg-[#1B2A8F]/90'}>
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}