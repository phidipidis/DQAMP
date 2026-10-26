import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { C, FONT, PageHeader, KPIBand, KPITile, Panel, DashboardPanel, SectionHead } from '@/components/ui/DashboardSystem';
import { Rocket, CheckCircle, Circle, ExternalLink, BookOpen } from 'lucide-react';

const STEPS = [
  { id: 'goals', title: 'Review Organizational Goals', desc: 'Familiarize yourself with the top-level strategic goals that guide all division work.', path: 'OrganizationalGoals' },
  { id: 'objectives', title: 'Explore Division Objectives', desc: 'Understand the objectives assigned to your functional division.', path: 'DivisionObjectives' },
  { id: 'projects', title: 'Review Your Projects', desc: 'Locate the projects you are responsible for and their linked outputs.', path: 'Projects' },
  { id: 'activities', title: 'Create or Update an Activity', desc: 'Add a new activity or update an existing one with schedule, budget, and evidence.', path: 'Activities' },
  { id: 'submit', title: 'Submit for QAME Review', desc: 'Submit a completed activity for quality assurance assessment.', path: 'Activities' },
  { id: 'reports', title: 'View Reports', desc: 'Explore the Report Center for performance and financial summaries.', path: 'ReportCenter' },
  { id: 'notifications', title: 'Check Notifications', desc: 'Review pending approvals and reminders in your notification center.', path: 'notifications' },
];

const RESOURCES = [
  { title: 'Data Dictionary', desc: 'Reference for all entity fields and definitions', path: 'data-dictionary' },
  { title: 'User Roles & Permissions', desc: 'Understand access levels for each role', path: 'user-roles' },
  { title: 'Organization Hierarchy', desc: 'Divisions, operating units, and sections', path: 'organization-hierarchy' },
  { title: 'Workflow Status Monitor', desc: 'Track activity workflow progress', path: 'workflow-monitor' },
];

const STORAGE_KEY = 'dqamp_pilot_onboarding';

export default function PilotOnboarding() {
  const [completed, setCompleted] = useState({});

  useEffect(() => {
    try { setCompleted(JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')); } catch { setCompleted({}); }
  }, []);

  const toggle = (id) => {
    const next = { ...completed, [id]: !completed[id] };
    setCompleted(next);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* ignore */ }
  };

  const doneCount = Object.values(completed).filter(Boolean).length;
  const progress = Math.round((doneCount / STEPS.length) * 100);

  return (
    <div style={{ fontFamily: FONT, color: C.text, display: 'flex', flexDirection: 'column', gap: 24 }}>
      <PageHeader title="Pilot Onboarding" subtitle="A guided checklist to help you get started with DQAMP workflows" />
      <KPIBand>
        <KPITile label="Steps completed" value={`${doneCount} / ${STEPS.length}`} icon={CheckCircle} borderLeft={C.brand} />
        <KPITile label="Progress" value={`${progress}%`} icon={Rocket} borderLeft={C.successBar} />
      </KPIBand>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, alignItems: 'start' }}>
        <Panel>
          <SectionHead aside={`${STEPS.length} steps`}>Onboarding checklist</SectionHead>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {STEPS.map((step, i) => {
              const isDone = !!completed[step.id];
              return (
                <div key={step.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 14, padding: '14px 16px', borderRadius: 8, background: isDone ? C.successSoft : C.bg, border: `1px solid ${isDone ? C.successBar + '33' : C.border}` }}>
                  <button onClick={() => toggle(step.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginTop: 2, flexShrink: 0 }}>
                    {isDone ? <CheckCircle size={20} color={C.successBar} /> : <Circle size={20} color={C.muted} />}
                  </button>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: C.muted }}>Step {i + 1}</span>
                      <span style={{ fontSize: 14, fontWeight: 600, color: C.text, textDecoration: isDone ? 'line-through' : 'none', textDecorationColor: C.muted }}>{step.title}</span>
                    </div>
                    <p style={{ fontSize: 13, color: C.muted, marginTop: 4, lineHeight: 1.45 }}>{step.desc}</p>
                  </div>
                  <Link to={createPageUrl(step.path)} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600, color: C.brand, textDecoration: 'none', whiteSpace: 'nowrap', flexShrink: 0 }}>
                    Open <ExternalLink size={12} />
                  </Link>
                </div>
              );
            })}
          </div>
        </Panel>

        <DashboardPanel title="Resources" noPad>
          <div style={{ padding: '0 24px 22px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {RESOURCES.map(r => (
                <Link key={r.path} to={createPageUrl(r.path)} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 14px', borderRadius: 8, background: C.bg, textDecoration: 'none', border: `1px solid ${C.border}` }}>
                  <BookOpen size={16} color={C.brand} style={{ flexShrink: 0, marginTop: 1 }} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{r.title}</div>
                    <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{r.desc}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </DashboardPanel>
      </div>
    </div>
  );
}