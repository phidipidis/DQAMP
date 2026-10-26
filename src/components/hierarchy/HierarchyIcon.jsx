import React from 'react';
import { Target, Compass, Package, FolderKanban, CheckSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

const HIERARCHY_CONFIG = {
  'organizational_goal': {
    icon: Target,
    color: '#094684',
    label: 'Organizational Goal',
    level: 1
  },
  'division_objective': {
    icon: Compass,
    color: '#0C5A96',
    label: 'Division Objective',
    level: 2
  },
  'output': {
    icon: Package,
    color: '#1E6FA8',
    label: 'Output',
    level: 3
  },
  'project': {
    icon: FolderKanban,
    color: '#3083BA',
    label: 'Project',
    level: 4
  },
  'activity': {
    icon: CheckSquare,
    color: '#4298CC',
    label: 'Activity',
    level: 5
  }
};

export function HierarchyIcon({ type, size = 'md', showLabel = false, className }) {
  const config = HIERARCHY_CONFIG[type];
  if (!config) return null;

  const Icon = config.icon;
  
  const sizeClasses = {
    xs: 'h-3.5 w-3.5',
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
    xl: 'h-8 w-8'
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Icon 
        className={sizeClasses[size]} 
        style={{ color: config.color }} 
      />
      {showLabel && (
        <span className="text-sm font-medium" style={{ color: config.color }}>
          {config.label}
        </span>
      )}
    </div>
  );
}

export function getHierarchyConfig(type) {
  return HIERARCHY_CONFIG[type];
}

export { HIERARCHY_CONFIG };