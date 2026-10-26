import React from 'react';
import { ChevronDown, Compass, Layers, Activity, TrendingUp, FileText, Settings2, ShieldCheck, BarChart2, Map } from 'lucide-react';
import NavItem from './NavItem';
import AccessLevelIcon from './AccessLevelIcon';

const iconMap = {
  Compass, Layers, Activity, TrendingUp, FileText, Settings2, ShieldCheck, BarChart2, Map
};

const MUTED = '#6B7280';
const TEXT = '#0F172A';
const BORDER = '#E5E9F0';

export default function NavigationSection({
  section,
  isCollapsed,
  onToggle,
  currentPageName,
  notificationCounts = {}
}) {
  const Icon = iconMap[section.icon] || Compass;

  const getBadgeCount = (item) => {
    if (item.badge === 'count') {
      return notificationCounts[`my_${item.name.toLowerCase().replace(/\s+/g, '_')}_count`] || 0;
    }
    if (item.badge === 'pending_count') {
      return notificationCounts.pending_activities_count || 0;
    }
    if (item.badge === 'pending_approval_count') {
      return notificationCounts.pending_approval_count || 0;
    }
    if (item.badge === 'pending_assessments_count') {
      return notificationCounts.pending_assessments_count || 0;
    }
    return undefined;
  };

  return (
    <div style={{ marginBottom: 2 }}>
      <button
        onClick={onToggle}
        style={{
          width: '100%',
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '8px 20px',
          border: 'none', background: 'transparent', cursor: 'pointer',
          fontFamily: "'Public Sans', system-ui, sans-serif",
          fontSize: 11, fontWeight: 600, color: MUTED,
          letterSpacing: '0.08em', textTransform: 'uppercase',
          transition: 'color 0.13s',
        }}
        onMouseEnter={e => e.currentTarget.style.color = TEXT}
        onMouseLeave={e => e.currentTarget.style.color = MUTED}
      >
        <Icon size={13} style={{ flexShrink: 0, opacity: 0.7 }} />
        <span style={{ flex: 1, textAlign: 'left' }}>{section.name}</span>
        {section.access && <AccessLevelIcon accessLevel={section.access} />}
        <ChevronDown
          size={13}
          style={{ transition: 'transform 0.2s', transform: !isCollapsed ? 'rotate(180deg)' : 'none', flexShrink: 0 }}
        />
      </button>

      {!isCollapsed && (
        <div style={{ paddingBottom: 6 }}>
          {section.items.map((item, idx) => (
            <NavItem
              key={idx}
              item={item}
              isActive={currentPageName === item.path}
              badgeCount={getBadgeCount(item)}
            />
          ))}
        </div>
      )}
    </div>
  );
}