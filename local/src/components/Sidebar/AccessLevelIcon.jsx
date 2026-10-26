import { Eye, Filter } from 'lucide-react';

const MUTED = '#6B7280';
const BRAND = '#1E3A5F';

export default function AccessLevelIcon({ accessLevel }) {
  if (accessLevel === 'read-only') {
    return <Eye size={11} style={{ color: MUTED, flexShrink: 0 }} />;
  }
  if (accessLevel === 'filtered') {
    return <Filter size={11} style={{ color: BRAND, flexShrink: 0 }} />;
  }
  return null;
}