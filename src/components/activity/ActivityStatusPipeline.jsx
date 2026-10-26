import React from 'react';
import { CheckCircle, Circle, Clock, Lock, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

const MAIN_STEPS = ['Draft', 'Submitted', 'Under Review', 'Published'];

const STEP_META = {
  Draft:                  { label: 'Draft',                  desc: 'Implementer editing',    icon: Circle,      color: 'bg-slate-100 text-slate-500' },
  Submitted:              { label: 'Submitted',              desc: 'Pending QA review',      icon: Clock,       color: 'bg-blue-50 text-blue-600' },
  'Returned for Revision':{ label: 'Returned for Revision', desc: 'Needs implementer action',icon: RotateCcw,   color: 'bg-amber-100 text-amber-700' },
  'Under Review':         { label: 'Under Review',           desc: 'QA evaluation',          icon: Clock,       color: 'bg-purple-50 text-purple-600' },
  Published:              { label: 'Published',              desc: 'Official record',         icon: Lock,        color: 'bg-emerald-100 text-emerald-700' },
};

export default function ActivityStatusPipeline({ status }) {
  const isRevision = status === 'Returned for Revision';

  // Build displayed steps: insert revision step if applicable
  const steps = isRevision
    ? ['Draft', 'Submitted', 'Returned for Revision', 'Under Review', 'Published']
    : MAIN_STEPS;

  const currentIndex = steps.indexOf(status);

  return (
    <div className="space-y-1">
      <div className="flex items-center flex-wrap gap-1">
        {steps.map((key, i) => {
          const meta = STEP_META[key];
          const Icon = meta.icon;
          const isPast = i < currentIndex;
          const isCurrent = i === currentIndex;

          return (
            <React.Fragment key={key}>
              <div className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border',
                isCurrent && key !== 'Returned for Revision' && 'bg-[#1e3a5f] text-white border-[#1e3a5f] shadow-sm',
                isCurrent && key === 'Returned for Revision' && 'bg-amber-100 text-amber-700 border-amber-300 shadow-sm',
                isPast && 'bg-emerald-50 text-emerald-700 border-emerald-200',
                !isCurrent && !isPast && 'bg-slate-50 text-slate-400 border-slate-200'
              )}>
                {isPast
                  ? <CheckCircle className="h-3.5 w-3.5" />
                  : <Icon className="h-3.5 w-3.5" />
                }
                {meta.label}
              </div>
              {i < steps.length - 1 && (
                <div className={cn(
                  'h-px flex-shrink-0 w-4',
                  i < currentIndex ? 'bg-emerald-400' : 'bg-slate-200'
                )} />
              )}
            </React.Fragment>
          );
        })}
      </div>
      {isRevision && (
        <p className="text-xs text-amber-600 font-medium pl-1">
          ↩ Reviewer returned this activity — please revise and re-submit.
        </p>
      )}
    </div>
  );
}