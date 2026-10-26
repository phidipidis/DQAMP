import { useState, useEffect } from 'react';
import { navigationConfig } from '../config/roleBasedNavigation';
import { pagesConfig } from '../../pages.config';
import { useNotificationCounts } from '../hooks/useNotificationCounts';
import SidebarHeader from './SidebarHeader';
import QuickActions from './QuickActions';
import NavigationSection from './NavigationSection';
import UserProfile from './UserProfile';

const BORDER = '#E5E9F0';

export default function Sidebar({ user, onLogout, currentPageName, open = false }) {
  const [collapsedSections, setCollapsedSections] = useState({});
  const { data: notificationCounts = {} } = useNotificationCounts(user);

  const userRole = user?.role || 'Implementer';
  const config = navigationConfig[userRole] || navigationConfig.Implementer;

  // Only list pages this local build actually routes.
  const availablePages = new Set(Object.keys(pagesConfig.Pages));
  const sections = (config.sections || [])
    .map((section) => ({ ...section, items: (section.items || []).filter((item) => availablePages.has(item.path)) }))
    .filter((section) => section.items.length > 0);

  useEffect(() => {
    const initialState = {};
    sections.forEach((section, idx) => {
      initialState[idx] = section.collapsed || false;
    });
    setCollapsedSections(initialState);
  }, [userRole]);

  const toggleSection = (idx) => {
    setCollapsedSections(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  return (
    <aside
      aria-label="Main navigation"
      className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col transition-transform duration-200 lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}
      style={{
        background: '#fff', borderRight: `1px solid ${BORDER}`,
        fontFamily: "'Public Sans', system-ui, sans-serif",
      }}
    >
      <SidebarHeader />
      <QuickActions actions={config.quick_actions} />
      <nav className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300" style={{ padding: '8px 0' }}>
        {sections.map((section, idx) => (
          <NavigationSection
            key={idx}
            section={section}
            isCollapsed={collapsedSections[idx]}
            onToggle={() => toggleSection(idx)}
            currentPageName={currentPageName}
            notificationCounts={notificationCounts}
          />
        ))}
      </nav>
      <UserProfile user={user} onLogout={onLogout} />
    </aside>
  );
}