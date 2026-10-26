import { PageHeader } from './DashboardSystem';

/**
 * SharedPageContainer – standard page wrapper using the shared dashboard system.
 * Provides consistent page header and spacing.
 * Does NOT modify any data, logic, or navigation.
 */
export default function SharedPageContainer({ title, subtitle, icon: Icon, actions, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, fontFamily: "'Public Sans', system-ui, sans-serif" }}>
      <PageHeader title={title} subtitle={subtitle} actions={actions} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {children}
      </div>
    </div>
  );
}