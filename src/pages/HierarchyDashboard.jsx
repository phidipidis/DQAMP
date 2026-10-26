import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight, Target, Briefcase, Package, ClipboardList, Search } from 'lucide-react';
import { C, FONT, PageHeader, KPIBand, KPITile } from '@/components/ui/DashboardSystem';

const DIVISIONS = [
  { Division_Name: 'CID', Division_Goal: 'Curriculum & Instruction Division' },
  { Division_Name: 'SGOD', Division_Goal: 'School Governance & Operations Division' },
  { Division_Name: 'OSDS', Division_Goal: 'Office of the Schools Division Superintendent' },
];

export default function HierarchyDashboard() {
  const [expandedDivisions, setExpandedDivisions] = useState({});
  const [expandedProjects, setExpandedProjects] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDivision, setFilterDivision] = useState('All');

  const { data: goals = [] } = useQuery({ queryKey: ['orgGoals'], queryFn: () => base44.entities.OrganizationalGoal.list() });
  const { data: objectives = [] } = useQuery({ queryKey: ['divObjectives'], queryFn: () => base44.entities.DivisionObjective.list('Objective_Order') });
  const { data: projects = [] } = useQuery({ queryKey: ['projects'], queryFn: () => base44.entities.Project.list('Project_Order') });
  const { data: outputs = [] } = useQuery({ queryKey: ['outputs'], queryFn: () => base44.entities.ProjectOutputs.list('Output_Order') });
  const { data: activities = [] } = useQuery({ queryKey: ['activities'], queryFn: () => base44.entities.DQAMPActivity.list('Activity_Order') });

  const totalProjects = projects.length;
  const totalActivities = activities.length;
  const totalObjectives = objectives.length;
  const activitiesWithQAME = activities.filter(a => a.QAME_Rating).length;
  const qameCoverage = totalActivities > 0 ? ((activitiesWithQAME / totalActivities) * 100).toFixed(1) : 0;

  const toggleDivision = (id) => setExpandedDivisions(prev => ({ ...prev, [id]: !prev[id] }));
  const toggleProject = (id) => setExpandedProjects(prev => ({ ...prev, [id]: !prev[id] }));

  const filteredDivisions = DIVISIONS.filter(d => filterDivision === 'All' || d.Division_Name === filterDivision);

  const statusColors = {
    'Planning': 'bg-slate-100 text-slate-800',
    'Ongoing': 'bg-blue-100 text-blue-800',
    'On Track': 'bg-emerald-100 text-emerald-800',
    'At Risk': 'bg-amber-100 text-amber-800',
    'Delayed': 'bg-red-100 text-red-800',
    'Completed': 'bg-emerald-100 text-emerald-800',
  };
  const qameColors = {
    'Outstanding': 'bg-emerald-100 text-emerald-800',
    'Very Satisfactory': 'bg-blue-100 text-blue-800',
    'Satisfactory': 'bg-amber-100 text-amber-800',
    'Needs Improvement': 'bg-red-100 text-red-800',
  };

  return (
    <div style={{ fontFamily: FONT, color: C.text, display: 'flex', flexDirection: 'column', gap: 24 }}>
      <PageHeader title="DQAMP Hierarchy Dashboard" subtitle="Organizational Goal → Division → Objective → Project → Output → Activity" />

      <KPIBand>
        <KPITile label="Org Goals" value={goals.length} borderLeft={C.brand} />
        <KPITile label="Div. Objectives" value={totalObjectives} borderLeft={C.accent} />
        <KPITile label="Projects" value={totalProjects} borderLeft={C.successBar} />
        <KPITile label="Activities" value={totalActivities} borderLeft={C.warningBar} />
        <KPITile label="QAME coverage" value={`${qameCoverage}%`} borderLeft={C.brand} />
      </KPIBand>

      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input placeholder="Search projects or activities..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
              </div>
            </div>
            <Select value={filterDivision} onValueChange={setFilterDivision}>
              <SelectTrigger className="w-[150px]"><SelectValue placeholder="Division" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Divisions</SelectItem>
                {DIVISIONS.map(d => <SelectItem key={d.Division_Name} value={d.Division_Name}>{d.Division_Name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {filteredDivisions.map(division => {
          const divObjectives = objectives.filter(o => o.Functional_Division === division.Division_Name);
          const divProjects = projects.filter(p => p.Functional_Division === division.Division_Name && (
            !searchTerm ||
            p.Project_Title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.Project_Code?.toLowerCase().includes(searchTerm.toLowerCase())
          ));
          const divActivities = activities.filter(a => a.Functional_Division === division.Division_Name);
          const avgQAME = divActivities.length > 0
            ? ((divActivities.filter(a => a.QAME_Rating).length / divActivities.length) * 100).toFixed(0)
            : 0;

          return (
            <Card key={division.Division_Name} className="shadow-md">
              <Collapsible open={expandedDivisions[division.Division_Name]} onOpenChange={() => toggleDivision(division.Division_Name)}>
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-slate-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {expandedDivisions[division.Division_Name] ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                        <Target className="h-5 w-5 text-[#1e3a5f]" />
                        <div>
                          <CardTitle className="text-lg">{division.Division_Name}</CardTitle>
                          <p className="text-sm text-slate-600 mt-1">{division.Division_Goal}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <div className="text-center"><p className="font-bold text-[#1e3a5f]">{divObjectives.length}</p><p className="text-slate-500">Objectives</p></div>
                        <div className="text-center"><p className="font-bold text-[#1e3a5f]">{divProjects.length}</p><p className="text-slate-500">Projects</p></div>
                        <div className="text-center"><p className="font-bold text-emerald-600">{divActivities.length}</p><p className="text-slate-500">Activities</p></div>
                        <div className="text-center"><p className="font-bold text-[#0d9488]">{avgQAME}%</p><p className="text-slate-500">QAME</p></div>
                      </div>
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="space-y-4">
                    {divObjectives.length > 0 && (
                      <div className="ml-8 space-y-2">
                        <p className="text-sm font-semibold text-slate-700 flex items-center gap-2"><Briefcase className="h-4 w-4 text-[#0d9488]" />Division Objectives</p>
                        {divObjectives.map(obj => (
                          <div key={obj.id} className="flex items-center gap-2 ml-4">
                            {obj.Objective_Code && <Badge variant="outline" className="text-xs">{obj.Objective_Code}</Badge>}
                            <span className="text-sm">{obj.Objective_Title || obj.Description}</span>
                            {obj.Status && <Badge variant="outline" className="text-xs">{obj.Status}</Badge>}
                          </div>
                        ))}
                      </div>
                    )}

                    {divProjects.map(project => {
                      const projOutputs = outputs.filter(o => o.Linked_Project === project.id).sort((a, b) => (a.Output_Order || 0) - (b.Output_Order || 0));
                      const projActivities = activities.filter(a => a.Linked_Projects?.includes(project.id));
                      const unlinkedActs = projActivities.filter(a => !(a.Contributes_To_Output?.length) && !(a.Linked_Outputs?.length));

                      return (
                        <Card key={project.id} className="ml-8 border-l-4 border-[#0d9488]">
                          <Collapsible open={expandedProjects[project.id]} onOpenChange={() => toggleProject(project.id)}>
                            <CollapsibleTrigger asChild>
                              <CardHeader className="cursor-pointer hover:bg-slate-50 py-3">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    {expandedProjects[project.id] ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                    <Package className="h-4 w-4 text-amber-600" />
                                    <div className="flex items-center gap-2">
                                      <Badge variant="outline" className="text-xs">{project.Project_Code}</Badge>
                                      <span className="font-medium">{project.Project_Title}</span>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Badge className={statusColors[project.Project_Status] || ''}>{project.Project_Status}</Badge>
                                    <span className="text-xs text-slate-500">{projOutputs.length} outputs · {projActivities.length} activities</span>
                                  </div>
                                </div>
                              </CardHeader>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                              <CardContent className="space-y-3">
                                {projOutputs.length === 0 && projActivities.length === 0 && (
                                  <p className="text-sm text-slate-400 ml-6">No outputs or activities linked.</p>
                                )}
                                {projOutputs.map(output => {
                                  const outputActivities = activities.filter(a =>
                                    (Array.isArray(a.Contributes_To_Output) && a.Contributes_To_Output.includes(output.id)) ||
                                    (Array.isArray(a.Linked_Outputs) && a.Linked_Outputs.includes(output.id))
                                  );
                                  return (
                                    <div key={output.id} className="ml-6 border-l-2 border-slate-200 pl-4 space-y-2">
                                      <div className="flex items-start gap-2">
                                        <ClipboardList className="h-4 w-4 text-slate-600 mt-0.5" />
                                        <div className="flex-1">
                                          <div className="flex items-center gap-2">
                                            {output.Output_Order && <span className="text-xs font-mono text-slate-500">#{output.Output_Order}</span>}
                                            <p className="font-medium text-sm">{output.Output_Title || output.Output_Description}</p>
                                          </div>
                                          {outputActivities.length > 0 && (
                                            <div className="mt-2 space-y-1">
                                              {outputActivities.map(act => (
                                                <div key={act.id} className="flex items-center justify-between p-2 bg-slate-50 rounded text-xs">
                                                  <div className="flex items-center gap-2">
                                                    {act.Activity_ID && <Badge variant="outline" className="text-xs font-mono">{act.Activity_ID}</Badge>}
                                                    <span>{act.Activity_Title || act.Title}</span>
                                                  </div>
                                                  <div className="flex items-center gap-2">
                                                    {act.QAME_Rating && <Badge className={qameColors[act.QAME_Rating] || ''}>{act.QAME_Rating}</Badge>}
                                                  </div>
                                                </div>
                                              ))}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}

                                {unlinkedActs.length > 0 && (
                                  <div className="ml-6 border-l-2 border-amber-300 pl-4 bg-amber-50 rounded p-3">
                                    <p className="font-medium text-sm text-amber-900 mb-2">Activities (pending output assignment)</p>
                                    <div className="space-y-1">
                                      {unlinkedActs.map(act => (
                                        <div key={act.id} className="flex items-center justify-between p-2 bg-white rounded text-xs">
                                          <div className="flex items-center gap-2">
                                            {act.Activity_ID && <Badge variant="outline" className="text-xs font-mono">{act.Activity_ID}</Badge>}
                                            <span>{act.Activity_Title || act.Title}</span>
                                          </div>
                                          {act.QAME_Rating && <Badge className={qameColors[act.QAME_Rating] || ''}>{act.QAME_Rating}</Badge>}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </CardContent>
                            </CollapsibleContent>
                          </Collapsible>
                        </Card>
                      );
                    })}

                    {divProjects.length === 0 && (
                      <p className="text-sm text-slate-400 ml-8">No projects found for this division.</p>
                    )}
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          );
        })}
      </div>
    </div>
  );
}