import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { logAuditEvent } from '../components/audit/AuditLogger';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import toast from 'react-hot-toast';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText } from 'lucide-react';
import ActivityStatusPipeline from '../components/activity/ActivityStatusPipeline';
import ActivityFormHeader from '../components/activity/ActivityFormHeader';
import CoreInfoSection from '../components/activity/CoreInfoSection';
import ScheduleSection from '../components/activity/ScheduleSection';
import BudgetSection from '../components/activity/BudgetSection';
import ImplementationSection from '../components/activity/ImplementationSection';
import QAMESection, { RATING_SCORE_MAP } from '../components/activity/QAMESection';
import AttachmentsSection from '../components/activity/AttachmentsSection';
import ARTAFeedbackCard from '../components/activity/ARTAFeedbackCard';
import PartnershipSection from '../components/activity/PartnershipSection';

// ─── Constants ────────────────────────────────────────────────────────────────
const EMPTY_FORM = {
  Activity_ID: '', Activity_Title: '', Title: '', Description: '',
  Activity_Type: '', Functional_Division: '', Unit_Section: '',
  Operating_Unit: '', Responsible_Person: '',
  Planned_Start_Date: '', Start_Date: '', End_Date: '', Date_Conducted: '', Venue: '',
  Status: 'Not Started', Remarks: '', Reschedule_Reason: '',
  Funding_Source: '', Financial_Allocation: '', Financial_Utilization: '', Variance: null,
  Physical_Progress: '', Financial_Progress: '',
  QAME_Rating: null, QAME_Rating_Score: null, QAME_Assessor: '', QAME_Venue_Rating: null,
  Remarks_For_Improvement: '', QAME_Remarks: '', QAME_Evaluation_Form_URL: '', QAME_Report_File: '',
  Workflow_Status: 'Draft',
  Reviewed_By: '', Reviewed_Date: '', Published_Date: '',
  Evidence_Attachments: [],
  Assigned_Assessors: [], Linked_Projects: [], Linked_Outputs: [],
  Contributes_To_Output: [], Linked_Project: '',
  saro_number: null,
  has_partnership: null, partner_agency_name: null, partnership_type: [], partnership_type_other: null
};

// Migrate legacy Budget / Actual_Cost into canonical fields
function migrateLegacyFinancials(record) {
  const out = { ...record };
  if (!out.Financial_Allocation && out.Budget) out.Financial_Allocation = out.Budget;
  if (!out.Financial_Utilization && out.Actual_Cost) out.Financial_Utilization = out.Actual_Cost;
  const alloc = parseFloat(out.Financial_Allocation) || 0;
  const util = parseFloat(out.Financial_Utilization) || 0;
  if (alloc > 0 || util > 0) out.Variance = alloc - util;
  // If legacy string rating exists, convert to numeric score
  if (out.QAME_Rating && typeof out.QAME_Rating === 'string' && RATING_SCORE_MAP[out.QAME_Rating] != null) {
    out.QAME_Rating_Score = RATING_SCORE_MAP[out.QAME_Rating];
    out.QAME_Rating = RATING_SCORE_MAP[out.QAME_Rating]; // migrate to numeric
  } else if (out.QAME_Rating != null && !isNaN(parseFloat(out.QAME_Rating))) {
    out.QAME_Rating_Score = parseFloat(out.QAME_Rating);
  }
  return out;
}

