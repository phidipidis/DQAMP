import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { C, FONT, PageHeader, KPIBand, KPITile, Panel, DashboardPanel, DashboardTable, AlertRow, SectionHead } from '@/components/ui/DashboardSystem';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Clock, CheckCircle2, XCircle, ClipboardList } from 'lucide-react';

export default function ApprovalWorkflow() {
  const queryClient = useQueryClient();
  const [actionItem, setActionItem] = useState(null);
  const [actionType, setActionType] = useState(null);
  const [remarks, setRemarks] = useState('');
  const [processing, setProcessing] = useState(false);

  const { data: activities = [] } = useQuery({ queryKey: ['activities'], queryFn: () => base44.entities.DQAMPActivity.list() });

  const pending = activities.filter(a => a.Workflow_Status === 'Submitted' || a.Workflow_Status === 'Under Review');
  const approved = activities.filter(a => a.Workflow_Status === 'Published');
  const returned = activities.filter(a => a.Workflow_Status === 'Returned for Revision');

  const openAction = (item, type) => { setActionItem(item); setActionType(type); setRemarks(''); };

  const confirm = async () => {
    if (!actionItem) return;
    setProcessing(true);
    try {
      const me = await base44.auth.me();
      if (actionType === 'approve') {
        await base44.entities.DQAMPActivity.update(actionItem.id, {
          Workflow_Status: 'Published',
          Published_Date: new Date().toISOString().slice(0, 10),
          Reviewed_By: me.email,
          QAME_Remarks: remarks || 'Approved and published.',
        });
      } else {
        await base44.entities.DQAMPActivity.update(actionItem.id, {
          Workflow_Status: 'Returned for Revision',
          Return_For_Revision_Note: remarks || 'Returned for revision.',
          Reviewed_By: me.email,
        });
      }
      await queryClient.invalidateQueries({ queryKey: ['activities'] });
      setActionItem(null);
      setActionType(null);
      setRemarks('');
    } finally { setProcessing(false); }
  };

  return (
    <div style={{ fontFamily: FONT, color: C.text, display: 'flex', flexDirection: 'column', gap: 24 }}>
      <PageHeader title="Approval Workflow" subtitle="Review and sign off on pending activity reports submitted for approval" />
      <KPIBand>
        <KPITile label="Pending approval" value={pending.length} icon={Clock} borderLeft={C.warningBar} sub="awaiting review" />
        <KPITile label="Published" value={approved.length} icon={CheckCircle2} borderLeft={C.successBar} />
        <KPITile label="Returned" value={returned.length} icon={XCircle} borderLeft={C.danger} />
        <KPITile label="Total activities" value={activities.length} icon={ClipboardList} borderLeft={C.brand} />
      </KPIBand>

      {pending.length > 5 && (
        <AlertRow icon={Clock} severity="warning" text={`${pending.length} activity reports are awaiting review — high queue volume`} />
      )}

      <DashboardPanel title="Pending approval queue" aside={`${pending.length} items`} noPad>
        <DashboardTable
          headers={[{ label: 'Activity' }, { label: 'Division' }, { label: 'Stage' }, { label: 'Submitted' }, { label: '' }]}
          rows={pending}
          emptyMessage="No activities pending approval. All caught up!"
          renderRow={(a, i) => (
            <tr key={a.id} style={{ borderTop: `1px solid ${C.border}`, background: i % 2 === 0 ? C.surface : C.bg }}>
              <td style={{ padding: '12px 16px', maxWidth: 260 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{a.Activity_Title || a.Title}</div>
                {a.Description && <div style={{ fontSize: 11, color: C.muted, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.Description}</div>}
              </td>
              <td style={{ padding: '12px 16px', fontSize: 12, color: C.muted }}>{a.Functional_Division || '—'}</td>
              <td style={{ padding: '12px 16px' }}><span style={{ fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 5, background: (a.Workflow_Status === 'Submitted' ? C.accent : C.warningBar) + '15', color: a.Workflow_Status === 'Submitted' ? C.accent : C.warningBar }}>{a.Workflow_Status}</span></td>
              <td style={{ padding: '12px 16px', fontSize: 12, color: C.muted }}>{a.Reviewed_Date || '—'}</td>
              <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                  <button onClick={() => openAction(a, 'approve')} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600, color: C.success, background: C.successSoft, border: `1px solid ${C.successBar}33`, borderRadius: 6, padding: '5px 10px', cursor: 'pointer' }}><CheckCircle2 size={13} /> Approve</button>
                  <button onClick={() => openAction(a, 'reject')} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600, color: C.danger, background: C.dangerSoft, border: `1px solid ${C.dangerBar}33`, borderRadius: 6, padding: '5px 10px', cursor: 'pointer' }}><XCircle size={13} /> Return</button>
                </div>
              </td>
            </tr>
          )}
        />
      </DashboardPanel>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'start' }}>
        <Panel>
          <SectionHead aside={`${approved.length} items`}>Recently published</SectionHead>
          {approved.length === 0 ? (
            <p style={{ fontSize: 13, color: C.muted, padding: '16px 0', textAlign: 'center' }}>No published activities yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {approved.slice(0, 5).map(a => (
                <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 8, background: C.successSoft, border: `1px solid ${C.successBar}22` }}>
                  <CheckCircle2 size={15} color={C.successBar} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: C.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.Activity_Title || a.Title}</div>
                    <div style={{ fontSize: 11, color: C.muted }}>Published {a.Published_Date || '—'}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>
        <Panel>
          <SectionHead aside={`${returned.length} items`}>Returned for revision</SectionHead>
          {returned.length === 0 ? (
            <p style={{ fontSize: 13, color: C.muted, padding: '16px 0', textAlign: 'center' }}>No returned activities.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {returned.slice(0, 5).map(a => (
                <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 8, background: C.dangerSoft, border: `1px solid ${C.dangerBar}22` }}>
                  <XCircle size={15} color={C.dangerBar} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: C.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.Activity_Title || a.Title}</div>
                    <div style={{ fontSize: 11, color: C.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.Return_For_Revision_Note || 'Returned for revision'}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>

      <Dialog open={!!actionItem} onOpenChange={(o) => { if (!o) { setActionItem(null); setRemarks(''); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{actionType === 'approve' ? 'Approve & publish activity' : 'Return for revision'}</DialogTitle></DialogHeader>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingTop: 8 }}>
            <div style={{ padding: 14, borderRadius: 8, background: C.bg, border: `1px solid ${C.border}` }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{actionItem?.Activity_Title || actionItem?.Title}</div>
              <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>{actionItem?.Functional_Division} · {actionItem?.Workflow_Status}</div>
            </div>
            <div><Label>{actionType === 'approve' ? 'Approval remarks' : 'Reason for return'}</Label><Textarea value={remarks} onChange={e => setRemarks(e.target.value)} rows={3} placeholder={actionType === 'approve' ? 'Optional notes for the record' : 'Explain what needs to be revised'} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionItem(null)}>Cancel</Button>
            <Button variant={actionType === 'approve' ? 'primary' : 'destructive'} onClick={confirm} disabled={processing}>{processing ? 'Processing...' : actionType === 'approve' ? 'Approve & publish' : 'Return for revision'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}