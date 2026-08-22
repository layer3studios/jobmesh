'use client';
// FILE: src/components/ui/Table.tsx
// Generic data table with sticky header, sortable columns and hover rows.
import { useState } from 'react';
import type { ReactNode } from 'react';
import { ChevronsUpDown } from 'lucide-react';
import { TYPE } from '../../theme/tokens';

export interface Column<T> {
  key: string;
  header: string;
  sortable?: boolean;
  render?: (row: T) => ReactNode;
}

export function Table<T>({
  columns, data, onSort, onRowClick, emptyMessage = 'No data',
}: {
  columns: Column<T>[];
  data: T[];
  onSort?: (key: string) => void;
  /** Makes every body row clickable (pointer cursor). */
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
}) {
  const [hovered, setHovered] = useState<number | null>(null);
  const cell: React.CSSProperties = { padding: '10px 14px', textAlign: 'left', fontSize: TYPE.base, color: 'var(--ink)' };

  return (
    <div style={{ overflow: 'auto', border: '1px solid var(--border)', borderRadius: 10 }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 480 }}>
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                scope="col"
                aria-sort={col.sortable ? 'none' : undefined}
                style={{
                  ...cell, position: 'sticky', top: 0, background: 'var(--surface-sunken)',
                  fontSize: TYPE.sm, fontWeight: 600, color: 'var(--ink-muted)',
                  borderBottom: '1px solid var(--border)', cursor: col.sortable ? 'pointer' : 'default',
                  whiteSpace: 'nowrap', userSelect: 'none',
                }}
                onClick={col.sortable ? () => onSort?.(col.key) : undefined}
              >
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  {col.header}
                  {col.sortable && <ChevronsUpDown size={13} aria-hidden style={{ color: 'var(--ink-faint)' }} />}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} style={{ ...cell, textAlign: 'center', color: 'var(--ink-muted)', padding: 32 }}>
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, i) => (
              <tr
                key={i}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                style={{
                  background: hovered === i ? 'var(--paper-2)' : 'transparent', transition: 'background 120ms ease',
                  cursor: onRowClick ? 'pointer' : 'default',
                }}
              >
                {columns.map((col) => (
                  <td key={col.key} style={{ ...cell, borderBottom: i === data.length - 1 ? 'none' : '1px solid var(--border)' }}>
                    {col.render ? col.render(row) : String((row as Record<string, unknown>)[col.key] ?? '')}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
