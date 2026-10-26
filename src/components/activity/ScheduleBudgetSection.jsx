import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, DollarSign, Lock, AlertTriangle, TrendingUp } from 'lucide-react';

export default function ScheduleBudgetSection({ formData, onChange, locked }) {
  const inp = (field) => ({
    value: formData[field] || '',
    onChange: (e) => onChange(field, e.target.value),
    disabled: locked
  });

  const allocated = parseFloat(formData.Financial_Allocation) || 0;
  const utilized = parseFloat(formData.Financial_Utilization) || 0;
  const variance = allocated - utilized;
  const utilizationRate = allocated > 0 ? (utilized / allocated) * 100 : 0;
  const isOverBudget = utilized > allocated && allocated > 0;

  return (
    <div className="space-y-5">
      {/* Schedule */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-[#1e3a5f] flex items-center justify-between text-base">
            <span className="flex items-center gap-2"><Calendar className="h-4 w-4" />Schedule</span>
            {locked && <Badge variant="outline" className="text-amber-600 border-amber-300 gap-1 text-xs"><Lock className="h-3 w-3" />Locked</Badge>}
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
              <Label>Date Conducted</Label>
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

      {/* Budget Monitoring */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-[#1e3a5f] flex items-center justify-between text-base">
            <span className="flex items-center gap-2"><DollarSign className="h-4 w-4" />Budget Monitoring</span>
            {locked && <Badge variant="outline" className="text-amber-600 border-amber-300 gap-1 text-xs"><Lock className="h-3 w-3" />Locked</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Funding Source</Label>
              <Select value={formData.Funding_Source || ''} onValueChange={(v) => onChange('Funding_Source', v)} disabled={locked}>
                <SelectTrigger><SelectValue placeholder="Select source" /></SelectTrigger>
                <SelectContent>
                  {['MOOE', 'SARO', 'SEF', 'Others'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Financial Allocation (₱)</Label>
              <Input type="number" {...inp('Financial_Allocation')} placeholder="0.00" />
            </div>
            <div>
              <Label>Financial Utilization (₱)</Label>
              <Input type="number" {...inp('Financial_Utilization')} placeholder="0.00" />
            </div>
            <div>
              <Label>Variance (₱) <span className="text-xs text-slate-400">(auto)</span></Label>
              <div className={`flex items-center h-10 px-3 rounded-md border text-sm font-medium ${variance >= 0 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                {allocated > 0 ? `₱${variance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'}
              </div>
            </div>
          </div>

          {allocated > 0 && (
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-slate-500">
                <span className="flex items-center gap-1"><TrendingUp className="h-3 w-3" />Utilization Rate</span>
                <span className={`font-semibold ${isOverBudget ? 'text-red-600' : utilizationRate > 80 ? 'text-amber-600' : 'text-emerald-600'}`}>
                  {utilizationRate.toFixed(1)}%
                  {isOverBudget && ' — OVER BUDGET'}
                </span>
              </div>
              <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${isOverBudget ? 'bg-red-500' : utilizationRate > 80 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                  style={{ width: `${Math.min(utilizationRate, 100)}%` }}
                />
              </div>
              {isOverBudget && (
                <div className="flex items-center gap-1 text-xs text-red-600 font-medium">
                  <AlertTriangle className="h-3 w-3" />
                  Expenditure exceeds allocation by ₱{(utilized - allocated).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}