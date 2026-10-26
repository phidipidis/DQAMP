import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function DivisionObjectiveDialog({ open, onOpenChange, objective, organizationalGoals }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    Objective_Code: '',
    Objective_Title: '',
    Description: '',
    Functional_Division: 'CID',
    Target_Year: new Date().getFullYear(),
    Quarter: 'Q1',
    Status: 'Not Started',
    Owner: '',
    Target_Value: '',
    Current_Progress: 0,
    Objective_Order: 0,
    Linked_Organizational_Goals: []
  });

  useEffect(() => {
    if (objective) {
      setFormData({
        Objective_Code: objective.Objective_Code || '',
        Objective_Title: objective.Objective_Title || '',
        Description: objective.Description || '',
        Functional_Division: objective.Functional_Division || 'CID',
        Target_Year: objective.Target_Year || new Date().getFullYear(),
        Quarter: objective.Quarter || 'Q1',
        Status: objective.Status || 'Not Started',
        Owner: objective.Owner || '',
        Target_Value: objective.Target_Value || '',
        Current_Progress: objective.Current_Progress || 0,
        Objective_Order: objective.Objective_Order || 0,
        Linked_Organizational_Goals: objective.Linked_Organizational_Goals || []
      });
    } else {
      setFormData({
        Objective_Code: '',
        Objective_Title: '',
        Description: '',
        Functional_Division: 'CID',
        Target_Year: new Date().getFullYear(),
        Quarter: 'Q1',
        Status: 'Not Started',
        Owner: '',
        Target_Value: '',
        Current_Progress: 0,
        Objective_Order: 0,
        Linked_Organizational_Goals: []
      });
    }
  }, [objective, open]);

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.DivisionObjective.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['divisionObjectives'] });
      onOpenChange(false);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.DivisionObjective.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['divisionObjectives'] });
      onOpenChange(false);
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (objective) {
      updateMutation.mutate({ id: objective.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const toggleGoalLink = (goalId) => {
    setFormData(prev => ({
      ...prev,
      Linked_Organizational_Goals: prev.Linked_Organizational_Goals.includes(goalId)
        ? prev.Linked_Organizational_Goals.filter(id => id !== goalId)
        : [...prev.Linked_Organizational_Goals, goalId]
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[#1e3a5f]">
            {objective ? 'Edit Division Objective' : 'New Division Objective'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="Objective_Code">Objective Code</Label>
              <Input
                id="Objective_Code"
                value={formData.Objective_Code}
                onChange={(e) => setFormData({ ...formData, Objective_Code: e.target.value })}
                placeholder="e.g., CID-OBJ-001"
              />
            </div>

            <div>
              <Label htmlFor="Functional_Division">Functional Division *</Label>
              <Select
                value={formData.Functional_Division}
                onValueChange={(value) => setFormData({ ...formData, Functional_Division: value })}
              >
                <SelectTrigger id="Functional_Division">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CID">CID</SelectItem>
                  <SelectItem value="SGOD">SGOD</SelectItem>
                  <SelectItem value="OSDS">OSDS</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="Objective_Title">Objective Title *</Label>
            <Input
              id="Objective_Title"
              value={formData.Objective_Title}
              onChange={(e) => setFormData({ ...formData, Objective_Title: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="Description">Description</Label>
            <Textarea
              id="Description"
              value={formData.Description}
              onChange={(e) => setFormData({ ...formData, Description: e.target.value })}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="Target_Year">Target Year</Label>
              <Input
                id="Target_Year"
                type="number"
                value={formData.Target_Year}
                onChange={(e) => setFormData({ ...formData, Target_Year: parseInt(e.target.value) })}
              />
            </div>

            <div>
              <Label htmlFor="Quarter">Quarter</Label>
              <Select
                value={formData.Quarter}
                onValueChange={(value) => setFormData({ ...formData, Quarter: value })}
              >
                <SelectTrigger id="Quarter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Q1">Q1</SelectItem>
                  <SelectItem value="Q2">Q2</SelectItem>
                  <SelectItem value="Q3">Q3</SelectItem>
                  <SelectItem value="Q4">Q4</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="Status">Status</Label>
              <Select
                value={formData.Status}
                onValueChange={(value) => setFormData({ ...formData, Status: value })}
              >
                <SelectTrigger id="Status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Not Started">Not Started</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="On Track">On Track</SelectItem>
                  <SelectItem value="At Risk">At Risk</SelectItem>
                  <SelectItem value="Achieved">Achieved</SelectItem>
                  <SelectItem value="Not Achieved">Not Achieved</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="Current_Progress">Current Progress (%)</Label>
              <Input
                id="Current_Progress"
                type="number"
                min="0"
                max="100"
                value={formData.Current_Progress}
                onChange={(e) => setFormData({ ...formData, Current_Progress: parseFloat(e.target.value) })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="Owner">Owner</Label>
              <Input
                id="Owner"
                value={formData.Owner}
                onChange={(e) => setFormData({ ...formData, Owner: e.target.value })}
                placeholder="Person responsible"
              />
            </div>

            <div>
              <Label htmlFor="Target_Value">Target Value</Label>
              <Input
                id="Target_Value"
                value={formData.Target_Value}
                onChange={(e) => setFormData({ ...formData, Target_Value: e.target.value })}
                placeholder="e.g., 95% completion rate"
              />
            </div>
          </div>

          <div>
            <Label className="text-base font-semibold mb-3 block">Link to Organizational Goals</Label>
            <div className="border rounded-lg p-4 max-h-48 overflow-y-auto space-y-2">
              {organizationalGoals && organizationalGoals.length > 0 ? (
                organizationalGoals.map(goal => (
                  <div key={goal.id} className="flex items-start gap-3 p-2 hover:bg-slate-50 rounded">
                    <Checkbox
                      id={`goal-${goal.id}`}
                      checked={formData.Linked_Organizational_Goals.includes(goal.id)}
                      onCheckedChange={() => toggleGoalLink(goal.id)}
                    />
                    <label htmlFor={`goal-${goal.id}`} className="flex-1 cursor-pointer text-sm">
                      <div className="font-medium text-slate-900">{goal.Goal_Title}</div>
                      {goal.Description && (
                        <div className="text-xs text-slate-500 mt-1">{goal.Description}</div>
                      )}
                    </label>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500 text-center py-4">
                  No organizational goals available. Create organizational goals first.
                </p>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Selected: {formData.Linked_Organizational_Goals.length} goal(s)
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-[#1e3a5f] hover:bg-[#2d5080]">
              {objective ? 'Update Objective' : 'Create Objective'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}