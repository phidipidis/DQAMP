import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { C, FONT, DIVISIONS, PageHeader, KPIBand, KPITile, Panel, DashboardPanel, DashboardTable } from '@/components/ui/DashboardSystem';
import { Contact, Mail, Users, Building2 } from 'lucide-react';

const DIV_FULL = { CID: 'Curriculum & Instruction', SGOD: 'School Governance & Operations', OSDS: 'Schools Division Superintendent' };

export default function DivisionContacts() {
  const [filterDiv, setFilterDiv] = useState('All');
  const { data: activities = [] } = useQuery({ queryKey: ['activities'], queryFn: () => base44.entities.DQAMPActivity.list() });
  const { data: projects = [] } = useQuery({ queryKey: ['projects'], queryFn: () => base44.entities.Project.list() });
  const { data: assessors = [] } = useQuery({ queryKey: ['assessors'], queryFn: () => base44.entities.QAME_Assessor.list() });
  const { data: users = [] } = useQuery({ queryKey: ['users'], queryFn: () => base44.entities.User.list() });

  const userByEmail = new Map();
  const userByName = new Map();
  users.forEach(u => {
    if (u.email) userByEmail.set(u.email.toLowerCase(), u);
    if (u.full_name) userByName.set(u.full_name.toLowerCase(), u);
  });

  const personnelMap = new Map();
  const addPerson = (name, division, unit, opUnit, role) => {
    if (!name) return;
    const key = name.toLowerCase();
    if (!personnelMap.has(key)) {
      const matchedUser = userByName.get(key);
      personnelMap.set(key, {
        name, division, unit: unit || '', operatingUnit: opUnit || '', role,
        email: matchedUser?.email || '',
      });
    }
  };

  activities.forEach(a => addPerson(a.Responsible_Person, a.Functional_Division, a.Unit_Section, a.Operating_Unit, 'Implementer'));
  projects.forEach(p => addPerson(p.Owner, p.Functional_Division, p.Unit_Section, p.Operating_Unit, 'Project Owner'));
  assessors.forEach(a => {
    (a.Functional_Divisions || []).forEach(d => addPerson(a.Name, d, '', '', a.Role || 'QAME Assessor'));
  });

  const allPersonnel = [...personnelMap.values()];
  const filtered = filterDiv === 'All' ? allPersonnel : allPersonnel.filter(p => p.division === filterDiv);
  const withEmail = allPersonnel.filter(p => p.email).length;

  return (
    <div style={{ fontFamily: FONT, color: C.text, display: 'flex', flexDirection: 'column', gap: 24 }}>
      <PageHeader title="Division Contacts" subtitle="Personnel directory by functional division" />
      <KPIBand>
        <KPITile label="Total personnel" value={allPersonnel.length} icon={Users} borderLeft={C.brand} />
        <KPITile label="With email" value={withEmail} icon={Mail} borderLeft={C.accent} />
        <KPITile label="Divisions" value={DIVISIONS.length} icon={Building2} borderLeft={C.successBar} />
        <KPITile label="QAME assessors" value={assessors.filter(a => a.Is_Active).length} icon={Contact} borderLeft={C.warningBar} />
      </KPIBand>

      <Panel>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: C.muted, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Division</span>
          <div style={{ display: 'flex', background: C.bg, borderRadius: 7, padding: 3, gap: 2 }}>
            <button onClick={() => setFilterDiv('All')} style={{ padding: '5px 14px', fontSize: 13, fontWeight: filterDiv === 'All' ? 600 : 500, color: filterDiv === 'All' ? C.surface : C.neutral, background: filterDiv === 'All' ? C.brand : 'transparent', border: 'none', borderRadius: 5, cursor: 'pointer' }}>All</button>
            {DIVISIONS.map(d => (
              <button key={d} onClick={() => setFilterDiv(d)} style={{ padding: '5px 14px', fontSize: 13, fontWeight: filterDiv === d ? 600 : 500, color: filterDiv === d ? C.surface : C.neutral, background: filterDiv === d ? C.brand : 'transparent', border: 'none', borderRadius: 5, cursor: 'pointer' }}>{d}</button>
            ))}
          </div>
        </div>
      </Panel>

      {filterDiv === 'All' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {DIVISIONS.map(div => {
            const divPeople = allPersonnel.filter(p => p.division === div);
            return (
              <DashboardPanel key={div} title={`${div} — ${DIV_FULL[div]}`} aside={`${divPeople.length} contacts`} noPad>
                <DashboardTable
                  headers={[{ label: 'Name' }, { label: 'Role' }, { label: 'Unit / Section' }, { label: 'Email' }]}
                  rows={divPeople}
                  emptyMessage="No contacts for this division."
                  renderRow={(p, i) => (
                    <tr key={p.name} style={{ borderTop: `1px solid ${C.border}`, background: i % 2 === 0 ? C.surface : C.bg }}>
                      <td style={{ padding: '10px 16px', fontSize: 13, fontWeight: 500, color: C.text }}>{p.name}</td>
                      <td style={{ padding: '10px 16px', fontSize: 12, color: C.muted }}>{p.role}</td>
                      <td style={{ padding: '10px 16px', fontSize: 12, color: C.muted }}>{[p.unit, p.operatingUnit].filter(Boolean).join(' · ') || '—'}</td>
                      <td style={{ padding: '10px 16px', fontSize: 12, color: C.brand }}>{p.email || '—'}</td>
                    </tr>
                  )}
                />
              </DashboardPanel>
            );
          })}
        </div>
      ) : (
        <DashboardPanel title={`${filterDiv} — ${DIV_FULL[filterDiv]}`} aside={`${filtered.length} contacts`} noPad>
          <DashboardTable
            headers={[{ label: 'Name' }, { label: 'Role' }, { label: 'Unit / Section' }, { label: 'Email' }]}
            rows={filtered}
            emptyMessage="No contacts for this division."
            renderRow={(p, i) => (
              <tr key={p.name} style={{ borderTop: `1px solid ${C.border}`, background: i % 2 === 0 ? C.surface : C.bg }}>
                <td style={{ padding: '10px 16px', fontSize: 13, fontWeight: 500, color: C.text }}>{p.name}</td>
                <td style={{ padding: '10px 16px', fontSize: 12, color: C.muted }}>{p.role}</td>
                <td style={{ padding: '10px 16px', fontSize: 12, color: C.muted }}>{[p.unit, p.operatingUnit].filter(Boolean).join(' · ') || '—'}</td>
                <td style={{ padding: '10px 16px', fontSize: 12, color: C.brand }}>{p.email || '—'}</td>
              </tr>
            )}
          />
        </DashboardPanel>
      )}
    </div>
  );
}