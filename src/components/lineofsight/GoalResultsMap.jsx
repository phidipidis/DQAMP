import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ChevronRight, ChevronDown, Flag, FolderKanban, Target } from 'lucide-react';
import { cn } from "@/lib/utils";

const statusColors = {
  'Planning': 'bg-gray-100 text-gray-800',
  'Ongoing': 'bg-blue-100 text-blue-800',
  'Completed': 'bg-emerald-100 text-emerald-800',
  'Not Started': 'bg-gray-100 text-gray-800',
  'In Progress': 'bg-blue-100 text-blue-800',
  'Achieved': 'bg-emerald-100 text-emerald-800',
  'Not Achieved': 'bg-red-100 text-red-800'
};

function MapNode({ icon: Icon, label, status, progress, level = 0, children, link, color }) {
  const [expanded, setExpanded] = useState(level < 2);
  const hasChildren = children && React.Children.count(children) > 0;

  return (
    <div className={cn("border-l-2 border-slate-200", level > 0 && "ml-6")}>
      <div 
        className="flex items-center gap-3 p-3 hover:bg-slate-50 cursor-pointer border-b border-slate-100"
        onClick={() => hasChildren && setExpanded(!expanded)}
      >
        <div className="w-5">
          {hasChildren ? (
            expanded ? <ChevronDown className="h-4 w-4 text-slate-400" /> : <ChevronRight className="h-4 w-4 text-slate-400" />
          ) : null}
        </div>
        
        <div className={cn("p-2 rounded-lg", color)}>
          <Icon className="h-4 w-4" />
        </div>
        
        <div className="flex-1 min-w-0">
          {link ? (
            <Link 
              to={link} 
              className="font-medium text-slate-800 hover:text-[#1e3a5f] hover:underline truncate block"
              onClick={(e) => e.stopPropagation()}
            >
              {label}
            </Link>
          ) : (
            <span className="font-medium text-slate-800 truncate block">{label}</span>
          )}
        </div>
        
        {status && (
          <Badge className={cn("text-xs", statusColors[status] || 'bg-gray-100')}>{status}</Badge>
        )}
        
        <div className="flex items-center gap-2 min-w-[100px]">
          <Progress value={progress || 0} className="w-16 h-2" />
          <span className="text-sm font-medium text-slate-600 w-8 text-right">{Math.round(progress || 0)}%</span>
        </div>
      </div>
      
      {hasChildren && expanded && <div className="bg-slate-50/30">{children}</div>}
    </div>
  );
}

export default function GoalResultsMap({ goal, divisionObjectives, outputs, projects, getDivisionObjectiveProgress, getOutputProgress }) {
  return (
    <div className="border rounded-lg bg-white overflow-hidden">
      <MapNode
        icon={Flag}
        label={goal.Goal_Title}
        progress={divisionObjectives.length > 0 
          ? divisionObjectives.reduce((sum, obj) => sum + getDivisionObjectiveProgress(obj.id), 0) / divisionObjectives.length 
          : goal.Current_Progress || 0}
        level={0}
        color="bg-purple-600 text-white"
      >
        {divisionObjectives.map(objective => {
          const objOutputs = outputs.filter(o => 
            objective.Linked_Outputs?.includes(o.id) || o.Linked_Division_Objectives?.includes(objective.id)
          );
          const objProgress = getDivisionObjectiveProgress(objective.id);
          
          return (
            <MapNode
              key={objective.id}
              icon={Target}
              label={`${objective.Objective_Code || objective.Functional_Division} - ${objective.Objective_Title}`}
              status={objective.Status}
              progress={objProgress}
              level={1}
              color="bg-[#0d9488] text-white"
            >
              {objOutputs.map(output => {
                const outputProgress = getOutputProgress(output);
                
                return (
                  <MapNode
                    key={output.id}
                    icon={FolderKanban}
                    label={output.Output_Title}
                    status={output.Status}
                    progress={outputProgress}
                    level={2}
                    color="bg-[#1e3a5f] text-white"
                  />
                );
              })}
            </MapNode>
          );
        })}
      </MapNode>
    </div>
  );
}