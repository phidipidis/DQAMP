import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { base44 } from '@/api/base44Client';

const ROLES = [
  { value: 'Implementer', label: 'Implementer', desc: 'Activity implementation & data entry' },
  { value: 'Planning_Admin', label: 'Planning Admin', desc: 'Strategic & operational management' },
  { value: 'QA_Assessor', label: 'QA Assessor', desc: 'Quality assessment & monitoring' },
  { value: 'admin', label: 'Administrator', desc: 'Full system access & user management' },
];

const DIVISIONS = ['CID', 'SGOD', 'OSDS'];
const NEEDS_DIVISION = ['Implementer', 'Planning_Admin'];

export default function InviteUserDialog({ open, onOpenChange, onInvited }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Implementer');
  const [division, setDivision] = useState('CID');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [issued, setIssued] = useState(null);

  const reset = () => {
    setEmail('');
    setRole('Implementer');
    setDivision('CID');
    setError('');
    setIssued(null);
  };

  const handleClose = (val) => {
    onOpenChange(val);
    if (!val) reset();
  };

  const handleInvite = async () => {
    const trimmed = email.trim();
    if (!trimmed) {
      setError('Email address is required.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const result = await base44.users.inviteUser(trimmed, role, division);
      setIssued({ email: trimmed, temporaryPassword: result.temporaryPassword });
    } catch (err) {
      setError(err?.message || 'Could not create the account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const finish = () => {
    onInvited();
    handleClose(false);
  };

  if (issued) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Account created</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2 text-sm">
            <p>Give this temporary password to <strong>{issued.email}</strong>. It is shown only once.</p>
            <p className="font-mono text-base bg-slate-100 border rounded-md px-3 py-2 select-all">
              {issued.temporaryPassword}
            </p>
            <p className="text-xs text-slate-500">
              No email is sent. The user signs in with this password at the login page.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => navigator.clipboard?.writeText(issued.temporaryPassword)}>
              Copy password
            </Button>
            <Button onClick={finish}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add New User</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="invite-email">Email Address</Label>
            <Input
              id="invite-email"
              type="email"
              placeholder="user@deped.gov.ph"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !loading && handleInvite()}
            />
          </div>
          <div className="space-y-2">
            <Label>Access Role</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROLES.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    <div className="flex flex-col">
                      <span className="font-medium">{r.label}</span>
                      <span className="text-xs text-slate-500">{r.desc}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {NEEDS_DIVISION.includes(role) && (
            <div className="space-y-2">
              <Label>Division</Label>
              <Select value={division} onValueChange={setDivision}>
                <SelectTrigger aria-label="Division">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DIVISIONS.map((d) => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-500">This user can change records only in this division.</p>
            </div>
          )}
          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
              {error}
            </p>
          )}
          <p className="text-xs text-slate-500">
            This creates a sign-in on this computer and shows a temporary password once.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => handleClose(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleInvite} disabled={loading}>
            {loading ? 'Creating…' : 'Create Account'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
