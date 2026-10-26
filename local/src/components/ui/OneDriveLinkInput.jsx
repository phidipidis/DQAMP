import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

// Files are uploaded to OneDrive by hand; this field stores the share link.
export default function OneDriveLinkInput({ onAdd, disabled, buttonLabel = 'Add link', className }) {
  const [value, setValue] = useState('');
  const [error, setError] = useState('');

  const submit = () => {
    const url = value.trim();
    let valid = false;
    try {
      valid = new URL(url).protocol === 'https:';
    } catch {
      valid = false;
    }
    if (!valid) {
      setError('Paste the full https:// share link from OneDrive.');
      return;
    }
    setError('');
    setValue('');
    onAdd(url);
  };

  return (
    <div className={className}>
      <div className="flex gap-2">
        <Input
          type="url"
          placeholder="https://1drv.ms/... or OneDrive share link"
          value={value}
          disabled={disabled}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              submit();
            }
          }}
        />
        <Button type="button" variant="outline" disabled={disabled || !value.trim()} onClick={submit}>
          {buttonLabel}
        </Button>
      </div>
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
      <p className="text-xs text-slate-400 mt-1">Upload the file to OneDrive first, then paste its share link here.</p>
    </div>
  );
}
