import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Calendar, Lock } from 'lucide-react';

export default function ScheduleSection({ formData, onChange, locked }) {
  const inp = (field) => ({
    value: formData[field] || '',
    onChange: (e) => onChange(field, e.target.value),
    disabled: locked,
  });

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-[#1e3a5f] flex items-center justify-between text-base">
          <span className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />Schedule
          </span>
          {locked && (
            <Badge variant="outline" className="text-amber-600 border-amber-300 gap-1 text-xs">
              <Lock className="h-3 w-3" />Locked
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Planned Start Date</Label>
            <Input type="date" {...inp('Planned_Start_Date')} />
          </div>
          <div>
            <Label>Actual Start Date</Label>
            <Input type="date" {...inp('Start_Date')} />
          </div>
          <div>
            <Label>End Date</Label>
            <Input type="date" {...inp('End_Date')} />
          </div>
          <div>
            <Label>Actual End Date</Label>
            <Input type="date" {...inp('Date_Conducted')} />
          </div>
        </div>
        <div>
          <Label>Venue</Label>
          <Input {...inp('Venue')} placeholder="Location or venue" />
        </div>
        <div>
          <Label>Reschedule Reason</Label>
          <Input {...inp('Reschedule_Reason')} placeholder="If rescheduled, state reason" />
        </div>
      </CardContent>
    </Card>
  );
}