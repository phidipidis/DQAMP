import React from 'react';
import { Button } from './button';
import { cn } from '@/lib/utils';

/**
 * DQAMP Design System - Empty State Component
 * Consistent empty state messaging and CTAs
 */
export function EmptyState({ 
  icon: Icon,
  title, 
  description, 
  action,
  actionLabel,
  onAction,
  className 
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-12 px-4 text-center", className)}>
      {Icon && (
        <div className="mb-4 p-4 bg-gray-100 rounded-full">
          <Icon className="h-12 w-12 text-gray-400" />
        </div>
      )}
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-gray-600 max-w-md mb-6">{description}</p>
      )}
      {(action || onAction) && (
        action || (
          <Button variant="primary" onClick={onAction}>
            {actionLabel}
          </Button>
        )
      )}
    </div>
  );
}

export default EmptyState;