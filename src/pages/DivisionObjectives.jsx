import React, { useState } from 'react';
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Search, Edit, Trash2, Target } from 'lucide-react';

const DIVISIONS = ['CID', 'SGOD', 'OSDS'];
const STATUSES = ['Not Started', 'In Progress', 'On Track', 'At Risk', 'Achieved', 'Not Achieved'];

const EMPTY_FORM = {
  Objective_Code: '',
  Objective_Title: '',
  Description: '',
  Functional_Division: '',
  Target_Year: new Date().getFullYear(),
  Quarter: '',
  Status: 'Not Started',
  Owner: '',
  Target_Value: '',
  Current_Progress: 0,
};

const statusColors = {
  'Not Started': 'bg-gray-100 text-gray-800',
  'In Progress': 'bg-blue-100 text-blue-800',
  'On Track': 'bg-emerald-100 text-emerald-800',
  'At Risk': 'bg-amber-100 text-amber-800',
  'Achieved': 'bg-green-100 text-green-800',
  'Not Achieved': 'bg-red-100 text-red-800',
};

export default function DivisionObjectives() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [divisionFilter, setDivisionFilter] = useState('All');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingObjective, setEditingObjective] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);

  const { data: objectives = [], isLoading } = useQuery({
    queryKey: ['division-objectives-all'],
    queryFn: () => base44.entities.DivisionObjective.list('-created_date'),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.DivisionObjective.create(data),
    onSuccess: async (result) => {
      await logAuditEvent({ actionType: 'Create', entity: 'DivisionObjective', recordId: result.id, remarks: `Created: ${formData.Objective_Title}` });
      queryClient.invalidateQueries({ queryKey: ['division-objectives-all'] });
      toast.success('Division Objective created!');
      closeDialog();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.DivisionObjective.update(id, data),
    onSuccess: async () => {
      await logAuditEvent({ actionType: 'Update', entity: 'DivisionObjective', recordId: editingObjective.id, remarks: `Updated: ${formData.Objective_Title}` });
      queryClient.invalidateQueries({ queryKey: ['division-objectives-all'] });
      toast.success('Division Objective updated!');
      closeDialog();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.DivisionObjective.delete(id),
    onSuccess: async (_, id) => {
      await logAuditEvent({ actionType: 'Delete', entity: 'DivisionObjective', recordId: id, remarks: 'Deleted objective' });
      queryClient.invalidateQueries({ queryKey: ['division-objectives-all'] });
      toast.success('Division Objective deleted.');
    },
  });

  const openCreate = () => {
    setEditingObjective(null);
    setFormData(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (obj) => {
    setEditingObjective(obj);
    setFormData({
      Objective_Code: obj.Objective_Code || '',
      Objective_Title: obj.Objective_Title || '',
      Description: obj.Description || '',
      Functional_Division: obj.Functional_Division || '',
      Target_Year: obj.Target_Year || new Date().getFullYear(),
      Quarter: obj.Quarter || '',
      Status: obj.Status || 'Not Started',
      Owner: obj.Owner || '',
      Target_Value: obj.Target_Value || '',
      Current_Progress: obj.Current_Progress || 0,
    });
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingObjective(null);
  };

  const handleSave = () => {
    if (!formData.Objective_Title || !formData.Functional_Division) {
      toast.error('Objective Title and Division are required.');
      return;
    }
    if (editingObjective) {
      updateMutation.mutate({ id: editingObjective.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const filtered = objectives.filter((o) => {
    const matchSearch =
      o.Objective_Title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.Objective_Code?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchDiv = divisionFilter === 'All' || o.Functional_Division === divisionFilter;
    return matchSearch && matchDiv;
  });

  const inp = (field) => ({
    value: formData[field],
    onChange: (e) => setFormData((p) => ({ ...p, [field]: e.target.value })),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#003DA5] flex items-center gap-2">
            <Target className="h-6 w-6" />
            Division Objectives
          </h1>
          <p className="text-slate-600">Manage functional division objectives ({objectives.length} total)</p>
        </div>
        <Button onClick={openCreate} className="gap-2 bg-[#003DA5] hover:bg-[#003DA5]/90">
          <Plus className="h-4 w-4" />New Objective
        </Button>
      </div>

      {/* Filters */}
      <Card className="shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-[200px] relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input placeholder="Search by code or title..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" />
            </div>
            <Select value={divisionFilter} onValueChange={setDivisionFilter}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="Division" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Divisions</SelectItem>
                {DIVISIONS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="shadow-md">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead className="font-semibold">Code</TableHead>
                  <TableHead className="font-semibold">Objective Title</TableHead>
                  <TableHead className="font-semibold">Division</TableHead>
                  <TableHead className="font-semibold">Year</TableHead>
                  <TableHead className="font-semibold">Owner</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-slate-500">Loading...</TableCell></TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-slate-500">No division objectives found.</TableCell></TableRow>
                ) : (
                  filtered.map((obj) => (
                    <TableRow key={obj.id} className="hover:bg-slate-50">
                      <TableCell className="font-mono text-sm font-medium text-[#003DA5]">{obj.Objective_Code || '-'}</TableCell>
                      <TableCell className="max-w-sm truncate font-medium">{obj.Objective_Title}</TableCell>
                      <TableCell><Badge variant="outline">{obj.Functional_Division}</Badge></TableCell>
                      <TableCell>{obj.Target_Year || '-'}</TableCell>
                      <TableCell className="text-slate-600 text-sm">{obj.Owner || '-'}</TableCell>
                      <TableCell>
                        <Badge className={statusColors[obj.Status] || statusColors['Not Started']}>{obj.Status || 'Not Started'}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(obj)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-700"
                            onClick={() => window.confirm('Delete this objective?') && deleteMutation.mutate(obj.id)}
                            disabled={deleteMutation.isPending}
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
      <Dialog open={dialogOpen} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingObjective ? 'Edit Division Objective' : 'New Division Objective'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Objective Code</Label>
                <Input {...inp('Objective_Code')} placeholder="e.g. CID-01" />
              </div>
              <div>
                <Label>Functional Division <span className="text-red-500">*</span></Label>
                <Select value={formData.Functional_Division} onValueChange={(v) => setFormData((p) => ({ ...p, Functional_Division: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select division" /></SelectTrigger>
                  <SelectContent>{DIVISIONS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Objective Title <span className="text-red-500">*</span></Label>
              <Input {...inp('Objective_Title')} placeholder="Objective title" />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea {...inp('Description')} rows={3} placeholder="Detailed description" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Target Year</Label>
                <Input type="number" {...inp('Target_Year')} placeholder="2026" />
              </div>
              <div>
                <Label>Quarter</Label>
                <Select value={formData.Quarter} onValueChange={(v) => setFormData((p) => ({ ...p, Quarter: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select quarter" /></SelectTrigger>
                  <SelectContent>
                    {['Q1','Q2','Q3','Q4'].map((q) => <SelectItem key={q} value={q}>{q}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Status</Label>
                <Select value={formData.Status} onValueChange={(v) => setFormData((p) => ({ ...p, Status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Progress (%)</Label>
                <Input type="number" min="0" max="100" value={formData.Current_Progress} onChange={(e) => setFormData((p) => ({ ...p, Current_Progress: parseFloat(e.target.value) || 0 }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Owner</Label>
                <Input {...inp('Owner')} placeholder="Responsible person" />
              </div>
              <div>
                <Label>Target Value</Label>
                <Input {...inp('Target_Value')} placeholder="e.g. 100%" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Cancel</Button>
            <Button onClick={handleSave} className="bg-[#003DA5] hover:bg-[#003DA5]/90" disabled={createMutation.isPending || updateMutation.isPending}>
              {createMutation.isPending || updateMutation.isPending ? 'Saving...' : editingObjective ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}