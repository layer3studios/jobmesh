import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import Footer from '@/components/layouts/Footer';

vi.mock('next/link', () => ({
  default: ({ children, href, ...rest }: { children: React.ReactNode; href: string }) =>
    <a href={href} {...rest}>{children}</a>,
}));

describe('Footer', () => {
  it('renders footer nav columns and a copyright line', () => {
    render(<Footer />);
    // Verbatim COPY strings from theme/brand.
    expect(screen.getByText('Job feed')).toBeTruthy();
    expect(screen.getByText('Privacy')).toBeTruthy();
    expect(screen.getByText(/©/)).toBeTruthy();
    const jobFeed = screen.getByText('Job feed').closest('a') as HTMLAnchorElement;
    expect(jobFeed.getAttribute('href')).toBe('/jobs');
  });
});
