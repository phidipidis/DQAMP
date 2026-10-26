import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { logAuditEvent } from '../components/audit/AuditLogger';
import toast from 'react-hot-toast';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow } from
"@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue } from
"@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter } from
"@/components/ui/dialog";
import { Plus, Search, Edit, Trash2 } from 'lucide-react';

export default function Objectives() {
  const [searchTerm, setSearchTerm] = useState('');
  const [projectFilter, setProjectFilter] = useState('All');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingObjective, setEditingObjective] = useState(null);

  const [formData, setFormData] = useState({
    Linked_Project: '',
    Objective_Statement: '',
    Objective_Type: '',
    Target_Indicator: '',
    Target_Value: '',
    Verification_Method: '',
    Objective_Status: 'Not Started',
    Linked_Outputs: []
  });

  const queryClient = useQueryClient();

  const { data: objectives = [], isLoading } = useQuery({
    queryKey: ['objectives'],
    queryFn: () => base44.entities.Project_Objectives.list('-created_date')
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => base44.entities.Project.list()
  });

  const { data: outputs = [] } = useQuery({
    queryKey: ['outputs'],
    queryFn: () => base44.entities.ProjectOutputs.list()
  });

  const createMutation = useMutation({
    mutationFn: (data) => {
      console.log('Creating objective with data:', data);
      return base44.entities.Project_Objectives.create(data);
    },
    onSuccess: async (result) => {
      console.log('Objective created successfully:', result);
      await logAuditEvent({
        actionType: 'Create',
        entity: 'Project_Objectives',
        recordId: result.id,
        remarks: `Created objective`,
        newValues: formData
      });
      queryClient.invalidateQueries(['objectives']);
      toast.success('Objective created successfully!');
      closeDialog();
    },
    onError: (error) => {
      console.error('Failed to create objective:', error);
      toast.error(`Failed to create objective: ${error.message || 'Unknown error'}`);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => {
      console.log('Updating objective:', id, 'with data:', data);
      return base44.entities.Project_Objectives.update(id, data);
    },
    onSuccess: async () => {
      console.log('Objective updated successfully');
      await logAuditEvent({
        actionType: 'Update',
        entity: 'Project_Objectives',
        recordId: editingObjective.id,
        remarks: `Updated objective`,
        previousValues: editingObjective,
        newValues: formData
      });
      queryClient.invalidateQueries(['objectives']);
      toast.success('Objective updated successfully!');
      closeDialog();
    },
    onError: (error) => {
      console.error('Failed to update objective:', error);
      toast.error(`Failed to update objective: ${error.message || 'Unknown error'}`);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => {
      console.log('Deleting objective:', id);
      return base44.entities.Project_Objectives.delete(id);
    },
    onSuccess: async (_, id) => {
      console.log('Objective deleted successfully');
      await logAuditEvent({
        actionType: 'Delete',
        entity: 'Project_Objectives',
        recordId: id,
        remarks: `Deleted objective`
      });
      queryClient.invalidateQueries(['objectives']);
      toast.success('Objective deleted successfully!');
    },
    onError: (error) => {
      console.error('Failed to delete objective:', error);
      toast.error(`Failed to delete objective: ${error.message || 'Unknown error'}`);
    }
  });

  const filteredObjectives = objectives.filter((obj) => {
    const matchesSearch = obj.Objective_Statement?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesProject = projectFilter === 'All' || obj.Linked_Project === projectFilter;
    return matchesSearch && matchesProject;
  });

  const getProjectCode = (projectId) => {
    const project = projects.find((p) => p.id === projectId);
    return project?.Project_Code || '-';
  };

  const openCreateDialog = () => {
    setEditingObjective(null);
    setFormData({
      Linked_Project: '',
      Objective_Statement: '',
      Objective_Type: '',
      Target_Indicator: '',
      Target_Value: '',
      Verification_Method: '',
      Objective_Status: 'Not Started',
      Linked_Outputs: []
    });
    setDialogOpen(true);
  };

  const openEditDialog = (objective) => {
    setEditingObjective(objective);
    setFormData({
      Linked_Project: objective.Linked_Project || '',
      Objective_Statement: objective.Objective_Statement || '',
      Objective_Type: objective.Objective_Type || '',
      Target_Indicator: objective.Target_Indicator || '',
      Target_Value: objective.Target_Value || '',
      Verification_Method: objective.Verification_Method || '',
      Objective_Status: objective.Objective_Status || 'Not Started',
      Linked_Outputs: objective.Linked_Outputs || []
    });
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingObjective(null);
  };

  const handleSave = () => {
    console.log('handleSave called with formData:', formData);

    if (!formData.Linked_Project || !formData.Objective_Statement) {
      toast.error('Please fill in all required fields (Project and Objective Statement)');
      return;
    }

    if (editingObjective) {
      console.log('Updating existing objective:', editingObjective.id);
      updateMutation.mutate({ id: editingObjective.id, data: formData });
    } else {
      console.log('Creating new objective');
      createMutation.mutate(formData);
    }
  };

  const statusColors = {
    'Not Started': 'bg-gray-100 text-gray-800',
    'In Progress': 'bg-blue-100 text-blue-800',
    'Achieved': 'bg-emerald-100 text-emerald-800',
    'Not Achieved': 'bg-red-100 text-red-800'
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1e3a5f]">Division Objectives</h1>
          <p className="text-slate-600">Manage division objectives and projects</p>
        </div>
        <Button onClick={openCreateDialog} className="gap-2 bg-[#1e3a5f] hover:bg-[#1e3a5f]/90">
          <Plus className="h-4 w-4" />
          New Objective
        </Button>
      </div>

      {/* Filters */}
      <Card className="shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search objectives..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9" />

              </div>
            </div>
            <Select value={projectFilter} onValueChange={setProjectFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Project" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Projects</SelectItem>
                {projects.map((p) =>
                <SelectItem key={p.id} value={p.id}>{p.Project_Code}</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Objectives Table */}
      <Card className="shadow-md">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead className="font-semibold">Project</TableHead>
                  <TableHead className="font-semibold">Objective Statement</TableHead>
                  <TableHead className="font-semibold">Type</TableHead>
                  <TableHead className="font-semibold">Target</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ?
                <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                      Loading objectives...
                    </TableCell>
                  </TableRow> :
                filteredObjectives.length === 0 ?
                <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                      No objectives found.
                    </TableCell>
                  </TableRow> :

                filteredObjectives.map((obj) =>
                <TableRow key={obj.id} className="hover:bg-slate-50">
                      <TableCell className="font-medium">{getProjectCode(obj.Linked_Project)}</TableCell>
                      <TableCell className="max-w-md truncate">{obj.Objective_Statement}</TableCell>
                      <TableCell>{obj.Objective_Type || '-'}</TableCell>
                      <TableCell>{obj.Target_Value ? `${obj.Target_Indicator}: ${obj.Target_Value}` : '-'}</TableCell>
                      <TableCell>
                        <Badge className={statusColors[obj.Objective_Status] || statusColors['Not Started']}>
                          {obj.Objective_Status || 'Not Started'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditDialog(obj)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-500 hover:text-red-700"
                        onClick={() => {
                          console.log('Delete button clicked for objective:', obj.id);
                          if (window.confirm('Are you sure you want to delete this objective?')) {
                            deleteMutation.mutate(obj.id);
                          }
                        }}
                        disabled={deleteMutation.isPending}>

                           <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                )
                }
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingObjective ? 'Edit Objective' : 'New Objective'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Linked Project <span className="text-red-500">*</span></Label>
              <Select
                value={formData.Linked_Project}
                onValueChange={(v) => setFormData((prev) => ({ ...prev, Linked_Project: v }))}>

                <SelectTrigger>
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((p) =>
                  <SelectItem key={p.id} value={p.id}>{p.Project_Code} - {p.Project_Title}</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Objective Statement <span className="text-red-500">*</span></Label>
              <Textarea
                value={formData.Objective_Statement}
                onChange={(e) => setFormData((prev) => ({ ...prev, Objective_Statement: e.target.value }))}
                rows={3}
                placeholder="Describe the objective" />

            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Objective Type</Label>
                <Select
                  value={formData.Objective_Type}
                  onValueChange={(v) => setFormData((prev) => ({ ...prev, Objective_Type: v }))}>

                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Outcome">Outcome</SelectItem>
                    <SelectItem value="Intermediate Outcome">Intermediate Outcome</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select
                  value={formData.Objective_Status}
                  onValueChange={(v) => setFormData((prev) => ({ ...prev, Objective_Status: v }))}>

                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Not Started">Not Started</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Achieved">Achieved</SelectItem>
                    <SelectItem value="Not Achieved">Not Achieved</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Target Indicator</Label>
                <Input
                  value={formData.Target_Indicator}
                  onChange={(e) => setFormData((prev) => ({ ...prev, Target_Indicator: e.target.value }))}
                  placeholder="e.g., Completion Rate" />

              </div>
              <div>
                <Label>Target Value</Label>
                <Input
                  value={formData.Target_Value}
                  onChange={(e) => setFormData((prev) => ({ ...prev, Target_Value: e.target.value }))}
                  placeholder="e.g., 100%" />

              </div>
            </div>
            <div>
              <Label>Verification Method</Label>
              <Input
                value={formData.Verification_Method}
                onChange={(e) => setFormData((prev) => ({ ...prev, Verification_Method: e.target.value }))}
                placeholder="How will this be verified?" />

            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Cancel</Button>
            <Button
              onClick={handleSave}
              variant="outline"
              className="text-slate-700 border-slate-300 hover:bg-slate-50"
              disabled={createMutation.isPending || updateMutation.isPending}>

              {createMutation.isPending || updateMutation.isPending ?
              <span className="flex items-center gap-2">
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent"></span>
                  {editingObjective ? 'Updating...' : 'Creating...'}
                </span> :

              <>{editingObjective ? 'Update' : 'Create'}</>
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>);

}