import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { logAuditEvent } from '../components/audit/AuditLogger';
import toast from 'react-hot-toast';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import WorkflowBadge from '../components/ui/WorkflowBadge';
import {
  Plus, Search, Edit2, Eye, AlertTriangle,
  ChevronRight, ChevronLeft, Download, FileUp,
  Paperclip, Link as LinkIcon, FileText, Trash2, ExternalLink
} from 'lucide-react';
import CSVImporter from '../components/import/CSVImporter';
import ReportDownloader from '../components/reports/ReportDownloader';
import { format } from 'date-fns';
import { useFilters } from '@/lib/FilterContext';
import { exportActivitiesNaming } from '../utils/namingStandardsExport';

const DIVISIONS = ['CID', 'SGOD', 'OSDS'];
const ACTIVITY_TYPES = ['Training', 'Program LRM', 'PIR', 'Research', 'Conference', 'Monitoring', 'Evaluation', 'Workshop'];
const FUNDING_SOURCES = ['MOOE', 'SARO', 'SEF', 'Others'];

// CRITICAL-3: "Returned for Revision" added to the state list
const WORKFLOW_STATES = ['Draft', 'Submitted', 'Returned for Revision', 'Under Review', 'Published'];

// Map of valid next states (handles non-linear "Returned for Revision" correctly)
const NEXT_STATE = {
  'Draft': 'Submitted',
  'Submitted': 'Under Review',
  'Returned for Revision': 'Submitted',   // re-submission path
  'Under Review': 'Published',
};

const EMPTY_FORM = {
  Activity_Title: '',
  Description: '',
  Functional_Division: '',
  Activity_Type: '',
  Funding_Source: '',
  Planned_Start_Date: '',
  End_Date: '',
  Financial_Allocation: '',
  Financial_Utilization: '',
  Workflow_Status: 'Draft',
  Evidence_Attachments: [],
  QAME_Evaluation_Form_URL: '',
  QAME_Report_File: '',
  Linked_Projects: [],
  Linked_Outputs: [],
  Remarks: ''
};

