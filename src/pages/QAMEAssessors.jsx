import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { logAuditEvent } from '../components/audit/AuditLogger';
import toast from 'react-hot-toast';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Plus, Search, Edit, AlertCircle } from 'lucide-react';

const DIVISIONS = ['CID', 'SGOD', 'OSDS'];

export default function QAMEAssessors() {
  const [searchTerm, setSearchTerm] = useState('');
  const [divisionFilter, setDivisionFilter] = useState('All');
  const [activeFilter, setActiveFilter] = useState('All');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAssessor, setEditingAssessor] = useState(null);
  
  const [formData, setFormData] = useState({
    Name: '',
    Functional_Divisions: [],
    Role: '',
    Is_Active: true
  });

  const queryClient = useQueryClient();

  const { data: assessors = [], isLoading } = useQuery({
    queryKey: ['assessors'],
    queryFn: () => base44.entities.QAME_Assessor.list('-created_date')
  });

  const { data: activities = [] } = useQuery({
    queryKey: ['activities'],
    queryFn: () => base44.entities.DQAMPActivity.list()
  });

  const createMutation = useMutation({
    mutationFn: (data) => {
      console.log('Creating assessor with data:', data);
      return base44.entities.QAME_Assessor.create(data);
    },
    onSuccess: async (result) => {
      console.log('Assessor created successfully:', result);
      await logAuditEvent({
        actionType: 'Create',
        entity: 'QAME_Assessor',
        recordId: result.id,
        remarks: `Created assessor: ${formData.Name}`,
        newValues: formData
      });
      queryClient.invalidateQueries(['assessors']);
      toast.success(`Assessor "${formData.Name}" added successfully!`);
      closeDialog();
    },
    onError: (error) => {
      console.error('Failed to create assessor:', error);
      toast.error(`Failed to add assessor: ${error.message || 'Unknown error'}`);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => {
      console.log('Updating assessor:', id, 'with data:', data);
      return base44.entities.QAME_Assessor.update(id, data);
    },
    onSuccess: async () => {
      console.log('Assessor updated successfully');
      const actionType = editingAssessor.Is_Active !== formData.Is_Active ? 'Role_Change' : 'Update';
      await logAuditEvent({
        actionType,
        entity: 'QAME_Assessor',
        recordId: editingAssessor.id,
        remarks: formData.Is_Active !== editingAssessor.Is_Active 
          ? `Assessor ${formData.Name} ${formData.Is_Active ? 'activated' : 'deactivated'}`
          : `Updated assessor: ${formData.Name}`,
        previousValues: editingAssessor,
        newValues: formData
      });
      queryClient.invalidateQueries(['assessors']);
      toast.success(`Assessor "${formData.Name}" updated successfully!`);
      closeDialog();
    },
    onError: (error) => {
      console.error('Failed to update assessor:', error);
      toast.error(`Failed to update assessor: ${error.message || 'Unknown error'}`);
    }
  });

  // Helper to get divisions array (handles legacy single division data)
  const getAssessorDivisions = (assessor) => {
    if (assessor.Functional_Divisions && Array.isArray(assessor.Functional_Divisions)) {
      return assessor.Functional_Divisions;
    }
    // Legacy support: convert old single Functional_Division to array
    if (assessor.Functional_Division) {
      return [assessor.Functional_Division];
    }
    return [];
  };

  const filteredAssessors = assessors.filter(assessor => {
    const matchesSearch = assessor.Name?.toLowerCase().includes(searchTerm.toLowerCase());
    const divisions = getAssessorDivisions(assessor);
    const matchesDivision = divisionFilter === 'All' || divisions.includes(divisionFilter);
    const matchesActive = activeFilter === 'All' || 
      (activeFilter === 'Active' && assessor.Is_Active) ||
      (activeFilter === 'Inactive' && !assessor.Is_Active);
    return matchesSearch && matchesDivision && matchesActive;
  });

  const getAssignedActivitiesCount = (assessorId) => {
    return activities.filter(a => a.Assigned_Assessors?.includes(assessorId)).length;
  };

  const getWorkloadStatus = (assessorId) => {
    const count = getAssignedActivitiesCount(assessorId);
    if (count === 0) return { label: 'No Assignments', color: 'bg-gray-100 text-gray-800' };
    if (count <= 3) return { label: 'Light', color: 'bg-emerald-100 text-emerald-800' };
    if (count <= 6) return { label: 'Moderate', color: 'bg-amber-100 text-amber-800' };
    return { label: 'Heavy', color: 'bg-red-100 text-red-800' };
  };

  const openCreateDialog = () => {
    setEditingAssessor(null);
    setFormData({
      Name: '',
      Functional_Divisions: [],
      Role: '',
      Is_Active: true
    });
    setDialogOpen(true);
  };

  const openEditDialog = (assessor) => {
    setEditingAssessor(assessor);
    setFormData({
      Name: assessor.Name || '',
      Functional_Divisions: getAssessorDivisions(assessor),
      Role: assessor.Role || '',
      Is_Active: assessor.Is_Active ?? true
    });
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingAssessor(null);
  };

  const handleDivisionToggle = (division) => {
    setFormData(prev => {
      const current = prev.Functional_Divisions || [];
      if (current.includes(division)) {
        return { ...prev, Functional_Divisions: current.filter(d => d !== division) };
      } else {
        return { ...prev, Functional_Divisions: [...current, division] };
      }
    });
  };

  const handleSave = () => {
    console.log('handleSave called with formData:', formData);
    
    if (!formData.Name || formData.Functional_Divisions.length === 0) {
      toast.error('Please fill in Name and select at least one Division');
      return;
    }

    if (editingAssessor) {
      console.log('Updating existing assessor:', editingAssessor.id);
      updateMutation.mutate({ id: editingAssessor.id, data: formData });
    } else {
      console.log('Creating new assessor');
      createMutation.mutate(formData);
    }
  };

  // Stats
  const totalActive = assessors.filter(a => a.Is_Active).length;
  const totalInactive = assessors.filter(a => !a.Is_Active).length;
  const divisionCounts = {
    CID: assessors.filter(a => getAssessorDivisions(a).includes('CID') && a.Is_Active).length,
    SGOD: assessors.filter(a => getAssessorDivisions(a).includes('SGOD') && a.Is_Active).length,
    OSDS: assessors.filter(a => getAssessorDivisions(a).includes('OSDS') && a.Is_Active).length
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1e3a5f]">QAME Assessors</h1>
          <p className="text-slate-600">Manage assessor registry with workload visibility</p>
        </div>
        <Button onClick={openCreateDialog} className="gap-2 bg-[#1e3a5f] hover:bg-[#1e3a5f]/90">
          <Plus className="h-4 w-4" />
          Add Assessor
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <p className="text-sm text-slate-600">Total Active</p>
            <p className="text-2xl font-bold text-[#10b981]">{totalActive}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <p className="text-sm text-slate-600">Total Inactive</p>
            <p className="text-2xl font-bold text-slate-400">{totalInactive}</p>
          </CardContent>
        </Card>
        {DIVISIONS.map(div => (
          <Card key={div} className="shadow-sm">
            <CardContent className="p-4">
              <p className="text-sm text-slate-600">{div} Active</p>
              <p className="text-2xl font-bold text-[#1e3a5f]">{divisionCounts[div]}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Governance Note:</strong> Assessors cannot be deleted if they have historical activity assignments. 
          Deactivate assessors instead by setting Is_Active to false. All changes are audit-logged. 
          Assessors can be assigned to multiple divisions.
        </AlertDescription>
      </Alert>

      {/* Filters */}
      <Card className="shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search assessors..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={divisionFilter} onValueChange={setDivisionFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Division" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Divisions</SelectItem>
                {DIVISIONS.map(d => (
                  <SelectItem key={d} value={d}>{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={activeFilter} onValueChange={setActiveFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Status</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Assessors Table */}
      <Card className="shadow-md">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead className="font-semibold">Name</TableHead>
                  <TableHead className="font-semibold">Divisions</TableHead>
                  <TableHead className="font-semibold">Role</TableHead>
                  <TableHead className="font-semibold text-center">Assigned Activities</TableHead>
                  <TableHead className="font-semibold">Workload Status</TableHead>
                  <TableHead className="font-semibold text-center">Active</TableHead>
                  <TableHead className="font-semibold text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                      Loading assessors...
                    </TableCell>
                  </TableRow>
                ) : filteredAssessors.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                      No assessors found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAssessors.map(assessor => {
                    const workload = getWorkloadStatus(assessor.id);
                    const divisions = getAssessorDivisions(assessor);
                    return (
                      <TableRow key={assessor.id} className={`hover:bg-slate-50 ${!assessor.Is_Active ? 'opacity-60' : ''}`}>
                        <TableCell className="font-medium">{assessor.Name}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {divisions.map(div => (
                              <Badge key={div} variant="outline" className="text-xs">
                                {div}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>{assessor.Role || '-'}</TableCell>
                        <TableCell className="text-center">{getAssignedActivitiesCount(assessor.id)}</TableCell>
                        <TableCell>
                          <Badge className={workload.color}>{workload.label}</Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          {assessor.Is_Active ? (
                            <Badge className="bg-emerald-100 text-emerald-800">Active</Badge>
                          ) : (
                            <Badge className="bg-gray-100 text-gray-800">Inactive</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditDialog(assessor)}>
                              <Edit className="h-4 w-4" />
                            </Button>
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
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingAssessor ? 'Edit Assessor' : 'Add Assessor'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Name <span className="text-red-500">*</span></Label>
              <Input
                value={formData.Name}
                onChange={(e) => setFormData(prev => ({ ...prev, Name: e.target.value }))}
                placeholder="Full name"
              />
            </div>
            <div>
              <Label>Functional Divisions <span className="text-red-500">*</span></Label>
              <p className="text-xs text-slate-500 mb-2">Select one or more divisions</p>
              <div className="flex flex-wrap gap-4">
                {DIVISIONS.map(division => (
                  <div key={division} className="flex items-center space-x-2">
                    <Checkbox
                      id={`division-${division}`}
                      checked={formData.Functional_Divisions?.includes(division)}
                      onCheckedChange={() => handleDivisionToggle(division)}
                    />
                    <Label htmlFor={`division-${division}`} className="cursor-pointer">
                      {division}
                    </Label>
                  </div>
                ))}
              </div>
              {formData.Functional_Divisions?.length === 0 && (
                <p className="text-xs text-red-500 mt-1">At least one division is required</p>
              )}
            </div>
            <div>
              <Label>Role / Designation</Label>
              <Input
                value={formData.Role}
                onChange={(e) => setFormData(prev => ({ ...prev, Role: e.target.value }))}
                placeholder="e.g., SEPS SMME, EPS II SMME, etc."
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Active Status</Label>
              <Switch
                checked={formData.Is_Active}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, Is_Active: checked }))}
              />
            </div>
            {editingAssessor && !formData.Is_Active && formData.Is_Active !== editingAssessor.Is_Active && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Deactivating this assessor will prevent them from being assigned to new activities.
                  This action will be audit-logged.
                </AlertDescription>
              </Alert>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Cancel</Button>
            <Button 
              onClick={handleSave} 
              variant="outline"
              className="text-slate-700 border-slate-300 hover:bg-slate-50"
              disabled={createMutation.isPending || updateMutation.isPending || formData.Functional_Divisions?.length === 0}
            >
              {createMutation.isPending || updateMutation.isPending ? (
                <span className="flex items-center gap-2">
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent"></span>
                  {editingAssessor ? 'Updating...' : 'Adding...'}
                </span>
              ) : (
                <>{editingAssessor ? 'Update' : 'Add'}</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}