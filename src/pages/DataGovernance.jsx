import { C, FONT, PageHeader, KPIBand, KPITile, DashboardPanel, DashboardTable } from '@/components/ui/DashboardSystem';
import { Scale, ShieldCheck, CheckCircle, Database } from 'lucide-react';

const POLICIES = [
  { title: 'Canonical Entity Naming', desc: 'All records must use standardized entity names (DQAMPActivity, Project, ProjectOutputs, OrganizationalGoal, DivisionObjective). Legacy entity names are deprecated and migrated.', tag: 'Naming' },
  { title: 'Field Standardization', desc: 'Canonical fields take precedence over legacy aliases. Activity_Title is required (not legacy Title); Financial_Allocation is required (not legacy Budget).', tag: 'Fields' },
  { title: 'Required Field Validation', desc: 'Every activity must have Activity_ID, Activity_Title, and Functional_Division. Projects require Project_Code, Project_Title, and Functional_Division.', tag: 'Validation' },
  { title: 'Audit Trail Integrity', desc: 'All create, update, delete, submit, review, and publish actions are logged to Audit_Log with user email, timestamp, and action type.', tag: 'Audit' },
  { title: 'Evidence & MOV Requirements', desc: 'Completed activities must have at least one evidence attachment. QAME evaluation requires a rating and assessor assignment.', tag: 'Evidence' },
  { title: 'Role-Based Access Control', desc: 'Access is governed by four roles: Administrator, Planning Admin, QA Assessor, and Implementer. Each role has defined navigation and data access levels.', tag: 'Access' },
];

const VALIDATION_RULES = [
  { entity: 'DQAMPActivity', field: 'Activity_ID', rule: 'Required, unique identifier', severity: 'Required' },
  { entity: 'DQAMPActivity', field: 'Activity_Title', rule: 'Required (canonical; not legacy Title)', severity: 'Required' },
  { entity: 'DQAMPActivity', field: 'Functional_Division', rule: 'Enum: CID, SGOD, OSDS', severity: 'Required' },
  { entity: 'DQAMPActivity', field: 'QAME_Rating', rule: 'Numeric 1.00–4.00 when evaluated', severity: 'Conditional' },
  { entity: 'Project', field: 'Project_Code', rule: 'Required, unique', severity: 'Required' },
  { entity: 'Project', field: 'Project_Title', rule: 'Required', severity: 'Required' },
  { entity: 'ProjectOutputs', field: 'Linked_Project', rule: 'Required — must reference a Project ID', severity: 'Required' },
  { entity: 'DivisionObjective', field: 'Objective_Title', rule: 'Required', severity: 'Required' },
  { entity: 'OrganizationalGoal', field: 'Goal_Title', rule: 'Required (canonical; not legacy Title)', severity: 'Required' },
  { entity: 'ARTAFeedback', field: 'SQD1–SQD8', rule: 'Numeric 1–5, all required', severity: 'Required' },
];

const sevColor = { Required: C.danger, Conditional: C.warningBar };

export default function DataGovernance() {
  return (
    <div style={{ fontFamily: FONT, color: C.text, display: 'flex', flexDirection: 'column', gap: 24 }}>
      <PageHeader title="Data Governance" subtitle="System policies, field definitions, and validation rules for consistent data quality" />
      <KPIBand>
        <KPITile label="Governance policies" value={POLICIES.length} icon={Scale} borderLeft={C.brand} />
        <KPITile label="Validation rules" value={VALIDATION_RULES.length} icon={ShieldCheck} borderLeft={C.accent} />
        <KPITile label="Standardized entities" value={10} icon={Database} borderLeft={C.successBar} />
        <KPITile label="Required fields" value={VALIDATION_RULES.filter(r => r.severity === 'Required').length} icon={CheckCircle} borderLeft={C.warningBar} />
      </KPIBand>

      <DashboardPanel title="Governance policies" aside={`${POLICIES.length} policies`} noPad>
        <div style={{ padding: '0 24px 22px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          {POLICIES.map(p => (
            <div key={p.title} style={{ padding: '16px', borderRadius: 8, background: C.bg, border: `1px solid ${C.border}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <ShieldCheck size={16} color={C.brand} />
                <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{p.title}</span>
                <span style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 4, background: C.accentSoft, color: C.brand }}>{p.tag}</span>
              </div>
              <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.45, margin: 0 }}>{p.desc}</p>
            </div>
          ))}
        </div>
      </DashboardPanel>

      <DashboardPanel title="Field validation rules" aside="standardized entities" noPad>
        <DashboardTable
          headers={[{ label: 'Entity' }, { label: 'Field' }, { label: 'Validation rule' }, { label: 'Severity' }]}
          rows={VALIDATION_RULES}
          renderRow={(r, i) => (
            <tr key={r.entity + r.field} style={{ borderTop: `1px solid ${C.border}`, background: i % 2 === 0 ? C.surface : C.bg }}>
              <td style={{ padding: '10px 16px', fontSize: 13, fontWeight: 600, color: C.text }}>{r.entity}</td>
              <td style={{ padding: '10px 16px', fontSize: 12, color: C.brand, fontFamily: 'monospace' }}>{r.field}</td>
              <td style={{ padding: '10px 16px', fontSize: 13, color: C.muted }}>{r.rule}</td>
              <td style={{ padding: '10px 16px' }}>
                <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 5, background: (sevColor[r.severity] || C.muted) + '15', color: sevColor[r.severity] || C.muted }}>{r.severity}</span>
              </td>
            </tr>
          )}
        />
      </DashboardPanel>
    </div>
  );
}