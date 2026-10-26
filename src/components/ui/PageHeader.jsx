import React from 'react';
import { Button } from './button';
import { cn } from '@/lib/utils';

/**
 * DQAMP Design System - Page Header Component
 * Provides consistent page title and action layout
 */
export function PageHeader({ 
  title, 
  subtitle, 
  icon: Icon,
  action,
  actionLabel,
  onAction,
  actionVariant = "default",
  className,
  children 
}) {
  return (
    <div className={cn("flex items-start justify-between mb-6", className)}>
      <div className="flex-1">
        <h1 className="text-2xl md:text-3xl font-semibold text-deped-blue flex items-center gap-3">
          {Icon && <Icon className="h-7 w-7" />}
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm md:text-base text-gray-600 mt-1">{subtitle}</p>
        )}
      </div>
      {(action || onAction) && (
        <div className="flex items-center gap-2">
          {action || (
            <Button variant={actionVariant} onClick={onAction}>
              {actionLabel}
            </Button>
          )}
          {children}
        </div>
      )}
    </div>
  );
}

export default PageHeader;