import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './table';
import { Card, CardContent } from './card';
import { cn } from '@/lib/utils';

/**
 * DQAMP Design System - Data Table Component
 * Standardized table layout with consistent styling
 */
export function DataTable({ 
  columns, 
  data, 
  onRowClick,
  emptyMessage = "No data available",
  isLoading = false,
  className 
}) {
  if (isLoading) {
    return (
      <Card className={cn("shadow-md", className)}>
        <CardContent className="p-8 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-deped-blue border-r-transparent"></div>
          <p className="mt-3 text-sm text-gray-600">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("shadow-md", className)}>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 border-b-2 border-deped-blue-100">
                {columns.map((col, idx) => (
                  <TableHead 
                    key={idx} 
                    className={cn(
                      "font-semibold text-deped-blue",
                      col.align === 'right' && "text-right",
                      col.align === 'center' && "text-center"
                    )}
                  >
                    {col.header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length} className="py-12 text-center text-gray-500">
                    {emptyMessage}
                  </TableCell>
                </TableRow>
              ) : (
                data.map((row, rowIdx) => (
                  <TableRow 
                    key={rowIdx} 
                    className={cn(
                      "border-b hover:bg-gray-50 transition-colors",
                      onRowClick && "cursor-pointer"
                    )}
                    onClick={() => onRowClick?.(row)}
                  >
                    {columns.map((col, colIdx) => (
                      <TableCell 
                        key={colIdx}
                        className={cn(
                          "text-sm",
                          col.align === 'right' && "text-right",
                          col.align === 'center' && "text-center"
                        )}
                      >
                        {col.cell ? col.cell(row) : row[col.accessor]}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

export default DataTable;