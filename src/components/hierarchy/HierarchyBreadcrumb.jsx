import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, ArrowLeft } from 'lucide-react';
import { HierarchyIcon } from './HierarchyIcon';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function HierarchyBreadcrumb({ items = [], className }) {
  if (!items || items.length === 0) return null;

  // Mobile: Show back button only
  const parentItem = items.length > 1 ? items[items.length - 2] : null;

  return (
    <>
      {/* Mobile breadcrumb - back button */}
      <div className={cn("md:hidden mb-4", className)}>
        {parentItem && (
          <Link to={parentItem.route}>
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </Link>
        )}
      </div>

      {/* Desktop breadcrumb - full trail */}
      <div className={cn("hidden md:flex items-center gap-2 flex-wrap mb-4", className)}>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          
          return (
            <React.Fragment key={item.id || index}>
              {isLast ? (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-gray-100">
                  <HierarchyIcon type={item.type} size="sm" />
                  <span className="text-sm font-medium text-gray-700">
                    {item.label}
                  </span>
                </div>
              ) : (
                <>
                  <Link 
                    to={item.route}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-gray-50 transition-colors group"
                    title={item.tooltip}
                  >
                    <HierarchyIcon type={item.type} size="sm" />
                    <span className="text-sm text-gray-600 group-hover:text-gray-900">
                      {item.label}
                    </span>
                  </Link>
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                </>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </>
  );
}