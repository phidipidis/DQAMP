import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { MoreHorizontal } from 'lucide-react';

// Secondary row actions behind one "More" button, so the primary action stands out.
export default function RowActionsMenu({ label, items }) {
  const visible = items.filter(Boolean);
  if (visible.length === 0) return null;
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger
        aria-label={label}
        className="inline-flex h-9 w-9 items-center justify-center rounded-md text-slate-700 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E3A5F]"
      >
        <MoreHorizontal className="h-4 w-4" />
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={4}
          className="z-50 min-w-[180px] rounded-md border border-slate-200 bg-white p-1 shadow-md"
        >
          {visible.map(({ label: itemLabel, icon: Icon, onSelect, tone }) => (
            <DropdownMenu.Item
              key={itemLabel}
              onSelect={onSelect}
              className={`flex cursor-pointer select-none items-center gap-2 rounded px-3 py-2 text-sm outline-none data-[highlighted]:bg-slate-100 ${tone === 'warning' ? 'text-amber-800' : 'text-slate-800'}`}
            >
              {Icon && <Icon className="h-4 w-4" aria-hidden="true" />}
              {itemLabel}
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
