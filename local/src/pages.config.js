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
import MainDashboard from './pages/MainDashboard';
import OrganizationalGoals from './pages/OrganizationalGoals';
import DivisionObjectives from './pages/DivisionObjectives';
import Projects from './pages/Projects';
import ProjectView from './pages/ProjectView';
import ProjectWorkspace from './pages/ProjectWorkspace';
import Outputs from './pages/Outputs';
import OutputDetail from './pages/OutputDetail';
import Activities from './pages/Activities';
import ActivityView from './pages/ActivityView';
import ActivityForm from './pages/ActivityForm';
import ActivityCalendar from './pages/ActivityCalendar';
import ActivityImport from './pages/ActivityImport';
import UserManagement from './pages/UserManagement';
import SystemSettings from './pages/SystemSettings';
import ReportCenter from './pages/ReportCenter';
import PIRPAReport from './pages/PIRPAReport';
import __Layout from './Layout.jsx';


export const PAGES = {
    "MainDashboard": MainDashboard,
    "OrganizationalGoals": OrganizationalGoals,
    "DivisionObjectives": DivisionObjectives,
    "Projects": Projects,
    "ProjectView": ProjectView,
    "ProjectWorkspace": ProjectWorkspace,
    "Outputs": Outputs,
    "OutputDetail": OutputDetail,
    "Activities": Activities,
    "ActivityView": ActivityView,
    "ActivityForm": ActivityForm,
    "ActivityCalendar": ActivityCalendar,
    "ActivityImport": ActivityImport,
    "UserManagement": UserManagement,
    "SystemSettings": SystemSettings,
    "ReportCenter": ReportCenter,
    "PIRPAReport": PIRPAReport,
}

export const pagesConfig = {
    mainPage: "MainDashboard",
    Pages: PAGES,
    Layout: __Layout,
};
