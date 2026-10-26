import { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { C, FONT, PageHeader, Panel, DashboardPanel, SectionHead } from '@/components/ui/DashboardSystem';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, HelpCircle, Mail, Phone, BookOpen, ExternalLink, MessageSquare } from 'lucide-react';

const FAQS = [
  { q: 'How do I submit an activity for QAME review?', a: 'Open the activity from the Activities page, complete all required fields, then click "Submit for Review" in the workflow panel. The activity will move to "Submitted" status and appear in the QA Assessor\'s review queue.' },
  { q: 'What is the difference between a Project and an Activity?', a: 'A Project is a higher-level initiative tied to division objectives. Activities are the specific implementation actions (workshops, trainings, research) that contribute to a project\'s outputs.' },
  { q: 'How do I upload evidence or MOV?', a: 'Open the activity, scroll to the Evidence & Attachments section, and upload your files. Supported formats include images (JPG/PNG) and documents (PDF/Word).' },
  { q: 'Who can publish an activity?', a: 'Only QA Assessors and Administrators can approve and publish activities. Implementers submit activities for review; they cannot publish them directly.' },
  { q: 'How are financial utilization rates calculated?', a: 'Utilization rate = (Financial_Utilization ÷ Financial_Allocation) × 100. Variance is calculated as Allocation − Utilization.' },
  { q: 'How do I generate a report?', a: 'Visit the Report Center or Report Generator page, select your desired report type and date range, then click Generate to download a PDF.' },
];

const GUIDES = [
  { title: 'Getting Started', desc: 'New user onboarding checklist', path: 'pilot-onboarding' },
  { title: 'Data Dictionary', desc: 'Entity fields and definitions', path: 'data-dictionary' },
  { title: 'User Roles & Permissions', desc: 'Access levels explained', path: 'user-roles' },
  { title: 'Organization Hierarchy', desc: 'Divisions and units', path: 'organization-hierarchy' },
  { title: 'Workflow Monitor', desc: 'Track activity status stages', path: 'workflow-monitor' },
  { title: 'Report Center', desc: 'Pre-built reports and exports', path: 'ReportCenter' },
];

export default function HelpCenter() {
  const [openFaq, setOpenFaq] = useState(0);

  return (
    <div style={{ fontFamily: FONT, color: C.text, display: 'flex', flexDirection: 'column', gap: 24 }}>
      <PageHeader title="Help Center" subtitle="Frequently asked questions, user guides, and technical support contacts" />
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, alignItems: 'start' }}>
        <Panel padded={false} style={{ overflow: 'hidden' }}>
          <div style={{ padding: '18px 24px 14px', borderBottom: `1px solid ${C.border}` }}>
            <SectionHead aside={`${FAQS.length} questions`}><span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><HelpCircle size={16} color={C.brand} /> Frequently asked questions</span></SectionHead>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {FAQS.map((faq, i) => {
              const isOpen = openFaq === i;
              return (
                <Collapsible key={i} open={isOpen} onOpenChange={() => setOpenFaq(isOpen ? null : i)}>
                  <CollapsibleTrigger asChild>
                    <button style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '16px 24px', border: 'none', background: 'transparent', cursor: 'pointer', borderBottom: `1px solid ${C.border}`, textAlign: 'left', fontFamily: FONT }}>
                      <ChevronDown size={15} style={{ transition: 'transform 0.2s', transform: isOpen ? 'none' : 'rotate(-90deg)', color: C.muted, flexShrink: 0 }} />
                      <span style={{ fontSize: 14, fontWeight: 600, color: C.text, flex: 1 }}>{faq.q}</span>
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div style={{ padding: '0 24px 16px 51px', borderBottom: `1px solid ${C.border}` }}>
                      <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.55 }}>{faq.a}</p>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              );
            })}
          </div>
        </Panel>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <DashboardPanel title="Technical support" noPad>
            <div style={{ padding: '0 24px 22px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: C.accentSoft, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Mail size={16} color={C.brand} /></div>
                  <div><div style={{ fontSize: 12, color: C.muted }}>Email</div><div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>dqamp.support@depedlucena.ph</div></div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: C.accentSoft, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Phone size={16} color={C.brand} /></div>
                  <div><div style={{ fontSize: 12, color: C.muted }}>Phone</div><div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>(042) 373-XXXX</div></div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: C.accentSoft, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><MessageSquare size={16} color={C.brand} /></div>
                  <div><div style={{ fontSize: 12, color: C.muted }}>Hours</div><div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>Mon–Fri, 8:00 AM – 5:00 PM</div></div>
                </div>
              </div>
            </div>
          </DashboardPanel>

          <DashboardPanel title="User guides" noPad>
            <div style={{ padding: '0 24px 22px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {GUIDES.map(g => (
                  <Link key={g.path} to={createPageUrl(g.path)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 8, background: C.bg, textDecoration: 'none', border: `1px solid ${C.border}` }}>
                    <BookOpen size={15} color={C.brand} style={{ flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{g.title}</div>
                      <div style={{ fontSize: 11, color: C.muted }}>{g.desc}</div>
                    </div>
                    <ExternalLink size={12} color={C.muted} style={{ flexShrink: 0 }} />
                  </Link>
                ))}
              </div>
            </div>
          </DashboardPanel>
        </div>
      </div>
    </div>
  );
}