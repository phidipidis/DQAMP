import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  ChevronRight, 
  ChevronDown, 
  FolderKanban, 
  Package, 
  ClipboardList 
} from 'lucide-react';
import { cn } from "@/lib/utils";

const statusColors = {
  'Planning': 'bg-gray-100 text-gray-800',
  'Ongoing': 'bg-blue-100 text-blue-800',
  'Completed': 'bg-emerald-100 text-emerald-800',
  'Not Started': 'bg-gray-100 text-gray-800',
  'In Progress': 'bg-blue-100 text-blue-800',
  'Achieved': 'bg-emerald-100 text-emerald-800',
  'Not Achieved': 'bg-red-100 text-red-800',
  'Pending': 'bg-amber-100 text-amber-800',
  'Verified': 'bg-emerald-100 text-emerald-800',
  'Draft': 'bg-gray-100 text-gray-800',
  'Submitted': 'bg-blue-100 text-blue-800',
  'Under Review': 'bg-amber-100 text-amber-800',
  'Published': 'bg-emerald-100 text-emerald-800'
};

function TreeNode({ 
  icon: Icon, 
  label, 
  status, 
  progress, 
  indicator, 
  children, 
  level = 0,
  link,
  defaultExpanded = false
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const hasChildren = children && React.Children.count(children) > 0;

  return (
    <div className={cn("border-l-2 border-slate-200", level > 0 && "ml-6")}>
      <div 
        className={cn(
          "flex items-center gap-3 p-3 hover:bg-slate-50 cursor-pointer transition-colors",
          "border-b border-slate-100"
        )}
        onClick={() => hasChildren && setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2 min-w-[24px]">
          {hasChildren ? (
            expanded ? (
              <ChevronDown className="h-4 w-4 text-slate-400" />
            ) : (
              <ChevronRight className="h-4 w-4 text-slate-400" />
            )
          ) : (
            <div className="w-4" />
          )}
        </div>
        
        <div className={cn(
          "p-2 rounded-lg",
          level === 0 ? "bg-[#1e3a5f] text-white" :
          level === 1 ? "bg-[#0d9488] text-white" :
          level === 2 ? "bg-amber-500 text-white" :
          "bg-slate-200 text-slate-700"
        )}>
          <Icon className="h-4 w-4" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {link ? (
              <Link 
                to={link} 
                className="font-medium text-slate-800 hover:text-[#1e3a5f] hover:underline truncate"
                onClick={(e) => e.stopPropagation()}
              >
                {label}
              </Link>
            ) : (
              <span className="font-medium text-slate-800 truncate">{label}</span>
            )}
            {status && (
              <Badge className={cn("text-xs", statusColors[status] || 'bg-gray-100 text-gray-800')}>
                {status}
              </Badge>
            )}
          </div>
          {indicator && (
            <p className="text-xs text-slate-500 truncate">{indicator}</p>
          )}
        </div>
        
        <div className="flex items-center gap-3 min-w-[120px]">
          <div className="w-20">
            <Progress value={progress || 0} className="h-2" />
          </div>
          <span className="text-sm font-medium text-slate-600 w-10 text-right">
            {Math.round(progress || 0)}%
          </span>
        </div>
      </div>
      
      {hasChildren && expanded && (
        <div className="bg-slate-50/50">
          {children}
        </div>
      )}
    </div>
  );
}

export default function ResultsChainTree({ project, outputs, activities }) {
  // Theory of Change progress calculation
  const getActivityProgress = (activity) => {
    const statusMap = { 'Not Started': 0, 'In Progress': 50, 'Completed': 100, 'Cancelled': 0, 'Delayed': 25 };
    return statusMap[activity.Status] || 0;
  };

  // Calculate output progress from linked activities
  const getOutputProgress = (output) => {
    const linkedActivities = activities.filter(a => 
      output.Linked_Activities?.includes(a.id) || a.Linked_Outputs?.includes(output.id)
    );
    if (linkedActivities.length === 0) {
      const statusMap = { 'Not Started': 0, 'In Progress': 50, 'Completed': 100, 'Verified': 100, 'Not Achieved': 0 };
      return statusMap[output.Status] || 0;
    }
    const totalProgress = linkedActivities.reduce((sum, a) => sum + getActivityProgress(a), 0);
    return totalProgress / linkedActivities.length;
  };

  // Calculate project progress from outputs
  const projectProgress = outputs.length > 0
    ? outputs.reduce((sum, o) => sum + getOutputProgress(o), 0) / outputs.length
    : 0;

  return (
    <div className="border rounded-lg bg-white overflow-hidden">
      <TreeNode
        icon={FolderKanban}
        label={`${project.Project_Code} - ${project.Project_Title}`}
        status={project.Project_Status}
        progress={projectProgress}
        link={createPageUrl(`ProjectView?id=${project.id}`)}
        level={0}
        defaultExpanded={true}
      >
        {outputs.map(output => {
          const outputActivities = activities.filter(a => 
            output.Linked_Activities?.includes(a.id) || a.Linked_Outputs?.includes(output.id)
          );
          const outputProgress = getOutputProgress(output);
          
          return (
            <TreeNode
              key={output.id}
              icon={Package}
              label={output.Output_Title}
              status={output.Status}
              progress={outputProgress}
              indicator={output.Output_Type}
              level={1}
              defaultExpanded={true}
            >
              {outputActivities.map(activity => (
                <TreeNode
                  key={activity.id}
                  icon={ClipboardList}
                  label={activity.Activity_Title}
                  status={activity.Status}
                  progress={getActivityProgress(activity)}
                  indicator={activity.Activity_Type}
                  level={2}
                  link={createPageUrl(`Activities?view=${activity.id}`)}
                />
              ))}
            </TreeNode>
          );
        })}
      </TreeNode>
    </div>
  );
}