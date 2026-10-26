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
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { Package, ArrowLeft, Edit, Save, X, ClipboardList, ExternalLink, Paperclip, FileText, Trash2, Download } from 'lucide-react';
import { Link } from 'react-router-dom';
import OneDriveLinkInput from '@/components/ui/OneDriveLinkInput';
import { createPageUrl } from '../utils';

export default function OutputDetail() {
  const [outputId, setOutputId] = useState(null);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({});

  const queryClient = useQueryClient();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');
    if (id) setOutputId(id);
  }, []);

  const { data: output, isLoading } = useQuery({
    queryKey: ['output', outputId],
    queryFn: () => base44.entities.ProjectOutputs.list().then(list => list.find(o => o.id === outputId)),
    enabled: !!outputId
  });

  const { data: activities = [] } = useQuery({
    queryKey: ['activities'],
    queryFn: () => base44.entities.DQAMPActivity.list()
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => base44.entities.Project.list()
  });

  const linkedActivities = activities.filter(a => a.Contributes_To_Output?.includes(outputId));
  const linkedProject = projects.find(p => p.id === output?.Linked_Project);

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.ProjectOutputs.update(outputId, data),
    onSuccess: async () => {
      await logAuditEvent({ actionType: 'Update', entity: 'ProjectOutputs', recordId: outputId, remarks: 'Output updated via detail page' });
      queryClient.invalidateQueries(['output', outputId]);
      setEditing(false);
    }
  });

  const handleEdit = () => {
    setFormData({ ...output });
    setEditing(true);
  };

  const handleSave = () => {
    updateMutation.mutate(formData);
  };

  const handleEvidenceLink = async (url) => {
    setFormData(prev => ({
      ...prev,
      Evidence_Attachments: [...(prev.Evidence_Attachments || []), url]
    }));
    await logAuditEvent({
      actionType: 'Upload',
      entity: 'ProjectOutputs',
      recordId: outputId,
      remarks: `Linked evidence attachment`
    });
  };

  const handleRemoveEvidence = (index) => {
    setFormData(prev => ({
      ...prev,
      Evidence_Attachments: prev.Evidence_Attachments.filter((_, i) => i !== index)
    }));
  };

  const statusColors = { 'Draft': 'bg-gray-100 text-gray-800', 'Submitted': 'bg-blue-100 text-blue-800', 'Under Review': 'bg-amber-100 text-amber-800', 'Published': 'bg-emerald-100 text-emerald-800' };
  const verificationColors = { 'Pending': 'bg-gray-100 text-gray-800', 'Verified': 'bg-emerald-100 text-emerald-800', 'Not Achieved': 'bg-red-100 text-red-800' };

  if (isLoading || !output) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-slate-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to={createPageUrl(`ProjectWorkspace?project=${output.Linked_Project}`)}>
          <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 mr-1" /> Back to Project</Button>
        </Link>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1B2A8F] flex items-center gap-2">
            <Package className="h-6 w-6" />
            Output Detail
          </h1>
          <p className="text-slate-600">{linkedProject?.Project_Code} - {linkedProject?.Project_Title}</p>
        </div>
        <Badge className={verificationColors[output.Output_Verification_Status]}>{output.Output_Verification_Status}</Badge>
      </div>

      {/* Output Header Form */}
      <Card className="shadow-md">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg">Output Information</CardTitle>
          {!editing ? (
            <Button variant="outline" size="sm" onClick={handleEdit}>
              <Edit className="h-4 w-4 mr-1" /> Edit
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setEditing(false)}>
                <X className="h-4 w-4 mr-1" /> Cancel
              </Button>
              <Button size="sm" onClick={handleSave} className="bg-[#1B2A8F] hover:bg-[#1B2A8F]/90">
                <Save className="h-4 w-4 mr-1" /> Save
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent>
          {editing ? (
            <div className="grid md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label>Output Statement</Label>
                <Textarea value={formData.Output_Description || ''} onChange={(e) => setFormData(prev => ({ ...prev, Output_Description: e.target.value }))} rows={2} />
              </div>
              <div>
                <Label>Category</Label>
                <Select value={formData.Output_Category || ''} onValueChange={(v) => setFormData(prev => ({ ...prev, Output_Category: v }))}>
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
                <Input type="date" value={formData.Due_Date || ''} onChange={(e) => setFormData(prev => ({ ...prev, Due_Date: e.target.value }))} />
              </div>
              <div>
                <Label>Verification Status</Label>
                <Select value={formData.Output_Verification_Status || ''} onValueChange={(v) => setFormData(prev => ({ ...prev, Output_Verification_Status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Verified">Verified</SelectItem>
                    <SelectItem value="Not Achieved">Not Achieved</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Evidence Attachments */}
              <div className="md:col-span-2 border-t pt-4 mt-2">
                <Label className="flex items-center gap-2">
                  <Paperclip className="h-4 w-4" />
                  Evidence / Means of Verification (MOV)
                </Label>
                <OneDriveLinkInput onAdd={handleEvidenceLink} className="mt-1" />
                {formData.Evidence_Attachments?.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {formData.Evidence_Attachments.map((url, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm bg-slate-50 p-2 rounded">
                        <FileText className="h-4 w-4 text-slate-500" />
                        <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate flex-1">
                          Attachment {idx + 1}
                        </a>
                        <Button aria-label="Delete" variant="ghost" size="sm" onClick={() => handleRemoveEvidence(idx)}>
                          <Trash2 className="h-3 w-3 text-red-500" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <span className="text-sm text-slate-500">Output Statement:</span>
                <p className="font-medium">{output.Output_Description}</p>
              </div>
              <div>
                <span className="text-sm text-slate-500">Category:</span>
                <p><Badge variant="outline">{output.Output_Category || '-'}</Badge></p>
              </div>
              <div>
                <span className="text-sm text-slate-500">Due Date:</span>
                <p className="font-medium">{output.Due_Date || '-'}</p>
              </div>

              {/* Evidence Attachments - View Mode */}
              {output.Evidence_Attachments?.length > 0 && (
                <div className="md:col-span-2 border-t pt-4 mt-2">
                  <Label className="text-slate-500 flex items-center gap-2">
                    <Paperclip className="h-4 w-4" />
                    Evidence / MOV Attachments
                  </Label>
                  <div className="mt-2 space-y-1">
                    {output.Evidence_Attachments.map((url, idx) => (
                      <a 
                        key={idx} 
                        href={url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
                      >
                        <Download className="h-4 w-4" />
                        Download Attachment {idx + 1}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Linked Activities */}
      <Card className="shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-[#1B2A8F]" />
            Linked Activities ({linkedActivities.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {linkedActivities.length === 0 ? (
            <p className="text-center text-slate-500 py-4">No activities linked to this output.</p>
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
                {linkedActivities.map(act => (
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
        </CardContent>
      </Card>
    </div>
  );
}