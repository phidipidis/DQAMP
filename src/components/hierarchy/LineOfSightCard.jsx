import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { HierarchyIcon, getHierarchyConfig } from './HierarchyIcon';
import { cn } from '@/lib/utils';

export function LineOfSightCard({ hierarchy = [], currentLevel, className }) {
  if (!hierarchy || hierarchy.length === 0) return null;

  return (
    <Card className={cn("p-4 mb-6 bg-gradient-to-r from-blue-50 to-white border-l-4", className)}
      style={{ borderLeftColor: getHierarchyConfig(currentLevel)?.color || '#094684' }}>
      
      {/* Mobile view - show current and parent only */}
      <div className="md:hidden">
        <div className="flex items-center gap-2 mb-2">
          <HierarchyIcon type={currentLevel} size="sm" showLabel />
        </div>
        {hierarchy.length > 1 && (
          <div className="text-xs text-gray-500 flex items-center gap-1 flex-wrap">
            {hierarchy.slice(0, -1).map((item, idx) => (
              <React.Fragment key={item.id || idx}>
                <span>{item.title}</span>
                {idx < hierarchy.length - 2 && <ChevronRight className="h-3 w-3" />}
              </React.Fragment>
            ))}
          </div>
        )}
        <h2 className="text-lg font-semibold mt-2" style={{ color: getHierarchyConfig(currentLevel)?.color }}>
          {hierarchy[hierarchy.length - 1]?.title}
        </h2>
      </div>

      {/* Desktop view - full cascade */}
      <div className="hidden md:block">
        <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
          <HierarchyIcon type={currentLevel} size="xs" />
          <span className="font-medium">Line of Sight</span>
        </div>
        
        <div className="flex items-center gap-3 flex-wrap">
          {hierarchy.map((item, index) => {
            const isLast = index === hierarchy.length - 1;
            const config = getHierarchyConfig(item.type);
            
            return (
              <React.Fragment key={item.id || index}>
                {item.route && !isLast ? (
                  <Link 
                    to={item.route}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg border-2 hover:shadow-md transition-all bg-white group"
                    style={{ borderColor: config?.color }}
                  >
                    <HierarchyIcon type={item.type} size="md" />
                    <div>
                      <div className="text-xs text-gray-500">{config?.label}</div>
                      <div className="text-sm font-semibold group-hover:underline" style={{ color: config?.color }}>
                        {item.title}
                      </div>
                    </div>
                  </Link>
                ) : (
                  <div 
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-lg border-2",
                      isLast && "bg-gradient-to-r from-blue-50 to-blue-100 shadow-sm"
                    )}
                    style={{ borderColor: config?.color }}
                  >
                    <HierarchyIcon type={item.type} size="md" />
                    <div>
                      <div className="text-xs text-gray-600">{config?.label}</div>
                      <div className={cn("text-sm font-semibold", isLast && "text-base")} 
                        style={{ color: config?.color }}>
                        {item.title}
                      </div>
                    </div>
                  </div>
                )}
                
                {!isLast && (
                  <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0" />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </Card>
  );
}