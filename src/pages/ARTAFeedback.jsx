import { useState, useEffect } from 'react';
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Plus, Eye, AlertCircle } from 'lucide-react';

const INITIAL_FORM = {
  Linked_Activity: '',
  Age: '',
  Sex: '',
  Region: '',
  Agency_Visited: '',
  Service_Availed: '',
  Customer_Type: '',
  CC1: '',
  CC2: '',
  CC3: '',
  CC3_Reason: '',
  SQD1_Responsiveness: '',
  SQD2_Reliability: '',
  SQD3_Access_Facilities: '',
  SQD4_Communication: '',
  SQD5_Costs: '',
  SQD6_Integrity: '',
  SQD7_Assurance: '',
  SQD8_Outcome: '',
  Remarks: ''
};

export default function ARTAFeedback() {
  const urlParams = new URLSearchParams(window.location.search);
  const activityIdFromUrl = urlParams.get('activity');

  const [searchTerm, setSearchTerm] = useState('');
  const [activityFilter, setActivityFilter] = useState(activityIdFromUrl || 'All');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewingFeedback, setViewingFeedback] = useState(null);
  const [formData, setFormData] = useState(INITIAL_FORM);

  const queryClient = useQueryClient();

  const { data: feedback = [], isLoading } = useQuery({
    queryKey: ['feedback'],
    queryFn: () => base44.entities.ARTAFeedback.list('-created_date')
  });

  const { data: activities = [] } = useQuery({
    queryKey: ['activities'],
    queryFn: () => base44.entities.DQAMPActivity.list()
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.ARTAFeedback.create(data),
    onSuccess: async (result) => {
      await logAuditEvent({
        actionType: 'Create',
        entity: 'ARTAFeedback',
        recordId: result.id,
        remarks: `Created ARTA feedback for activity`,
        newValues: formData
      });
      queryClient.invalidateQueries(['feedback']);
      closeDialog();
    }
  });

  useEffect(() => {
    if (activityIdFromUrl) {
      setActivityFilter(activityIdFromUrl);
    }
  }, [activityIdFromUrl]);

  const filteredFeedback = feedback.filter(fb => {
    const matchesActivity = activityFilter === 'All' || fb.Linked_Activity === activityFilter;
    return matchesActivity;
  });

  const getActivityTitle = (activityId) => {
    const activity = activities.find(a => a.id === activityId);
    return activity?.Activity_Title || activity?.Title || '-';
  };

  const openCreateDialog = () => {
    setFormData({
      ...INITIAL_FORM,
      Linked_Activity: activityFilter !== 'All' ? activityFilter : ''
    });
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setFormData(INITIAL_FORM);
  };

  const openViewDialog = (fb) => {
    setViewingFeedback(fb);
    setViewDialogOpen(true);
  };

  const handleSave = () => {
    if (!formData.Linked_Activity || !formData.Customer_Type || !formData.CC1) {
      return;
    }

    // Validate SQD fields
    const sqds = ['SQD1_Responsiveness', 'SQD2_Reliability', 'SQD3_Access_Facilities', 
                  'SQD4_Communication', 'SQD5_Costs', 'SQD6_Integrity', 'SQD7_Assurance', 'SQD8_Outcome'];
    for (const sqd of sqds) {
      if (!formData[sqd]) return;
    }

    const dataToSave = {
      ...formData,
      SQD1_Responsiveness: parseInt(formData.SQD1_Responsiveness),
      SQD2_Reliability: parseInt(formData.SQD2_Reliability),
      SQD3_Access_Facilities: parseInt(formData.SQD3_Access_Facilities),
      SQD4_Communication: parseInt(formData.SQD4_Communication),
      SQD5_Costs: parseInt(formData.SQD5_Costs),
      SQD6_Integrity: parseInt(formData.SQD6_Integrity),
      SQD7_Assurance: parseInt(formData.SQD7_Assurance),
      SQD8_Outcome: parseInt(formData.SQD8_Outcome)
    };

    createMutation.mutate(dataToSave);
  };

  const isCC2CC3Disabled = formData.CC1 === 'Not aware';

  const RatingSelect = ({ label, field }) => (
    <div>
      <Label>{label} <span className="text-red-500">*</span></Label>
      <Select
        value={formData[field]?.toString()}
        onValueChange={(v) => setFormData(prev => ({ ...prev, [field]: v }))}
      >
        <SelectTrigger>
          <SelectValue placeholder="1-5" />
        </SelectTrigger>
        <SelectContent>
          {[1, 2, 3, 4, 5].map(n => (
            <SelectItem key={n} value={n.toString()}>{n}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1e3a5f]">ARTA Feedback (CSM)</h1>
          <p className="text-slate-600">Customer Satisfaction Measurement feedback collection</p>
        </div>
        <Button onClick={openCreateDialog} className="gap-2 bg-[#1e3a5f] hover:bg-[#1e3a5f]/90">
          <Plus className="h-4 w-4" />
          New Feedback
        </Button>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>CSM Data Governance:</strong> No sentiment analysis, normalization, averaging, or composite scoring 
          is performed on feedback data. Raw values are preserved as submitted.
        </AlertDescription>
      </Alert>

      {/* Filters */}
      <Card className="shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <Select value={activityFilter} onValueChange={setActivityFilter}>
              <SelectTrigger className="w-[300px]">
                <SelectValue placeholder="Filter by Activity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Activities</SelectItem>
                {activities.map(a => (
                  <SelectItem key={a.id} value={a.id}>{a.Activity_Title || a.Title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Feedback Table */}
      <Card className="shadow-md">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead className="font-semibold">Activity</TableHead>
                  <TableHead className="font-semibold">Customer Type</TableHead>
                  <TableHead className="font-semibold">Region</TableHead>
                  <TableHead className="font-semibold">CC1 Awareness</TableHead>
                  <TableHead className="font-semibold text-center">SQD Avg</TableHead>
                  <TableHead className="font-semibold">Date</TableHead>
                  <TableHead className="font-semibold text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                      Loading feedback...
                    </TableCell>
                  </TableRow>
                ) : filteredFeedback.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                      No feedback found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredFeedback.map(fb => {
                    const sqds = [fb.SQD1_Responsiveness, fb.SQD2_Reliability, fb.SQD3_Access_Facilities,
                                 fb.SQD4_Communication, fb.SQD5_Costs, fb.SQD6_Integrity, 
                                 fb.SQD7_Assurance, fb.SQD8_Outcome].filter(Boolean);
                    const displayAvg = sqds.length > 0 ? (sqds.reduce((a,b) => a+b, 0) / sqds.length).toFixed(2) : '-';
                    
                    return (
                      <TableRow key={fb.id} className="hover:bg-slate-50">
                        <TableCell className="max-w-[200px] truncate">{getActivityTitle(fb.Linked_Activity)}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{fb.Customer_Type}</Badge>
                        </TableCell>
                        <TableCell>{fb.Region || '-'}</TableCell>
                        <TableCell>
                          <Badge className={
                            fb.CC1 === 'Aware before transaction' ? 'bg-emerald-100 text-emerald-800' :
                            fb.CC1 === 'Aware only upon seeing CC' ? 'bg-amber-100 text-amber-800' :
                            'bg-gray-100 text-gray-800'
                          }>
                            {fb.CC1}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center font-medium">{displayAvg}</TableCell>
                        <TableCell>{fb.created_date ? new Date(fb.created_date).toLocaleDateString() : '-'}</TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openViewDialog(fb)}>
                              <Eye className="h-4 w-4" />
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

      <div className="text-sm text-slate-600">
        Total: {filteredFeedback.length} feedback record(s)
      </div>

      {/* Create Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New ARTA Feedback</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* Activity Selection */}
            <div>
              <Label>Linked Activity <span className="text-red-500">*</span></Label>
              <Select
                value={formData.Linked_Activity}
                onValueChange={(v) => setFormData(prev => ({ ...prev, Linked_Activity: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select activity" />
                </SelectTrigger>
                <SelectContent>
                  {activities.map(a => (
                    <SelectItem key={a.id} value={a.id}>{a.Activity_Title || a.Title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Respondent Profile */}
            <div className="space-y-4">
              <h3 className="font-semibold text-[#1e3a5f]">Respondent Profile</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Age</Label>
                  <Input
                    value={formData.Age}
                    onChange={(e) => setFormData(prev => ({ ...prev, Age: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Sex</Label>
                  <Input
                    value={formData.Sex}
                    onChange={(e) => setFormData(prev => ({ ...prev, Sex: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Region</Label>
                  <Input
                    value={formData.Region}
                    onChange={(e) => setFormData(prev => ({ ...prev, Region: e.target.value }))}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Agency Visited</Label>
                  <Input
                    value={formData.Agency_Visited}
                    onChange={(e) => setFormData(prev => ({ ...prev, Agency_Visited: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Service Availed</Label>
                  <Input
                    value={formData.Service_Availed}
                    onChange={(e) => setFormData(prev => ({ ...prev, Service_Availed: e.target.value }))}
                  />
                </div>
              </div>
              <div>
                <Label>Customer Type <span className="text-red-500">*</span></Label>
                <Select
                  value={formData.Customer_Type}
                  onValueChange={(v) => setFormData(prev => ({ ...prev, Customer_Type: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Citizen">Citizen</SelectItem>
                    <SelectItem value="Business">Business</SelectItem>
                    <SelectItem value="Government">Government</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Citizen's Charter */}
            <div className="space-y-4">
              <h3 className="font-semibold text-[#1e3a5f]">Citizen's Charter Questions</h3>
              <div>
                <Label>CC1: Awareness <span className="text-red-500">*</span></Label>
                <Select
                  value={formData.CC1}
                  onValueChange={(v) => setFormData(prev => ({ 
                    ...prev, 
                    CC1: v,
                    CC2: v === 'Not aware' ? '' : prev.CC2,
                    CC3: v === 'Not aware' ? '' : prev.CC3
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Aware before transaction">Aware before transaction</SelectItem>
                    <SelectItem value="Aware only upon seeing CC">Aware only upon seeing CC</SelectItem>
                    <SelectItem value="Not aware">Not aware</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>CC2: Findability {isCC2CC3Disabled && '(Skipped)'}</Label>
                <Select
                  value={formData.CC2}
                  onValueChange={(v) => setFormData(prev => ({ ...prev, CC2: v }))}
                  disabled={isCC2CC3Disabled}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Easy to find">Easy to find</SelectItem>
                    <SelectItem value="Hard to find">Hard to find</SelectItem>
                    <SelectItem value="Did not see">Did not see</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>CC3: Usage {isCC2CC3Disabled && '(Skipped)'}</Label>
                <Select
                  value={formData.CC3}
                  onValueChange={(v) => setFormData(prev => ({ ...prev, CC3: v }))}
                  disabled={isCC2CC3Disabled}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Used CC">Used CC</SelectItem>
                    <SelectItem value="Did not use CC">Did not use CC</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {formData.CC3 === 'Did not use CC' && (
                <div>
                  <Label>Reason for not using CC <span className="text-red-500">*</span></Label>
                  <Input
                    value={formData.CC3_Reason}
                    onChange={(e) => setFormData(prev => ({ ...prev, CC3_Reason: e.target.value }))}
                  />
                </div>
              )}
            </div>

            {/* SQD */}
            <div className="space-y-4">
              <h3 className="font-semibold text-[#1e3a5f]">Service Quality Dimensions (1-5)</h3>
              <div className="grid grid-cols-4 gap-4">
                <RatingSelect label="SQD1: Responsiveness" field="SQD1_Responsiveness" />
                <RatingSelect label="SQD2: Reliability" field="SQD2_Reliability" />
                <RatingSelect label="SQD3: Access/Facilities" field="SQD3_Access_Facilities" />
                <RatingSelect label="SQD4: Communication" field="SQD4_Communication" />
                <RatingSelect label="SQD5: Costs" field="SQD5_Costs" />
                <RatingSelect label="SQD6: Integrity" field="SQD6_Integrity" />
                <RatingSelect label="SQD7: Assurance" field="SQD7_Assurance" />
                <RatingSelect label="SQD8: Outcome" field="SQD8_Outcome" />
              </div>
            </div>

            {/* Remarks */}
            <div>
              <Label>Remarks (Optional)</Label>
              <Textarea
                value={formData.Remarks}
                onChange={(e) => setFormData(prev => ({ ...prev, Remarks: e.target.value }))}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Cancel</Button>
            <Button 
              onClick={handleSave} 
              className="bg-[#1e3a5f] hover:bg-[#1e3a5f]/90"
              disabled={createMutation.isPending}
            >
              Submit Feedback
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Feedback Details</DialogTitle>
          </DialogHeader>
          {viewingFeedback && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-500">Activity</p>
                  <p className="font-medium">{getActivityTitle(viewingFeedback.Linked_Activity)}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Customer Type</p>
                  <p className="font-medium">{viewingFeedback.Customer_Type}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Age</p>
                  <p className="font-medium">{viewingFeedback.Age || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Sex</p>
                  <p className="font-medium">{viewingFeedback.Sex || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Region</p>
                  <p className="font-medium">{viewingFeedback.Region || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Agency Visited</p>
                  <p className="font-medium">{viewingFeedback.Agency_Visited || '-'}</p>
                </div>
              </div>
              
              <div className="border-t pt-4">
                <h4 className="font-semibold mb-2">Citizen's Charter</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-slate-500">CC1</p>
                    <p className="font-medium">{viewingFeedback.CC1}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">CC2</p>
                    <p className="font-medium">{viewingFeedback.CC2 || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">CC3</p>
                    <p className="font-medium">{viewingFeedback.CC3 || '-'}</p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-2">Service Quality Dimensions</h4>
                <div className="grid grid-cols-4 gap-4">
                  {['SQD1_Responsiveness', 'SQD2_Reliability', 'SQD3_Access_Facilities', 'SQD4_Communication',
                    'SQD5_Costs', 'SQD6_Integrity', 'SQD7_Assurance', 'SQD8_Outcome'].map(sqd => (
                    <div key={sqd}>
                      <p className="text-sm text-slate-500">{sqd.replace('_', ': ')}</p>
                      <p className="font-medium text-lg">{viewingFeedback[sqd]}</p>
                    </div>
                  ))}
                </div>
              </div>

              {viewingFeedback.Remarks && (
                <div className="border-t pt-4">
                  <p className="text-sm text-slate-500">Remarks</p>
                  <p>{viewingFeedback.Remarks}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}