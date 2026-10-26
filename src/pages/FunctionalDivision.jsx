import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import DivisionObjectiveDialog from '../components/ui/DivisionObjectiveDialog';
import { Plus, Target, Link as LinkIcon } from 'lucide-react';

export default function FunctionalDivision() {
  const [showDialog, setShowDialog] = useState(false);
  const [editingObjective, setEditingObjective] = useState(null);
  const queryClient = useQueryClient();

  const { data: divisionObjectives = [] } = useQuery({
    queryKey: ['divisionObjectives'],
    queryFn: () => base44.entities.DivisionObjective.list()
  });

  const { data: organizationalGoals = [] } = useQuery({
    queryKey: ['organizationalGoals'],
    queryFn: () => base44.entities.OrganizationalGoal.list()
  });

  const deleteObjectiveMutation = useMutation({
    mutationFn: (objectiveId) => base44.entities.DivisionObjective.delete(objectiveId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['divisionObjectives'] });
    }
  });

  const getLinkedGoalTitles = (objective) => {
    if (!objective.Linked_Organizational_Goals || objective.Linked_Organizational_Goals.length === 0) {
      return '-';
    }
    return objective.Linked_Organizational_Goals
      .map(goalId => {
        const goal = organizationalGoals.find(g => g.id === goalId);
        return goal ? goal.Goal_Title : 'Unknown';
      })
      .join(', ');
  };

  const divisionStats = ['CID', 'SGOD', 'OSDS'].map(division => ({
    division,
    count: divisionObjectives.filter(o => o.Functional_Division === division).length
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1e3a5f]">Functional Division Objectives</h1>
          <p className="text-slate-600">Manage division-level objectives aligned with organizational goals</p>
        </div>
        <Button 
          onClick={() => {
            setEditingObjective(null);
            setShowDialog(true);
          }}
          className="bg-[#1e3a5f] hover:bg-[#2d5080]"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Division Objective
        </Button>
      </div>

      {/* Division Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {divisionStats.map(stat => (
          <Card key={stat.division} className="border-none shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">{stat.division}</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{stat.count} Objectives</p>
                </div>
                <div className="bg-[#1e3a5f] p-3 rounded-lg">
                  <Target className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Objectives Table */}
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-[#1e3a5f] flex items-center gap-2">
            <Target className="h-5 w-5" />
            Division Objectives
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Code</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Objective Title</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Division</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Owner</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Target Year</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">
                    <LinkIcon className="h-4 w-4 inline mr-1" />
                    Linked Goals
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-slate-600">Progress</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {divisionObjectives.map(objective => (
                  <tr key={objective.id} className="border-b hover:bg-slate-50">
                    <td className="py-3 px-4 text-sm font-mono">{objective.Objective_Code || '-'}</td>
                    <td className="py-3 px-4 text-sm font-medium">{objective.Objective_Title}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {objective.Functional_Division}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm">{objective.Owner || '-'}</td>
                    <td className="py-3 px-4 text-sm">{objective.Target_Year || '-'}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        objective.Status === 'Achieved' ? 'bg-green-100 text-green-800' :
                        objective.Status === 'On Track' ? 'bg-blue-100 text-blue-800' :
                        objective.Status === 'At Risk' ? 'bg-red-100 text-red-800' :
                        objective.Status === 'In Progress' ? 'bg-amber-100 text-amber-800' :
                        objective.Status === 'Not Achieved' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {objective.Status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm max-w-xs truncate" title={getLinkedGoalTitles(objective)}>
                      {getLinkedGoalTitles(objective)}
                    </td>
                    <td className="py-3 px-4 text-sm text-right">{objective.Current_Progress || 0}%</td>
                    <td className="py-3 px-4 text-right">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => {
                          setEditingObjective(objective);
                          setShowDialog(true);
                        }}
                      >
                        Edit
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => {
                          if (confirm('Are you sure you want to delete this objective?')) {
                            deleteObjectiveMutation.mutate(objective.id);
                          }
                        }}
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
                {divisionObjectives.length === 0 && (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-500">
                      No division objectives found. Click "New Division Objective" to create one.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <DivisionObjectiveDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        objective={editingObjective}
        organizationalGoals={organizationalGoals}
      />
    </div>
  );
}