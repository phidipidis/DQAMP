import React from 'react';
import { Eye, Filter } from 'lucide-react';

const MUTED = '#9CA3AF';
const BRAND = '#0B2EA9';

export default function AccessLevelIcon({ accessLevel }) {
  if (accessLevel === 'read-only') {
    return <Eye size={11} style={{ color: MUTED, flexShrink: 0 }} />;
  }
  if (accessLevel === 'filtered') {
    return <Filter size={11} style={{ color: BRAND, flexShrink: 0 }} />;
  }
  return null;
}