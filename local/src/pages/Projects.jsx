import { useState } from 'react';
import { canEditPlanning } from '@/lib/permissions';
import { useAuth } from '@/lib/AuthContext';
import { formatPeso } from '@/lib/format';
import { useFilters } from '@/lib/FilterContext';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
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
import { Plus, Search, Eye, Edit, Trash2, Download } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { exportProjectsNaming } from '../utils/namingStandardsExport';

export default function Projects() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const { divisions } = useFilters();
  const { user } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [deleteConfirmProject, setDeleteConfirmProject] = useState(null);
  const [sortBy, setSortBy] = useState('Project_Code');
  const [sortOrder, setSortOrder] = useState('asc');
  
  const [formData, setFormData] = useState({
    Project_Code: '',
    Project_Title: '',
    Project_Description: '',
    Functional_Division: '',
    Project_Start_Date: '2026-01-05',
    Project_End_Date: '2026-12-31',
    Project_Status: 'Planning'
  });

  const queryClient = useQueryClient();

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () => base44.entities.Project.list('-created_date')
  });

  const { data: activities = [] } = useQuery({
    queryKey: ['activities'],
    queryFn: () => base44.entities.DQAMPActivity.list()
  });

  const { data: outputs = [] } = useQuery({
    queryKey: ['outputs'],
    queryFn: () => base44.entities.ProjectOutputs.list()
  });

  const createMutation = useMutation({
    mutationFn: (data) => {
      console.log('Creating project with data:', data);
      return base44.entities.Project.create(data);
    },
    onSuccess: async (result) => {
      console.log('Project created successfully:', result);
      await logAuditEvent({
        actionType: 'Create',
        entity: 'Project',
        recordId: result.id,
        remarks: `Created project: ${formData.Project_Code}`,
        newValues: formData
      });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success(`Project "${formData.Project_Code}" created successfully!`);
      closeDialog();
    },
    onError: (error) => {
      console.error('Failed to create project:', error);
      toast.error(`Failed to create project: ${error.message || 'Unknown error'}`);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => {
      console.log('Updating project:', id, 'with data:', data);
      return base44.entities.Project.update(id, data);
    },
    onSuccess: async () => {
      console.log('Project updated successfully');
      await logAuditEvent({
        actionType: 'Update',
        entity: 'Project',
        recordId: editingProject.id,
        remarks: `Updated project: ${formData.Project_Code}`,
        previousValues: editingProject,
        newValues: formData
      });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success(`Project "${formData.Project_Code}" updated successfully!`);
      closeDialog();
    },
    onError: (error) => {
      console.error('Failed to update project:', error);
      toast.error(`Failed to update project: ${error.message || 'Unknown error'}`);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Project.delete(id),
    onSuccess: async (_, id) => {
      const project = projects.find(p => p.id === id);
      await logAuditEvent({
        actionType: 'Delete',
        entity: 'Project',
        recordId: id,
        remarks: `Deleted project: ${project?.Project_Code || id}`
      });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Project deleted successfully.');
      setDeleteConfirmProject(null);
    },
    onError: (error) => {
      toast.error(`Failed to delete project: ${error.message || 'Unknown error'}`);
    }
  });

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const filteredProjects = projects
    .filter(project => {
      const matchesSearch = project.Project_Code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           project.Project_Title?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'All' || project.Project_Status === statusFilter;
      const matchesDivision = divisions.length === 0 || divisions.includes(project.Functional_Division);
      return matchesSearch && matchesStatus && matchesDivision;
    })
    .sort((a, b) => {
      const aVal = a[sortBy];
      const bVal = b[sortBy];
      if (typeof aVal === 'string') {
        return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
    });

  const getProjectBudget = (projectId) => {
    const linkedActivities = activities.filter(a =>
      a.Linked_Projects?.includes(projectId) || projects.find(p => p.id === projectId)?.Linked_Activities?.includes(a.id)
    );
    return linkedActivities.reduce((sum, a) => sum + (a.Financial_Allocation || 0), 0);
  };

  const getLinkedActivitiesCount = (projectId) => {
    return activities.filter(a =>
      a.Linked_Projects?.includes(projectId) || projects.find(p => p.id === projectId)?.Linked_Activities?.includes(a.id)
    ).length;
  };

  const getLinkedOutputsCount = (projectId) => {
    return outputs.filter(o => o.Linked_Project === projectId).length;
  };

  const openCreateDialog = () => {
    setEditingProject(null);
    setFormData({
      Project_Code: '',
      Project_Title: '',
      Project_Description: '',
      Functional_Division: '',
      Project_Start_Date: '2026-01-05',
      Project_End_Date: '2026-12-31',
      Project_Status: 'Planning'
    });
    setDialogOpen(true);
  };

  const openEditDialog = (project) => {
    setEditingProject(project);
    setFormData({
      Project_Code: project.Project_Code || '',
      Project_Title: project.Project_Title || '',
      Project_Description: project.Project_Description || '',
      Functional_Division: project.Functional_Division || '',
      Project_Start_Date: project.Project_Start_Date || '2026-01-05',
      Project_End_Date: project.Project_End_Date || '2026-12-31',
      Project_Status: project.Project_Status || 'Planning'
    });
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingProject(null);
  };

  const handleSave = () => {
    console.log('handleSave called with formData:', formData);
    
    if (!formData.Project_Code || !formData.Project_Title || !formData.Functional_Division) {
      toast.error('Please fill in all required fields (Project Code, Title, and Division)');
      return;
    }

    if (editingProject) {
      console.log('Updating existing project:', editingProject.id);
      updateMutation.mutate({ id: editingProject.id, data: formData });
    } else {
      console.log('Creating new project');
      createMutation.mutate(formData);
    }
  };

  const statusColors = {
    'Planning': 'bg-slate-100 text-slate-800',
    'Ongoing': 'bg-blue-100 text-blue-800',
    'On Track': 'bg-emerald-100 text-emerald-800',
    'Completed': 'bg-emerald-100 text-emerald-800',
    'At Risk': 'bg-amber-100 text-amber-900',
    'Delayed': 'bg-red-100 text-red-800',
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#1B2A8F]">Projects</h1>
          <p className="text-slate-600">Manage projects with objectives and outputs</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {filteredProjects.length > 0 && (
            <Button variant="outline" onClick={() => exportProjectsNaming(filteredProjects)} className="gap-2">
              <Download className="h-4 w-4" />
              Export Names & Codes
            </Button>
          )}
          {canEditPlanning(user) && (
            <Button onClick={openCreateDialog} className="gap-2 bg-[#1B2A8F] hover:bg-[#1B2A8F]/90">
              <Plus className="h-4 w-4" />
              New Project
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <Card className="shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search projects..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger aria-label="Filter by status" className="w-[160px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Statuses</SelectItem>
                <SelectItem value="Planning">Planning</SelectItem>
                <SelectItem value="Ongoing">Ongoing</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Projects Table */}
      <Card className="shadow-md">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead className="font-semibold cursor-pointer hover:bg-slate-100" onClick={() => handleSort('Project_Code')}>
                    Project Code {sortBy === 'Project_Code' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </TableHead>
                  <TableHead className="font-semibold">Title</TableHead>
                  <TableHead className="font-semibold">Division</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold text-center">Outputs</TableHead>
                  <TableHead className="font-semibold text-center">Activities</TableHead>
                  <TableHead className="font-semibold text-right">Total Budget</TableHead>
                  <TableHead className="font-semibold text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-slate-500">
                      Loading projects...
                    </TableCell>
                  </TableRow>
                ) : filteredProjects.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-slate-500">
                      No projects found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProjects.map(project => (
                    <TableRow key={project.id} className="hover:bg-slate-50">
                      <TableCell className="font-medium">{project.Project_Code}</TableCell>
                      <TableCell>{project.Project_Title}</TableCell>
                      <TableCell>{project.Functional_Division}</TableCell>
                      <TableCell>
                        <Badge className={statusColors[project.Project_Status]}>
                          {project.Project_Status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">{getLinkedOutputsCount(project.id)}</TableCell>
                      <TableCell className="text-center">{getLinkedActivitiesCount(project.id)}</TableCell>
                      <TableCell className="text-right">{formatPeso(getProjectBudget(project.id))}</TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-1">
                          <Link to={createPageUrl(`ProjectView?id=${project.id}`)}>
                            <Button aria-label="View" variant="ghost" size="icon" className="h-8 w-8">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          {canEditPlanning(user, project.Functional_Division ?? null) && (
                            <>
                              <Button aria-label="Edit" variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditDialog(project)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button aria-label="Delete" variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => setDeleteConfirmProject(project)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
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

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirmProject} onOpenChange={(open) => !open && setDeleteConfirmProject(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deleteConfirmProject?.Project_Code} – {deleteConfirmProject?.Project_Title}</strong>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => deleteMutation.mutate(deleteConfirmProject.id)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingProject ? 'Edit Project' : 'New Project'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Project Code <span className="text-red-500">*</span></Label>
                <Input
                  value={formData.Project_Code}
                  onChange={(e) => setFormData(prev => ({ ...prev, Project_Code: e.target.value }))}
                  placeholder="e.g., PROJ-001"
                />
              </div>
              <div>
                <Label>Functional Division <span className="text-red-500">*</span></Label>
                <Select
                  value={formData.Functional_Division}
                  onValueChange={(v) => setFormData(prev => ({ ...prev, Functional_Division: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select division" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CID">CID</SelectItem>
                    <SelectItem value="SGOD">SGOD</SelectItem>
                    <SelectItem value="OSDS">OSDS</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Project Title <span className="text-red-500">*</span></Label>
              <Input
                value={formData.Project_Title}
                onChange={(e) => setFormData(prev => ({ ...prev, Project_Title: e.target.value }))}
                placeholder="Project title"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={formData.Project_Description}
                onChange={(e) => setFormData(prev => ({ ...prev, Project_Description: e.target.value }))}
                rows={3}
                placeholder="Project description"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={formData.Project_Start_Date}
                  onChange={(e) => setFormData(prev => ({ ...prev, Project_Start_Date: e.target.value }))}
                />
              </div>
              <div>
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={formData.Project_End_Date}
                  onChange={(e) => setFormData(prev => ({ ...prev, Project_End_Date: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <Label>Status</Label>
              <Select
                value={formData.Project_Status}
                onValueChange={(v) => setFormData(prev => ({ ...prev, Project_Status: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Planning">Planning</SelectItem>
                  <SelectItem value="Ongoing">Ongoing</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Cancel</Button>
            <Button 
              onClick={handleSave} 
              variant="outline"
              className="text-slate-700 border-slate-300 hover:bg-slate-50"
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {createMutation.isPending || updateMutation.isPending ? (
                <span className="flex items-center gap-2">
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent"></span>
                  {editingProject ? 'Updating...' : 'Creating...'}
                </span>
              ) : (
                <>{editingProject ? 'Update' : 'Create'}</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}