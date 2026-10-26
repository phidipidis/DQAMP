import React, { useState, useEffect } from 'react';
import { navigationConfig } from '../config/roleBasedNavigation';
import { useNotificationCounts } from '../hooks/useNotificationCounts';
import SidebarHeader from './SidebarHeader';
import QuickActions from './QuickActions';
import NavigationSection from './NavigationSection';
import UserProfile from './UserProfile';

const BORDER = '#E5E9F0';

export default function Sidebar({ user, onLogout, currentPageName }) {
  const [collapsedSections, setCollapsedSections] = useState({});
  const { data: notificationCounts = {} } = useNotificationCounts(user);

  const userRole = user?.role || 'Implementer';
  const config = navigationConfig[userRole] || navigationConfig.Implementer;

  useEffect(() => {
    const initialState = {};
    config.sections?.forEach((section, idx) => {
      initialState[idx] = section.collapsed || false;
    });
    setCollapsedSections(initialState);
  }, [userRole]);

  const toggleSection = (idx) => {
    setCollapsedSections(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  return (
    <aside style={{
      position: 'fixed', left: 0, top: 0, width: 256, height: '100vh',
      display: 'flex', flexDirection: 'column',
      background: '#fff', borderRight: `1px solid ${BORDER}`,
      fontFamily: "'Public Sans', system-ui, sans-serif",
    }}>
      <SidebarHeader />
      <QuickActions actions={config.quick_actions} />
      <nav className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300" style={{ padding: '8px 0' }}>
        {config.sections?.map((section, idx) => (
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