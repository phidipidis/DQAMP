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
 *   import { lazy } from 'react';
import __Layout from './Layout.jsx';

const MainDashboard = lazy(() => import('./pages/MainDashboard'));
const OrganizationalGoals = lazy(() => import('./pages/OrganizationalGoals'));
const DivisionObjectives = lazy(() => import('./pages/DivisionObjectives'));
const Projects = lazy(() => import('./pages/Projects'));
const ProjectView = lazy(() => import('./pages/ProjectView'));
const ProjectWorkspace = lazy(() => import('./pages/ProjectWorkspace'));
const Outputs = lazy(() => import('./pages/Outputs'));
const OutputDetail = lazy(() => import('./pages/OutputDetail'));
const Activities = lazy(() => import('./pages/Activities'));
const ActivityView = lazy(() => import('./pages/ActivityView'));
const ActivityForm = lazy(() => import('./pages/ActivityForm'));
const ActivityCalendar = lazy(() => import('./pages/ActivityCalendar'));
const ActivityImport = lazy(() => import('./pages/ActivityImport'));
const UserManagement = lazy(() => import('./pages/UserManagement'));
const SystemSettings = lazy(() => import('./pages/SystemSettings'));
const ReportCenter = lazy(() => import('./pages/ReportCenter'));
const PIRPAReport = lazy(() => import('./pages/PIRPAReport'));
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
import { lazy } from 'react';
import __Layout from './Layout.jsx';

const MainDashboard = lazy(() => import('./pages/MainDashboard'));
const OrganizationalGoals = lazy(() => import('./pages/OrganizationalGoals'));
const DivisionObjectives = lazy(() => import('./pages/DivisionObjectives'));
const Projects = lazy(() => import('./pages/Projects'));
const ProjectView = lazy(() => import('./pages/ProjectView'));
const ProjectWorkspace = lazy(() => import('./pages/ProjectWorkspace'));
const Outputs = lazy(() => import('./pages/Outputs'));
const OutputDetail = lazy(() => import('./pages/OutputDetail'));
const Activities = lazy(() => import('./pages/Activities'));
const ActivityView = lazy(() => import('./pages/ActivityView'));
const ActivityForm = lazy(() => import('./pages/ActivityForm'));
const ActivityCalendar = lazy(() => import('./pages/ActivityCalendar'));
const ActivityImport = lazy(() => import('./pages/ActivityImport'));
const UserManagement = lazy(() => import('./pages/UserManagement'));
const SystemSettings = lazy(() => import('./pages/SystemSettings'));
const ReportCenter = lazy(() => import('./pages/ReportCenter'));
const PIRPAReport = lazy(() => import('./pages/PIRPAReport'));


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
