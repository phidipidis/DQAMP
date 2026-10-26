import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Handshake, Lock } from 'lucide-react';

const PARTNERSHIP_OPTIONS = [
  'Co-funded (shared budget/resources)',
  'Co-implementer (joint activity delivery)',
  'Resource Speaker / Expert provided by partner',
  'Venue provided by partner',
  'Materials / Logistics provided by partner',
  'Memorandum of Agreement (MOA) / MOU-based',
  'Others (please specify)',
];

export default function PartnershipSection({ formData, onChange, locked }) {
  const hasPartnership = formData.has_partnership === true;
  const partnershipTypes = formData.partnership_type || [];
  const hasOthers = partnershipTypes.includes('Others (please specify)');

  const setPartnership = (val) => {
    onChange('has_partnership', val);
    if (!val) {
      onChange('partner_agency_name', null);
      onChange('partnership_type', null);
      onChange('partnership_type_other', null);
    }
  };

  const toggleType = (option) => {
    const current = partnershipTypes;
    const updated = current.includes(option)
      ? current.filter(o => o !== option)
      : [...current, option];
    onChange('partnership_type', updated);
    if (option === 'Others (please specify)' && current.includes(option)) {
      onChange('partnership_type_other', null);
    }
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-[#1e3a5f] flex items-center justify-between text-base">
          <span className="flex items-center gap-2"><Handshake className="h-4 w-4" />Partnership</span>
          {locked && <Badge variant="outline" className="text-amber-600 border-amber-300 gap-1 text-xs"><Lock className="h-3 w-3" />Locked</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Primary question */}
        <div>
          <p className="text-sm font-semibold text-slate-700 mb-3">
            Was this activity conducted in partnership with another agency?
          </p>
          <div className="flex gap-6">
            {[{ label: 'Yes', value: true }, { label: 'No', value: false }].map(({ label, value }) => (
              <label key={label} className={`flex items-center gap-2 cursor-pointer ${locked ? 'pointer-events-none opacity-60' : ''}`}>
                <input
                  type="radio"
                  name="has_partnership"
                  checked={formData.has_partnership === value}
                  onChange={() => setPartnership(value)}
                  className="h-4 w-4 accent-[#1E3A5F]"
                  disabled={locked}
                />
                <span className="text-sm font-medium text-slate-700">{label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* No — confirmation message */}
        {formData.has_partnership === false && (
          <p className="text-sm text-slate-500 italic bg-slate-50 rounded-lg px-4 py-3 border">
            No partnership recorded for this activity.
          </p>
        )}

        {/* Yes — reveal fields */}
        {hasPartnership && (
          <div className="space-y-4 border-t pt-4">
            <div>
              <Label>Partner Agency Name <span className="text-red-500">*</span></Label>
              <Input
                value={formData.partner_agency_name || ''}
                onChange={(e) => onChange('partner_agency_name', e.target.value)}
                disabled={locked}
                placeholder="Name of partner agency"
              />
            </div>

            <div>
              <Label className="mb-2 block">How was the partnership conducted?</Label>
              <div className="space-y-2">
                {PARTNERSHIP_OPTIONS.map((option) => (
                  <label key={option} className={`flex items-start gap-2.5 cursor-pointer ${locked ? 'pointer-events-none opacity-60' : ''}`}>
                    <input
                      type="checkbox"
                      checked={partnershipTypes.includes(option)}
                      onChange={() => toggleType(option)}
                      className="h-4 w-4 mt-0.5 accent-[#1E3A5F] flex-shrink-0"
                      disabled={locked}
                    />
                    <span className="text-sm text-slate-700">{option}</span>
                  </label>
                ))}
              </div>
            </div>

            {hasOthers && (
              <div>
                <Label>Please specify (Others)</Label>
                <Input
                  value={formData.partnership_type_other || ''}
                  onChange={(e) => onChange('partnership_type_other', e.target.value)}
                  disabled={locked}
                  placeholder="Describe the type of partnership..."
                />
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}