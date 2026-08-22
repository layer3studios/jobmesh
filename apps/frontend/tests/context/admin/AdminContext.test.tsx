import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import type { AdminIdentity } from '@/context/admin/admin-context-types';

const push = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }));

const fetchAdminMe = vi.fn();
const logoutAdmin = vi.fn();
vi.mock('@/api/admin-api', () => ({
  fetchAdminMe: () => fetchAdminMe(),
  logoutAdmin: () => logoutAdmin(),
}));

import { AdminProvider, useAdmin } from '@/context/admin/AdminContext';

const ADMIN: AdminIdentity = { adminUserId: 'a1', email: 'admin@x.io', role: 'super_admin' };

function Probe() {
  const { admin, isLoading, logout } = useAdmin();
  return (
    <div>
      <span data-testid="email">{admin?.email ?? 'none'}</span>
      <span data-testid="loading">{String(isLoading)}</span>
      <button onClick={() => void logout()}>logout</button>
    </div>
  );
}

describe('AdminContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchAdminMe.mockResolvedValue(ADMIN);
    logoutAdmin.mockResolvedValue(undefined);
  });

  it('renders children when wrapped in AdminProvider', () => {
    render(<AdminProvider initialAdmin={ADMIN}><span data-testid="child">hi</span></AdminProvider>);
    expect(screen.getByTestId('child').textContent).toBe('hi');
  });

  it('useAdmin() throws when used outside AdminProvider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<Probe />)).toThrow(/useAdmin must be used within an AdminProvider/);
    spy.mockRestore();
  });

  it('initialAdmin hydrates state with isLoading=false and does NOT call fetchAdminMe', () => {
    render(<AdminProvider initialAdmin={ADMIN}><Probe /></AdminProvider>);
    expect(screen.getByTestId('email').textContent).toBe('admin@x.io');
    expect(screen.getByTestId('loading').textContent).toBe('false');
    expect(fetchAdminMe).not.toHaveBeenCalled();
  });

  it('no initialAdmin → isLoading=true, then admin populates from fetchAdminMe', async () => {
    render(<AdminProvider><Probe /></AdminProvider>);
    expect(screen.getByTestId('loading').textContent).toBe('true');
    await waitFor(() => expect(screen.getByTestId('email').textContent).toBe('admin@x.io'));
    expect(screen.getByTestId('loading').textContent).toBe('false');
    expect(fetchAdminMe).toHaveBeenCalledTimes(1);
  });

  it('refresh seeing a 401 (fetchAdminMe → null) leaves admin null', async () => {
    fetchAdminMe.mockResolvedValue(null);
    render(<AdminProvider><Probe /></AdminProvider>);
    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'));
    expect(screen.getByTestId('email').textContent).toBe('none');
  });

  it('logout calls logoutAdmin and clears admin', async () => {
    render(<AdminProvider initialAdmin={ADMIN}><Probe /></AdminProvider>);
    fireEvent.click(screen.getByText('logout'));
    await waitFor(() => expect(screen.getByTestId('email').textContent).toBe('none'));
    expect(logoutAdmin).toHaveBeenCalledTimes(1);
    expect(push).toHaveBeenCalledWith('/admin/login');
  });

  it('logout still clears local state when logoutAdmin rejects (best-effort)', async () => {
    logoutAdmin.mockRejectedValue(new Error('network'));
    render(<AdminProvider initialAdmin={ADMIN}><Probe /></AdminProvider>);
    fireEvent.click(screen.getByText('logout'));
    await waitFor(() => expect(screen.getByTestId('email').textContent).toBe('none'));
  });
});
