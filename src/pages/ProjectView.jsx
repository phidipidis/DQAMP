import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import WorkflowBadge from '../components/ui/WorkflowBadge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from "@/components/ui/alert-dialog";
import {
  ArrowLeft, Calendar, DollarSign, Target, Package, ClipboardList,
  Building2, Plus, Pencil, Trash2
} from 'lucide-react';

const EMPTY_OBJECTIVE = { Objective_Statement: '', Objective_Type: '', Target_Indicator: '', Target_Value: '', Verification_Method: '', Objective_Status: 'Not Started' };
const EMPTY_OUTPUT = { Output_Description: '', Output_Category: '', Due_Date: '', Output_Verification_Status: 'Pending', means_of_verification_url: '' };

export default function ProjectView() {
  const urlParams = new URLSearchParams(window.location.search);
  const projectId = urlParams.get('id');
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Dialog states
  const [objectiveDialog, setObjectiveDialog] = useState(false);
  const [editingObjective, setEditingObjective] = useState(null);
  const [objectiveForm, setObjectiveForm] = useState(EMPTY_OBJECTIVE);
  const [deleteObjective, setDeleteObjective] = useState(null);

  const [outputDialog, setOutputDialog] = useState(false);
  const [editingOutput, setEditingOutput] = useState(null);
  const [outputForm, setOutputForm] = useState(EMPTY_OUTPUT);
  const [deleteOutput, setDeleteOutput] = useState(null);

  const { data: projectData, isLoading } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => base44.entities.Project.filter({ id: projectId })
  });

  const { data: objectives = [], refetch: refetchObjectives } = useQuery({
    queryKey: ['objectives', projectId],
    queryFn: () => base44.entities.Project_Objectives.filter({ Linked_Project: projectId })
  });

  const { data: outputs = [], refetch: refetchOutputs } = useQuery({
    queryKey: ['outputs', projectId],
    queryFn: () => base44.entities.ProjectOutputs.filter({ Linked_Project: projectId })
  });

  const { data: activities = [] } = useQuery({
    queryKey: ['activities'],
    queryFn: () => base44.entities.DQAMPActivity.list()
  });

  // Objective mutations
  const createObjectiveMutation = useMutation({
    mutationFn: (data) => base44.entities.Project_Objectives.create({ ...data, Linked_Project: projectId }),
    onSuccess: () => { refetchObjectives(); closeObjectiveDialog(); }
  });
  const updateObjectiveMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Project_Objectives.update(id, data),
    onSuccess: () => { refetchObjectives(); closeObjectiveDialog(); }
  });
  const deleteObjectiveMutation = useMutation({
    mutationFn: (id) => base44.entities.Project_Objectives.delete(id),
    onSuccess: () => { refetchObjectives(); setDeleteObjective(null); }
  });

  // Output mutations
  const createOutputMutation = useMutation({
    mutationFn: (data) => base44.entities.ProjectOutputs.create({ ...data, Linked_Project: projectId }),
    onSuccess: () => { refetchOutputs(); closeOutputDialog(); }
  });
  const updateOutputMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ProjectOutputs.update(id, data),
    onSuccess: () => { refetchOutputs(); closeOutputDialog(); }
  });
  const deleteOutputMutation = useMutation({
    mutationFn: (id) => base44.entities.ProjectOutputs.delete(id),
    onSuccess: () => { refetchOutputs(); setDeleteOutput(null); }
  });

  const openAddObjective = () => { setEditingObjective(null); setObjectiveForm(EMPTY_OBJECTIVE); setObjectiveDialog(true); };
  const openEditObjective = (obj) => { setEditingObjective(obj); setObjectiveForm({ Objective_Statement: obj.Objective_Statement || '', Objective_Type: obj.Objective_Type || '', Target_Indicator: obj.Target_Indicator || '', Target_Value: obj.Target_Value || '', Verification_Method: obj.Verification_Method || '', Objective_Status: obj.Objective_Status || 'Not Started' }); setObjectiveDialog(true); };
  const closeObjectiveDialog = () => { setObjectiveDialog(false); setEditingObjective(null); setObjectiveForm(EMPTY_OBJECTIVE); };

  const openAddOutput = () => { setEditingOutput(null); setOutputForm(EMPTY_OUTPUT); setOutputDialog(true); };
  const openEditOutput = (out) => { setEditingOutput(out); setOutputForm({ Output_Description: out.Output_Description || '', Output_Category: out.Output_Category || '', Due_Date: out.Due_Date || '', Output_Verification_Status: out.Output_Verification_Status || 'Pending', means_of_verification_url: out.means_of_verification_url || '' }); setOutputDialog(true); };
  const closeOutputDialog = () => { setOutputDialog(false); setEditingOutput(null); setOutputForm(EMPTY_OUTPUT); };

  const saveObjective = () => {
    if (!objectiveForm.Objective_Statement) return;
    if (editingObjective) updateObjectiveMutation.mutate({ id: editingObjective.id, data: objectiveForm });
    else createObjectiveMutation.mutate(objectiveForm);
  };

  const saveOutput = () => {
    if (!outputForm.Output_Description) return;
    if (editingOutput) updateOutputMutation.mutate({ id: editingOutput.id, data: outputForm });
    else createOutputMutation.mutate(outputForm);
  };

  const project = projectData?.[0];

  if (isLoading) return <div className="flex items-center justify-center h-64">Loading...</div>;
  if (!project) return <div className="flex items-center justify-center h-64">Project not found.</div>;

  const linkedActivities = activities.filter(a =>
    Array.isArray(a.Linked_Projects) ? a.Linked_Projects.includes(projectId) : a.Linked_Project === projectId
  );
  const totalBudget = linkedActivities.reduce((sum, a) => sum + (a.Financial_Allocation || 0), 0);

  const statusColors = { 'Planning': 'bg-gray-100 text-gray-800', 'Ongoing': 'bg-blue-100 text-blue-800', 'Completed': 'bg-emerald-100 text-emerald-800' };
  const objectiveStatusColors = { 'Not Started': 'bg-gray-100 text-gray-800', 'In Progress': 'bg-blue-100 text-blue-800', 'Achieved': 'bg-emerald-100 text-emerald-800', 'Not Achieved': 'bg-red-100 text-red-800' };
  const outputStatusColors = { 'Pending': 'bg-amber-100 text-amber-800', 'Verified': 'bg-emerald-100 text-emerald-800', 'Not Achieved': 'bg-red-100 text-red-800' };

  const isSavingObj = createObjectiveMutation.isPending || updateObjectiveMutation.isPending;
  const isSavingOut = createOutputMutation.isPending || updateOutputMutation.isPending;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate(createPageUrl('Projects'))}>
            <ArrowLeft className="h-4 w-4 mr-2" />Back
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-[#1e3a5f]">{project.Project_Code}</h1>
              <Badge className={statusColors[project.Project_Status]}>{project.Project_Status}</Badge>
            </div>
            <p className="text-slate-600">{project.Project_Title}</p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Objectives', value: objectives.length, icon: Target, color: '#1e3a5f', bg: 'bg-[#1e3a5f]/10' },
          { label: 'Outputs', value: outputs.length, icon: Package, color: '#0d9488', bg: 'bg-[#0d9488]/10' },
          { label: 'Activities', value: linkedActivities.length, icon: ClipboardList, color: '#d97706', bg: 'bg-amber-100' },
          { label: 'Total Budget', value: `₱${totalBudget.toLocaleString()}`, icon: DollarSign, color: '#059669', bg: 'bg-emerald-100' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <Card key={label} className="shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 ${bg} rounded-lg`}><Icon className="h-5 w-5" style={{ color }} /></div>
                <div><p className="text-sm text-slate-600">{label}</p><p className="text-xl font-bold">{value}</p></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Project Details */}
      <Card className="shadow-md">
        <CardHeader><CardTitle className="text-[#1e3a5f] flex items-center gap-2"><Building2 className="h-5 w-5" />Project Details</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div><p className="text-sm text-slate-500">Division</p><p className="font-medium">{project.Functional_Division}</p></div>
          <div><p className="text-sm text-slate-500">Start Date</p><p className="font-medium">{project.Project_Start_Date || '-'}</p></div>
          <div><p className="text-sm text-slate-500">End Date</p><p className="font-medium">{project.Project_End_Date || '-'}</p></div>
          <div><p className="text-sm text-slate-500">Status</p><Badge className={statusColors[project.Project_Status]}>{project.Project_Status}</Badge></div>
          {project.Project_Description && (
            <div className="col-span-4"><p className="text-sm text-slate-500">Description</p><p>{project.Project_Description}</p></div>
          )}
        </CardContent>
      </Card>

      {/* Objectives */}
      <Card className="shadow-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-[#1e3a5f] flex items-center gap-2"><Target className="h-5 w-5" />Linked Objectives ({objectives.length})</CardTitle>
            <Button size="sm" variant="primary" onClick={openAddObjective}><Plus className="h-4 w-4 mr-1" />Add Objective</Button>
          </div>
        </CardHeader>
        <CardContent>
          {objectives.length === 0 ? (
            <p className="text-slate-500 text-center py-4">No objectives linked to this project.</p>
          ) : (
            <div className="space-y-3">
              {objectives.map(obj => (
                <div key={obj.id} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">{obj.Objective_Statement}</p>
                      {obj.Objective_Type && <Badge variant="outline" className="mt-1">{obj.Objective_Type}</Badge>}
                      {obj.Target_Indicator && (
                        <p className="text-sm text-slate-500 mt-1">Target: {obj.Target_Indicator} = {obj.Target_Value}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge className={objectiveStatusColors[obj.Objective_Status] || objectiveStatusColors['Not Started']}>
                        {obj.Objective_Status || 'Not Started'}
                      </Badge>
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEditObjective(obj)}>
                        <Pencil className="h-4 w-4 text-slate-500" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setDeleteObjective(obj)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Outputs */}
      <Card className="shadow-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-[#1e3a5f] flex items-center gap-2"><Package className="h-5 w-5" />Linked Outputs ({outputs.length})</CardTitle>
            <Button size="sm" variant="primary" onClick={openAddOutput}><Plus className="h-4 w-4 mr-1" />Add Output</Button>
          </div>
        </CardHeader>
        <CardContent>
          {outputs.length === 0 ? (
            <p className="text-slate-500 text-center py-4">No outputs linked to this project.</p>
          ) : (
            <div className="space-y-3">
              {outputs.map(output => (
                <div key={output.id} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">{output.Output_Description}</p>
                      <div className="flex gap-2 mt-1 flex-wrap">
                        {output.Output_Category && <Badge variant="outline">{output.Output_Category}</Badge>}
                        {output.Due_Date && (
                          <Badge variant="outline" className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />{output.Due_Date}
                          </Badge>
                        )}
                      </div>
                      {output.means_of_verification_url && (
                        <a href={output.means_of_verification_url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 underline mt-1 block">MOV Link</a>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge className={outputStatusColors[output.Output_Verification_Status] || outputStatusColors['Pending']}>
                        {output.Output_Verification_Status || 'Pending'}
                      </Badge>
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEditOutput(output)}>
                        <Pencil className="h-4 w-4 text-slate-500" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setDeleteOutput(output)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Linked Activities */}
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-[#1e3a5f] flex items-center gap-2"><ClipboardList className="h-5 w-5" />Linked Activities ({linkedActivities.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {linkedActivities.length === 0 ? (
            <p className="text-slate-500 text-center py-4">No activities linked to this project.</p>
          ) : (
            <div className="space-y-3">
              {linkedActivities.map(activity => (
                <Link key={activity.id} to={createPageUrl(`ActivityView?id=${activity.id}`)}
                  className="block p-4 border rounded-lg hover:bg-slate-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium">{activity.Activity_Title || activity.Title}</p>
                      <div className="flex gap-2 mt-1">
                        <Badge variant="outline">{activity.Activity_Type || activity.Category || 'Uncategorized'}</Badge>
                        <span className="text-sm text-slate-500">₱{(activity.Financial_Allocation || 0).toLocaleString()}</span>
                      </div>
                    </div>
                    <WorkflowBadge status={activity.Workflow_Status} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Objective Dialog */}
      <Dialog open={objectiveDialog} onOpenChange={(open) => !open && closeObjectiveDialog()}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingObjective ? 'Edit Objective' : 'Add Objective'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Objective Statement *</Label>
              <textarea className="w-full mt-1 border rounded-md p-2 text-sm min-h-[80px] resize-y"
                value={objectiveForm.Objective_Statement}
                onChange={e => setObjectiveForm(f => ({ ...f, Objective_Statement: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Type</Label>
                <Select value={objectiveForm.Objective_Type} onValueChange={v => setObjectiveForm(f => ({ ...f, Objective_Type: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Outcome">Outcome</SelectItem>
                    <SelectItem value="Intermediate Outcome">Intermediate Outcome</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={objectiveForm.Objective_Status} onValueChange={v => setObjectiveForm(f => ({ ...f, Objective_Status: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['Not Started', 'In Progress', 'Achieved', 'Not Achieved'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Target Indicator</Label>
                <Input className="mt-1" value={objectiveForm.Target_Indicator} onChange={e => setObjectiveForm(f => ({ ...f, Target_Indicator: e.target.value }))} />
              </div>
              <div>
                <Label>Target Value</Label>
                <Input className="mt-1" value={objectiveForm.Target_Value} onChange={e => setObjectiveForm(f => ({ ...f, Target_Value: e.target.value }))} />
              </div>
            </div>
            <div>
              <Label>Verification Method</Label>
              <Input className="mt-1" value={objectiveForm.Verification_Method} onChange={e => setObjectiveForm(f => ({ ...f, Verification_Method: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeObjectiveDialog}>Cancel</Button>
            <Button variant="primary" onClick={saveObjective} disabled={isSavingObj || !objectiveForm.Objective_Statement}>
              {isSavingObj ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Output Dialog */}
      <Dialog open={outputDialog} onOpenChange={(open) => !open && closeOutputDialog()}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingOutput ? 'Edit Output' : 'Add Output'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Output Description *</Label>
              <textarea className="w-full mt-1 border rounded-md p-2 text-sm min-h-[80px] resize-y"
                value={outputForm.Output_Description}
                onChange={e => setOutputForm(f => ({ ...f, Output_Description: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Category</Label>
                <Select value={outputForm.Output_Category} onValueChange={v => setOutputForm(f => ({ ...f, Output_Category: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    {['Deliverable', 'Capacity', 'Policy', 'System'].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Verification Status</Label>
                <Select value={outputForm.Output_Verification_Status} onValueChange={v => setOutputForm(f => ({ ...f, Output_Verification_Status: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['Pending', 'Verified', 'Not Achieved'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Due Date</Label>
                <Input type="date" className="mt-1" value={outputForm.Due_Date} onChange={e => setOutputForm(f => ({ ...f, Due_Date: e.target.value }))} />
              </div>
              <div>
                <Label>MOV URL</Label>
                <Input className="mt-1" placeholder="https://..." value={outputForm.means_of_verification_url} onChange={e => setOutputForm(f => ({ ...f, means_of_verification_url: e.target.value }))} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeOutputDialog}>Cancel</Button>
            <Button variant="primary" onClick={saveOutput} disabled={isSavingOut || !outputForm.Output_Description}>
              {isSavingOut ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Objective Confirmation */}
      <AlertDialog open={!!deleteObjective} onOpenChange={(open) => !open && setDeleteObjective(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Objective</AlertDialogTitle>
            <AlertDialogDescription>Are you sure you want to delete this objective? This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700"
              onClick={() => deleteObjectiveMutation.mutate(deleteObjective.id)}
              disabled={deleteObjectiveMutation.isPending}>
              {deleteObjectiveMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Output Confirmation */}
      <AlertDialog open={!!deleteOutput} onOpenChange={(open) => !open && setDeleteOutput(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Output</AlertDialogTitle>
            <AlertDialogDescription>Are you sure you want to delete this output? This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700"
              onClick={() => deleteOutputMutation.mutate(deleteOutput.id)}
              disabled={deleteOutputMutation.isPending}>
              {deleteOutputMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}