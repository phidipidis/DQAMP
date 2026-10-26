import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, Lock } from 'lucide-react';

const ACTIVITY_TYPES = [
  'Workshop', 'Training', 'Research', 'PIR', 'Conferences',
  'Meetings', 'Orientation', 'Capability Building NEAP/PRC Accredited',
  'Contest', 'Others'
];

export default function CoreInfoSection({ formData, onChange, locked }) {
  const inp = (field) => ({
    value: formData[field] || '',
    onChange: (e) => onChange(field, e.target.value),
    disabled: locked
  });

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-[#1e3a5f] flex items-center justify-between text-base">
          <span className="flex items-center gap-2"><Building2 className="h-4 w-4" />Activity Information</span>
          {locked && <Badge variant="outline" className="text-amber-600 border-amber-300 gap-1 text-xs"><Lock className="h-3 w-3" />Locked</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Activity Title <span className="text-red-500">*</span></Label>
          <Input {...inp('Activity_Title')} placeholder="Activity title" />
        </div>
        <div>
          <Label>Venue</Label>
          <Input {...inp('Venue')} placeholder="Location or venue" />
        </div>
        <div>
          <Label>Description</Label>
          <Textarea {...inp('Description')} rows={3} placeholder="Activity description" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Activity Type</Label>
            <Select value={formData.Activity_Type || ''} onValueChange={(v) => onChange('Activity_Type', v)} disabled={locked}>
              <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
              <SelectContent>
                {ACTIVITY_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Functional Division <span className="text-red-500">*</span></Label>
            <Select value={formData.Functional_Division || ''} onValueChange={(v) => onChange('Functional_Division', v)} disabled={locked}>
              <SelectTrigger><SelectValue placeholder="Select division" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="CID">CID</SelectItem>
                <SelectItem value="SGOD">SGOD</SelectItem>
                <SelectItem value="OSDS">OSDS</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Unit / Section</Label>
            <Input {...inp('Unit_Section')} placeholder="e.g., Curriculum Implementation" />
          </div>
          <div>
            <Label>Responsible Person</Label>
            <Input {...inp('Responsible_Person')} placeholder="Name of person in charge" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}