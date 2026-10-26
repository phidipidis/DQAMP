import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Plus, BarChart3, Target, FileText, Calendar, Settings } from 'lucide-react';

const iconMap = { Plus, BarChart3, Target, FileText, Calendar, Settings };
const MUTED = '#6B7280';
const TEXT = '#374151';
const BORDER = '#E5E9F0';

export default function QuickActions({ actions = [] }) {
  if (!actions || actions.length === 0) return null;

  const btnStyle = {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
    padding: '7px 10px', borderRadius: 6,
    fontSize: 12, fontWeight: 500, color: TEXT,
    border: `1px solid ${BORDER}`, background: '#fff',
    cursor: 'pointer', transition: 'all 0.13s',
    fontFamily: "'Public Sans', system-ui, sans-serif",
    textDecoration: 'none',
  };

  return (
    <div style={{ padding: '10px 16px', borderBottom: `1px solid ${BORDER}` }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6 }}>
        {actions.map((action, idx) => {
          const Icon = iconMap[action.icon] || Plus;

          if (action.path) {
            return (
              <Link
                key={idx}
                to={createPageUrl(action.path)}
                style={btnStyle}
                onMouseEnter={e => { e.currentTarget.style.background = '#F1F5F9'; e.currentTarget.style.borderColor = '#CBD5E1'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = BORDER; }}
              >
                <Icon size={13} />
                <span>{action.label}</span>
              </Link>
            );
          }

          return (
            <button
              key={idx}
              style={btnStyle}
              onMouseEnter={e => { e.currentTarget.style.background = '#F1F5F9'; e.currentTarget.style.borderColor = '#CBD5E1'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = BORDER; }}
            >
              <Icon size={13} />
              <span>{action.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}