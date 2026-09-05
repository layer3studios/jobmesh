'use client';
// FILE: src/components/ui/Table.tsx
// Generic data table: a glass surface with a mono uppercase header row, hairline
// row separators and CSS hover (board.css `.tbl-row`) — never hover-as-state.
import type { ReactNode } from 'react';
import { ChevronsUpDown } from 'lucide-react';
import { TYPE } from '../../theme/tokens';

export interface Column<T> {
  key: string;
  header: string;
  sortable?: boolean;
  render?: (row: T) => ReactNode;
}

const MONO = 'var(--font-jetbrains-mono), ui-monospace, monospace';

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
  const cell: React.CSSProperties = { padding: '11px 14px', textAlign: 'left', fontSize: TYPE.base, color: 'var(--ink)' };

  return (
    <div className="glass" style={{ overflow: 'auto', borderRadius: 14 }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 480 }}>
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                scope="col"
                aria-sort={col.sortable ? 'none' : undefined}
                style={{
                  ...cell, position: 'sticky', top: 0, background: 'var(--glass-strong)',
                  fontFamily: MONO, fontSize: 10, fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase',
                  color: 'var(--ink-muted)',
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
                className="tbl-row"
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                style={{ cursor: onRowClick ? 'pointer' : 'default' }}
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
