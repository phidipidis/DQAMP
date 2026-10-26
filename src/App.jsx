import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import NavigationTracker from '@/lib/NavigationTracker'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import SystemHealth from './pages/SystemHealth';
import DataDictionary from './pages/DataDictionary';
import OrganizationHierarchy from './pages/OrganizationHierarchy';
import PilotOnboarding from './pages/PilotOnboarding';
import UserRoles from './pages/UserRoles';
import DivisionPerformanceSummary from './pages/DivisionPerformanceSummary';
import ComplianceTrends from './pages/ComplianceTrends';
import WorkflowMonitor from './pages/WorkflowMonitor';
import ArchivedProjects from './pages/ArchivedProjects';
import DataIntegrityReports from './pages/DataIntegrityReports';
import DivisionContacts from './pages/DivisionContacts';
import Notifications from './pages/Notifications';
import ComplianceTracker from './pages/ComplianceTracker';
import StrategicRoadmap from './pages/StrategicRoadmap';
import FeedbackAnalytics from './pages/FeedbackAnalytics';
import ResourceAllocation from './pages/ResourceAllocation';
import DataReconciliation from './pages/DataReconciliation';
import QualityAudit from './pages/QualityAudit';
import TargetIndicators from './pages/TargetIndicators';
import UserActivity from './pages/UserActivity';
import DivisionPerformance from './pages/DivisionPerformance';
import ProjectCalendar from './pages/ProjectCalendar';
import DocumentRepository from './pages/DocumentRepository';
import DataGovernance from './pages/DataGovernance';
import DocumentLibrary from './pages/DocumentLibrary';
import HelpCenter from './pages/HelpCenter';
import TaskManager from './pages/TaskManager';
import SystemSettings from './pages/SystemSettings';
import DataArchive from './pages/DataArchive';
import ApprovalWorkflow from './pages/ApprovalWorkflow';
import ReportGenerator from './pages/ReportGenerator';

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;

const LayoutWrapper = ({ children, currentPageName }) => Layout ?
  <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>;

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <Routes>
      <Route path="/" element={
        <LayoutWrapper currentPageName={mainPageKey}>
          <MainPage />
        </LayoutWrapper>
      } />
      {Object.entries(Pages).map(([path, Page]) => (
        <Route
          key={path}
          path={`/${path}`}
          element={
            <LayoutWrapper currentPageName={path}>
              <Page />
            </LayoutWrapper>
          }
        />
      ))}
      <Route path="/system-health" element={<LayoutWrapper currentPageName="system-health"><SystemHealth /></LayoutWrapper>} />
      <Route path="/data-dictionary" element={<LayoutWrapper currentPageName="data-dictionary"><DataDictionary /></LayoutWrapper>} />
      <Route path="/organization-hierarchy" element={<LayoutWrapper currentPageName="organization-hierarchy"><OrganizationHierarchy /></LayoutWrapper>} />
      <Route path="/pilot-onboarding" element={<LayoutWrapper currentPageName="pilot-onboarding"><PilotOnboarding /></LayoutWrapper>} />
      <Route path="/user-roles" element={<LayoutWrapper currentPageName="user-roles"><UserRoles /></LayoutWrapper>} />
      <Route path="/division-performance-summary" element={<LayoutWrapper currentPageName="division-performance-summary"><DivisionPerformanceSummary /></LayoutWrapper>} />
      <Route path="/compliance-trends" element={<LayoutWrapper currentPageName="compliance-trends"><ComplianceTrends /></LayoutWrapper>} />
      <Route path="/workflow-monitor" element={<LayoutWrapper currentPageName="workflow-monitor"><WorkflowMonitor /></LayoutWrapper>} />
      <Route path="/archived-projects" element={<LayoutWrapper currentPageName="archived-projects"><ArchivedProjects /></LayoutWrapper>} />
      <Route path="/data-integrity-reports" element={<LayoutWrapper currentPageName="data-integrity-reports"><DataIntegrityReports /></LayoutWrapper>} />
      <Route path="/division-contacts" element={<LayoutWrapper currentPageName="division-contacts"><DivisionContacts /></LayoutWrapper>} />
      <Route path="/notifications" element={<LayoutWrapper currentPageName="notifications"><Notifications /></LayoutWrapper>} />
      <Route path="/compliance-tracker" element={<LayoutWrapper currentPageName="compliance-tracker"><ComplianceTracker /></LayoutWrapper>} />
      <Route path="/strategic-roadmap" element={<LayoutWrapper currentPageName="strategic-roadmap"><StrategicRoadmap /></LayoutWrapper>} />
      <Route path="/feedback-analytics" element={<LayoutWrapper currentPageName="feedback-analytics"><FeedbackAnalytics /></LayoutWrapper>} />
      <Route path="/resource-allocation" element={<LayoutWrapper currentPageName="resource-allocation"><ResourceAllocation /></LayoutWrapper>} />
      <Route path="/data-reconciliation" element={<LayoutWrapper currentPageName="data-reconciliation"><DataReconciliation /></LayoutWrapper>} />
      <Route path="/quality-audit" element={<LayoutWrapper currentPageName="quality-audit"><QualityAudit /></LayoutWrapper>} />
      <Route path="/target-indicators" element={<LayoutWrapper currentPageName="target-indicators"><TargetIndicators /></LayoutWrapper>} />
      <Route path="/user-activity" element={<LayoutWrapper currentPageName="user-activity"><UserActivity /></LayoutWrapper>} />
      <Route path="/division-performance" element={<LayoutWrapper currentPageName="division-performance"><DivisionPerformance /></LayoutWrapper>} />
      <Route path="/project-calendar" element={<LayoutWrapper currentPageName="project-calendar"><ProjectCalendar /></LayoutWrapper>} />
      <Route path="/document-repository" element={<LayoutWrapper currentPageName="document-repository"><DocumentRepository /></LayoutWrapper>} />
      <Route path="/data-governance" element={<LayoutWrapper currentPageName="data-governance"><DataGovernance /></LayoutWrapper>} />
      <Route path="/document-library" element={<LayoutWrapper currentPageName="document-library"><DocumentLibrary /></LayoutWrapper>} />
      <Route path="/help-center" element={<LayoutWrapper currentPageName="help-center"><HelpCenter /></LayoutWrapper>} />
      <Route path="/task-manager" element={<LayoutWrapper currentPageName="task-manager"><TaskManager /></LayoutWrapper>} />
      <Route path="/system-settings" element={<LayoutWrapper currentPageName="system-settings"><SystemSettings /></LayoutWrapper>} />
      <Route path="/data-archive" element={<LayoutWrapper currentPageName="data-archive"><DataArchive /></LayoutWrapper>} />
      <Route path="/approval-workflow" element={<LayoutWrapper currentPageName="approval-workflow"><ApprovalWorkflow /></LayoutWrapper>} />
      <Route path="/report-generator" element={<LayoutWrapper currentPageName="report-generator"><ReportGenerator /></LayoutWrapper>} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <NavigationTracker />
          <AuthenticatedApp />
        </Router>
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App