/**
 * Pages routed in this local build. Each page loads on demand.
 * The sidebar and Report Center only show pages listed here.
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
const ARTAFeedback = lazy(() => import('./pages/ARTAFeedback'));

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
    "ARTAFeedback": ARTAFeedback,
}

export const pagesConfig = {
    mainPage: "MainDashboard",
    Pages: PAGES,
    Layout: __Layout,
};
