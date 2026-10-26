import React from 'react';
import { Badge } from "@/components/ui/badge";

const statusColors = {
  'Draft': 'bg-gray-100 text-gray-800 border-gray-300',
  'Submitted': 'bg-amber-100 text-amber-800 border-amber-300',
  'Under Review': 'bg-blue-100 text-blue-800 border-blue-300',
  'Published': 'bg-emerald-100 text-emerald-800 border-emerald-300'
};

export default function WorkflowBadge({ status }) {
  return (
    <Badge className={`${statusColors[status] || 'bg-gray-100 text-gray-800'} border font-medium`}>
      {status}
    </Badge>
  );
}