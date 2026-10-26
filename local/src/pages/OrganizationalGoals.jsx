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
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import {
  Tabs, TabsContent, TabsList, TabsTrigger
} from "@/components/ui/tabs";
import { Plus, Search, Edit, Flag, FolderKanban, Target, Package } from 'lucide-react';

export default function OrganizationalGoals() {
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [formData, setFormData] = useState({
    Goal_Title: '',
    Description: '',
    Target_Year: '2026',
    Priority_Level: 'Medium',
    Linked_Projects: [],
    Linked_Objectives: [],
    Linked_Outputs: [],
    Is_Active: true
  });

  const queryClient = useQueryClient();

  const { data: goals = [], isLoading } = useQuery({
    queryKey: ['goals'],
    queryFn: () => base44.entities.OrganizationalGoal.list('-created_date')
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => base44.entities.Project.list()
  });

  const { data: objectives = [] } = useQuery({
    queryKey: ['division-objectives-all'],
    queryFn: () => base44.entities.DivisionObjective.list()
  });

  const { data: outputs = [] } = useQuery({
    queryKey: ['outputs'],
    queryFn: () => base44.entities.ProjectOutputs.list()
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.OrganizationalGoal.create(data),
    onSuccess: async (result) => {
      await logAuditEvent({
        actionType: 'Create',
        entity: 'OrganizationalGoal',
        recordId: result.id,
        remarks: `Created goal: ${formData.Goal_Title}`,
        newValues: formData
      });
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      closeDialog();
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.OrganizationalGoal.update(id, data),
    onSuccess: async () => {
      await logAuditEvent({
        actionType: 'Update',
        entity: 'OrganizationalGoal',
        recordId: editingGoal.id,
        remarks: `Updated goal: ${formData.Goal_Title}`,
        previousValues: editingGoal,
        newValues: formData
      });
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      closeDialog();
    }
  });

  const filteredGoals = goals.filter(g =>
    g.Goal_Title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openCreateDialog = () => {
    setEditingGoal(null);
    setFormData({
      Goal_Title: '',
      Description: '',
      Target_Year: '2026',
      Priority_Level: 'Medium',
      Linked_Projects: [],
      Linked_Objectives: [],
      Linked_Outputs: [],
      Is_Active: true
    });
    setDialogOpen(true);
  };

  const openEditDialog = (goal) => {
    setEditingGoal(goal);
    // Canonicalize: accept either field name stored on the record
    const linkedObjs = goal.Linked_Objectives?.length
      ? goal.Linked_Objectives
      : (goal.Linked_Division_Objectives || []);
    setFormData({
      Goal_Title: goal.Goal_Title || '',
      Description: goal.Description || '',
      Target_Year: goal.Target_Year || '2026',
      Priority_Level: goal.Priority_Level || 'Medium',
      Linked_Projects: goal.Linked_Projects || [],
      Linked_Objectives: linkedObjs,
      Linked_Outputs: goal.Linked_Outputs || [],
      Is_Active: goal.Is_Active ?? true
    });
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingGoal(null);
  };

  const syncReverseObjectiveLinks = async (goalId, prevLinked, nextLinked) => {
    const prev = prevLinked || [];
    const next = nextLinked || [];
    const added = next.filter(id => !prev.includes(id));
    const removed = prev.filter(id => !next.includes(id));
    for (const objId of added) {
      const obj = objectives.find(o => o.id === objId);
      if (!obj) continue;
      const existing = obj.Linked_Organizational_Goals || [];
      if (!existing.includes(goalId)) {
        await base44.entities.DivisionObjective.update(objId, {
          Linked_Organizational_Goals: [...existing, goalId]
        });
      }
    }
    for (const objId of removed) {
      const obj = objectives.find(o => o.id === objId);
      if (!obj) continue;
      const updated = (obj.Linked_Organizational_Goals || []).filter(id => id !== goalId);
      await base44.entities.DivisionObjective.update(objId, {
        Linked_Organizational_Goals: updated
      });
    }
  };

  const handleSave = () => {
    if (!formData.Goal_Title) return;
    // Canonicalize: always save as Linked_Objectives, clear alias field
    const canonicalData = { ...formData, Linked_Division_Objectives: formData.Linked_Objectives };
    if (editingGoal) {
      const prevLinked = editingGoal.Linked_Objectives?.length
        ? editingGoal.Linked_Objectives
        : (editingGoal.Linked_Division_Objectives || []);
      updateMutation.mutate(
        { id: editingGoal.id, data: canonicalData },
        { onSuccess: () => syncReverseObjectiveLinks(editingGoal.id, prevLinked, formData.Linked_Objectives) }
      );
    } else {
      createMutation.mutate(canonicalData, {
        onSuccess: (result) => syncReverseObjectiveLinks(result.id, [], formData.Linked_Objectives)
      });
    }
  };

  const toggleProject = (projectId) => {
    setFormData(prev => ({
      ...prev,
      Linked_Projects: prev.Linked_Projects.includes(projectId)
        ? prev.Linked_Projects.filter(id => id !== projectId)
        : [...prev.Linked_Projects, projectId]
    }));
  };

  const toggleObjective = (objectiveId) => {
    setFormData(prev => ({
      ...prev,
      Linked_Objectives: prev.Linked_Objectives.includes(objectiveId)
        ? prev.Linked_Objectives.filter(id => id !== objectiveId)
        : [...prev.Linked_Objectives, objectiveId]
    }));
  };

  const toggleOutput = (outputId) => {
    setFormData(prev => ({
      ...prev,
      Linked_Outputs: prev.Linked_Outputs.includes(outputId)
        ? prev.Linked_Outputs.filter(id => id !== outputId)
        : [...prev.Linked_Outputs, outputId]
    }));
  };

  const getProjectCode = (id) => projects.find(p => p.id === id)?.Project_Code || '-';

  const priorityColors = {
    'High': 'bg-red-100 text-red-800',
    'Medium': 'bg-amber-100 text-amber-800',
    'Low': 'bg-blue-100 text-blue-800'
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#003DA5] flex items-center gap-2">
            <Flag className="h-6 w-6" />
            Organizational Goals
          </h1>
          <p className="text-slate-600">Manage strategic goals with project, objective, and output linkages</p>
        </div>
        <Button onClick={openCreateDialog} className="gap-2 bg-[#003DA5] hover:bg-[#003DA5]/90">
          <Plus className="h-4 w-4" />
          New Goal
        </Button>
      </div>

      {/* Filters */}
      <Card className="shadow-sm">
        <CardContent className="p-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search goals..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* Goals Table */}
      <Card className="shadow-md">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead className="font-semibold">Goal Title</TableHead>
                  <TableHead className="font-semibold">Target Year</TableHead>
                  <TableHead className="font-semibold">Priority</TableHead>
                  <TableHead className="font-semibold text-center">Projects</TableHead>
                  <TableHead className="font-semibold text-center">Objectives</TableHead>
                  <TableHead className="font-semibold text-center">Outputs</TableHead>
                  <TableHead className="font-semibold text-center">Status</TableHead>
                  <TableHead className="font-semibold text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-slate-500">Loading...</TableCell>
                  </TableRow>
                ) : filteredGoals.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-slate-500">No goals found.</TableCell>
                  </TableRow>
                ) : (
                  filteredGoals.map(goal => (
                    <TableRow key={goal.id} className="hover:bg-slate-50">
                      <TableCell className="font-medium max-w-xs truncate">{goal.Goal_Title}</TableCell>
                      <TableCell>{goal.Target_Year || '-'}</TableCell>
                      <TableCell>
                        <Badge className={priorityColors[goal.Priority_Level]}>{goal.Priority_Level}</Badge>
                      </TableCell>
                      <TableCell className="text-center">{goal.Linked_Projects?.length || 0}</TableCell>
                      <TableCell className="text-center">{(goal.Linked_Objectives?.length || goal.Linked_Division_Objectives?.length || 0)}</TableCell>
                      <TableCell className="text-center">{goal.Linked_Outputs?.length || 0}</TableCell>
                      <TableCell className="text-center">
                        <Badge className={goal.Is_Active ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-800'}>
                          {goal.Is_Active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(goal)}>
                          <Edit className="h-4 w-4" />
                        </Button>
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingGoal ? 'Edit Goal' : 'New Organizational Goal'}</DialogTitle>
          </DialogHeader>
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-4">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="projects">Projects ({formData.Linked_Projects.length})</TabsTrigger>
              <TabsTrigger value="objectives">Objectives ({formData.Linked_Objectives.length})</TabsTrigger>
              <TabsTrigger value="outputs">Outputs ({formData.Linked_Outputs.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-4">
              <div>
                <Label>Goal Title <span className="text-red-500">*</span></Label>
                <Input
                  value={formData.Goal_Title}
                  onChange={(e) => setFormData(prev => ({ ...prev, Goal_Title: e.target.value }))}
                  placeholder="Goal title"
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={formData.Description}
                  onChange={(e) => setFormData(prev => ({ ...prev, Description: e.target.value }))}
                  rows={3}
                  placeholder="Goal description"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Target Year</Label>
                  <Select value={formData.Target_Year} onValueChange={(v) => setFormData(prev => ({ ...prev, Target_Year: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2025">2025</SelectItem>
                      <SelectItem value="2026">2026</SelectItem>
                      <SelectItem value="2027">2027</SelectItem>
                      <SelectItem value="2028">2028</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Priority Level</Label>
                  <Select value={formData.Priority_Level} onValueChange={(v) => setFormData(prev => ({ ...prev, Priority_Level: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="High">High</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="Low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <Label>Active Status</Label>
                <Switch checked={formData.Is_Active} onCheckedChange={(v) => setFormData(prev => ({ ...prev, Is_Active: v }))} />
              </div>
            </TabsContent>

            <TabsContent value="projects" className="space-y-2 max-h-64 overflow-y-auto">
              <p className="text-sm text-slate-500 mb-2">Select projects linked to this goal</p>
              {projects.map(p => (
                <div key={p.id} className="flex items-center gap-3 p-2 bg-slate-50 rounded-lg">
                  <Checkbox
                    checked={formData.Linked_Projects.includes(p.id)}
                    onCheckedChange={() => toggleProject(p.id)}
                  />
                  <FolderKanban className="h-4 w-4 text-[#003DA5]" />
                  <span className="text-sm flex-1">{p.Project_Code} - {p.Project_Title}</span>
                  <Badge variant="outline">{p.Functional_Division}</Badge>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="objectives" className="space-y-2">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-slate-500">
                  Available: <strong>{objectives.length}</strong> &nbsp;|&nbsp; Linked: <strong>{formData.Linked_Objectives.length}</strong>
                </p>
                {objectives.length > 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => {
                      if (window.confirm(`Link all ${objectives.length} objectives to this goal?`)) {
                        setFormData(prev => ({ ...prev, Linked_Objectives: objectives.map(o => o.id) }));
                      }
                    }}
                  >
                    Link All
                  </Button>
                )}
              </div>
              {objectives.length === 0 && (
                <p className="text-sm text-slate-400 py-4 text-center">No objectives found.</p>
              )}
              <div className="max-h-64 overflow-y-auto space-y-1">
              {objectives.map(o => (
                <div key={o.id} className="flex items-center gap-3 p-2 bg-slate-50 rounded-lg">
                  <Checkbox
                    checked={formData.Linked_Objectives.includes(o.id)}
                    onCheckedChange={() => toggleObjective(o.id)}
                  />
                  <Target className="h-4 w-4 text-[#0d9488] flex-shrink-0" />
                  <span className="text-sm flex-1 truncate">
                    {o.Objective_Code ? <span className="font-mono text-xs text-slate-500 mr-1">[{o.Objective_Code}]</span> : null}
                    {o.Objective_Title || o.Objective_Description || o.Objective_Statement || o.id}
                  </span>
                  <Badge variant="outline">{o.Functional_Division || '-'}</Badge>
                </div>
              ))}
              </div>
            </TabsContent>

            <TabsContent value="outputs" className="space-y-2 max-h-64 overflow-y-auto">
              <p className="text-sm text-slate-500 mb-2">Select outputs linked to this goal</p>
              {outputs.map(o => (
                <div key={o.id} className="flex items-center gap-3 p-2 bg-slate-50 rounded-lg">
                  <Checkbox
                    checked={formData.Linked_Outputs.includes(o.id)}
                    onCheckedChange={() => toggleOutput(o.id)}
                  />
                  <Package className="h-4 w-4 text-amber-500" />
                  <span className="text-sm flex-1 truncate">{o.Output_Description}</span>
                  <Badge variant="outline">{getProjectCode(o.Linked_Project)}</Badge>
                </div>
              ))}
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={closeDialog}>Cancel</Button>
            <Button onClick={handleSave} className="bg-[#003DA5] hover:bg-[#003DA5]/90" disabled={createMutation.isPending || updateMutation.isPending}>
              {editingGoal ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}