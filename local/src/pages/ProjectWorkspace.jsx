import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { logAuditEvent } from '../components/audit/AuditLogger';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger
} from "@/components/ui/collapsible";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import {
  FolderKanban, Package, ClipboardList, Plus, ChevronDown, ChevronRight,
  Edit, Save, X, DollarSign, CheckCircle, ExternalLink, Link2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';

export default function ProjectWorkspace() {
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [editingProject, setEditingProject] = useState(false);
  const [projectForm, setProjectForm] = useState({});
  const [expandedOutputs, setExpandedOutputs] = useState({});
  const [outputDialogOpen, setOutputDialogOpen] = useState(false);
  const [activityDialogOpen, setActivityDialogOpen] = useState(false);
  const [linkActivityDialogOpen, setLinkActivityDialogOpen] = useState(false);
  const [currentOutputId, setCurrentOutputId] = useState(null);
  const [outputForm, setOutputForm] = useState({ Output_Description: '', Output_Category: 'Deliverable', Due_Date: '' });
  const [activityForm, setActivityForm] = useState({ Title: '', Schedule_Start_Date: '', Schedule_End_Date: '', Workflow_Status: 'Draft', Financial_Allocation: 0, Functional_Division: 'CID' });

  const queryClient = useQueryClient();

  // Get projectId from URL if present
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const pid = urlParams.get('project');
    if (pid) setSelectedProjectId(pid);
  }, []);

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => base44.entities.Project.list()
  });

  const { data: outputs = [] } = useQuery({
    queryKey: ['outputs'],
    queryFn: () => base44.entities.ProjectOutputs.list()
  });

  const { data: activities = [] } = useQuery({
    queryKey: ['activities'],
    queryFn: () => base44.entities.DQAMPActivity.list()
  });

  const selectedProject = projects.find(p => p.id === selectedProjectId);
  const projectOutputs = outputs.filter(o => o.Linked_Project === selectedProjectId);

  // Metrics
  const projectActivities = activities.filter(a => a.Linked_Project === selectedProjectId || a.Contributes_To_Output?.some(oid => projectOutputs.some(o => o.id === oid)));
  const completedActivities = projectActivities.filter(a => a.Workflow_Status === 'Published').length;
  const totalBudget = projectActivities.reduce((sum, a) => sum + (a.Financial_Allocation || 0), 0);
  const completionPercent = projectActivities.length > 0 ? Math.round(completedActivities / projectActivities.length * 100) : 0;

  // Mutations
  const updateProjectMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Project.update(id, data),
    onSuccess: async () => {
      await logAuditEvent({ actionType: 'Update', entity: 'Project', recordId: selectedProjectId, remarks: 'Project updated via workspace' });
      queryClient.invalidateQueries(['projects']);
      setEditingProject(false);
    }
  });

  const createOutputMutation = useMutation({
    mutationFn: (data) => base44.entities.ProjectOutputs.create(data),
    onSuccess: async (result) => {
      await logAuditEvent({ actionType: 'Create', entity: 'ProjectOutputs', recordId: result.id, remarks: 'Output created via workspace' });
      queryClient.invalidateQueries(['outputs']);
      setOutputDialogOpen(false);
      setOutputForm({ Output_Description: '', Output_Category: 'Deliverable', Due_Date: '' });
    }
  });

  const createActivityMutation = useMutation({
    mutationFn: (data) => base44.entities.DQAMPActivity.create(data),
    onSuccess: async (result) => {
      await logAuditEvent({ actionType: 'Create', entity: 'DQAMPActivity', recordId: result.id, remarks: 'Activity created via workspace' });
      queryClient.invalidateQueries(['activities']);
      setActivityDialogOpen(false);
      setActivityForm({ Title: '', Schedule_Start_Date: '', Schedule_End_Date: '', Workflow_Status: 'Draft', Financial_Allocation: 0, Functional_Division: selectedProject?.Functional_Division || 'CID' });
    }
  });

  const linkActivityMutation = useMutation({
    mutationFn: ({ id, outputId }) => base44.entities.DQAMPActivity.update(id, { 
      Linked_Project: selectedProjectId,
      Contributes_To_Output: [outputId]
    }),
    onSuccess: async (_, { id }) => {
      await logAuditEvent({ actionType: 'Link_Change', entity: 'DQAMPActivity', recordId: id, remarks: 'Activity linked to output via workspace' });
      queryClient.invalidateQueries(['activities']);
      setLinkActivityDialogOpen(false);
    }
  });

  const handleSelectProject = (pid) => {
    setSelectedProjectId(pid);
    setEditingProject(false);
    const project = projects.find(p => p.id === pid);
    if (project) setProjectForm({ ...project });
  };

  const handleEditProject = () => {
    setProjectForm({ ...selectedProject });
    setEditingProject(true);
  };

  const handleSaveProject = () => {
    updateProjectMutation.mutate({ id: selectedProjectId, data: projectForm });
  };

  const toggleOutput = (outputId) => {
    setExpandedOutputs(prev => ({ ...prev, [outputId]: !prev[outputId] }));
  };

  const openAddOutput = () => {
    setOutputForm({ Output_Description: '', Output_Category: 'Deliverable', Due_Date: '' });
    setOutputDialogOpen(true);
  };

  const openAddActivity = (outputId) => {
    setCurrentOutputId(outputId);
    setActivityForm({ Title: '', Schedule_Start_Date: '', Schedule_End_Date: '', Workflow_Status: 'Draft', Financial_Allocation: 0, Functional_Division: selectedProject?.Functional_Division || 'CID' });
    setActivityDialogOpen(true);
  };

  const openLinkActivity = (outputId) => {
    setCurrentOutputId(outputId);
    setLinkActivityDialogOpen(true);
  };

  const handleLinkActivity = (activityId) => {
    linkActivityMutation.mutate({ id: activityId, outputId: currentOutputId });
  };

  // Get unlinked activities for the current project (no output assigned)
  const getUnlinkedActivities = () => activities.filter(a => 
    (a.Linked_Project === selectedProjectId || !a.Linked_Project) && 
    (!a.Contributes_To_Output || a.Contributes_To_Output.length === 0)
  );

  const handleCreateOutput = () => {
    if (!outputForm.Output_Description) return;
    createOutputMutation.mutate({ ...outputForm, Linked_Project: selectedProjectId });
  };

  const handleCreateActivity = () => {
    if (!activityForm.Title) return;
    createActivityMutation.mutate({
      ...activityForm,
      Linked_Project: selectedProjectId,
      Contributes_To_Output: currentOutputId ? [currentOutputId] : []
    });
  };

  const getOutputActivities = (outputId) => activities.filter(a => a.Contributes_To_Output?.includes(outputId));

  const statusColors = { 'Draft': 'bg-gray-100 text-gray-800', 'Submitted': 'bg-blue-100 text-blue-800', 'Under Review': 'bg-amber-100 text-amber-800', 'Published': 'bg-emerald-100 text-emerald-800' };
  const verificationColors = { 'Pending': 'bg-gray-100 text-gray-800', 'Verified': 'bg-emerald-100 text-emerald-800', 'Not Achieved': 'bg-red-100 text-red-800' };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1e3a5f] flex items-center gap-2">
            <FolderKanban className="h-6 w-6" />
            Project Workspace
          </h1>
          <p className="text-slate-600">Project-centric view with outputs and activities</p>
        </div>
      </div>

      {/* Project Selector */}
      <Card className="shadow-sm">
        <CardContent className="p-4">
          <Label>Select Project</Label>
          <Select value={selectedProjectId || ''} onValueChange={handleSelectProject}>
            <SelectTrigger className="w-full md:w-96 mt-1">
              <SelectValue placeholder="Choose a project..." />
            </SelectTrigger>
            <SelectContent>
              {projects.map(p => (
                <SelectItem key={p.id} value={p.id}>{p.Project_Code} - {p.Project_Title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedProject && (
        <>
          {/* Project Header */}
          <Card className="shadow-md">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg">Project Details</CardTitle>
              {!editingProject ? (
                <Button variant="outline" size="sm" onClick={handleEditProject}>
                  <Edit className="h-4 w-4 mr-1" /> Edit
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setEditingProject(false)}>
                    <X className="h-4 w-4 mr-1" /> Cancel
                  </Button>
                  <Button size="sm" onClick={handleSaveProject} className="bg-[#1e3a5f] hover:bg-[#1e3a5f]/90">
                    <Save className="h-4 w-4 mr-1" /> Save
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent>
              {editingProject ? (
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Project Code</Label>
                    <Input value={projectForm.Project_Code || ''} onChange={(e) => setProjectForm(prev => ({ ...prev, Project_Code: e.target.value }))} />
                  </div>
                  <div>
                    <Label>Project Title</Label>
                    <Input value={projectForm.Project_Title || ''} onChange={(e) => setProjectForm(prev => ({ ...prev, Project_Title: e.target.value }))} />
                  </div>
                  <div>
                    <Label>Division</Label>
                    <Select value={projectForm.Functional_Division || ''} onValueChange={(v) => setProjectForm(prev => ({ ...prev, Functional_Division: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CID">CID</SelectItem>
                        <SelectItem value="SGOD">SGOD</SelectItem>
                        <SelectItem value="OSDS">OSDS</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Status</Label>
                    <Select value={projectForm.Project_Status || ''} onValueChange={(v) => setProjectForm(prev => ({ ...prev, Project_Status: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Planning">Planning</SelectItem>
                        <SelectItem value="Ongoing">Ongoing</SelectItem>
                        <SelectItem value="Completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Start Date</Label>
                    <Input type="date" value={projectForm.Project_Start_Date || ''} onChange={(e) => setProjectForm(prev => ({ ...prev, Project_Start_Date: e.target.value }))} />
                  </div>
                  <div>
                    <Label>End Date</Label>
                    <Input type="date" value={projectForm.Project_End_Date || ''} onChange={(e) => setProjectForm(prev => ({ ...prev, Project_End_Date: e.target.value }))} />
                  </div>
                  <div className="md:col-span-2">
                    <Label>Description</Label>
                    <Textarea value={projectForm.Project_Description || ''} onChange={(e) => setProjectForm(prev => ({ ...prev, Project_Description: e.target.value }))} rows={2} />
                  </div>
                </div>
              ) : (
                <div className="grid md:grid-cols-3 gap-4">
                  <div><span className="text-sm text-slate-500">Code:</span> <span className="font-medium">{selectedProject.Project_Code}</span></div>
                  <div><span className="text-sm text-slate-500">Title:</span> <span className="font-medium">{selectedProject.Project_Title}</span></div>
                  <div><span className="text-sm text-slate-500">Division:</span> <Badge variant="outline">{selectedProject.Functional_Division}</Badge></div>
                  <div><span className="text-sm text-slate-500">Status:</span> <Badge className={selectedProject.Project_Status === 'Completed' ? 'bg-emerald-100 text-emerald-800' : selectedProject.Project_Status === 'Ongoing' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}>{selectedProject.Project_Status}</Badge></div>
                  <div><span className="text-sm text-slate-500">Start:</span> {selectedProject.Project_Start_Date || '-'}</div>
                  <div><span className="text-sm text-slate-500">End:</span> {selectedProject.Project_End_Date || '-'}</div>
                  {selectedProject.Project_Description && <div className="md:col-span-3"><span className="text-sm text-slate-500">Description:</span> {selectedProject.Project_Description}</div>}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="shadow-sm">
              <CardContent className="p-4 flex items-center gap-3">
                <Package className="h-8 w-8 text-[#1E3A5F]" />
                <div>
                  <p className="text-2xl font-bold">{projectOutputs.length}</p>
                  <p className="text-xs text-slate-500">Total Outputs</p>
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardContent className="p-4 flex items-center gap-3">
                <ClipboardList className="h-8 w-8 text-[#1e3a5f]" />
                <div>
                  <p className="text-2xl font-bold">{projectActivities.length}</p>
                  <p className="text-xs text-slate-500">Total Activities</p>
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardContent className="p-4 flex items-center gap-3">
                <CheckCircle className="h-8 w-8 text-emerald-500" />
                <div>
                  <p className="text-2xl font-bold">{completionPercent}%</p>
                  <p className="text-xs text-slate-500">Completed</p>
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardContent className="p-4 flex items-center gap-3">
                <DollarSign className="h-8 w-8 text-amber-500" />
                <div>
                  <p className="text-2xl font-bold">₱{totalBudget.toLocaleString()}</p>
                  <p className="text-xs text-slate-500">Budget</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Outputs Section */}
          <Card className="shadow-md">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Package className="h-5 w-5 text-[#1E3A5F]" />
                Outputs
              </CardTitle>
              <Button size="sm" onClick={openAddOutput} className="gap-1 bg-[#1E3A5F] hover:bg-[#1E3A5F]/90">
                <Plus className="h-4 w-4" /> Add Output
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {projectOutputs.length === 0 ? (
                <p className="text-center text-slate-500 py-6">No outputs yet. Click "Add Output" to create one.</p>
              ) : (
                projectOutputs.map(output => {
                  const outputActivities = getOutputActivities(output.id);
                  const isExpanded = expandedOutputs[output.id];
                  return (
                    <Collapsible key={output.id} open={isExpanded} onOpenChange={() => toggleOutput(output.id)}>
                      <div className="border rounded-lg">
                        <div className="w-full p-3 flex items-center justify-between hover:bg-slate-50">
                          <CollapsibleTrigger className="flex items-center gap-3 flex-1">
                            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                            <span className="font-medium text-left">{output.Output_Description}</span>
                            <Badge variant="outline">{output.Output_Category}</Badge>
                            <Badge className={verificationColors[output.Output_Verification_Status]}>{output.Output_Verification_Status}</Badge>
                          </CollapsibleTrigger>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-slate-500">{outputActivities.length} activities</span>
                            <Link to={createPageUrl(`OutputDetail?id=${output.id}`)}>
                              <Button aria-label="Open link" variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => e.stopPropagation()}>
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            </Link>
                          </div>
                        </div>
                        <CollapsibleContent>
                          <div className="border-t p-3 bg-slate-50">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-sm font-medium">Activities</span>
                              <div className="flex gap-2">
                                <Button size="sm" variant="outline" onClick={() => openLinkActivity(output.id)} className="gap-1">
                                  <Link2 className="h-3 w-3" /> Link Existing
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => openAddActivity(output.id)} className="gap-1">
                                  <Plus className="h-3 w-3" /> Create New
                                </Button>
                              </div>
                            </div>
                            {outputActivities.length === 0 ? (
                              <p className="text-sm text-slate-500 text-center py-2">No activities linked to this output.</p>
                            ) : (
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Title</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Schedule</TableHead>
                                    <TableHead>Budget</TableHead>
                                    <TableHead></TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {outputActivities.map(act => (
                                    <TableRow key={act.id}>
                                      <TableCell className="font-medium">{act.Title}</TableCell>
                                      <TableCell><Badge className={statusColors[act.Workflow_Status]}>{act.Workflow_Status}</Badge></TableCell>
                                      <TableCell className="text-sm">{act.Schedule_Start_Date || '-'}</TableCell>
                                      <TableCell>₱{(act.Financial_Allocation || 0).toLocaleString()}</TableCell>
                                      <TableCell>
                                        <Link to={createPageUrl(`Activities?id=${act.id}`)}>
                                          <Button aria-label="Open link" variant="ghost" size="icon"><ExternalLink className="h-4 w-4" /></Button>
                                        </Link>
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            )}
                          </div>
                        </CollapsibleContent>
                      </div>
                    </Collapsible>
                  );
                })
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Add Output Dialog */}
      <Dialog open={outputDialogOpen} onOpenChange={setOutputDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Output</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Output Description <span className="text-red-500">*</span></Label>
              <Textarea value={outputForm.Output_Description} onChange={(e) => setOutputForm(prev => ({ ...prev, Output_Description: e.target.value }))} rows={2} />
            </div>
            <div>
              <Label>Category</Label>
              <Select value={outputForm.Output_Category} onValueChange={(v) => setOutputForm(prev => ({ ...prev, Output_Category: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
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
              <Input type="date" value={outputForm.Due_Date} onChange={(e) => setOutputForm(prev => ({ ...prev, Due_Date: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOutputDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateOutput} className="bg-[#1E3A5F] hover:bg-[#1E3A5F]/90">Create Output</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Activity Dialog */}
      <Dialog open={activityDialogOpen} onOpenChange={setActivityDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create New Activity</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Activity Title <span className="text-red-500">*</span></Label>
              <Input value={activityForm.Title} onChange={(e) => setActivityForm(prev => ({ ...prev, Title: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Start Date</Label>
                <Input type="date" value={activityForm.Schedule_Start_Date} onChange={(e) => setActivityForm(prev => ({ ...prev, Schedule_Start_Date: e.target.value }))} />
              </div>
              <div>
                <Label>End Date</Label>
                <Input type="date" value={activityForm.Schedule_End_Date} onChange={(e) => setActivityForm(prev => ({ ...prev, Schedule_End_Date: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Status</Label>
                <Select value={activityForm.Workflow_Status} onValueChange={(v) => setActivityForm(prev => ({ ...prev, Workflow_Status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Draft">Draft</SelectItem>
                    <SelectItem value="Submitted">Submitted</SelectItem>
                    <SelectItem value="Under Review">Under Review</SelectItem>
                    <SelectItem value="Published">Published</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Budget (₱)</Label>
                <Input type="number" value={activityForm.Financial_Allocation} onChange={(e) => setActivityForm(prev => ({ ...prev, Financial_Allocation: parseFloat(e.target.value) || 0 }))} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActivityDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateActivity} className="bg-[#1e3a5f] hover:bg-[#1e3a5f]/90">Create Activity</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Link Existing Activity Dialog */}
      <Dialog open={linkActivityDialogOpen} onOpenChange={setLinkActivityDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Link Existing Activity</DialogTitle></DialogHeader>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {getUnlinkedActivities().length === 0 ? (
              <p className="text-center text-slate-500 py-4">No unlinked activities available.</p>
            ) : (
              getUnlinkedActivities().map(act => (
                <div key={act.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50">
                  <div>
                    <p className="font-medium">{act.Title}</p>
                    <div className="flex gap-2 mt-1">
                      <Badge className={statusColors[act.Workflow_Status]}>{act.Workflow_Status}</Badge>
                      <span className="text-xs text-slate-500">₱{(act.Financial_Allocation || 0).toLocaleString()}</span>
                    </div>
                  </div>
                  <Button size="sm" onClick={() => handleLinkActivity(act.id)} className="bg-[#1E3A5F] hover:bg-[#1E3A5F]/90">
                    <Link2 className="h-4 w-4 mr-1" /> Link
                  </Button>
                </div>
              ))
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLinkActivityDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}