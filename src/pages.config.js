/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import ARTACSMSummary from './pages/ARTACSMSummary';
import ARTADashboard from './pages/ARTADashboard';
import ARTAFeedback from './pages/ARTAFeedback';
import Activities from './pages/Activities';
import ActivityCalendar from './pages/ActivityCalendar';
import ActivityForm from './pages/ActivityForm';
import ActivityImport from './pages/ActivityImport';
import ActivityView from './pages/ActivityView';
import AuditLogs from './pages/AuditLogs';
import ConsolidatedQAMEReport from './pages/ConsolidatedQAMEReport';
import ExecutiveDashboard from './pages/ExecutiveDashboard';
import FinancialDashboard from './pages/FinancialDashboard';
import FinancialUtilizationReport from './pages/FinancialUtilizationReport';
import FunctionalDivision from './pages/FunctionalDivision';
import HierarchyDashboard from './pages/HierarchyDashboard';
import LineOfSight from './pages/LineOfSight';
import MainDashboard from './pages/MainDashboard';
import DivisionObjectives from './pages/DivisionObjectives';
import Objectives from './pages/Objectives';
import OrganizationalGoals from './pages/OrganizationalGoals';
import OutputDetail from './pages/OutputDetail';
import Outputs from './pages/Outputs';
import PIRPAReport from './pages/PIRPAReport';
import ProjectPerformance from './pages/ProjectPerformance';
import ProjectView from './pages/ProjectView';
import ProjectWorkspace from './pages/ProjectWorkspace';
import Projects from './pages/Projects';
import QAMEAssessors from './pages/QAMEAssessors';
import QAMEToolsReport from './pages/QAMEToolsReport';
import PartnershipReport from './pages/PartnershipReport';
import ReportCenter from './pages/ReportCenter';
import ResultsChain from './pages/ResultsChain';
import SCurveDashboard from './pages/SCurveDashboard';
import UserManagement from './pages/UserManagement';
import __Layout from './Layout.jsx';


export const PAGES = {
    "ARTACSMSummary": ARTACSMSummary,
    "ARTADashboard": ARTADashboard,
    "ARTAFeedback": ARTAFeedback,
    "Activities": Activities,
    "ActivityCalendar": ActivityCalendar,
    "ActivityForm": ActivityForm,
    "ActivityImport": ActivityImport,
    "ActivityView": ActivityView,
    "AuditLogs": AuditLogs,
    "ConsolidatedQAMEReport": ConsolidatedQAMEReport,
    "ExecutiveDashboard": ExecutiveDashboard,
    "FinancialDashboard": FinancialDashboard,
    "FinancialUtilizationReport": FinancialUtilizationReport,
    "FunctionalDivision": FunctionalDivision,
    "HierarchyDashboard": HierarchyDashboard,
    "LineOfSight": LineOfSight,
    "MainDashboard": MainDashboard,
    "DivisionObjectives": DivisionObjectives,
    "Objectives": Objectives,
    "OrganizationalGoals": OrganizationalGoals,
    "OutputDetail": OutputDetail,
    "Outputs": Outputs,
    "PIRPAReport": PIRPAReport,
    "ProjectPerformance": ProjectPerformance,
    "ProjectView": ProjectView,
    "ProjectWorkspace": ProjectWorkspace,
    "Projects": Projects,
    "QAMEAssessors": QAMEAssessors,
    "QAMEToolsReport": QAMEToolsReport,
    "PartnershipReport": PartnershipReport,
    "ReportCenter": ReportCenter,
    "ResultsChain": ResultsChain,
    "SCurveDashboard": SCurveDashboard,
    "UserManagement": UserManagement,
}

export const pagesConfig = {
    mainPage: "MainDashboard",
    Pages: PAGES,
    Layout: __Layout,
};