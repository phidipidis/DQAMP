import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { C, FONT, PageHeader, KPIBand, KPITile, DashboardPanel } from '@/components/ui/DashboardSystem';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Library, Upload, FileText, Download, Search, BookOpen, ShieldCheck, FileCheck } from 'lucide-react';

const LIB_CATEGORIES = [
  { key: 'Policy', icon: ShieldCheck, color: C.brand },
  { key: 'Manual', icon: BookOpen, color: C.accent },
  { key: 'Report', icon: FileText, color: C.successBar },
  { key: 'Reference', icon: Library, color: C.warningBar },
  { key: 'Template', icon: FileCheck, color: C.muted },
  { key: 'Other', icon: FileText, color: C.neutral },
];

export default function DocumentLibrary() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [activeCat, setActiveCat] = useState('Policy');
  const [form, setForm] = useState({ Title: '', Description: '', Category: 'Policy', Tags: '' });
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const { data: documents = [] } = useQuery({ queryKey: ['documents'], queryFn: () => base44.entities.Document_Library.list('-created_date') });

  const byCategory = (cat) => documents.filter(d => d.Category === cat);
  const filtered = byCategory(activeCat).filter(d => !search || `${d.Title} ${d.Description || ''} ${d.Tags || ''}`.toLowerCase().includes(search.toLowerCase()));

  const resetForm = () => { setForm({ Title: '', Description: '', Category: 'Policy', Tags: '' }); setFile(null); };

  const save = async () => {
    if (!form.Title || !file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const me = await base44.auth.me();
      await base44.entities.Document_Library.create({ ...form, File_URL: file_url, File_Name: file.name, Uploaded_By: me.email });
      await queryClient.invalidateQueries({ queryKey: ['documents'] });
      setDialogOpen(false);
      resetForm();
    } finally { setUploading(false); }
  };

  return (
    <div style={{ fontFamily: FONT, color: C.text, display: 'flex', flexDirection: 'column', gap: 24 }}>
      <PageHeader title="Document Library" subtitle="Browse internal policy guidelines, manuals, and compliance documentation" actions={<Button onClick={() => { resetForm(); setDialogOpen(true); }} variant="primary" size="sm"><Upload size={14} /> Upload</Button>} />
      <KPIBand>
        <KPITile label="Total documents" value={documents.length} icon={Library} borderLeft={C.brand} />
        <KPITile label="Policies" value={byCategory('Policy').length} icon={ShieldCheck} borderLeft={C.accent} />
        <KPITile label="Manuals" value={byCategory('Manual').length} icon={BookOpen} borderLeft={C.successBar} />
        <KPITile label="Reports" value={byCategory('Report').length} icon={FileText} borderLeft={C.warningBar} />
      </KPIBand>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
        {LIB_CATEGORIES.map(cat => {
          const Icon = cat.icon;
          const count = byCategory(cat.key).length;
          const isActive = activeCat === cat.key;
          return (
            <button key={cat.key} onClick={() => setActiveCat(cat.key)} style={{ textAlign: 'left', padding: '16px 18px', borderRadius: 10, border: `1px solid ${isActive ? cat.color : C.border}`, background: isActive ? cat.color + '08' : C.surface, cursor: 'pointer', fontFamily: FONT, transition: 'all 0.13s' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <div style={{ width: 34, height: 34, borderRadius: 8, background: cat.color + '15', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={17} color={cat.color} />
                </div>
                <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{cat.key}</span>
              </div>
              <div style={{ fontSize: 22, fontWeight: 700, color: cat.color }}>{count}</div>
              <div style={{ fontSize: 11, color: C.muted }}>document{count !== 1 ? 's' : ''}</div>
            </button>
          );
        })}
      </div>

      <DashboardPanel title={`${activeCat} documents`} aside={`${filtered.length} item${filtered.length !== 1 ? 's' : ''}`} noPad>
        <div style={{ padding: '0 24px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, border: `1px solid ${C.border}`, borderRadius: 6, padding: '6px 12px', background: C.surface, maxWidth: 360 }}>
            <Search size={14} color={C.muted} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search within category..." style={{ border: 'none', outline: 'none', fontSize: 13, flex: 1, fontFamily: FONT, color: C.text }} />
          </div>
        </div>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: C.muted }}>
            <Library size={28} style={{ margin: '0 auto 10px' }} />
            <p style={{ fontSize: 14 }}>No {activeCat.toLowerCase()} documents found.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {filtered.map((d, i) => (
              <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 24px', borderTop: i === 0 ? 'none' : `1px solid ${C.border}`, background: i % 2 === 0 ? C.surface : C.bg }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: C.accentSoft, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <FileText size={16} color={C.brand} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{d.Title}</div>
                  {d.Description && <div style={{ fontSize: 12, color: C.muted, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.Description}</div>}
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 3 }}>{d.File_Name || '—'} · {d.Uploaded_By || '—'}</div>
                </div>
                {d.File_URL && <a href={d.File_URL} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: C.brand, textDecoration: 'none', flexShrink: 0 }}><Download size={14} /> Download</a>}
              </div>
            ))}
          </div>
        )}
      </DashboardPanel>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Upload to library</DialogTitle></DialogHeader>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingTop: 8 }}>
            <div><Label>Title</Label><Input value={form.Title} onChange={e => setForm({ ...form, Title: e.target.value })} placeholder="Document title" /></div>
            <div><Label>Description</Label><Textarea value={form.Description} onChange={e => setForm({ ...form, Description: e.target.value })} rows={2} placeholder="Brief description" /></div>
            <div><Label>Category</Label>
              <Select value={form.Category} onValueChange={v => setForm({ ...form, Category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{LIB_CATEGORIES.map(c => <SelectItem key={c.key} value={c.key}>{c.key}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Tags</Label><Input value={form.Tags} onChange={e => setForm({ ...form, Tags: e.target.value })} placeholder="comma, separated, tags" /></div>
            <div><Label>File</Label><input type="file" onChange={e => setFile(e.target.files[0])} style={{ fontSize: 13, fontFamily: FONT, width: '100%' }} /></div>
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