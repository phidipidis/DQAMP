import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { C, FONT, PageHeader, Panel, SectionHead } from '@/components/ui/DashboardSystem';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, BookOpen } from 'lucide-react';

const ENTITIES = [
  { name: 'DQAMPActivity', label: 'Activity', desc: 'Workflow and feedback tracking for division activities' },
  { name: 'Project', label: 'Project', desc: 'Projects with objectives and outputs' },
  { name: 'ProjectOutputs', label: 'Project Output', desc: 'Deliverables and outputs produced by projects' },
  { name: 'OrganizationalGoal', label: 'Organizational Goal', desc: 'Top-level strategic goals' },
  { name: 'DivisionObjective', label: 'Division Objective', desc: 'Objectives assigned to functional divisions' },
  { name: 'Project_Objectives', label: 'Project Objective', desc: 'Objectives within a project' },
  { name: 'QAME_Assessor', label: 'QAME Assessor', desc: 'Quality assurance assessors' },
  { name: 'ARTAFeedback', label: 'ARTA Feedback', desc: 'Customer satisfaction survey responses' },
  { name: 'Audit_Log', label: 'Audit Log', desc: 'System activity audit trail' },
  { name: 'User', label: 'User', desc: 'Registered system users' },
];

const typeStyle = (t) => ({
  fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 4,
  background: C.accentSoft, color: C.brand, whiteSpace: 'nowrap',
});

export default function DataDictionary() {
  const [openEntity, setOpenEntity] = useState('DQAMPActivity');

  const { data: schemaMap = {} } = useQuery({
    queryKey: ['allSchemas'],
    queryFn: async () => {
      const entries = await Promise.all(ENTITIES.map(async e => {
        try { const s = await base44.entities[e.name].schema(); return [e.name, s]; }
        catch { return [e.name, null]; }
      }));
      return Object.fromEntries(entries);
    },
  });

  const renderFields = (schema) => {
    if (!schema || !schema.properties) return <p style={{ fontSize: 13, color: C.muted, padding: '12px 0' }}>Schema unavailable.</p>;
    const props = schema.properties;
    const required = schema.required || [];
    const rows = Object.entries(props).map(([key, def]) => ({ key, def, required: required.includes(key) }));
    return (
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: FONT }}>
          <thead>
            <tr style={{ background: C.bg }}>
              <th style={{ padding: '8px 14px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: C.muted }}>Field</th>
              <th style={{ padding: '8px 14px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: C.muted }}>Type</th>
              <th style={{ padding: '8px 14px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: C.muted }}>Required</th>
              <th style={{ padding: '8px 14px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: C.muted }}>Description</th>
              <th style={{ padding: '8px 14px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: C.muted }}>Allowed values</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.key} style={{ borderTop: `1px solid ${C.border}`, background: i % 2 === 0 ? C.surface : C.bg }}>
                <td style={{ padding: '8px 14px', fontSize: 13, fontWeight: 600, color: C.text, fontFamily: 'monospace' }}>{r.key}</td>
                <td style={{ padding: '8px 14px' }}><span style={typeStyle(r.def.type)}>{r.def.type}{r.def.format ? ` (${r.def.format})` : ''}</span></td>
                <td style={{ padding: '8px 14px', fontSize: 12, color: r.required ? C.danger : C.muted }}>{r.required ? 'Yes' : 'No'}</td>
                <td style={{ padding: '8px 14px', fontSize: 12, color: C.muted, maxWidth: 320 }}>{r.def.description || '—'}</td>
                <td style={{ padding: '8px 14px', fontSize: 11, color: C.muted, maxWidth: 260 }}>{r.def.enum ? r.def.enum.join(', ') : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div style={{ fontFamily: FONT, color: C.text, display: 'flex', flexDirection: 'column', gap: 24 }}>
      <PageHeader title="Data Dictionary" subtitle="Standardized entities and field definitions for pilot reference" />
      <Panel padded={false} style={{ overflow: 'hidden' }}>
        <div style={{ padding: '14px 24px', borderBottom: `1px solid ${C.border}` }}>
          <SectionHead aside={`${ENTITIES.length} entities`}><span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><BookOpen size={16} color={C.brand} /> Entity schemas</span></SectionHead>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {ENTITIES.map(e => {
            const isOpen = openEntity === e.name;
            return (
              <Collapsible key={e.name} open={isOpen} onOpenChange={() => setOpenEntity(isOpen ? null : e.name)}>
                <CollapsibleTrigger asChild>
                  <button style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '14px 24px', border: 'none', background: 'transparent', cursor: 'pointer', borderBottom: `1px solid ${C.border}`, textAlign: 'left', fontFamily: FONT }}>
                    <ChevronDown size={15} style={{ transition: 'transform 0.2s', transform: isOpen ? 'none' : 'rotate(-90deg)', color: C.muted, flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{e.label} <span style={{ fontSize: 12, fontWeight: 400, color: C.muted, fontFamily: 'monospace' }}>({e.name})</span></div>
                      <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{e.desc}</div>
                    </div>
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div style={{ borderBottom: `1px solid ${C.border}` }}>{renderFields(schemaMap[e.name])}</div>
                </CollapsibleContent>
              </Collapsible>
            );
          })}
        </div>
      </Panel>
    </div>
  );
}