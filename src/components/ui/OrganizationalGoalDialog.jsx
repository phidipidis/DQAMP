import React, { useState, useEffect } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function OrganizationalGoalDialog({ open, onOpenChange, goal }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    Goal_Title: '',
    Description: '',
    Target_Year: new Date().getFullYear(),
    Quarter: 'Q1',
    Strategic_Priority: 'Medium',
    Status: 'Not Started',
    Owner: '',
    Target_Value: '',
    Current_Progress: 0
  });

  useEffect(() => {
    if (goal) {
      setFormData({
        Goal_Title: goal.Goal_Title || '',
        Description: goal.Description || '',
        Target_Year: goal.Target_Year || new Date().getFullYear(),
        Quarter: goal.Quarter || 'Q1',
        Strategic_Priority: goal.Strategic_Priority || 'Medium',
        Status: goal.Status || 'Not Started',
        Owner: goal.Owner || '',
        Target_Value: goal.Target_Value || '',
        Current_Progress: goal.Current_Progress || 0
      });
    } else {
      setFormData({
        Goal_Title: '',
        Description: '',
        Target_Year: new Date().getFullYear(),
        Quarter: 'Q1',
        Strategic_Priority: 'Medium',
        Status: 'Not Started',
        Owner: '',
        Target_Value: '',
        Current_Progress: 0
      });
    }
  }, [goal, open]);

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.OrganizationalGoal.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizationalGoals'] });
      onOpenChange(false);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.OrganizationalGoal.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizationalGoals'] });
      onOpenChange(false);
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (goal) {
      updateMutation.mutate({ id: goal.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[#1e3a5f]">
            {goal ? 'Edit Organizational Goal' : 'New Organizational Goal'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="Goal_Title">Goal Title *</Label>
            <Input
              id="Goal_Title"
              value={formData.Goal_Title}
              onChange={(e) => setFormData({ ...formData, Goal_Title: e.target.value })}
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
              <Label htmlFor="Target_Year">Target Year *</Label>
              <Input
                id="Target_Year"
                type="number"
                value={formData.Target_Year}
                onChange={(e) => setFormData({ ...formData, Target_Year: parseInt(e.target.value) })}
                required
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
              <Label htmlFor="Strategic_Priority">Strategic Priority *</Label>
              <Select
                value={formData.Strategic_Priority}
                onValueChange={(value) => setFormData({ ...formData, Strategic_Priority: value })}
              >
                <SelectTrigger id="Strategic_Priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="Low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>

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
                  <SelectItem value="Completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="Owner">Owner</Label>
            <Input
              id="Owner"
              value={formData.Owner}
              onChange={(e) => setFormData({ ...formData, Owner: e.target.value })}
              placeholder="Person responsible for this goal"
            />
          </div>

          <div>
            <Label htmlFor="Target_Value">Target Value</Label>
            <Input
              id="Target_Value"
              value={formData.Target_Value}
              onChange={(e) => setFormData({ ...formData, Target_Value: e.target.value })}
              placeholder="e.g., 95% customer satisfaction, $1M revenue"
            />
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

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-[#1e3a5f] hover:bg-[#2d5080]">
              {goal ? 'Update Goal' : 'Create Goal'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}