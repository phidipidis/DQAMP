
/**
 * StatusBadge – Phase 1 shared semantic status badge.
 * Maps common status strings to the DQAMP brand token colors.
 * Purely presentational – no logic or data changes.
 */

const STATUS_MAP = {
  // Success / positive
  'On Track':    { bg: 'var(--color-success-soft)',  text: 'var(--color-success)',  label: 'On Track' },
  'Completed':   { bg: 'var(--color-success-soft)',  text: 'var(--color-success)',  label: 'Completed' },
  'Achieved':    { bg: 'var(--color-success-soft)',  text: 'var(--color-success)',  label: 'Achieved' },
  'Published':   { bg: 'var(--color-success-soft)',  text: 'var(--color-success)',  label: 'Published' },
  'Verified':    { bg: 'var(--color-success-soft)',  text: 'var(--color-success)',  label: 'Verified' },

  // Warning / caution
  'At Risk':              { bg: 'var(--color-warning-soft)',  text: 'var(--color-warning)',  label: 'At Risk' },
  'In Progress':          { bg: 'var(--color-warning-soft)',  text: 'var(--color-warning)',  label: 'In Progress' },
  'Delayed':              { bg: 'var(--color-warning-soft)',  text: 'var(--color-warning)',  label: 'Delayed' },
  'Under Review':         { bg: 'var(--color-warning-soft)',  text: 'var(--color-warning)',  label: 'Under Review' },
  'Submitted':            { bg: 'var(--color-secondary-soft)', text: 'var(--color-secondary)', label: 'Submitted' },
  'Returned for Revision':{ bg: 'var(--color-warning-soft)',  text: 'var(--color-warning)',  label: 'Returned' },

  // Danger / negative
  'Critical':      { bg: 'var(--color-danger-soft)',  text: 'var(--color-danger)',  label: 'Critical' },
  'Cancelled':     { bg: 'var(--color-danger-soft)',  text: 'var(--color-danger)',  label: 'Cancelled' },
  'Not Achieved':  { bg: 'var(--color-danger-soft)',  text: 'var(--color-danger)',  label: 'Not Achieved' },

  // Neutral
  'Not Started':   { bg: 'var(--color-surface-alt)',  text: 'var(--color-text-muted)', label: 'Not Started' },
  'Draft':         { bg: 'var(--color-surface-alt)',  text: 'var(--color-text-muted)', label: 'Draft' },
  'Planning':      { bg: 'var(--color-surface-alt)',  text: 'var(--color-text-muted)', label: 'Planning' },
  'N/A':           { bg: 'var(--color-surface-alt)',  text: 'var(--color-text-muted)', label: 'N/A' },
};

export function StatusBadge({ status, className = '' }) {
  const config = STATUS_MAP[status] ?? {
    bg: 'var(--color-surface-alt)',
    text: 'var(--color-text-muted)',
    label: status ?? '—',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${className}`}
      style={{ backgroundColor: config.bg, color: config.text }}
    >
      {config.label}
    </span>
  );
}

export default StatusBadge;