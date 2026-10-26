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
import { FolderOpen, Upload, FileText, Trash2, Download, Search } from 'lucide-react';

const CATEGORIES = ['Policy', 'Report', 'Evidence', 'Reference', 'Template', 'Manual', 'Other'];
const CAT_COLOR = { Policy: C.brand, Report: C.accent, Evidence: C.successBar, Reference: C.warningBar, Template: C.muted, Manual: C.danger, Other: C.neutral };

export default function DocumentRepository() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('All');
  const [form, setForm] = useState({ Title: '', Description: '', Category: 'Reference', Tags: '', Linked_Project: '' });
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const { data: documents = [] } = useQuery({ queryKey: ['documents'], queryFn: () => base44.entities.Document_Library.list('-created_date') });
  const { data: projects = [] } = useQuery({ queryKey: ['projects'], queryFn: () => base44.entities.Project.list() });

  const filtered = documents.filter(d => {
    if (filterCat !== 'All' && d.Category !== filterCat) return false;
    if (search && !(`${d.Title} ${d.Description || ''} ${d.Tags || ''}`.toLowerCase().includes(search.toLowerCase()))) return false;
    return true;
  });

  const resetForm = () => { setForm({ Title: '', Description: '', Category: 'Reference', Tags: '', Linked_Project: '' }); setFile(null); };

  const save = async () => {
    if (!form.Title || !file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await base44.entities.Document_Library.create({ ...form, File_URL: file_url, File_Name: file.name });
      await queryClient.invalidateQueries({ queryKey: ['documents'] });
      setDialogOpen(false);
      resetForm();
    } finally { setUploading(false); }
  };

  const remove = async (d) => {
    if (!confirm(`Delete "${d.Title}"?`)) return;
    await base44.entities.Document_Library.delete(d.id);
    await queryClient.invalidateQueries({ queryKey: ['documents'] });
  };

  const selectStyle = { border: `1px solid ${C.border}`, borderRadius: 6, padding: '6px 12px', fontSize: 13, fontWeight: 500, color: C.neutral, background: C.surface, outline: 'none', cursor: 'pointer', fontFamily: FONT };

  return (
    <div style={{ fontFamily: FONT, color: C.text, display: 'flex', flexDirection: 'column', gap: 24 }}>
      <PageHeader title="Document Repository" subtitle="Upload, categorize, and manage supporting files and reference documents" actions={<Button onClick={() => { resetForm(); setDialogOpen(true); }} variant="primary" size="sm"><Upload size={14} /> Upload document</Button>} />
      <KPIBand>
        <KPITile label="Total documents" value={documents.length} icon={FolderOpen} borderLeft={C.brand} />
        <KPITile label="Categories" value={new Set(documents.map(d => d.Category)).size} icon={FileText} borderLeft={C.accent} />
        <KPITile label="Evidence files" value={documents.filter(d => d.Category === 'Evidence').length} icon={FileText} borderLeft={C.successBar} />
        <KPITile label="Policies" value={documents.filter(d => d.Category === 'Policy').length} icon={FileText} borderLeft={C.warningBar} />
      </KPIBand>

      <Panel>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, border: `1px solid ${C.border}`, borderRadius: 6, padding: '5px 10px', background: C.surface, flex: 1, minWidth: 220 }}>
            <Search size={14} color={C.muted} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search documents..." style={{ border: 'none', outline: 'none', fontSize: 13, flex: 1, fontFamily: FONT, color: C.text }} />
          </div>
          <SegmentedFilter options={CATEGORIES} selected={filterCat} onToggle={setFilterCat} multi={false} includeAll />
        </div>
      </Panel>

      <DashboardPanel title="Documents" aside={`${filtered.length} of ${documents.length}`} noPad>
        <DashboardTable
          headers={[{ label: 'Title' }, { label: 'Category' }, { label: 'File' }, { label: 'Uploaded by' }, { label: '' }]}
          rows={filtered}
          emptyMessage="No documents found. Upload your first document to get started."
          renderRow={(d, i) => (
            <tr key={d.id} style={{ borderTop: `1px solid ${C.border}`, background: i % 2 === 0 ? C.surface : C.bg }}>
              <td style={{ padding: '12px 16px' }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: C.text }}>{d.Title}</div>
                {d.Description && <div style={{ fontSize: 11, color: C.muted, marginTop: 2, maxWidth: 300, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.Description}</div>}
              </td>
              <td style={{ padding: '12px 16px' }}>
                <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 5, background: (CAT_COLOR[d.Category] || C.muted) + '15', color: CAT_COLOR[d.Category] || C.muted }}>{d.Category}</span>
              </td>
              <td style={{ padding: '12px 16px', fontSize: 12, color: C.muted, maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.File_Name || '—'}</td>
              <td style={{ padding: '12px 16px', fontSize: 12, color: C.muted }}>{d.Uploaded_By || '—'}</td>
              <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                  {d.File_URL && <a href={d.File_URL} target="_blank" rel="noreferrer" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}><Download size={14} color={C.brand} /></a>}
                  <button onClick={() => remove(d)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}><Trash2 size={14} color={C.danger} /></button>
                </div>
              </td>
            </tr>
          )}
        />
      </DashboardPanel>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Upload document</DialogTitle></DialogHeader>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingTop: 8 }}>
            <div><Label>Title</Label><Input value={form.Title} onChange={e => setForm({ ...form, Title: e.target.value })} placeholder="Document title" /></div>
            <div><Label>Description</Label><Textarea value={form.Description} onChange={e => setForm({ ...form, Description: e.target.value })} rows={2} placeholder="Brief description" /></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div><Label>Category</Label>
                <Select value={form.Category} onValueChange={v => setForm({ ...form, Category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Linked project (optional)</Label>
                <Select value={form.Linked_Project || 'none'} onValueChange={v => setForm({ ...form, Linked_Project: v === 'none' ? '' : v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="none">None</SelectItem>{projects.map(p => <SelectItem key={p.id} value={p.id}>{p.Project_Code} — {p.Project_Title}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>Tags</Label><Input value={form.Tags} onChange={e => setForm({ ...form, Tags: e.target.value })} placeholder="comma, separated, tags" /></div>
            <div>
              <Label>File</Label>
              <input type="file" onChange={e => setFile(e.target.files[0])} style={{ fontSize: 13, fontFamily: FONT, width: '100%' }} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={save} disabled={uploading || !form.Title || !file}>{uploading ? 'Uploading...' : 'Upload'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}