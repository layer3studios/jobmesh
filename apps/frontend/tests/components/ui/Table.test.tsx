import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Table, type Column } from '@/components/ui/Table';

interface Row { id: string; name: string }

const columns: Column<Row>[] = [
  { key: 'id', header: 'ID' },
  { key: 'name', header: 'Name' },
];

const data: Row[] = [
  { id: '1', name: 'Alice' },
  { id: '2', name: 'Bob' },
  { id: '3', name: 'Carol' },
];

describe('Table', () => {
  it('renders a row per data item', () => {
    const { container } = render(<Table columns={columns} data={data} />);
    const bodyRows = container.querySelectorAll('tbody tr');
    expect(bodyRows.length).toBe(3);
    expect(screen.getByText('Alice')).toBeTruthy();
    expect(screen.getByText('Bob')).toBeTruthy();
  });

  it('renders headers', () => {
    render(<Table columns={columns} data={data} />);
    expect(screen.getByText('Name')).toBeTruthy();
  });

  it('shows empty message when no data', () => {
    render(<Table columns={columns} data={[]} emptyMessage="Nothing here" />);
    expect(screen.getByText('Nothing here')).toBeTruthy();
  });
});
