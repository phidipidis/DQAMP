import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { BarChart2 } from 'lucide-react';

const STATUS_COLORS = {
  'Not Started': 'bg-slate-100 text-slate-700',
  'In Progress': 'bg-blue-100 text-blue-700',
  'Completed':   'bg-emerald-100 text-emerald-700',
  'Cancelled':   'bg-red-100 text-red-700',
  'Delayed':     'bg-amber-100 text-amber-700',
};

export default function ImplementationSection({ formData }) {
  const plannedStart  = formData.Planned_Start_Date || '—';
  const actualStart   = formData.Start_Date         || '—';
  const endDate       = formData.End_Date            || '—';
  const dateConducted = formData.Date_Conducted      || '—';
  const venue         = formData.Venue               || '—';
  const status        = formData.Status              || 'Not Started';

  const readonlyField = (label, value) => (
    <div>
      <Label className="text-xs text-slate-500">{label}</Label>
      <div className="mt-1 px-3 py-2 rounded-md bg-slate-50 border border-slate-200 text-sm text-slate-700 min-h-[36px]">
        {value}
      </div>
    </div>
  );

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-[#1e3a5f] flex items-center justify-between text-base">
          <span className="flex items-center gap-2"><BarChart2 className="h-4 w-4" />Implementation Monitoring</span>
          <Badge variant="outline" className="text-blue-600 border-blue-300 gap-1 text-xs">Auto-filled from Schedule</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          {readonlyField('Planned Start Date', plannedStart)}
          {readonlyField('Actual Start Date', actualStart)}
          {readonlyField('End Date', endDate)}
          {readonlyField('Actual End Date (Date Conducted)', dateConducted)}
        </div>
        {readonlyField('Venue', venue)}
        <div>
          <Label className="text-xs text-slate-500">Implementation Status</Label>
          <div className="mt-1">
            <Badge className={STATUS_COLORS[status] || STATUS_COLORS['Not Started']}>
              {status}
            </Badge>
            <p className="text-xs text-slate-400 mt-1">
              Auto-computed from dates — set "Actual End Date" to mark as Completed.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}