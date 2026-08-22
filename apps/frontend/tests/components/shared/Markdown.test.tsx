import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Markdown from '@/components/shared/Markdown';

describe('Markdown', () => {
  it('renders a heading as a semantic h1', () => {
    render(<Markdown># Build a rate limiter</Markdown>);
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading.textContent).toBe('Build a rate limiter');
  });

  it('renders bold as <strong>', () => {
    const { container } = render(<Markdown>{'This is **important** text'}</Markdown>);
    const strong = container.querySelector('strong');
    expect(strong).toBeTruthy();
    expect(strong?.textContent).toBe('important');
  });

  it('renders a fenced code block inside <pre>, content preserved verbatim', () => {
    const source = ['```js', 'const x = { a: 1 };', 'if (x.a < 2) run();', '```'].join('\n');
    const { container } = render(<Markdown>{source}</Markdown>);
    const pre = container.querySelector('pre');
    expect(pre).toBeTruthy();
    expect(pre?.textContent).toContain('const x = { a: 1 };');
    expect(pre?.textContent).toContain('if (x.a < 2) run();');
  });

  it('renders a GFM table (proves remark-gfm is wired)', () => {
    const source = ['| Field | Type |', '| --- | --- |', '| id | string |'].join('\n');
    const { container } = render(<Markdown>{source}</Markdown>);
    expect(container.querySelector('table')).toBeTruthy();
    expect(container.querySelector('th')?.textContent).toBe('Field');
    expect(container.querySelector('td')?.textContent).toBe('id');
  });

  // ── XSS: the whole reason react-markdown was chosen over an HTML pipeline ──
  it('renders a <script> tag as visible TEXT, never as an element', () => {
    const { container } = render(<Markdown>{'<script>alert(1)</script>'}</Markdown>);
    expect(container.querySelector('script')).toBeNull();
    expect(container.textContent).toContain('<script>alert(1)</script>');
  });

  it('produces no <img> element from an onerror payload', () => {
    const { container } = render(<Markdown>{'<img src=x onerror=alert(1)>'}</Markdown>);
    expect(container.querySelector('img')).toBeNull();
    // The payload survives as ESCAPED TEXT (&lt;img …&gt;), which is the safe
    // outcome — so assert no element carries the handler, rather than searching
    // innerHTML for the substring, which escaped text legitimately contains.
    expect(container.querySelector('[onerror]')).toBeNull();
    expect(container.innerHTML).toContain('&lt;img');
    expect(container.textContent).toContain('<img src=x onerror=alert(1)>');
  });

  it('does not emit a javascript: href', () => {
    const { container } = render(<Markdown>{'[click](javascript:alert(1))'}</Markdown>);
    const anchor = container.querySelector('a');
    const href = anchor?.getAttribute('href') ?? '';
    expect(href.toLowerCase().startsWith('javascript:')).toBe(false);
  });

  it('renders raw HTML anchors as text, not as links', () => {
    const { container } = render(<Markdown>{'<a href="https://evil.test">x</a>'}</Markdown>);
    expect(container.querySelector('a')).toBeNull();
    expect(container.textContent).toContain('https://evil.test');
  });

  // ── Images: no third-party requests from a public page ──
  it('renders a markdown image as a link, NOT an <img>', () => {
    const { container } = render(<Markdown>{'![diagram](https://cdn.example.com/y.png)'}</Markdown>);
    expect(container.querySelector('img')).toBeNull();
    const anchor = container.querySelector('a');
    expect(anchor?.getAttribute('href')).toBe('https://cdn.example.com/y.png');
    expect(anchor?.textContent).toBe('diagram');
  });

  it('gives links target=_blank and rel with noopener, noreferrer and nofollow', () => {
    const { container } = render(<Markdown>{'[repo](https://github.com/x/y)'}</Markdown>);
    const anchor = container.querySelector('a');
    expect(anchor?.getAttribute('target')).toBe('_blank');
    const rel = anchor?.getAttribute('rel') ?? '';
    expect(rel).toContain('noopener');
    expect(rel).toContain('noreferrer');
    expect(rel).toContain('nofollow');
  });

  it('renders nothing for empty or whitespace-only content', () => {
    const { container: empty } = render(<Markdown>{''}</Markdown>);
    expect(empty.innerHTML).toBe('');
    const { container: blank } = render(<Markdown>{'   \n\t  '}</Markdown>);
    expect(blank.innerHTML).toBe('');
  });

  it('renders lists', () => {
    const { container } = render(<Markdown>{'- one\n- two'}</Markdown>);
    expect(container.querySelectorAll('li')).toHaveLength(2);
  });
});