export default function Activities() {
  const { quarters, divisions } = useFilters();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDivision, setFilterDivision] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [error, setError] = useState(null);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [reportActivity, setReportActivity] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);

  // CRITICAL-1: All entity references unified to Activity
  const { data: activities = [], isLoading } = useQuery({
    queryKey: ['activities'],
    queryFn: () => base44.entities.DQAMPActivity.list('-created_date')
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => base44.entities.Project.list()
  });

  const { data: assessors = [] } = useQuery({
    queryKey: ['assessors'],
    queryFn: () => base44.entities.QAME_Assessor.list()
  });

  // CRITICAL-2: Fixed ARTA_Feedback → ARTAFeedback
  const { data: feedback = [] } = useQuery({
    queryKey: ['feedback'],
    queryFn: () => base44.entities.ARTAFeedback.list()
  });

  React.useEffect(() => {
    base44.auth.me().then(setCurrentUser);
  }, []);

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.DQAMPActivity.create(data),
    onSuccess: async (result) => {
      await logAuditEvent({ actionType: 'Create', entity: 'DQAMPActivity', recordId: result.id, remarks: `Created: ${formData.Activity_Title}` });
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      toast.success(`Activity "${formData.Activity_Title}" created!`);
      resetForm();
    },
    onError: (err) => toast.error(`Failed: ${err.message || 'Unknown error'}`)
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.DQAMPActivity.update(id, data),
    onSuccess: async () => {
      await logAuditEvent({ actionType: 'Update', entity: 'DQAMPActivity', recordId: selectedActivity.id, remarks: `Updated: ${formData.Activity_Title}` });
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      toast.success(`Activity "${formData.Activity_Title}" updated!`);
      resetForm();
    },
    onError: (err) => toast.error(`Failed: ${err.message || 'Unknown error'}`)
  });

  const resetForm = () => {
    setFormData(EMPTY_FORM);
    setSelectedActivity(null);
    setIsFormOpen(false);
    setError(null);
  };

  const handleEdit = (activity) => {
    setSelectedActivity(activity);
    setFormData({
      Activity_Title: activity.Activity_Title || '',
      Description: activity.Description || '',
      Functional_Division: activity.Functional_Division || '',
      Activity_Type: activity.Activity_Type || '',
      Funding_Source: activity.Funding_Source || '',
      Planned_Start_Date: activity.Planned_Start_Date || '',
      End_Date: activity.End_Date || '',
      Financial_Allocation: activity.Financial_Allocation || '',
      Financial_Utilization: activity.Financial_Utilization || '',
      Workflow_Status: activity.Workflow_Status || 'Draft',
      Evidence_Attachments: activity.Evidence_Attachments || [],
      QAME_Evaluation_Form_URL: activity.QAME_Evaluation_Form_URL || '',
      QAME_Report_File: activity.QAME_Report_File || '',
      Linked_Projects: activity.Linked_Projects || [],
      Linked_Outputs: activity.Linked_Outputs || [],
      Remarks: activity.Remarks || ''
    });
    setIsFormOpen(true);
  };

  const handleEvidenceUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const result = await base44.integrations.Core.UploadFile({ file });
    setFormData(prev => ({ ...prev, Evidence_Attachments: [...(prev.Evidence_Attachments || []), result.file_url] }));
    await logAuditEvent({ actionType: 'Upload', entity: 'DQAMPActivity', recordId: selectedActivity?.id || 'new', remarks: 'Uploaded evidence' });
  };

  const handleRemoveEvidence = (index) => {
    setFormData(prev => ({ ...prev, Evidence_Attachments: prev.Evidence_Attachments.filter((_, i) => i !== index) }));
  };

  const handleQAMEReportUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const result = await base44.integrations.Core.UploadFile({ file });
    setFormData(prev => ({ ...prev, QAME_Report_File: result.file_url }));
    await logAuditEvent({ actionType: 'Upload', entity: 'DQAMPActivity', recordId: selectedActivity?.id || 'new', remarks: 'Uploaded QAME Report' });
  };

  const canDownloadQAMEReport = (activity) => {
    if (['admin', 'QA_Assessor'].includes(currentUser?.role)) return true;
    return feedback.some(f => f.Linked_Activity === activity.id);
  };

  // CRITICAL-3: Transition logic now uses map instead of array index — handles non-linear states
  const handleWorkflowTransition = async (activity, newStatus) => {
    const expectedNext = NEXT_STATE[activity.Workflow_Status];
    if (expectedNext !== newStatus) {
      const msg = `Invalid transition: ${activity.Workflow_Status} → ${newStatus}`;
      setError(msg);
      toast.error(msg);
      return;
    }

    // Draft → Submitted OR Returned for Revision → Submitted: auto-assign assessors
    if (newStatus === 'Submitted') {
      const divisionAssessors = assessors.filter(a => {
        if (!a.Is_Active) return false;
        if (Array.isArray(a.Functional_Divisions)) return a.Functional_Divisions.includes(activity.Functional_Division);
        return a.Functional_Division === activity.Functional_Division;
      });
      if (divisionAssessors.length === 0) {
        const msg = `Cannot submit: No active assessors for ${activity.Functional_Division}.`;
        setError(msg); toast.error(msg); return;
      }
      const assignedIds = divisionAssessors.map(a => a.id);
      await base44.entities.DQAMPActivity.update(activity.id, { Workflow_Status: newStatus, Assigned_Assessors: assignedIds });
      await logAuditEvent({ actionType: 'Submit', entity: 'DQAMPActivity', recordId: activity.id, remarks: `Submitted. ${assignedIds.length} assessors assigned for ${activity.Functional_Division}` });
      toast.success(`Submitted! ${assignedIds.length} assessors auto-assigned.`);
    } else {
      await base44.entities.DQAMPActivity.update(activity.id, { Workflow_Status: newStatus });
      const actionType = newStatus === 'Under Review' ? 'Review' : newStatus === 'Published' ? 'Publish' : 'Update';
      await logAuditEvent({ actionType, entity: 'DQAMPActivity', recordId: activity.id, remarks: `Workflow: ${activity.Workflow_Status} → ${newStatus}` });
      toast.success(`Status → "${newStatus}"`);
    }
    queryClient.invalidateQueries({ queryKey: ['activities'] });
  };

  const handleRevertStatus = async (activity) => {
    const revertMap = { 'Submitted': 'Draft', 'Under Review': 'Submitted', 'Published': 'Under Review', 'Returned for Revision': 'Draft' };
    const previousStatus = revertMap[activity.Workflow_Status];
    if (!previousStatus) return;
    await base44.entities.DQAMPActivity.update(activity.id, { Workflow_Status: previousStatus });
    await logAuditEvent({ actionType: 'Revert', entity: 'DQAMPActivity', recordId: activity.id, remarks: `Admin reverted: ${activity.Workflow_Status} → ${previousStatus}` });
    queryClient.invalidateQueries({ queryKey: ['activities'] });
    toast.success(`Reverted to "${previousStatus}"`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!formData.Activity_Title || !formData.Functional_Division) {
      const msg = 'Activity Title and Functional Division are required.';
      setError(msg); toast.error(msg); return;
    }
    const alloc = formData.Financial_Allocation ? parseFloat(formData.Financial_Allocation) : null;
    const util = formData.Financial_Utilization ? parseFloat(formData.Financial_Utilization) : null;
    const dataToSave = {
      ...formData,
      Financial_Allocation: alloc,
      Financial_Utilization: util,
      Variance: (alloc != null && util != null) ? alloc - util : null,
    };
    if (selectedActivity) {
      if (selectedActivity.Workflow_Status === 'Published') { setError('Published activities cannot be edited.'); return; }
      updateMutation.mutate({ id: selectedActivity.id, data: dataToSave });
    } else {
      createMutation.mutate(dataToSave);
    }
  };

  const filteredActivities = activities.filter(activity => {
    const matchesSearch = activity.Activity_Title?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDivision = filterDivision === 'All' || activity.Functional_Division === filterDivision;
    const matchesStatus = filterStatus === 'All' || activity.Workflow_Status === filterStatus;
    // Global division filter
    if (divisions.length > 0 && !divisions.includes(activity.Functional_Division)) return false;
    // Global quarter filter — check all date fields in priority order
    if (quarters.length > 0) {
      const dateStr = activity.Start_Date || activity.Planned_Start_Date || activity.Date_Conducted;
      if (!dateStr) return false;
      const month = new Date(dateStr).getMonth();
      const q = `Q${Math.floor(month / 3) + 1}`;
      if (!quarters.includes(q)) return false;
    }
    return matchesSearch && matchesDivision && matchesStatus;
  });

  const isFieldEditable = () => {
    if (!selectedActivity) return true;
    return selectedActivity.Workflow_Status !== 'Published';
  };

  const formatDate = (d) => {
    if (!d || isNaN(new Date(d).getTime())) return '-';
    return format(new Date(d), 'MMM d, yyyy');
  };

  const fmtFilename = (url) => decodeURIComponent(url.split('/').pop().split('?')[0]) || url;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Activities</h1>
          <p className="text-slate-600 mt-1">Manage DQAMP activities with workflow tracking</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={() => exportActivitiesNaming(filteredActivities)} className="gap-2">
            <Download className="h-4 w-4" />Export Names & Codes
          </Button>
          <Button variant="outline" onClick={() => setIsImportOpen(true)}>
            <FileUp className="h-4 w-4 mr-2" />Import CSV
          </Button>
          <Button onClick={() => setIsFormOpen(true)} className="bg-[#1e3a5f] hover:bg-[#152a47]">
            <Plus className="h-4 w-4 mr-2" />New Activity
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-[200px] relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input placeholder="Search activities..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
            </div>
            <Select value={filterDivision} onValueChange={setFilterDivision}>
              <SelectTrigger className="w-[150px]"><SelectValue placeholder="Division" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Divisions</SelectItem>
                {DIVISIONS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[190px]"><SelectValue placeholder="Workflow Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Statuses</SelectItem>
                {WORKFLOW_STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Division</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Workflow Status</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>Allocation</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-slate-500">Loading activities...</TableCell></TableRow>
                ) : filteredActivities.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-slate-500">No activities found.</TableCell></TableRow>
                ) : (
                  filteredActivities.map(activity => {
                    const nextState = NEXT_STATE[activity.Workflow_Status];
                    return (
                      <TableRow key={activity.id}>
                        <TableCell className="font-medium max-w-[200px] truncate">{activity.Activity_Title}</TableCell>
                        <TableCell>{activity.Functional_Division}</TableCell>
                        <TableCell>{activity.Activity_Type || '-'}</TableCell>
                        <TableCell><WorkflowBadge status={activity.Workflow_Status} /></TableCell>
                        <TableCell>{formatDate(activity.Planned_Start_Date)}</TableCell>
                        <TableCell>{activity.Financial_Allocation ? `₱${activity.Financial_Allocation.toLocaleString()}` : '-'}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="sm" onClick={() => { setSelectedActivity(activity); setIsViewOpen(true); }}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => { setReportActivity(activity); setIsReportOpen(true); }}>
                              <Download className="h-4 w-4" />
                            </Button>
                            {activity.Workflow_Status !== 'Published' && (
                              <Button variant="ghost" size="sm" onClick={() => handleEdit(activity)}>
                                <Edit2 className="h-4 w-4" />
                              </Button>
                            )}
                            {nextState && activity.Workflow_Status !== 'Published' && (
                              <Button variant="outline" size="sm" onClick={() => handleWorkflowTransition(activity, nextState)}>
                                <ChevronRight className="h-4 w-4 mr-1" />
                                <span className="hidden sm:inline">{nextState}</span>
                              </Button>
                            )}
                            {currentUser?.role === 'admin' && !['Draft', 'Returned for Revision'].includes(activity.Workflow_Status) && (
                              <Button variant="outline" size="sm" className="text-amber-600 border-amber-300 hover:bg-amber-50" onClick={() => handleRevertStatus(activity)}>
                                <ChevronLeft className="h-4 w-4 mr-1" />Revert
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isFormOpen} onOpenChange={(open) => !open && resetForm()}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedActivity ? 'Edit Activity' : 'New Activity'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6">
            {selectedActivity?.Workflow_Status === 'Published' && (
              <Alert><AlertTriangle className="h-4 w-4" /><AlertDescription>This activity is published and cannot be edited.</AlertDescription></Alert>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label>Activity Title *</Label>
                <Input value={formData.Activity_Title} onChange={(e) => setFormData(p => ({ ...p, Activity_Title: e.target.value }))} disabled={!isFieldEditable()} required />
              </div>
              <div className="col-span-2">
                <Label>Description</Label>
                <Textarea value={formData.Description} onChange={(e) => setFormData(p => ({ ...p, Description: e.target.value }))} disabled={!isFieldEditable()} rows={3} />
              </div>
              <div>
                <Label>Functional Division *</Label>
                <Select value={formData.Functional_Division} onValueChange={(v) => setFormData(p => ({ ...p, Functional_Division: v }))} disabled={!isFieldEditable()}>
                  <SelectTrigger><SelectValue placeholder="Select division" /></SelectTrigger>
                  <SelectContent>{DIVISIONS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Activity Type</Label>
                <Select value={formData.Activity_Type} onValueChange={(v) => setFormData(p => ({ ...p, Activity_Type: v }))} disabled={!isFieldEditable()}>
                  <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>{ACTIVITY_TYPES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Funding Source</Label>
                <Select value={formData.Funding_Source} onValueChange={(v) => setFormData(p => ({ ...p, Funding_Source: v }))} disabled={!isFieldEditable()}>
                  <SelectTrigger><SelectValue placeholder="Select source" /></SelectTrigger>
                  <SelectContent>{FUNDING_SOURCES.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Financial Allocation (₱)</Label>
                <Input type="number" value={formData.Financial_Allocation} onChange={(e) => setFormData(p => ({ ...p, Financial_Allocation: e.target.value }))} disabled={!isFieldEditable()} min="0" />
              </div>
              <div>
                <Label>Budget Utilized (₱)</Label>
                <Input type="number" value={formData.Financial_Utilization} onChange={(e) => setFormData(p => ({ ...p, Financial_Utilization: e.target.value }))} disabled={!isFieldEditable()} min="0" />
              </div>
              <div>
                <Label>Planned Start Date</Label>
                <Input type="date" value={formData.Planned_Start_Date} onChange={(e) => setFormData(p => ({ ...p, Planned_Start_Date: e.target.value }))} disabled={!isFieldEditable()} />
              </div>
              <div>
                <Label>End Date</Label>
                <Input type="date" value={formData.End_Date} onChange={(e) => setFormData(p => ({ ...p, End_Date: e.target.value }))} disabled={!isFieldEditable()} />
              </div>
              <div>
                <Label>Linked Project</Label>
                <Select value={formData.Linked_Projects?.[0] || ''} onValueChange={(v) => setFormData(p => ({ ...p, Linked_Projects: v ? [v] : [] }))} disabled={!isFieldEditable()}>
                  <SelectTrigger><SelectValue placeholder="Select project (optional)" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>None</SelectItem>
                    {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.Project_Code} – {p.Project_Title}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <Label>Remarks</Label>
                <Textarea value={formData.Remarks} onChange={(e) => setFormData(p => ({ ...p, Remarks: e.target.value }))} disabled={!isFieldEditable()} rows={2} />
              </div>

              {/* Evidence */}
              <div className="col-span-2">
                <Label className="flex items-center gap-2"><Paperclip className="h-4 w-4" />Evidence / MOV Attachments</Label>
                <Input type="file" onChange={handleEvidenceUpload} disabled={!isFieldEditable()} className="mt-1" />
                {formData.Evidence_Attachments?.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {formData.Evidence_Attachments.map((url, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm bg-slate-50 p-2 rounded">
                        <FileText className="h-4 w-4 text-slate-500 flex-shrink-0" />
                        <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate flex-1">{fmtFilename(url)}</a>
                        {isFieldEditable() && (
                          <Button variant="ghost" size="sm" type="button" onClick={() => handleRemoveEvidence(idx)}>
                            <Trash2 className="h-3 w-3 text-red-500" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* QAME */}
              <div className="col-span-2 border-t pt-4"><h4 className="font-medium text-slate-700 mb-3">QAME Documents</h4></div>
              <div>
                <Label className="flex items-center gap-2"><LinkIcon className="h-4 w-4" />QAME Evaluation Form URL</Label>
                <Input type="url" placeholder="https://..." value={formData.QAME_Evaluation_Form_URL} onChange={(e) => setFormData(p => ({ ...p, QAME_Evaluation_Form_URL: e.target.value }))} disabled={!isFieldEditable()} />
                {formData.QAME_Evaluation_Form_URL && (
                  <a href={formData.QAME_Evaluation_Form_URL} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline mt-1 block">Open Form →</a>
                )}
              </div>
              <div>
                <Label className="flex items-center gap-2"><FileText className="h-4 w-4" />QAME Report (Upload)</Label>
                <Input type="file" accept=".pdf,.doc,.docx" onChange={handleQAMEReportUpload} disabled={!isFieldEditable()} />
                {formData.QAME_Report_File && <p className="text-xs text-emerald-600 mt-1">✓ Report uploaded</p>}
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button>
              <Button type="submit" variant="outline" className="text-gray-700 border-gray-300 hover:bg-gray-50" disabled={selectedActivity?.Workflow_Status === 'Published' || createMutation.isPending || updateMutation.isPending}>
                {(createMutation.isPending || updateMutation.isPending)
                  ? <span className="flex items-center gap-2"><span className="h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent" />{selectedActivity ? 'Updating...' : 'Creating...'}</span>
                  : <>{selectedActivity ? 'Update' : 'Create'} Activity</>
                }
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* CSV Importer */}
      <CSVImporter
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        entityName="Activity"
        requiredFields={[
          { name: 'Activity_Title', label: 'Activity Title' },
          { name: 'Functional_Division', label: 'Functional Division', enum: DIVISIONS }
        ]}
        optionalFields={[
          { name: 'Description', label: 'Description' },
          { name: 'Activity_Type', label: 'Activity Type', enum: ACTIVITY_TYPES },
          { name: 'Funding_Source', label: 'Funding Source', enum: FUNDING_SOURCES },
          { name: 'Planned_Start_Date', label: 'Planned Start Date' },
          { name: 'End_Date', label: 'End Date' },
          { name: 'Financial_Allocation', label: 'Financial Allocation', type: 'number' },
          { name: 'Remarks', label: 'Remarks' }
        ]}
        onImport={async (data) => {
          const records = data.map(row => ({ ...row, Workflow_Status: 'Draft' }));
          await base44.entities.DQAMPActivity.bulkCreate(records);
          queryClient.invalidateQueries({ queryKey: ['activities'] });
        }}
      />

      {/* Report Downloader */}
      {reportActivity && (
        <ReportDownloader
          isOpen={isReportOpen}
          onClose={() => { setIsReportOpen(false); setReportActivity(null); }}
          activityId={reportActivity.id}
          activityTitle={reportActivity.Activity_Title}
          hasFeedback={feedback.some(f => f.Linked_Activity === reportActivity.id)}
          isAdmin={currentUser?.role === 'admin'}
        />
      )}

      {/* View Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Activity Details</DialogTitle>
          </DialogHeader>
          {selectedActivity && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 flex-wrap">
                <WorkflowBadge status={selectedActivity.Workflow_Status} />
                <Badge variant="outline">{selectedActivity.Functional_Division}</Badge>
                {selectedActivity.Activity_Type && <Badge variant="outline">{selectedActivity.Activity_Type}</Badge>}
              </div>
              <div>
                <h3 className="text-lg font-semibold">{selectedActivity.Activity_Title}</h3>
                <p className="text-slate-600 mt-1">{selectedActivity.Description || 'No description'}</p>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-slate-500">Funding Source:</span><span className="ml-2 font-medium">{selectedActivity.Funding_Source || '-'}</span></div>
                <div><span className="text-slate-500">Allocation:</span><span className="ml-2 font-medium">{selectedActivity.Financial_Allocation ? `₱${selectedActivity.Financial_Allocation.toLocaleString()}` : '-'}</span></div>
                <div><span className="text-slate-500">Start Date:</span><span className="ml-2 font-medium">{formatDate(selectedActivity.Planned_Start_Date)}</span></div>
                <div><span className="text-slate-500">End Date:</span><span className="ml-2 font-medium">{formatDate(selectedActivity.End_Date)}</span></div>
              </div>
              {selectedActivity.Assigned_Assessors?.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Assigned Assessors</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedActivity.Assigned_Assessors.map(id => {
                      const a = assessors.find(x => x.id === id);
                      return a ? <Badge key={id} variant="secondary">{a.Name}</Badge> : null;
                    })}
                  </div>
                </div>
              )}
              {selectedActivity.Evidence_Attachments?.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2 flex items-center gap-2"><Paperclip className="h-4 w-4" />Evidence / MOV</p>
                  <div className="space-y-1">
                    {selectedActivity.Evidence_Attachments.map((url, idx) => (
                      <a key={idx} href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-blue-600 hover:underline">
                        <FileText className="h-4 w-4" />{fmtFilename(url)}
                      </a>
                    ))}
                  </div>
                </div>
              )}
              <div className="border-t pt-4">
                <h4 className="font-medium text-slate-700 mb-3">QAME Documents</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-slate-500">Evaluation Form</p>
                    {selectedActivity.QAME_Evaluation_Form_URL
                      ? <a href={selectedActivity.QAME_Evaluation_Form_URL} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-blue-600 hover:underline mt-1"><LinkIcon className="h-4 w-4" />Open Form</a>
                      : <p className="text-sm text-slate-400 mt-1">Not provided</p>}
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">QAME Report</p>
                    {selectedActivity.QAME_Report_File ? (
                      canDownloadQAMEReport(selectedActivity)
                        ? <a href={selectedActivity.QAME_Report_File} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-blue-600 hover:underline mt-1"><Download className="h-4 w-4" />Download Report</a>
                        : <p className="text-sm text-amber-600 mt-1">⚠️ Submit ARTA CSM to unlock</p>
                    ) : <p className="text-sm text-slate-400 mt-1">Not uploaded</p>}
                  </div>
                </div>
              </div>

              {/* ARTA Feedback section */}
              <div className="border-t pt-4">
                <h4 className="font-medium text-slate-700 mb-3">ARTA Customer Satisfaction Feedback</h4>
                <p className="text-sm text-slate-600 mb-3">
                  {feedback.filter(f => f.Linked_Activity === selectedActivity.id).length} feedback record(s) collected.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" className="gap-2"
                    onClick={() => { setIsViewOpen(false); navigate(createPageUrl(`ARTAFeedback?activity=${selectedActivity.id}`)); }}>
                    <ExternalLink className="h-4 w-4" />
                    {feedback.some(f => f.Linked_Activity === selectedActivity.id) ? 'View / Add Feedback' : 'Submit ARTA Feedback'}
                  </Button>
                  <Button variant="outline" size="sm" className="gap-2"
                    onClick={() => { setIsViewOpen(false); navigate(createPageUrl(`ActivityView?id=${selectedActivity.id}`)); }}>
                    <Eye className="h-4 w-4" />View Full Details
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}