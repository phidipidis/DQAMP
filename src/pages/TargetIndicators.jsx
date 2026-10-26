import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { C, FONT, DIVISIONS, PageHeader, KPIBand, KPITile, DashboardPanel, DashboardTable } from '@/components/ui/DashboardSystem';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Gauge, Plus, Pencil, Trash2, Target, CheckCircle } from 'lucide-react';

const STATUS_OPTS = ['Not Started', 'In Progress', 'On Track', 'At Risk', 'Achieved', 'Not Achieved'];

export default function TargetIndicators() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ Objective_Title: '', Objective_Code: '', Functional_Division: 'CID', Target_Indicator: '', Target_Value: '', Current_Progress: 0, Status: 'Not Started', Description: '' });
  const [saving, setSaving] = useState(false);

  const { data: objectives = [] } = useQuery({ queryKey: ['divObjectives'], queryFn: () => base44.entities.DivisionObjective.list('Objective_Order') });

  const resetForm = () => { setEditing(null); setForm({ Objective_Title: '', Objective_Code: '', Functional_Division: 'CID', Target_Indicator: '', Target_Value: '', Current_Progress: 0, Status: 'Not Started', Description: '' }); };

  const openCreate = () => { resetForm(); setDialogOpen(true); };
  const openEdit = (o) => { setEditing(o); setForm({ Objective_Title: o.Objective_Title || '', Objective_Code: o.Objective_Code || '', Functional_Division: o.Functional_Division || 'CID', Target_Indicator: o.Target_Indicator || '', Target_Value: o.Target_Value || '', Current_Progress: o.Current_Progress || 0, Status: o.Status || 'Not Started', Description: o.Description || '' }); setDialogOpen(true); };

  const save = async () => {
    setSaving(true);
    try {
      if (editing) await base44.entities.DivisionObjective.update(editing.id, form);
      else await base44.entities.DivisionObjective.create(form);
      await queryClient.invalidateQueries({ queryKey: ['divObjectives'] });
      setDialogOpen(false);
      resetForm();
    } finally { setSaving(false); }
  };

  const remove = async (o) => {
    if (!confirm(`Delete indicator "${o.Objective_Title}"?`)) return;
    await base44.entities.DivisionObjective.delete(o.id);
    await queryClient.invalidateQueries({ queryKey: ['divObjectives'] });
  };

  const achieved = objectives.filter(o => o.Status === 'Achieved').length;
  const avgProgress = objectives.length > 0 ? Math.round(objectives.reduce((s, o) => s + (o.Current_Progress || 0), 0) / objectives.length) : 0;

  return (
    <div style={{ fontFamily: FONT, color: C.text, display: 'flex', flexDirection: 'column', gap: 24 }}>
      <PageHeader title="Target Indicators" subtitle="Performance indicators linked to organizational objectives" actions={<Button onClick={openCreate} variant="primary" size="sm"><Plus size={14} /> Add indicator</Button>} />
      <KPIBand>
        <KPITile label="Total indicators" value={objectives.length} icon={Gauge} borderLeft={C.brand} />
        <KPITile label="Avg progress" value={`${avgProgress}%`} icon={Target} borderLeft={C.accent} />
        <KPITile label="Achieved" value={achieved} icon={CheckCircle} borderLeft={C.successBar} />
        <KPITile label="In progress" value={objectives.filter(o => o.Status === 'In Progress' || o.Status === 'On Track').length} icon={Gauge} borderLeft={C.warningBar} />
      </KPIBand>

      <DashboardPanel title="Indicators" aside={`${objectives.length} items`} noPad>
        <DashboardTable
          headers={[{ label: 'Code' }, { label: 'Indicator' }, { label: 'Division' }, { label: 'Target' }, { label: 'Progress', align: 'right' }, { label: 'Status' }, { label: '', align: 'right' }]}
          rows={objectives}
          emptyMessage="No indicators defined yet."
          renderRow={(o, i) => (
            <tr key={o.id} style={{ borderTop: `1px solid ${C.border}`, background: i % 2 === 0 ? C.surface : C.bg }}>
              <td style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: C.muted, fontFamily: 'monospace' }}>{o.Objective_Code || '—'}</td>
              <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 500, color: C.text }}>
                <div>{o.Objective_Title}</div>
                {o.Target_Indicator && <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{o.Target_Indicator}</div>}
              </td>
              <td style={{ padding: '12px 16px', fontSize: 12, color: C.muted }}>{o.Functional_Division}</td>
              <td style={{ padding: '12px 16px', fontSize: 12, color: C.muted }}>{o.Target_Value || '—'}</td>
              <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end' }}>
                  <div style={{ width: 60, height: 5, background: C.border, borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${o.Current_Progress || 0}%`, background: C.brand, borderRadius: 99 }} />
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 600, color: C.text, minWidth: 32 }}>{o.Current_Progress || 0}%</span>
                </div>
              </td>
              <td style={{ padding: '12px 16px' }}>
                <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 5, background: o.Status === 'Achieved' ? C.successSoft : o.Status === 'At Risk' ? C.dangerSoft : C.accentSoft, color: o.Status === 'Achieved' ? C.success : o.Status === 'At Risk' ? C.danger : C.brand }}>{o.Status || '—'}</span>
              </td>
              <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                  <button onClick={() => openEdit(o)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}><Pencil size={14} color={C.muted} /></button>
                  <button onClick={() => remove(o)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}><Trash2 size={14} color={C.danger} /></button>
                </div>
              </td>
            </tr>
          )}
        />
      </DashboardPanel>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? 'Edit indicator' : 'Add indicator'}</DialogTitle></DialogHeader>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingTop: 8 }}>
            <div><Label>Objective title</Label><Input value={form.Objective_Title} onChange={e => setForm({ ...form, Objective_Title: e.target.value })} placeholder="e.g. Improve reading proficiency" /></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div><Label>Objective code</Label><Input value={form.Objective_Code} onChange={e => setForm({ ...form, Objective_Code: e.target.value })} placeholder="CID-OBJ-01" /></div>
              <div><Label>Division</Label>
                <Select value={form.Functional_Division} onValueChange={v => setForm({ ...form, Functional_Division: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{DIVISIONS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>Target indicator</Label><Input value={form.Target_Indicator} onChange={e => setForm({ ...form, Target_Indicator: e.target.value })} placeholder="e.g. NAT reading score" /></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div><Label>Target value</Label><Input value={form.Target_Value} onChange={e => setForm({ ...form, Target_Value: e.target.value })} placeholder="e.g. 75%" /></div>
              <div><Label>Current progress (%)</Label><Input type="number" value={form.Current_Progress} onChange={e => setForm({ ...form, Current_Progress: Number(e.target.value) })} /></div>
            </div>
            <div><Label>Status</Label>
              <Select value={form.Status} onValueChange={v => setForm({ ...form, Status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{STATUS_OPTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Description</Label><Textarea value={form.Description} onChange={e => setForm({ ...form, Description: e.target.value })} rows={2} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={save} disabled={saving || !form.Objective_Title}>{saving ? 'Saving...' : 'Save'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}