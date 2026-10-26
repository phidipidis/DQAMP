import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { C, FONT, PageHeader, KPIBand, KPITile, Panel, SectionHead, DashboardTable } from '@/components/ui/DashboardSystem';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Building2, ChevronDown, ChevronRight, Target, Layers } from 'lucide-react';

const DIVISIONS = [
  { name: 'CID', full: 'Curriculum & Instruction Division' },
  { name: 'SGOD', full: 'School Governance & Operations Division' },
  { name: 'OSDS', full: 'Office of the Schools Division Superintendent' },
];

export default function OrganizationHierarchy() {
  const [expanded, setExpanded] = useState({ CID: true, SGOD: false, OSDS: false });

  const { data: objectives = [] } = useQuery({ queryKey: ['divObjectives'], queryFn: () => base44.entities.DivisionObjective.list('Objective_Order') });
  const { data: projects = [] } = useQuery({ queryKey: ['projects'], queryFn: () => base44.entities.Project.list('Project_Order') });
  const { data: activities = [] } = useQuery({ queryKey: ['activities'], queryFn: () => base44.entities.DQAMPActivity.list() });

  const toggle = (d) => setExpanded(prev => ({ ...prev, [d]: !prev[d] }));

  const totalUnits = new Set(activities.filter(a => a.Unit_Section).map(a => `${a.Functional_Division}:${a.Unit_Section}`)).size;
  const totalOpUnits = new Set(activities.filter(a => a.Operating_Unit).map(a => `${a.Functional_Division}:${a.Operating_Unit}`)).size;

  return (
    <div style={{ fontFamily: FONT, color: C.text, display: 'flex', flexDirection: 'column', gap: 24 }}>
      <PageHeader title="Organization Hierarchy" subtitle="Functional divisions, operating units, and sections" />
      <KPIBand>
        <KPITile label="Divisions" value={DIVISIONS.length} icon={Building2} borderLeft={C.brand} />
        <KPITile label="Unit sections" value={totalUnits} icon={Layers} borderLeft={C.accent} />
        <KPITile label="Operating units" value={totalOpUnits} icon={Target} borderLeft={C.successBar} />
        <KPITile label="Objectives" value={objectives.length} icon={Target} borderLeft={C.warningBar} />
      </KPIBand>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {DIVISIONS.map(div => {
          const divObjectives = objectives.filter(o => o.Functional_Division === div.name);
          const divProjects = projects.filter(p => p.Functional_Division === div.name);
          const divActivities = activities.filter(a => a.Functional_Division === div.name);
          const unitSections = [...new Set(divActivities.map(a => a.Unit_Section).filter(Boolean))];
          const opUnits = [...new Set(divActivities.map(a => a.Operating_Unit).filter(Boolean))];
          const isOpen = expanded[div.name];

          return (
            <Panel key={div.name} padded={false} style={{ overflow: 'hidden' }}>
              <Collapsible open={isOpen} onOpenChange={() => toggle(div.name)}>
                <CollapsibleTrigger asChild>
                  <button style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px', border: 'none', background: 'transparent', cursor: 'pointer', fontFamily: FONT }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      {isOpen ? <ChevronDown size={18} color={C.muted} /> : <ChevronRight size={18} color={C.muted} />}
                      <Building2 size={20} color={C.brand} />
                      <div>
                        <div style={{ fontSize: 17, fontWeight: 700, color: C.text }}>{div.name}</div>
                        <div style={{ fontSize: 13, color: C.muted, marginTop: 2 }}>{div.full}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 24, fontSize: 13 }}>
                      <div style={{ textAlign: 'center' }}><div style={{ fontWeight: 700, color: C.brand }}>{divObjectives.length}</div><div style={{ color: C.muted, fontSize: 11 }}>Objectives</div></div>
                      <div style={{ textAlign: 'center' }}><div style={{ fontWeight: 700, color: C.brand }}>{divProjects.length}</div><div style={{ color: C.muted, fontSize: 11 }}>Projects</div></div>
                      <div style={{ textAlign: 'center' }}><div style={{ fontWeight: 700, color: C.brand }}>{unitSections.length}</div><div style={{ color: C.muted, fontSize: 11 }}>Sections</div></div>
                    </div>
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div style={{ padding: '0 24px 22px', borderTop: `1px solid ${C.border}` }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 18 }}>
                      <div>
                        <SectionHead aside={`${unitSections.length} sections`}>Unit sections</SectionHead>
                        {unitSections.length === 0 ? (
                          <p style={{ fontSize: 13, color: C.muted }}>No unit sections recorded.</p>
                        ) : (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                            {unitSections.map(u => (
                              <span key={u} style={{ fontSize: 12, fontWeight: 500, padding: '5px 12px', borderRadius: 6, background: C.accentSoft, color: C.brand }}>{u}</span>
                            ))}
                          </div>
                        )}
                        <SectionHead aside={`${opUnits.length} units`} style={{ marginTop: 18 }}>Operating units</SectionHead>
                        {opUnits.length === 0 ? (
                          <p style={{ fontSize: 13, color: C.muted }}>No operating units recorded.</p>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {opUnits.map(u => (
                              <div key={u} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: C.text }}>
                                <Layers size={13} color={C.muted} /> {u}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <div>
                        <SectionHead aside={`${divObjectives.length} items`}>Division objectives</SectionHead>
                        <DashboardTable
                          headers={[{ label: 'Code' }, { label: 'Objective' }, { label: 'Status' }]}
                          rows={divObjectives}
                          emptyMessage="No objectives for this division."
                          renderRow={(o, i) => (
                            <tr key={o.id} style={{ borderTop: `1px solid ${C.border}`, background: i % 2 === 0 ? C.surface : C.bg }}>
                              <td style={{ padding: '8px 14px', fontSize: 12, fontWeight: 600, color: C.muted, fontFamily: 'monospace' }}>{o.Objective_Code || '—'}</td>
                              <td style={{ padding: '8px 14px', fontSize: 13, color: C.text }}>{o.Objective_Title}</td>
                              <td style={{ padding: '8px 14px', fontSize: 12, color: C.muted }}>{o.Status || '—'}</td>
                            </tr>
                          )}
                        />
                      </div>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </Panel>
          );
        })}
      </div>
    </div>
  );
}