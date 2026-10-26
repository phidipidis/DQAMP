import React from 'react';
import { Card, CardContent } from './card';
import { cn } from '@/lib/utils';

/**
 * DQAMP Design System - Stat Card Component
 * For displaying key metrics in dashboards
 */
export function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  iconColor = "bg-deped-blue",
  trend,
  className 
}) {
  return (
    <Card className={cn("border-none shadow-md hover:shadow-lg transition-shadow", className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm text-gray-600 font-medium">{title}</p>
            <p className="text-2xl md:text-3xl font-bold text-gray-900 mt-2">{value}</p>
            {trend && (
              <p className={cn(
                "text-xs mt-2 font-medium",
                trend.positive ? "text-deped-green" : "text-deped-red"
              )}>
                {trend.label}
              </p>
            )}
          </div>
          {Icon && (
            <div className={cn("p-3 rounded-lg shadow-sm", iconColor)}>
              <Icon className="h-6 w-6 text-white" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default StatCard;