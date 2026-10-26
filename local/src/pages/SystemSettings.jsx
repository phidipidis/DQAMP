import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { C, FONT, PageHeader, DashboardPanel } from '@/components/ui/DashboardSystem';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Settings, CalendarDays, Palette, MessageSquare, Save, CheckCircle2 } from 'lucide-react';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function SystemSettings() {
  const queryClient = useQueryClient();
  const { data: settings = [] } = useQuery({ queryKey: ['systemSettings'], queryFn: () => base44.entities.SystemSetting.list() });
  const [fiscal, setFiscal] = useState({ startMonth: 'January', endMonth: 'December', currentYear: '2026' });
  const [theme, setTheme] = useState({ primaryColor: '#1E3A5F', fontScale: 'Standard' });
  const [messaging, setMessaging] = useState({ bannerText: '', bannerEnabled: false, supportEmail: 'dqamp.support@depedlucena.ph' });
  const [saved, setSaved] = useState(null);

  useEffect(() => {
    const map = {};
    settings.forEach(s => { map[s.Setting_Key] = s; });
    if (map.fiscal_start_month) setFiscal(f => ({ ...f, startMonth: map.fiscal_start_month.Setting_Value }));
    if (map.fiscal_end_month) setFiscal(f => ({ ...f, endMonth: map.fiscal_end_month.Setting_Value }));
    if (map.fiscal_current_year) setFiscal(f => ({ ...f, currentYear: map.fiscal_current_year.Setting_Value }));
    if (map.theme_primary_color) setTheme(t => ({ ...t, primaryColor: map.theme_primary_color.Setting_Value }));
    if (map.theme_font_scale) setTheme(t => ({ ...t, fontScale: map.theme_font_scale.Setting_Value }));
    if (map.messaging_banner_text) setMessaging(m => ({ ...m, bannerText: map.messaging_banner_text.Setting_Value }));
    if (map.messaging_banner_enabled) setMessaging(m => ({ ...m, bannerEnabled: map.messaging_banner_enabled.Setting_Value === 'true' }));
    if (map.messaging_support_email) setMessaging(m => ({ ...m, supportEmail: map.messaging_support_email.Setting_Value }));
  }, [settings]);

  const upsert = async (key, value, category, description) => {
    const me = await base44.auth.me();
    const existing = settings.find(s => s.Setting_Key === key);
    if (existing) {
      await base44.entities.SystemSetting.update(existing.id, { Setting_Value: String(value), Last_Updated_By: me.email });
    } else {
      await base44.entities.SystemSetting.create({ Setting_Key: key, Setting_Value: String(value), Setting_Category: category, Description: description, Last_Updated_By: me.email });
    }
  };

  const saveFiscal = async () => {
    await upsert('fiscal_start_month', fiscal.startMonth, 'Fiscal', 'Fiscal year start month');
    await upsert('fiscal_end_month', fiscal.endMonth, 'Fiscal', 'Fiscal year end month');
    await upsert('fiscal_current_year', fiscal.currentYear, 'Fiscal', 'Current fiscal year');
    await queryClient.invalidateQueries({ queryKey: ['systemSettings'] });
    setSaved('fiscal'); setTimeout(() => setSaved(null), 2000);
  };

  const saveTheme = async () => {
    await upsert('theme_primary_color', theme.primaryColor, 'Theme', 'Primary brand color');
    await upsert('theme_font_scale', theme.fontScale, 'Theme', 'Font scale preference');
    await queryClient.invalidateQueries({ queryKey: ['systemSettings'] });
    setSaved('theme'); setTimeout(() => setSaved(null), 2000);
  };

  const saveMessaging = async () => {
    await upsert('messaging_banner_text', messaging.bannerText, 'Messaging', 'System-wide banner message');
    await upsert('messaging_banner_enabled', messaging.bannerEnabled ? 'true' : 'false', 'Messaging', 'Whether banner is shown');
    await upsert('messaging_support_email', messaging.supportEmail, 'Messaging', 'Support contact email');
    await queryClient.invalidateQueries({ queryKey: ['systemSettings'] });
    setSaved('messaging'); setTimeout(() => setSaved(null), 2000);
  };

  return (
    <div style={{ fontFamily: FONT, color: C.text, display: 'flex', flexDirection: 'column', gap: 24 }}>
      <PageHeader title="System Settings" subtitle="Manage global configurations for fiscal year, portal theme, and system messaging" />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'start' }}>
        <DashboardPanel title={<span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><CalendarDays size={16} color={C.brand} /> Fiscal year</span>} noPad>
          <div style={{ padding: '0 24px 22px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div><Label>Start month</Label>
                <Select value={fiscal.startMonth} onValueChange={v => setFiscal({ ...fiscal, startMonth: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{MONTHS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>End month</Label>
                <Select value={fiscal.endMonth} onValueChange={v => setFiscal({ ...fiscal, endMonth: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{MONTHS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Current fiscal year</Label><Input value={fiscal.currentYear} onChange={e => setFiscal({ ...fiscal, currentYear: e.target.value })} placeholder="2026" /></div>
              <Button onClick={saveFiscal} variant="primary" size="sm" style={{ alignSelf: 'flex-start' }}>{saved === 'fiscal' ? <><CheckCircle2 size={14} /> Saved</> : <><Save size={14} /> Save fiscal settings</>}</Button>
            </div>
          </div>
        </DashboardPanel>

        <DashboardPanel title={<span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Palette size={16} color={C.brand} /> Portal theme</span>} noPad>
          <div style={{ padding: '0 24px 22px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div><Label>Primary color</Label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <input type="color" value={theme.primaryColor} onChange={e => setTheme({ ...theme, primaryColor: e.target.value })} style={{ width: 44, height: 38, border: `1px solid ${C.border}`, borderRadius: 6, cursor: 'pointer', padding: 2 }} />
                  <Input value={theme.primaryColor} onChange={e => setTheme({ ...theme, primaryColor: e.target.value })} style={{ flex: 1 }} />
                </div>
              </div>
              <div><Label>Font scale</Label>
                <Select value={theme.fontScale} onValueChange={v => setTheme({ ...theme, fontScale: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{['Compact', 'Standard', 'Large'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div style={{ padding: 14, borderRadius: 8, background: theme.primaryColor + '08', border: `1px solid ${theme.primaryColor}22` }}>
                <div style={{ fontSize: 11, color: C.muted, marginBottom: 6 }}>Preview</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: theme.primaryColor }}>DQAMP Portal</div>
                <div style={{ fontSize: 13, color: C.muted, marginTop: 2 }}>Sample body text in selected theme</div>
              </div>
              <Button onClick={saveTheme} variant="primary" size="sm" style={{ alignSelf: 'flex-start' }}>{saved === 'theme' ? <><CheckCircle2 size={14} /> Saved</> : <><Save size={14} /> Save theme</>}</Button>
            </div>
          </div>
        </DashboardPanel>

        <DashboardPanel title={<span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><MessageSquare size={16} color={C.brand} /> System messaging</span>} noPad>
          <div style={{ padding: '0 24px 22px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div><Label>System-wide banner text</Label><Textarea value={messaging.bannerText} onChange={e => setMessaging({ ...messaging, bannerText: e.target.value })} rows={2} placeholder="Banner message shown to all users" /></div>
              <div><Label>Banner enabled</Label>
                <Select value={messaging.bannerEnabled ? 'true' : 'false'} onValueChange={v => setMessaging({ ...messaging, bannerEnabled: v === 'true' })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="true">Enabled</SelectItem><SelectItem value="false">Disabled</SelectItem></SelectContent>
                </Select>
              </div>
              <div><Label>Support email</Label><Input value={messaging.supportEmail} onChange={e => setMessaging({ ...messaging, supportEmail: e.target.value })} /></div>
              {messaging.bannerEnabled && messaging.bannerText && (
                <div style={{ padding: 14, borderRadius: 8, background: C.accentSoft, border: `1px solid ${C.accent}33` }}>
                  <div style={{ fontSize: 11, color: C.muted, marginBottom: 6 }}>Banner preview</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: C.brand }}>{messaging.bannerText}</div>
                </div>
              )}
              <Button onClick={saveMessaging} variant="primary" size="sm" style={{ alignSelf: 'flex-start' }}>{saved === 'messaging' ? <><CheckCircle2 size={14} /> Saved</> : <><Save size={14} /> Save messaging</>}</Button>
            </div>
          </div>
        </DashboardPanel>

        <DashboardPanel title={<span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Settings size={16} color={C.brand} /> General</span>} noPad>
          <div style={{ padding: '0 24px 22px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ padding: 14, borderRadius: 8, background: C.bg, border: `1px solid ${C.border}` }}>
                <div style={{ fontSize: 12, color: C.muted }}>Total stored settings</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: C.brand, marginTop: 4 }}>{settings.length}</div>
              </div>
              <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.5 }}>Settings are stored globally and apply to all portal users. Only administrators can modify these configurations.</div>
            </div>
          </div>
        </DashboardPanel>
      </div>
    </div>
  );
}