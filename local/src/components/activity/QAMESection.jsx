import OneDriveLinkInput from '@/components/ui/OneDriveLinkInput';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ClipboardCheck, Lock, FileDown, ExternalLink, CheckCircle, Star } from 'lucide-react';

// Kept for legacy migration in ActivityForm
export const RATING_SCORE_MAP = {
  'Outstanding': 4,
  'Very Satisfactory': 3,
  'Satisfactory': 2,
  'Needs Improvement': 1,
  'Not Rated': null
};

function ratingColor(score) {
  const s = parseFloat(score);
  if (s >= 4)   return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (s >= 3)   return 'bg-blue-50 text-blue-700 border-blue-200';
  if (s >= 2)   return 'bg-amber-50 text-amber-700 border-amber-200';
  if (s >= 1)   return 'bg-red-50 text-red-700 border-red-200';
  return 'bg-slate-50 text-slate-400 border-slate-200';
}

export default function QAMESection({
  formData,
  onChange,
  canEditQAME,
  canUploadReport,
  onReportAdd,
  feedbackCount = 0,
  isAdmin = false,
  isReviewer = false,
}) {
  const score = (formData.QAME_Rating != null && formData.QAME_Rating !== '')
    ? parseFloat(formData.QAME_Rating)
    : null;

  const handleRatingChange = (v) => {
    const num = v !== '' ? parseFloat(v) : null;
    onChange('QAME_Rating', num);
    onChange('QAME_Rating_Score', num);
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-[#1e3a5f] flex items-center justify-between text-base">
          <span className="flex items-center gap-2"><ClipboardCheck className="h-4 w-4" />QAME Evaluation</span>
          {!canEditQAME && (
            <Badge variant="outline" className="text-amber-600 border-amber-300 gap-1 text-xs">
              <Lock className="h-3 w-3" />Reviewer / Admin only
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">

        <div className="grid grid-cols-2 gap-4">
          {/* QAME Rating — numeric 1.00–4.00 */}
          <div>
            <Label className="flex items-center gap-1">
              QAME Rating (1.00 – 4.00) {!canEditQAME && <Lock className="h-3 w-3 text-slate-400" />}
            </Label>
            <Input
              type="number"
              min={1}
              max={4}
              step={0.01}
              value={formData.QAME_Rating ?? ''}
              onChange={(e) => handleRatingChange(e.target.value)}
              disabled={!canEditQAME}
              placeholder="e.g. 3.50"
            />
          </div>

          {/* Rating Score display (auto from input) */}
          <div>
            <Label className="flex items-center gap-1">
              <Star className="h-3.5 w-3.5" />Rating Score <span className="text-xs text-slate-400">(auto)</span>
            </Label>
            <div className={`mt-1 flex items-center justify-center h-9 rounded-lg border font-bold text-lg ${ratingColor(score)}`}>
              {score != null ? `${score.toFixed(2)} / 4` : '—'}
            </div>
          </div>
        </div>

        {/* Rating of Venue */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="flex items-center gap-1">
              Rating of Venue (1.00 – 4.00) {!canEditQAME && <Lock className="h-3 w-3 text-slate-400" />}
            </Label>
            <Input
              type="number"
              min={1}
              max={4}
              step={0.01}
              value={formData.QAME_Venue_Rating ?? ''}
              onChange={(e) => {
                const num = e.target.value !== '' ? parseFloat(e.target.value) : null;
                onChange('QAME_Venue_Rating', num);
              }}
              disabled={!canEditQAME}
              placeholder="e.g. 3.50"
            />
          </div>
          <div>
            <Label className="flex items-center gap-1">
              <Star className="h-3.5 w-3.5" />Venue Rating Score <span className="text-xs text-slate-400">(auto)</span>
            </Label>
            <div className={`mt-1 flex items-center justify-center h-9 rounded-lg border font-bold text-lg ${ratingColor(formData.QAME_Venue_Rating)}`}>
              {formData.QAME_Venue_Rating != null && formData.QAME_Venue_Rating !== '' ? `${parseFloat(formData.QAME_Venue_Rating).toFixed(2)} / 4` : '—'}
            </div>
          </div>
        </div>

        {/* QAME Assessor */}
        <div>
          <Label>QAME Assessor</Label>
          <Input
            value={formData.QAME_Assessor || ''}
            onChange={(e) => onChange('QAME_Assessor', e.target.value)}
            disabled={!canEditQAME}
            placeholder="Name of QAME assessor"
          />
        </div>

        {/* QAME Remarks — evaluator notes */}
        <div>
          <Label className="flex items-center gap-1">
            QAME Remarks {!canEditQAME && <Lock className="h-3 w-3 text-slate-400" />}
          </Label>
          <Textarea
            value={formData.QAME_Remarks || ''}
            onChange={(e) => onChange('QAME_Remarks', e.target.value)}
            disabled={!canEditQAME}
            rows={3}
            placeholder="Evaluator's notes, observations, and recommendations..."
          />
        </div>

        {/* Needs QAME Eval Form toggle */}
        <div>
          <Label>Requires QAME Evaluation Form?</Label>
          <div className="flex gap-6 mt-2">
            {[{ label: 'Yes', value: true }, { label: 'No', value: false }].map(({ label, value }) => (
              <label key={label} className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="radio"
                  name="needs_qame_eval_form"
                  checked={(formData.needs_qame_eval_form ?? true) === value}
                  onChange={() => onChange('needs_qame_eval_form', value)}
                  disabled={!canEditQAME}
                  className="accent-[#1e3a5f] w-4 h-4"
                />
                <span className="text-sm font-medium">{label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Evaluation Form URL — shown only if needed */}
        {(formData.needs_qame_eval_form ?? true) && (
          <div>
            <Label>QAME Evaluation Form URL</Label>
            <div className="flex gap-2">
              <Input
                type="url"
                value={formData.QAME_Evaluation_Form_URL || ''}
                onChange={(e) => onChange('QAME_Evaluation_Form_URL', e.target.value)}
                disabled={!canEditQAME}
                placeholder="https://forms.google.com/..."
              />
              {formData.QAME_Evaluation_Form_URL && (
                <Button variant="outline" size="icon" asChild>
                  <a href={formData.QAME_Evaluation_Form_URL} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              )}
            </div>
          </div>
        )}

        {/* QAME Report Upload */}
        <div>
          <Label>QAME Report</Label>
          {formData.QAME_Report_File ? (
            <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-lg border border-emerald-200 mt-1">
              <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-emerald-700">Report uploaded</p>
                {(isAdmin || isReviewer || feedbackCount > 0) ? (
                  <a href={formData.QAME_Report_File} target="_blank" rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline flex items-center gap-1 mt-0.5">
                    <FileDown className="h-3 w-3" />Download Report
                  </a>
                ) : (
                  <span className="text-xs text-amber-700 flex items-center gap-1 mt-0.5">
                    <Lock className="h-3 w-3" />Submit ARTA Feedback to download
                  </span>
                )}
              </div>
              {canUploadReport && (
                <OneDriveLinkInput onAdd={onReportAdd} buttonLabel="Replace link" className="w-72" />
              )}
            </div>
          ) : canUploadReport ? (
            <div className="mt-1">
              <OneDriveLinkInput onAdd={onReportAdd} buttonLabel="Save link" />
            </div>
          ) : (
            <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg border mt-1">
              <Lock className="h-4 w-4 text-slate-400 flex-shrink-0" />
              <p className="text-sm text-slate-500">No QAME report uploaded yet.</p>
            </div>
          )}
        </div>

      </CardContent>
    </Card>
  );
}