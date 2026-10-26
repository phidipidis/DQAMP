import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import {
  FileText, Flag, Target, Archive, FolderKanban, ClipboardList, Eye, TrendingUp,
  ShieldCheck, MessageSquare, Network, DollarSign, BarChart2,
  Crosshair, ScrollText, UserCog, Settings2, Calendar, LayoutDashboard,
  Layers, Compass, Activity, HeartPulse, BookOpen, Rocket, KeyRound,
  BarChart3, LineChart, Workflow, FileSearch, Contact, Bell, Building2,
  ClipboardCheck, Map, Wallet, GitCompare, FileCheck, Gauge, History, FolderOpen, Scale,
  Library, LifeBuoy, ListTodo, Settings, CheckCheck, FileBarChart
} from 'lucide-react';
import AccessLevelIcon from './AccessLevelIcon';

const iconMap = {
  FileText, Flag, Target, Archive, FolderKanban, ClipboardList, Eye, TrendingUp,
  ShieldCheck, MessageSquare, Network, DollarSign, BarChart2,
  Crosshair, ScrollText, UserCog, Settings2, Calendar, LayoutDashboard,
  Layers, Compass, Activity, HeartPulse, BookOpen, Rocket, KeyRound,
  BarChart3, LineChart, Workflow, FileSearch, Contact, Bell, Building2,
  ClipboardCheck, Map, Wallet, GitCompare, FileCheck, Gauge, History, FolderOpen, Scale,
  Library, LifeBuoy, ListTodo, Settings, CheckCheck, FileBarChart
};

const BRAND = '#0B2EA9';
const BRAND_SOFT = '#EAF0FF';
const MUTED = '#6B7280';
const TEXT = '#374151';
const TEXT_DARK = '#0F172A';

export default function NavItem({ item, isActive, badgeCount }) {
  const Icon = iconMap[item.icon] || FileText;

  const content = (
    <>
      <Icon
        size={15}
        style={{ flexShrink: 0, color: isActive ? BRAND : MUTED }}
      />
      <span style={{
        flex: 1, fontSize: 13, fontWeight: isActive ? 600 : 500,
        color: isActive ? BRAND : TEXT_DARK,
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
      }}>
        {item.name}
      </span>
      {item.access && <AccessLevelIcon accessLevel={item.access} />}
      {badgeCount !== undefined && badgeCount > 0 && (
        <span style={{
          fontSize: 10, fontWeight: 600, color: BRAND, background: BRAND_SOFT,
          padding: '1px 7px', borderRadius: 999, minWidth: 18, textAlign: 'center',
        }}>
          {badgeCount}
        </span>
      )}
      {item.badge && !badgeCount && item.badge !== 'count' && item.badge !== 'pending_count' && (
        <span style={{
          fontSize: 10, fontWeight: 600, color: BRAND, background: BRAND_SOFT,
          padding: '1px 7px', borderRadius: 999, minWidth: 18, textAlign: 'center',
        }}>
          {item.badge}
        </span>
      )}
    </>
  );

  return (
    <Link
      to={createPageUrl(item.path)}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '7px 12px', margin: '1px 12px',
        borderRadius: 6, textDecoration: 'none',
        fontFamily: "'Public Sans', system-ui, sans-serif",
        background: isActive ? BRAND_SOFT : 'transparent',
        transition: 'background 0.13s',
      }}
      onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = '#F1F5F9'; }}
      onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
    >
      {content}
    </Link>
  );
}