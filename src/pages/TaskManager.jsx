import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { C, FONT, PageHeader, KPIBand, KPITile, Panel, DashboardPanel, DashboardTable, SegmentedFilter } from '@/components/ui/DashboardSystem';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ListTodo, Plus, Pencil, Trash2, AlertCircle, CheckCircle2, Clock } from 'lucide-react';

const PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];
const STATUSES = ['Open', 'In Progress', 'Completed', 'Cancelled'];

const PR_COLOR = { Low: C.muted, Medium: C.accent, High: C.warningBar, Critical: C.danger };
const ST_COLOR = { Open: C.accent, 'In Progress': C.warningBar, Completed: C.successBar, Cancelled: C.muted };

export default function TaskManager() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterPriority, setFilterPriority] = useState('All');
  const [form, setForm] = useState({ Task_Title: '', Description: '', Priority: 'Medium', Status: 'Open', Assigned_To: '', Due_Date: '', Linked_Audit: '', Remarks: '' });

  const { data: tasks = [] } = useQuery({ queryKey: ['auditTasks'], queryFn: () => base44.entities.AuditTask.list('-created_date') });

  const filtered = tasks.filter(t => {
    if (filterStatus !== 'All' && t.Status !== filterStatus) return false;
    if (filterPriority !== 'All' && t.Priority !== filterPriority) return false;
    return true;
  });

  const openCreate = () => { setEditing(null); setForm({ Task_Title: '', Description: '', Priority: 'Medium', Status: 'Open', Assigned_To: '', Due_Date: '', Linked_Audit: '', Remarks: '' }); setDialogOpen(true); };
  const openEdit = (t) => { setEditing(t); setForm({ Task_Title: t.Task_Title, Description: t.Description || '', Priority: t.Priority || 'Medium', Status: t.Status || 'Open', Assigned_To: t.Assigned_To || '', Due_Date: t.Due_Date || '', Linked_Audit: t.Linked_Audit || '', Remarks: t.Remarks || '' }); setDialogOpen(true); };

  const save = async () => {
    if (!form.Task_Title) return;
    if (editing) {
      await base44.entities.AuditTask.update(editing.id, form);
    } else {
      const me = await base44.auth.me();
      await base44.entities.AuditTask.create({ ...form, Assigned_By: me.email });
    }
    await queryClient.invalidateQueries({ queryKey: ['auditTasks'] });
    setDialogOpen(false);
  };

  const remove = async (t) => {
    if (!confirm(`Delete "${t.Task_Title}"?`)) return;
    await base44.entities.AuditTask.delete(t.id);
    await queryClient.invalidateQueries({ queryKey: ['auditTasks'] });
  };

  const updateStatus = async (t, status) => {
    const patch = { Status: status };
    if (status === 'Completed') patch.Completed_Date = new Date().toISOString().slice(0, 10);
    await base44.entities.AuditTask.update(t.id, patch);
    await queryClient.invalidateQueries({ queryKey: ['auditTasks'] });
  };

  return (
    <div style={{ fontFamily: FONT, color: C.text, display: 'flex', flexDirection: 'column', gap: 24 }}>
      <PageHeader title="Task Manager" subtitle="Assign, track, and manage action items from QA audit findings" actions={<Button onClick={openCreate} variant="primary" size="sm"><Plus size={14} /> New task</Button>} />
      <KPIBand>
        <KPITile label="Total tasks" value={tasks.length} icon={ListTodo} borderLeft={C.brand} />
        <KPITile label="Open" value={tasks.filter(t => t.Status === 'Open').length} icon={AlertCircle} borderLeft={C.accent} />
        <KPITile label="In progress" value={tasks.filter(t => t.Status === 'In Progress').length} icon={Clock} borderLeft={C.warningBar} />
        <KPITile label="Completed" value={tasks.filter(t => t.Status === 'Completed').length} icon={CheckCircle2} borderLeft={C.successBar} />
      </KPIBand>

      <Panel>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
          <SegmentedFilter label="Status" options={STATUSES} selected={filterStatus} onToggle={setFilterStatus} multi={false} includeAll />
          <SegmentedFilter label="Priority" options={PRIORITIES} selected={filterPriority} onToggle={setFilterPriority} multi={false} includeAll />
        </div>
      </Panel>

      <DashboardPanel title="Action items" aside={`${filtered.length} of ${tasks.length}`} noPad>
        <DashboardTable
          headers={[{ label: 'Task' }, { label: 'Priority' }, { label: 'Assigned to' }, { label: 'Due' }, { label: 'Status' }, { label: '' }]}
          rows={filtered}
          emptyMessage="No tasks found. Create a new action item to get started."
          renderRow={(t, i) => (
            <tr key={t.id} style={{ borderTop: `1px solid ${C.border}`, background: i % 2 === 0 ? C.surface : C.bg }}>
              <td style={{ padding: '12px 16px', maxWidth: 260 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{t.Task_Title}</div>
                {t.Description && <div style={{ fontSize: 11, color: C.muted, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.Description}</div>}
                {t.Linked_Audit && <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>Audit: {t.Linked_Audit}</div>}
              </td>
              <td style={{ padding: '12px 16px' }}><span style={{ fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 5, background: (PR_COLOR[t.Priority] || C.muted) + '15', color: PR_COLOR[t.Priority] || C.muted }}>{t.Priority || 'Medium'}</span></td>
              <td style={{ padding: '12px 16px', fontSize: 12, color: C.muted }}>{t.Assigned_To || '—'}</td>
              <td style={{ padding: '12px 16px', fontSize: 12, color: C.muted }}>{t.Due_Date || '—'}</td>
              <td style={{ padding: '12px 16px' }}>
                <Select value={t.Status || 'Open'} onValueChange={v => updateStatus(t, v)}>
                  <SelectTrigger style={{ width: 140, fontSize: 12, fontWeight: 600, color: ST_COLOR[t.Status] || C.muted, border: `1px solid ${(ST_COLOR[t.Status] || C.muted) + '40'}` }}><SelectValue /></SelectTrigger>
                  <SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </td>
              <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                  <button onClick={() => openEdit(t)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}><Pencil size={14} color={C.brand} /></button>
                  <button onClick={() => remove(t)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}><Trash2 size={14} color={C.danger} /></button>
                </div>
              </td>
            </tr>
          )}
        />
      </DashboardPanel>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? 'Edit task' : 'New action item'}</DialogTitle></DialogHeader>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingTop: 8 }}>
            <div><Label>Task title</Label><Input value={form.Task_Title} onChange={e => setForm({ ...form, Task_Title: e.target.value })} placeholder="Action item title" /></div>
            <div><Label>Description</Label><Textarea value={form.Description} onChange={e => setForm({ ...form, Description: e.target.value })} rows={2} placeholder="Task details and context" /></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div><Label>Priority</Label>
                <Select value={form.Priority} onValueChange={v => setForm({ ...form, Priority: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{PRIORITIES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Status</Label>
                <Select value={form.Status} onValueChange={v => setForm({ ...form, Status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div><Label>Assigned to (email)</Label><Input value={form.Assigned_To} onChange={e => setForm({ ...form, Assigned_To: e.target.value })} placeholder="name@depedlucena.ph" /></div>
              <div><Label>Due date</Label><Input type="date" value={form.Due_Date} onChange={e => setForm({ ...form, Due_Date: e.target.value })} /></div>
            </div>
            <div><Label>Linked audit reference</Label><Input value={form.Linked_Audit} onChange={e => setForm({ ...form, Linked_Audit: e.target.value })} placeholder="Audit or review reference" /></div>
            <div><Label>Remarks</Label><Textarea value={form.Remarks} onChange={e => setForm({ ...form, Remarks: e.target.value })} rows={2} placeholder="Notes" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={save} disabled={!form.Task_Title}>{editing ? 'Save changes' : 'Create task'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}