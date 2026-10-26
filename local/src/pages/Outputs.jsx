import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { logAuditEvent } from '../components/audit/AuditLogger';
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
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Search, Edit, Trash2, CheckCircle } from 'lucide-react';
import { useFilters } from '@/lib/FilterContext';

export default function Outputs() {
  const { divisions } = useFilters();
  const [searchTerm, setSearchTerm] = useState('');
  const [projectFilter, setProjectFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingOutput, setEditingOutput] = useState(null);
  
  const [formData, setFormData] = useState({
    Linked_Project: '',
    Output_Description: '',
    Output_Category: '',
    Due_Date: '',
    Linked_Evidence: [],
    Linked_Objectives: [],
    Output_Verification_Status: 'Pending',
    Verified_By: '',
    Verification_Date: '',
    means_of_verification_url: ''
  });

  const queryClient = useQueryClient();

  const { data: outputs = [], isLoading } = useQuery({
    queryKey: ['outputs'],
    queryFn: () => base44.entities.ProjectOutputs.list('-created_date')
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => base44.entities.Project.list()
  });

  const { data: objectives = [] } = useQuery({
    queryKey: ['objectives'],
    queryFn: () => base44.entities.Project_Objectives.list()
  });

  const { data: activities = [] } = useQuery({
    queryKey: ['activities'],
    queryFn: () => base44.entities.DQAMPActivity.list()
  });

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.ProjectOutputs.create(data),
    onSuccess: async (result) => {
      await logAuditEvent({
        actionType: 'Create',
        entity: 'ProjectOutputs',
        recordId: result.id,
        remarks: `Created output`,
        newValues: formData
      });
      queryClient.invalidateQueries({ queryKey: ['outputs'] });
      closeDialog();
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ProjectOutputs.update(id, data),
    onSuccess: async () => {
      await logAuditEvent({
        actionType: 'Update',
        entity: 'ProjectOutputs',
        recordId: editingOutput.id,
        remarks: `Updated output`,
        previousValues: editingOutput,
        newValues: formData
      });
      queryClient.invalidateQueries({ queryKey: ['outputs'] });
      closeDialog();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ProjectOutputs.delete(id),
    onSuccess: async (_, id) => {
      await logAuditEvent({
        actionType: 'Delete',
        entity: 'ProjectOutputs',
        recordId: id,
        remarks: `Deleted output`
      });
      queryClient.invalidateQueries({ queryKey: ['outputs'] });
    }
  });

  const verifyMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.ProjectOutputs.update(id, {
      Output_Verification_Status: status,
      Verified_By: currentUser?.email,
      Verification_Date: new Date().toISOString()
    }),
    onSuccess: async (_, { id, status }) => {
      await logAuditEvent({
        actionType: 'Update',
        entity: 'ProjectOutputs',
        recordId: id,
        remarks: `Verified output as: ${status}`,
        newValues: { Output_Verification_Status: status }
      });
      queryClient.invalidateQueries({ queryKey: ['outputs'] });
    }
  });

  const filteredOutputs = outputs.filter(output => {
    const matchesSearch = output.Output_Description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesProject = projectFilter === 'All' || output.Linked_Project === projectFilter;
    const matchesStatus = statusFilter === 'All' || output.Output_Verification_Status === statusFilter;
    // Global division filter: match via linked project's division
    if (divisions.length > 0) {
      const proj = projects.find(p => p.id === output.Linked_Project);
      if (!proj || !divisions.includes(proj.Functional_Division)) return false;
    }
    return matchesSearch && matchesProject && matchesStatus;
  });

  const getProjectCode = (projectId) => {
    const project = projects.find(p => p.id === projectId);
    return project?.Project_Code || '-';
  };

  const openCreateDialog = () => {
    setEditingOutput(null);
    setFormData({
      Linked_Project: '',
      Output_Description: '',
      Output_Category: '',
      Due_Date: '',
      Linked_Evidence: [],
      Linked_Objectives: [],
      Output_Verification_Status: 'Pending',
      Verified_By: '',
      Verification_Date: '',
      means_of_verification_url: ''
    });
    setDialogOpen(true);
  };

  const openEditDialog = (output) => {
    setEditingOutput(output);
    setFormData({
      Linked_Project: output.Linked_Project || '',
      Output_Description: output.Output_Description || '',
      Output_Category: output.Output_Category || '',
      Due_Date: output.Due_Date || '',
      Linked_Evidence: output.Linked_Evidence || [],
      Linked_Objectives: output.Linked_Objectives || [],
      Output_Verification_Status: output.Output_Verification_Status || 'Pending',
      Verified_By: output.Verified_By || '',
      Verification_Date: output.Verification_Date || '',
      means_of_verification_url: output.means_of_verification_url || ''
    });
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingOutput(null);
  };

  const handleSave = () => {
    if (!formData.Linked_Project || !formData.Output_Description) {
      return;
    }

    // Payload persisted to base44.entities.ProjectOutputs (NOT Project_Outputs).
    // means_of_verification_url is a field on the ProjectOutputs entity — added in schema fix.
    // All fields in formData map directly to ProjectOutputs field names.
    if (editingOutput) {
      updateMutation.mutate({ id: editingOutput.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const statusColors = {
    'Pending': 'bg-amber-100 text-amber-800',
    'Verified': 'bg-emerald-100 text-emerald-800',
    'Not Achieved': 'bg-red-100 text-red-800'
  };

  const categoryColors = {
    'Deliverable': 'bg-blue-100 text-blue-800',
    'Capacity': 'bg-purple-100 text-purple-800',
    'Policy': 'bg-indigo-100 text-indigo-800',
    'System': 'bg-cyan-100 text-cyan-800'
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1e3a5f]">Project Outputs</h1>
          <p className="text-slate-600">Manage deliverables and outputs with verification tracking</p>
        </div>
        <Button onClick={openCreateDialog} className="gap-2 bg-[#1e3a5f] hover:bg-[#1e3a5f]/90">
          <Plus className="h-4 w-4" />
          New Output
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
                  placeholder="Search outputs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={projectFilter} onValueChange={setProjectFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Project" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Projects</SelectItem>
                {projects.map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.Project_Code}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Statuses</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Verified">Verified</SelectItem>
                <SelectItem value="Not Achieved">Not Achieved</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Outputs Table */}
      <Card className="shadow-md">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead className="font-semibold">Project</TableHead>
                  <TableHead className="font-semibold">Description</TableHead>
                  <TableHead className="font-semibold">Category</TableHead>
                  <TableHead className="font-semibold">Due Date</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold">MOV</TableHead>
                  <TableHead className="font-semibold text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                      Loading outputs...
                    </TableCell>
                  </TableRow>
                ) : filteredOutputs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                      No outputs found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOutputs.map(output => (
                    <TableRow key={output.id} className="hover:bg-slate-50">
                      <TableCell className="font-medium">{getProjectCode(output.Linked_Project)}</TableCell>
                      <TableCell className="max-w-md truncate">{output.Output_Description}</TableCell>
                      <TableCell>
                        {output.Output_Category && (
                          <Badge className={categoryColors[output.Output_Category]}>
                            {output.Output_Category}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>{output.Due_Date || '-'}</TableCell>
                      <TableCell>
                       <Badge className={statusColors[output.Output_Verification_Status] || statusColors['Pending']}>
                         {output.Output_Verification_Status || 'Pending'}
                       </Badge>
                      </TableCell>
                      <TableCell>
                       {output.means_of_verification_url ? (
                         <a
                           href={output.means_of_verification_url}
                           target="_blank"
                           rel="noopener noreferrer"
                           className="text-blue-600 hover:underline text-sm whitespace-nowrap"
                         >
                           View MOV ↗
                         </a>
                       ) : (
                         <span className="text-slate-400 text-sm">—</span>
                       )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-1">
                          {output.Output_Verification_Status === 'Pending' && (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-emerald-600"
                              onClick={() => verifyMutation.mutate({ id: output.id, status: 'Verified' })}
                              title="Mark as Verified"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditDialog(output)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-red-500 hover:text-red-700"
                            onClick={() => deleteMutation.mutate(output.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingOutput ? 'Edit Output' : 'New Output'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Linked Project <span className="text-red-500">*</span></Label>
              <Select
                value={formData.Linked_Project}
                onValueChange={(v) => setFormData(prev => ({ ...prev, Linked_Project: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.Project_Code} - {p.Project_Title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Output Description <span className="text-red-500">*</span></Label>
              <Textarea
                value={formData.Output_Description}
                onChange={(e) => setFormData(prev => ({ ...prev, Output_Description: e.target.value }))}
                rows={3}
                placeholder="Describe the output/deliverable"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Output Category</Label>
                <Select
                  value={formData.Output_Category}
                  onValueChange={(v) => setFormData(prev => ({ ...prev, Output_Category: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Deliverable">Deliverable</SelectItem>
                    <SelectItem value="Capacity">Capacity</SelectItem>
                    <SelectItem value="Policy">Policy</SelectItem>
                    <SelectItem value="System">System</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Due Date</Label>
                <Input
                  type="date"
                  value={formData.Due_Date}
                  onChange={(e) => setFormData(prev => ({ ...prev, Due_Date: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <Label>Means of Verification URL</Label>
              <Input
                value={formData.means_of_verification_url}
                onChange={(e) => setFormData(prev => ({ ...prev, means_of_verification_url: e.target.value }))}
                placeholder="Paste Google Drive or folder URL here..."
              />
              {formData.means_of_verification_url && (
                <a
                  href={formData.means_of_verification_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline text-xs mt-1 inline-block"
                >
                  Open link ↗
                </a>
              )}
            </div>
            <div>
              <Label>Verification Status</Label>
              <Select
                value={formData.Output_Verification_Status}
                onValueChange={(v) => setFormData(prev => ({ ...prev, Output_Verification_Status: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Verified">Verified</SelectItem>
                  <SelectItem value="Not Achieved">Not Achieved</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Cancel</Button>
            <Button 
              onClick={handleSave} 
              className="bg-[#1e3a5f] hover:bg-[#1e3a5f]/90"
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {editingOutput ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}