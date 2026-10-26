import { useState } from 'react';
import { LogOut, ChevronDown } from 'lucide-react';

const MUTED = '#6B7280';
const TEXT = '#0F172A';
const BORDER = '#E5E9F0';
const BRAND = '#1E3A5F';

export default function UserProfile({ user, onLogout }) {
  const [isOpen, setIsOpen] = useState(false);

  const getInitials = () => {
    if (user.full_name) {
      return user.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return user.email?.[0]?.toUpperCase() || 'U';
  };

  return (
    <div style={{ borderTop: `1px solid ${BORDER}`, padding: 12, fontFamily: "'Public Sans', system-ui, sans-serif" }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 10,
          padding: '6px 8px', borderRadius: 6, border: 'none', background: 'transparent',
          cursor: 'pointer', transition: 'background 0.13s',
        }}
        onMouseEnter={e => e.currentTarget.style.background = '#F1F5F9'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
      >
        <div style={{
          width: 32, height: 32, borderRadius: 999, flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 12, fontWeight: 600, color: '#fff', background: BRAND,
        }}>
          {getInitials()}
        </div>
        <div style={{ flex: 1, textAlign: 'left', minWidth: 0 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: TEXT, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {user.full_name || user.email}
          </p>
          <p style={{ fontSize: 11, fontWeight: 400, color: MUTED, margin: 0, textTransform: 'capitalize' }}>
            {user.role || 'User'}
          </p>
        </div>
        <ChevronDown
          size={14}
          style={{ color: MUTED, flexShrink: 0, transition: 'transform 0.2s', transform: isOpen ? 'rotate(180deg)' : 'none' }}
        />
      </button>

      {isOpen && (
        <div style={{ marginTop: 4 }}>
          <button
            onClick={onLogout}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 8,
              padding: '8px 8px', borderRadius: 6, border: 'none', cursor: 'pointer',
              fontSize: 13, fontWeight: 500, color: '#991B1B', background: 'transparent',
              fontFamily: "'Public Sans', system-ui, sans-serif",
              transition: 'background 0.13s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#FEF2F2'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <LogOut size={14} />
            <span>Sign out</span>
          </button>
        </div>
      )}
    </div>
  );
}