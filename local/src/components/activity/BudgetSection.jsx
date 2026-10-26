import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DollarSign, Lock, AlertTriangle, TrendingUp } from 'lucide-react';

export default function BudgetSection({ formData, onChange, locked }) {
  const allocated = parseFloat(formData.Financial_Allocation) || 0;
  const utilized = parseFloat(formData.Financial_Utilization) || 0;
  const variance = allocated - utilized;
  const utilizationRate = allocated > 0 ? (utilized / allocated) * 100 : 0;
  const isOverBudget = utilized > allocated && allocated > 0;
  const isNearBudget = !isOverBudget && utilizationRate > 80 && allocated > 0;

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-[#1B2A8F] flex items-center justify-between text-base">
          <span className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />Budget Monitoring
          </span>
          {locked && (
            <Badge variant="outline" className="text-amber-600 border-amber-300 gap-1 text-xs">
              <Lock className="h-3 w-3" />Locked
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Funding Source</Label>
          <Select
            value={formData.Funding_Source || ''}
            onValueChange={(v) => {
              onChange('Funding_Source', v);
              if (v !== 'SARO') onChange('saro_number', null);
            }}
            disabled={locked}
          >
            <SelectTrigger><SelectValue placeholder="Select source" /></SelectTrigger>
            <SelectContent>
              {['MOOE', 'SARO', 'SEF', 'Others'].map(s => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {formData.Funding_Source === 'SARO' && (
          <div>
            <Label>SARO Number</Label>
            <Input
              value={formData.saro_number || ''}
              onChange={(e) => onChange('saro_number', e.target.value)}
              disabled={locked}
              placeholder="e.g. SARO-ROV-26-0001234"
            />
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Financial Allocation (₱)</Label>
            <Input
              type="number"
              value={formData.Financial_Allocation || ''}
              onChange={(e) => onChange('Financial_Allocation', e.target.value)}
              disabled={locked}
              placeholder="0.00"
              min="0"
            />
          </div>
          <div>
            <Label>Financial Utilization (₱)</Label>
            <Input
              type="number"
              value={formData.Financial_Utilization || ''}
              onChange={(e) => onChange('Financial_Utilization', e.target.value)}
              disabled={locked}
              placeholder="0.00"
              min="0"
            />
          </div>
        </div>

        {/* Variance Display */}
        <div>
          <Label className="flex items-center gap-1 text-xs text-slate-500 mb-1">
            Variance (₱) <span className="italic">(auto-calculated)</span>
          </Label>
          <div className={`flex items-center h-10 px-3 rounded-md border text-sm font-semibold ${
            allocated === 0 ? 'bg-slate-50 text-slate-400 border-slate-200'
            : variance >= 0 ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
            : 'bg-red-50 text-red-700 border-red-200'
          }`}>
            {allocated > 0
              ? `₱${variance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
              : '—'
            }
          </div>
        </div>

        {/* Utilization Indicator */}
        {allocated > 0 && (
          <div className="space-y-2 pt-1">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />Utilization Rate
              </span>
              <span className={`font-bold ${isOverBudget ? 'text-red-600' : isNearBudget ? 'text-amber-600' : 'text-emerald-600'}`}>
                {utilizationRate.toFixed(1)}%
                {isOverBudget && ' — OVER BUDGET'}
                {isNearBudget && ' — Near Limit'}
              </span>
            </div>

            <div className="relative h-3 bg-slate-100 rounded-full overflow-hidden">
              {/* Background limit marker at 80% */}
              <div className="absolute top-0 bottom-0 w-px bg-amber-300 opacity-60" style={{ left: '80%' }} />
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  isOverBudget ? 'bg-red-500'
                  : isNearBudget ? 'bg-amber-500'
                  : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(utilizationRate, 100)}%` }}
              />
            </div>

            <div className="flex justify-between text-xs text-slate-400">
              <span>₱0</span>
              <span className="text-amber-500">80%</span>
              <span>₱{allocated.toLocaleString()}</span>
            </div>

            {isOverBudget && (
              <div className="flex items-center gap-2 p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 font-medium">
                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                Expenditure exceeds allocation by ₱{(utilized - allocated).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}