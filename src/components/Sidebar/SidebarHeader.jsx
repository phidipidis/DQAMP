import React from 'react';

const LOGO_URL = 'https://media.base44.com/images/public/698b102282e22235c0d3a033/5808b6b39_2026DepEdLucenaLogo.jpg';
const BRAND = '#0B2EA9';
const MUTED = '#6B7280';
const BORDER = '#E5E9F0';

export default function SidebarHeader() {
  return (
    <div style={{ padding: '18px 20px', borderBottom: `1px solid ${BORDER}`, fontFamily: "'Public Sans', system-ui, sans-serif" }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <img
          src={LOGO_URL}
          alt="DepEd Lucena Logo"
          style={{ width: 38, height: 38, borderRadius: 999, objectFit: 'cover', flexShrink: 0 }}
        />
        <div style={{ minWidth: 0 }}>
          <h1 style={{ fontSize: 17, fontWeight: 700, color: BRAND, margin: 0, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
            DQAMP
          </h1>
          <p style={{ fontSize: 11, fontWeight: 400, color: MUTED, margin: '2px 0 0', lineHeight: 1.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            Division Quality Assurance Portal
          </p>
        </div>
      </div>
    </div>
  );
}