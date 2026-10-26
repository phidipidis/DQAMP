export const navigationConfig = {
  Implementer: {
    sections: [
      {
        name: "STRATEGIC CONTEXT",
        icon: "Compass",
        access: "read-only",
        collapsed: true,
        items: [
          { name: "Organizational Goals", icon: "Flag", path: "OrganizationalGoals", access: "read-only" },
          { name: "Division Objectives", icon: "Target", path: "DivisionObjectives", access: "read-only" }
        ]
      },
      {
        name: "MY WORK",
        icon: "Layers",
        access: "full",
        collapsed: false,
        items: [
          { name: "My Outputs", icon: "Archive", path: "Outputs", filter: "assigned_to=current_user", badge: "count", badgeKey: "my_outputs_count" },
          { name: "My Projects", icon: "FolderKanban", path: "Projects", filter: "team_members_includes=current_user", badge: "count", badgeKey: "my_projects_count" },
          { name: "My Activities", icon: "ClipboardList", path: "Activities", filter: "responsible_person=current_user", badge: "pending_count" },
          { name: "Activity Calendar", icon: "CalendarDays", path: "ActivityCalendar" }
        ]
      },
      {
        name: "MY PERFORMANCE",
        icon: "BarChart2",
        access: "filtered",
        collapsed: true,
        items: [
          { name: "Activity Status", icon: "BarChart2", path: "MainDashboard", filter: "user_id=current_user" },
          { name: "My QAME Results", icon: "ShieldCheck", path: "QAMEAssessors", filter: "assessed_user=current_user" },
          { name: "Client Feedback", icon: "MessageSquare", path: "ARTAFeedback", filter: "activity_owner=current_user" }
        ]
      },
      {
        name: "MY REPORTS",
        icon: "FileText",
        access: "filtered",
        collapsed: true,
        items: [
          { name: "My Activities Report", icon: "ClipboardList", path: "PIRPAReport", filter: "responsible_person=current_user" },
          { name: "My Budget Usage", icon: "DollarSign", path: "FinancialUtilizationReport", filter: "responsible_person=current_user" },
          { name: "My Performance Summary", icon: "TrendingUp", path: "ReportCenter", filter: "user_id=current_user" }
        ]
      },
      {
        name: "SUPPORT",
        icon: "ShieldCheck",
        access: "read-only",
        collapsed: true,
        items: [
          { name: "Pilot Onboarding", icon: "Rocket", path: "pilot-onboarding", access: "full" },
          { name: "Data Dictionary", icon: "BookOpen", path: "data-dictionary", access: "read-only" },
          { name: "Division Contacts", icon: "Contact", path: "division-contacts", access: "read-only" },
          { name: "Notifications", icon: "Bell", path: "notifications", access: "full" },
          { name: "Document Repository", icon: "FolderOpen", path: "document-repository", access: "full" },
          { name: "Project Calendar", icon: "CalendarDays", path: "project-calendar", access: "read-only" },
          { name: "Data Governance", icon: "Scale", path: "data-governance", access: "read-only" },
          { name: "Help Center", icon: "LifeBuoy", path: "help-center", access: "full" },
          { name: "Report Generator", icon: "FileBarChart", path: "report-generator", access: "full" }
        ]
      }
    ],
    quick_actions: []
  },

  Planning_Admin: {
    sections: [
      {
        name: "STRATEGIC LEVEL",
        icon: "Compass",
        access: "full",
        collapsed: false,
        items: [
          { name: "Dashboard", icon: "LayoutDashboard", path: "MainDashboard" },
          { name: "Organizational Goals", icon: "Flag", path: "OrganizationalGoals" },
          { name: "Division Objectives", icon: "Target", path: "DivisionObjectives" }
        ]
      },
      {
        name: "OPERATIONAL LEVEL",
        icon: "Layers",
        access: "full",
        collapsed: false,
        items: [
          { name: "Outputs", icon: "Archive", path: "Outputs" },
          { name: "Projects", icon: "FolderKanban", path: "Projects", badge: "pending_approval_count" },
          { name: "Activities", icon: "ClipboardList", path: "Activities" },
          { name: "Activity Calendar", icon: "CalendarDays", path: "ActivityCalendar" }
        ]
      },
      {
        name: "MONITORING LEVEL",
        icon: "Activity",
        access: "read-only",
        collapsed: true,
        items: [
          { name: "Executive View", icon: "Eye", path: "ExecutiveDashboard", access: "read-only" },
          { name: "Performance Tracking", icon: "BarChart2", path: "ProjectPerformance", access: "read-only" },
          { name: "QAME Assessments", icon: "ShieldCheck", path: "QAMEAssessors", access: "read-only" },
          { name: "ARTA Feedback", icon: "MessageSquare", path: "ARTAFeedback", access: "read-only" }
        ]
      },
      {
        name: "INSIGHTS LEVEL",
        icon: "TrendingUp",
        access: "full",
        collapsed: true,
        items: [
          { name: "Theory of Change", icon: "Network", path: "ResultsChain" },
          { name: "Financial Analysis", icon: "DollarSign", path: "FinancialDashboard" },
          { name: "S-Curve Analysis", icon: "TrendingUp", path: "SCurveDashboard" },
          { name: "Line of Sight", icon: "Crosshair", path: "LineOfSight" }
        ]
      },
      {
        name: "REPORTS",
        icon: "FileText",
        access: "full",
        collapsed: true,
        items: [
          { name: "Report Center", icon: "FileText", path: "ReportCenter" }
        ]
      },
      {
        name: "SUPPORT",
        icon: "ShieldCheck",
        access: "full",
        collapsed: true,
        items: [
          { name: "Pilot Onboarding", icon: "Rocket", path: "pilot-onboarding" },
          { name: "Data Dictionary", icon: "BookOpen", path: "data-dictionary" },
          { name: "Division Contacts", icon: "Contact", path: "division-contacts" },
          { name: "Notifications", icon: "Bell", path: "notifications" },
          { name: "Organization Hierarchy", icon: "Building2", path: "organization-hierarchy" },
          { name: "Workflow Monitor", icon: "Workflow", path: "workflow-monitor" },
          { name: "Division Performance", icon: "BarChart3", path: "division-performance-summary" },
          { name: "Compliance Trends", icon: "LineChart", path: "compliance-trends" },
          { name: "Archived Projects", icon: "Archive", path: "archived-projects" },
          { name: "Strategic Roadmap", icon: "Map", path: "strategic-roadmap" },
          { name: "Project Calendar", icon: "CalendarDays", path: "project-calendar" },
          { name: "Target Indicators", icon: "Gauge", path: "target-indicators" },
          { name: "Resource Allocation", icon: "Wallet", path: "resource-allocation" },
          { name: "Compliance Tracker", icon: "ClipboardCheck", path: "compliance-tracker" },
          { name: "Division Performance", icon: "Building2", path: "division-performance" },
          { name: "Document Repository", icon: "FolderOpen", path: "document-repository" },
          { name: "Data Governance", icon: "Scale", path: "data-governance" },
          { name: "Document Library", icon: "Library", path: "document-library" },
          { name: "Help Center", icon: "LifeBuoy", path: "help-center" },
          { name: "Data Archive", icon: "Archive", path: "data-archive" },
          { name: "Report Generator", icon: "FileBarChart", path: "report-generator" },
          { name: "Approval Workflow", icon: "CheckCheck", path: "approval-workflow" },
          { name: "Task Manager", icon: "ListTodo", path: "task-manager" }
        ]
      }
    ],
    quick_actions: []
  },

  QA_Assessor: {
    sections: [
      {
        name: "STRATEGIC CONTEXT",
        icon: "Compass",
        access: "read-only",
        collapsed: true,
        items: [
          { name: "Organizational Goals", icon: "Flag", path: "OrganizationalGoals", access: "read-only" },
          { name: "Division Objectives", icon: "Target", path: "DivisionObjectives", access: "read-only" }
        ]
      },
      {
        name: "OPERATIONAL CONTEXT",
        icon: "Layers",
        access: "read-only",
        collapsed: true,
        items: [
          { name: "Projects", icon: "FolderKanban", path: "Projects", access: "read-only" },
          { name: "Activities", icon: "ClipboardList", path: "Activities", access: "read-only" }
        ]
      },
      {
        name: "MONITORING LEVEL",
        icon: "ShieldCheck",
        access: "full",
        collapsed: false,
        items: [
          { name: "QAME Assessments", icon: "ShieldCheck", path: "QAMEAssessors", badge: "pending_assessments_count" },
          { name: "Assessment Calendar", icon: "Calendar", path: "Activities" },
          { name: "ARTA Feedback Management", icon: "MessageSquare", path: "ARTAFeedback" },
          { name: "Quality Dashboard", icon: "BarChart2", path: "ARTADashboard" }
        ]
      },
      {
        name: "QUALITY REPORTS",
        icon: "FileText",
        access: "filtered",
        collapsed: true,
        items: [
          { name: "QAME Tools Report", icon: "ScrollText", path: "QAMEToolsReport" },
          { name: "Consolidated QAME Report", icon: "ScrollText", path: "ConsolidatedQAMEReport" },
          { name: "ARTA CSM Summary", icon: "ScrollText", path: "ARTACSMSummary" }
        ]
      },
      {
        name: "SUPPORT",
        icon: "BarChart2",
        access: "read-only",
        collapsed: true,
        items: [
          { name: "Pilot Onboarding", icon: "Rocket", path: "pilot-onboarding", access: "full" },
          { name: "Data Dictionary", icon: "BookOpen", path: "data-dictionary", access: "read-only" },
          { name: "Division Contacts", icon: "Contact", path: "division-contacts", access: "read-only" },
          { name: "Notifications", icon: "Bell", path: "notifications", access: "full" },
          { name: "Compliance Trends", icon: "LineChart", path: "compliance-trends", access: "read-only" },
          { name: "Workflow Monitor", icon: "Workflow", path: "workflow-monitor", access: "read-only" },
          { name: "Quality Audit", icon: "FileCheck", path: "quality-audit", access: "full" },
          { name: "Compliance Tracker", icon: "ClipboardCheck", path: "compliance-tracker", access: "read-only" },
          { name: "Feedback Analytics", icon: "BarChart3", path: "feedback-analytics", access: "read-only" },
          { name: "Document Repository", icon: "FolderOpen", path: "document-repository", access: "full" },
          { name: "Data Governance", icon: "Scale", path: "data-governance", access: "read-only" },
          { name: "Help Center", icon: "LifeBuoy", path: "help-center", access: "full" },
          { name: "Task Manager", icon: "ListTodo", path: "task-manager", access: "full" },
          { name: "Approval Workflow", icon: "CheckCheck", path: "approval-workflow", access: "full" },
          { name: "Report Generator", icon: "FileBarChart", path: "report-generator", access: "full" }
        ]
      }
    ],
    quick_actions: []
  },

  admin: {
    sections: [
      {
        name: "STRATEGIC LEVEL",
        icon: "Compass",
        access: "full",
        collapsed: false,
        items: [
          { name: "Dashboard", icon: "LayoutDashboard", path: "MainDashboard" },
          { name: "Organizational Goals", icon: "Flag", path: "OrganizationalGoals" },
          { name: "Division Objectives", icon: "Target", path: "DivisionObjectives" }
        ]
      },
      {
        name: "OPERATIONAL LEVEL",
        icon: "Layers",
        access: "full",
        collapsed: false,
        items: [
          { name: "Outputs", icon: "Archive", path: "Outputs" },
          { name: "Projects", icon: "FolderKanban", path: "Projects" },
          { name: "Activities", icon: "ClipboardList", path: "Activities" },
          { name: "Activity Calendar", icon: "CalendarDays", path: "ActivityCalendar" }
        ]
      },
      {
        name: "MONITORING LEVEL",
        icon: "Activity",
        access: "full",
        collapsed: true,
        items: [
          { name: "Executive View", icon: "Eye", path: "ExecutiveDashboard" },
          { name: "Performance Tracking", icon: "BarChart2", path: "ProjectPerformance" },
          { name: "QAME Assessments", icon: "ShieldCheck", path: "QAMEAssessors" },
          { name: "ARTA Feedback", icon: "MessageSquare", path: "ARTAFeedback" }
        ]
      },
      {
        name: "INSIGHTS LEVEL",
        icon: "TrendingUp",
        access: "full",
        collapsed: true,
        items: [
          { name: "Theory of Change", icon: "Network", path: "ResultsChain" },
          { name: "Financial Analysis", icon: "DollarSign", path: "FinancialDashboard" },
          { name: "S-Curve Analysis", icon: "TrendingUp", path: "SCurveDashboard" },
          { name: "Line of Sight", icon: "Crosshair", path: "LineOfSight" }
        ]
      },
      {
        name: "REPORTS",
        icon: "FileText",
        access: "full",
        collapsed: true,
        items: [
          { name: "Report Center", icon: "FileText", path: "ReportCenter" },
          { name: "Report Generator", icon: "FileBarChart", path: "report-generator" }
        ]
      },
      {
        name: "SYSTEM",
        icon: "Settings2",
        access: "full",
        collapsed: true,
        items: [
          { name: "Audit Trail", icon: "ScrollText", path: "AuditLogs" },
          { name: "User Management", icon: "UserCog", path: "UserManagement" },
          { name: "System Settings", icon: "Settings", path: "system-settings" },
          { name: "Help Center", icon: "LifeBuoy", path: "help-center" }
        ]
      },
      {
        name: "GOVERNANCE & SUPPORT",
        icon: "ShieldCheck",
        access: "full",
        collapsed: true,
        items: [
          { name: "System Health", icon: "HeartPulse", path: "system-health" },
          { name: "Document Library", icon: "Library", path: "document-library" },
          { name: "Data Dictionary", icon: "BookOpen", path: "data-dictionary" },
          { name: "User Roles", icon: "KeyRound", path: "user-roles" },
          { name: "Data Integrity Reports", icon: "FileSearch", path: "data-integrity-reports" },
          { name: "Division Contacts", icon: "Contact", path: "division-contacts" },
          { name: "Organization Hierarchy", icon: "Building2", path: "organization-hierarchy" },
          { name: "Workflow Monitor", icon: "Workflow", path: "workflow-monitor" },
          { name: "Division Performance", icon: "BarChart3", path: "division-performance-summary" },
          { name: "Compliance Trends", icon: "LineChart", path: "compliance-trends" },
          { name: "Archived Projects", icon: "Archive", path: "archived-projects" },
          { name: "Pilot Onboarding", icon: "Rocket", path: "pilot-onboarding" },
          { name: "Notifications", icon: "Bell", path: "notifications" }
        ]
      },
      {
        name: "MONITORING & ANALYTICS",
        icon: "BarChart2",
        access: "full",
        collapsed: true,
        items: [
          { name: "Compliance Tracker", icon: "ClipboardCheck", path: "compliance-tracker" },
          { name: "Feedback Analytics", icon: "BarChart3", path: "feedback-analytics" },
          { name: "Resource Allocation", icon: "Wallet", path: "resource-allocation" },
          { name: "Division Performance", icon: "Building2", path: "division-performance" },
          { name: "Quality Audit", icon: "FileCheck", path: "quality-audit" },
          { name: "User Activity", icon: "History", path: "user-activity" },
          { name: "Task Manager", icon: "ListTodo", path: "task-manager" },
          { name: "Approval Workflow", icon: "CheckCheck", path: "approval-workflow" }
        ]
      },
      {
        name: "PLANNING & RESOURCES",
        icon: "Map",
        access: "full",
        collapsed: true,
        items: [
          { name: "Strategic Roadmap", icon: "Map", path: "strategic-roadmap" },
          { name: "Project Calendar", icon: "CalendarDays", path: "project-calendar" },
          { name: "Target Indicators", icon: "Gauge", path: "target-indicators" },
          { name: "Document Repository", icon: "FolderOpen", path: "document-repository" },
          { name: "Data Reconciliation", icon: "GitCompare", path: "data-reconciliation" },
          { name: "Data Governance", icon: "Scale", path: "data-governance" },
          { name: "Data Archive", icon: "Archive", path: "data-archive" }
        ]
      }
    ],
    quick_actions: []
  }
};