// ─── Minimal Create Form (3 fields only) ─────────────────────────────────────
function NewActivityFields({ formData, onChange, projects, onSubmit, isSubmitting }) {
  return (
    <div className="max-w-xl mx-auto">
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-[#1e3a5f] flex items-center gap-2 text-base">
            <FileText className="h-4 w-4" />
            Activity Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div>
            <Label>Activity Title <span className="text-red-500">*</span></Label>
            <Input
              value={formData.Activity_Title || ''}
              onChange={(e) => onChange('Activity_Title', e.target.value)}
              placeholder="Enter activity title"
            />
          </div>
          <div>
            <Label>Functional Division <span className="text-red-500">*</span></Label>
            <Select
              value={formData.Functional_Division || ''}
              onValueChange={(v) => onChange('Functional_Division', v)}
            >
              <SelectTrigger><SelectValue placeholder="Select division" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="CID">CID</SelectItem>
                <SelectItem value="SGOD">SGOD</SelectItem>
                <SelectItem value="OSDS">OSDS</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Linked Project</Label>
            <Select
              value={formData.Linked_Project || ''}
              onValueChange={(v) => onChange('Linked_Project', v)}
            >
              <SelectTrigger><SelectValue placeholder="Select project (optional)" /></SelectTrigger>
              <SelectContent>
                {projects.map(p => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.Project_Code} – {p.Project_Title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <p className="text-xs text-slate-400 pt-1">
            Additional details (schedule, budget, attachments, QAME, etc.) can be filled in after creation from the Edit page.
          </p>
          <Button
            onClick={onSubmit}
            disabled={!formData.Activity_Title || !formData.Functional_Division || isSubmitting}
            className="w-full bg-[#1e3a5f] hover:bg-[#1e3a5f]/90"
          >
            {isSubmitting ? 'Creating...' : 'Create Activity'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ActivityForm() {
  const urlParams = new URLSearchParams(window.location.search);
  const activityId = urlParams.get('id');
  const isEditMode = !!activityId;

  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState(EMPTY_FORM);
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
  const [error, setError] = useState('');
  const [uploadingEvidence, setUploadingEvidence] = useState(false);
  const [uploadingReport, setUploadingReport] = useState(false);

  // ─── Data fetching ────────────────────────────────────────────────────
  const { data: existingList, isLoading: loadingActivity } = useQuery({
    queryKey: ['activity', activityId],
    queryFn: () => base44.entities.DQAMPActivity.filter({ id: activityId }),
    enabled: isEditMode,
  });

  const { data: assessors = [] } = useQuery({
    queryKey: ['assessors'],
    queryFn: () => base44.entities.QAME_Assessor.list(),
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => base44.entities.Project.list(),
  });

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: feedback = [] } = useQuery({
    queryKey: ['feedback', activityId],
    queryFn: () => base44.entities.ARTAFeedback.filter({ Linked_Activity: activityId }),
    enabled: isEditMode,
  });

  // Populate form on load / data change
  useEffect(() => {
    if (existingList?.length > 0) {
      const migrated = migrateLegacyFinancials(existingList[0]);
      setFormData({
        ...EMPTY_FORM,
        ...migrated,
        Financial_Allocation: migrated.Financial_Allocation ?? '',
        Financial_Utilization: migrated.Financial_Utilization ?? '',
        Evidence_Attachments: migrated.Evidence_Attachments || [],
        Assigned_Assessors: migrated.Assigned_Assessors || [],
        Linked_Projects: migrated.Linked_Projects || [],
        Linked_Outputs: migrated.Linked_Outputs || [],
      });
    }
  }, [existingList]);

  // ─── Role & permission flags ──────────────────────────────────────────
  const status = formData.Workflow_Status;
  const isAdmin = currentUser?.role === 'admin';
  const isReviewer = ['reviewer', 'assessor'].includes(currentUser?.role);

  const canEditCore        = isAdmin || ['Draft', 'Returned for Revision'].includes(status);
  const canEditBudget      = isAdmin || ['Draft', 'Returned for Revision'].includes(status);
  const canEditSchedule    = isAdmin || ['Draft', 'Returned for Revision'].includes(status);
  const canEditImpl        = isAdmin || ['Draft', 'Submitted', 'Returned for Revision'].includes(status);
  const canEditQAME        = isAdmin || (isReviewer && status === 'Under Review');
  const canEditAttachments = isAdmin || ['Draft', 'Submitted', 'Returned for Revision', 'Published'].includes(status);
  const canUploadReport    = isAdmin || (isReviewer && ['Under Review', 'Published'].includes(status));

  // In create mode, saving is handled by the inline "Create Activity" button in NewActivityFields.
  // In edit mode, the header Save button handles all updates.
  const canSave          = isEditMode && (canEditCore || canEditBudget || canEditQAME || canEditImpl || canEditAttachments);
  const canSubmit        = !isReviewer && ['Draft', 'Returned for Revision'].includes(status) && isEditMode;
  const canStartReview   = (isAdmin || isReviewer) && status === 'Submitted';
  const canReturnRevision= (isAdmin || isReviewer) && status === 'Under Review';
  const canPublish       = isAdmin && status === 'Under Review';

  // ─── Derive implementation status from dates ─────────────────────────
  const deriveStatus = (data) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dateConducted = data.Date_Conducted ? new Date(data.Date_Conducted) : null;
    const actualStart   = data.Start_Date      ? new Date(data.Start_Date)      : null;
    const plannedStart  = data.Planned_Start_Date ? new Date(data.Planned_Start_Date) : null;

    if (dateConducted && dateConducted <= today) {
      return 'Completed';  // activity has been conducted
    }
    if (actualStart && actualStart <= today) {
      return 'In Progress'; // started but not yet concluded
    }
    if (plannedStart && plannedStart <= today) {
      return 'In Progress'; // planned start passed, no actual start recorded
    }
    return 'Not Started';
  };

  // ─── Field change with variance auto-calc & status derivation ────────
  const handleChange = (field, value) => {
    setFormData(prev => {
      const next = { ...prev, [field]: value };
      if (field === 'Financial_Allocation' || field === 'Financial_Utilization') {
        const alloc = parseFloat(field === 'Financial_Allocation' ? value : prev.Financial_Allocation) || 0;
        const util  = parseFloat(field === 'Financial_Utilization' ? value : prev.Financial_Utilization) || 0;
        next.Variance = alloc - util;
      }
      // Auto-derive Status when any date field changes
      if (['Date_Conducted', 'Start_Date', 'Planned_Start_Date', 'End_Date'].includes(field)) {
        next.Status = deriveStatus(next);
      }
      return next;
    });
  };

  // ─── Build save payload (numeric coercions + clear legacy) ───────────
  const buildPayload = () => {
    const alloc = formData.Financial_Allocation !== '' ? parseFloat(formData.Financial_Allocation) : null;
    const util  = formData.Financial_Utilization !== '' ? parseFloat(formData.Financial_Utilization) : null;
    const titleValue = formData.Activity_Title || formData.Title || '';
    return {
      ...formData,
      Activity_Title:        titleValue,
      Title:                 titleValue,  // keep both in sync
      Financial_Allocation:  alloc,
      Financial_Utilization: util,
      Variance:              (alloc != null && util != null) ? alloc - util : null,
      Physical_Progress:     formData.Physical_Progress !== '' ? parseFloat(formData.Physical_Progress) : null,
      Financial_Progress:    formData.Financial_Progress !== '' ? parseFloat(formData.Financial_Progress) : null,
      QAME_Rating:           formData.QAME_Rating != null && formData.QAME_Rating !== '' ? parseFloat(formData.QAME_Rating) : null,
      QAME_Rating_Score:     formData.QAME_Rating != null && formData.QAME_Rating !== '' ? parseFloat(formData.QAME_Rating) : null,
      QAME_Remarks:          formData.QAME_Remarks || '',
      Budget:                null,  // clear legacy
      Actual_Cost:           null,  // clear legacy
    };
  };

  // ─── Mutations ────────────────────────────────────────────────────────
  const deleteMutation = useMutation({
    mutationFn: () => base44.entities.DQAMPActivity.delete(activityId),
    onSuccess: async () => {
      await logAuditEvent({ actionType: 'Delete', entity: 'DQAMPActivity', recordId: activityId, remarks: `Deleted: ${formData.Activity_Title}` });
      queryClient.invalidateQueries(['activities']);
      toast.success('Activity deleted.');
      navigate(createPageUrl('Activities'));
    },
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.DQAMPActivity.create(data),
    onSuccess: async (result) => {
      await logAuditEvent({ actionType: 'Create', entity: 'DQAMPActivity', recordId: result.id, remarks: `Created: ${formData.Activity_Title}` });
      queryClient.invalidateQueries(['activities']);
      toast.success('Activity created!');
      navigate(createPageUrl('Activities'));
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.DQAMPActivity.update(activityId, data),
    onSuccess: async () => {
      await logAuditEvent({ actionType: 'Update', entity: 'DQAMPActivity', recordId: activityId, remarks: `Saved: ${formData.Activity_Title}` });
      queryClient.invalidateQueries(['activities']);
      toast.success('Changes saved!');
      navigate(createPageUrl(`ActivityView?id=${activityId}`));
    },
  });

  const handleSave = () => {
    if ((!formData.Activity_Title && !formData.Title) || !formData.Functional_Division) {
      setError('Activity Title and Functional Division are required.');
      return;
    }
    setError('');
    if (isEditMode) updateMutation.mutate(buildPayload());
    else createMutation.mutate(buildPayload());
  };

  // ─── Workflow transitions ─────────────────────────────────────────────
  const handleTransition = async (newStatus) => {
    const today = new Date().toISOString().split('T')[0];
    const extra = {};
    if (newStatus === 'Under Review') {
      extra.Reviewed_By   = currentUser?.email || '';
      extra.Reviewed_Date = today;
    }
    if (newStatus === 'Published') {
      extra.Published_Date = today;
    }
    const payload = { ...buildPayload(), Workflow_Status: newStatus, ...extra };
    await base44.entities.DQAMPActivity.update(activityId, payload);
    await logAuditEvent({
      actionType: newStatus === 'Published' ? 'Publish' : 'Update',
      entity: 'DQAMPActivity', recordId: activityId,
      remarks: `Workflow → ${newStatus}`,
    });
    queryClient.invalidateQueries(['activities']);
    toast.success(`Status changed to "${newStatus}"`);
    navigate(createPageUrl(`ActivityView?id=${activityId}`));
  };

  const handleSubmitWorkflow = async () => {
    const activeAssessors = assessors.filter(
      a => a.Is_Active &&
           Array.isArray(a.Functional_Divisions) &&
           a.Functional_Divisions.includes(formData.Functional_Division)
    );
    if (activeAssessors.length === 0) {
      setError(`Submission blocked: No active QAME assessors found for "${formData.Functional_Division}".`);
      setSubmitDialogOpen(false);
      return;
    }
    const payload = {
      ...buildPayload(),
      Workflow_Status: 'Submitted',
      Assigned_Assessors: activeAssessors.map(a => a.id),
    };
    await base44.entities.DQAMPActivity.update(activityId, payload);
    await logAuditEvent({
      actionType: 'Submit', entity: 'DQAMPActivity', recordId: activityId,
      remarks: `Submitted — assessors: ${activeAssessors.map(a => a.Name).join(', ')}`,
    });
    queryClient.invalidateQueries(['activities']);
    toast.success('Activity submitted for QA review!');
    setSubmitDialogOpen(false);
    navigate(createPageUrl(`ActivityView?id=${activityId}`));
  };

  // ─── File uploads ─────────────────────────────────────────────────────
  const handleEvidenceUpload = async (file) => {
    setUploadingEvidence(true);
    const result = await base44.integrations.Core.UploadFile({ file });
    handleChange('Evidence_Attachments', [...(formData.Evidence_Attachments || []), result.file_url]);
    setUploadingEvidence(false);
  };

  const handleReportUpload = async (file) => {
    setUploadingReport(true);
    const result = await base44.integrations.Core.UploadFile({ file });
    handleChange('QAME_Report_File', result.file_url);
    await logAuditEvent({ actionType: 'Upload', entity: 'DQAMPActivity', recordId: activityId || 'new', remarks: 'QAME Report uploaded' });
    setUploadingReport(false);
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  // Loading skeleton while fetching existing record
  if (isEditMode && loadingActivity) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 bg-slate-200 rounded w-1/3" />
        <div className="h-4 bg-slate-100 rounded w-full" />
        <div className="grid grid-cols-2 gap-6">
          <div className="h-64 bg-slate-100 rounded-xl" />
          <div className="h-64 bg-slate-100 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* ── Header + action buttons + status alerts ── */}
      <ActivityFormHeader
        isEditMode={isEditMode}
        activityTitle={formData.Activity_Title}
        status={status}
        isSaving={isSaving}
        canSave={canSave}
        canSubmit={canSubmit}
        canStartReview={canStartReview}
        canReturnRevision={canReturnRevision}
        canPublish={canPublish}
        isReviewer={isReviewer}
        isAdmin={isAdmin}
        reviewedBy={formData.Reviewed_By}
        reviewedDate={formData.Reviewed_Date}
        publishedDate={formData.Published_Date}
        error={error}
        onBack={() => navigate(isEditMode ? createPageUrl(`ActivityView?id=${activityId}`) : createPageUrl('Activities'))}
        onSave={handleSave}
        onSubmitClick={() => setSubmitDialogOpen(true)}
        onStartReview={() => handleTransition('Under Review')}
        onReturnRevision={() => handleTransition('Returned for Revision')}
        onPublish={() => handleTransition('Published')}
        onView={() => navigate(createPageUrl(`ActivityView?id=${activityId}`))}
        onDelete={() => deleteMutation.mutate()}
      />

      {/* ── Workflow pipeline ── */}
      {isEditMode && (
        <div className="bg-white border rounded-xl px-5 py-4 shadow-sm">
          <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-3">Workflow Progress</p>
          <ActivityStatusPipeline status={status} />
        </div>
      )}

      {/* ── Form ── */}
      {!isEditMode ? (
        /* ── CREATE MODE: minimal 3-field form ── */
        <NewActivityFields
          formData={formData}
          onChange={handleChange}
          projects={projects}
          onSubmit={() => createMutation.mutate(buildPayload())}
          isSubmitting={createMutation.isPending}
        />
      ) : (
        /* ── EDIT MODE: full form ── */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Column 1 */}
          <div className="space-y-6">
            <CoreInfoSection formData={formData} onChange={handleChange} locked={!canEditCore} />
            <ScheduleSection formData={formData} onChange={handleChange} locked={!canEditSchedule} />
          </div>

          {/* Column 2 */}
          <div className="space-y-6">
            <BudgetSection formData={formData} onChange={handleChange} locked={!canEditBudget} />
            <ImplementationSection formData={formData} locked={!canEditImpl} />
            <AttachmentsSection
              formData={formData}
              onChange={handleChange}
              locked={!canEditAttachments}
              onEvidenceUpload={handleEvidenceUpload}
              uploadingEvidence={uploadingEvidence}
            />
          </div>

          {/* ARTA Feedback — full width */}
          <div className="lg:col-span-2">
            <ARTAFeedbackCard
              activityId={activityId}
              feedbackCount={feedback.length}
              hasQameReport={!!formData.QAME_Report_File}
              isAdmin={isAdmin}
              isReviewer={isReviewer}
            />
          </div>

          {/* Partnership — full width */}
          <div className="lg:col-span-2">
            <PartnershipSection formData={formData} onChange={handleChange} locked={!canEditCore} />
          </div>

          {/* QAME — full width */}
          <div className="lg:col-span-2">
            <QAMESection
              formData={formData}
              onChange={handleChange}
              canEditQAME={canEditQAME}
              canUploadReport={canUploadReport}
              onReportUpload={handleReportUpload}
              uploadingReport={uploadingReport}
              feedbackCount={feedback.length}
              isAdmin={isAdmin}
              isReviewer={isReviewer}
            />
          </div>
        </div>
      )}

      {/* ── Submit confirmation dialog ── */}
      <AlertDialog open={submitDialogOpen} onOpenChange={setSubmitDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Submit Activity for QA Review?</AlertDialogTitle>
            <AlertDialogDescription>
              This will lock core activity fields (Title, Dates, Budget) and auto-assign all active QAME
              assessors for <strong>{formData.Functional_Division}</strong>. This action is audit-logged and
              cannot be undone without a reviewer returning it for revision.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSubmitWorkflow} className="bg-[#0d9488] hover:bg-[#0d9488]/90">
              Confirm & Submit
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}