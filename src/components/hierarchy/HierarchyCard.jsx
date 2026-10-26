import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { HierarchyIcon, getHierarchyConfig } from './HierarchyIcon';
import { cn } from '@/lib/utils';

/**
 * HierarchyCard - Card styled based on hierarchy level
 * Features color-coded left border matching the hierarchy gradient
 */
export function HierarchyCard({ 
  type,
  title,
  subtitle,
  description,
  children,
  route,
  metrics,
  className 
}) {
  const config = getHierarchyConfig(type);
  
  const CardWrapper = route ? Link : 'div';
  const cardProps = route ? { to: route } : {};
  
  return (
    <CardWrapper {...cardProps}>
      <Card 
        className={cn(
          "border-l-4 transition-all hover:shadow-md",
          route && "cursor-pointer",
          className
        )}
        style={{ borderLeftColor: config?.color }}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div 
                className="p-2 rounded-lg"
                style={{ 
                  backgroundColor: `${config?.color}15`,
                }}
              >
                <HierarchyIcon type={type} size="lg" />
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">{config?.label}</div>
                <CardTitle className="text-lg" style={{ color: config?.color }}>
                  {title}
                </CardTitle>
                {subtitle && (
                  <p className="text-sm text-gray-600 mt-1">{subtitle}</p>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
        
        {(description || metrics || children) && (
          <CardContent className="pt-0">
            {description && (
              <p className="text-sm text-gray-600 mb-3">{description}</p>
            )}
            
            {metrics && metrics.length > 0 && (
              <div className="grid grid-cols-2 gap-4 mt-3">
                {metrics.map((metric, idx) => (
                  <div key={idx} className="flex flex-col">
                    <span className="text-xs text-gray-500">{metric.label}</span>
                    <span className="text-lg font-semibold" style={{ color: config?.color }}>
                      {metric.value}
                    </span>
                  </div>
                ))}
              </div>
            )}
            
            {children}
          </CardContent>
        )}
      </Card>
    </CardWrapper>
  );
}