import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import EmployerLogin from '@/components/employer/Login';

// Google button + logout need the OAuth provider; stub them out for a unit render.
vi.mock('@react-oauth/google', () => ({ GoogleLogin: () => null, googleLogout: () => {} }));
vi.mock('next/link', () => ({ default: ({ children }: { children: React.ReactNode }) => <>{children}</> }));

const replace = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ replace, push: vi.fn() }) }));

// Logged-in employer so the redirect effect fires immediately.
vi.mock('@/context/employer/EmployerContext', () => ({
  useEmployer: () => ({
    employerUser: { id: 'u1', name: 'A', email: 'a@x.io', picture: null },
    isAuthenticating: false, loginError: null, login: vi.fn(), clearLoginError: vi.fn(),
  }),
}));

function renderAt(search: string) {
  window.history.replaceState({}, '', `/employer/login${search}`);
  render(<EmployerLogin />);
}

describe('EmployerLogin ?next= handling', () => {
  beforeEach(() => replace.mockClear());

  it('redirects to a safe /employer/ next path after login', () => {
    renderAt('?next=/employer/invites/abc');
    expect(replace).toHaveBeenCalledWith('/employer/invites/abc');
  });

  it('ignores a scheme-relative //evil.com and falls back to /employer', () => {
    renderAt('?next=//evil.com');
    expect(replace).toHaveBeenCalledWith('/employer');
  });

  it('ignores a non-employer path and falls back to /employer', () => {
    renderAt('?next=/seeker/profile');
    expect(replace).toHaveBeenCalledWith('/employer');
  });

  it('ignores an absolute external URL and falls back to /employer', () => {
    renderAt('?next=https://evil.com');
    expect(replace).toHaveBeenCalledWith('/employer');
  });
});
