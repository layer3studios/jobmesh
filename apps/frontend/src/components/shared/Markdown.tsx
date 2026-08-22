// FILE: src/components/shared/Markdown.tsx
// The single markdown renderer for the app. Server Component on purpose: the
// content it renders is static, server-fetched employer text, so nothing about it
// needs interactivity and this ships ZERO markdown JavaScript to the browser.
// (7b's live preview, if it needs one, would be a separate client wrapper.)
//
// SECURITY — NO RAW HTML, EVER.
// react-markdown does not render raw HTML unless you add rehype-raw, and that is
// exactly why it was chosen. This app currently has no HTML sanitizer and needs
// none. Adding rehype-raw (or rehype-highlight, or any rehype plugin that passes
// HTML through) would reintroduce an XSS surface on a PUBLIC, unauthenticated page
// rendering text an employer typed. The `rehypePlugins` prop is deliberately
// absent. Do not add one.
//
// The one place this app does use dangerouslySetInnerHTML is
// seeker/JobDetailPanel/Body.tsx, for scraped ATS HTML. That is a pre-existing,
// separate risk decision — do not treat it as a pattern to copy here.

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Components } from 'react-markdown';

// Headings render as their semantic tag (h1/h2/h3 — real document structure and
// screen-reader landmarks) but at a capped visual scale, so an employer opening
// their task with "# TASK" cannot dwarf the page's own chrome.
const HEADING_SIZES = { h1: '1.15rem', h2: '1.05rem', h3: '0.96rem' } as const;

const headingStyle = (size: string): React.CSSProperties => ({
  fontSize: size,
  fontWeight: 600,
  color: 'var(--ink)',
  margin: '18px 0 6px',
  lineHeight: 1.35,
});

const components: Components = {
  h1: ({ children }) => <h1 style={headingStyle(HEADING_SIZES.h1)}>{children}</h1>,
  h2: ({ children }) => <h2 style={headingStyle(HEADING_SIZES.h2)}>{children}</h2>,
  h3: ({ children }) => <h3 style={headingStyle(HEADING_SIZES.h3)}>{children}</h3>,
  h4: ({ children }) => <h4 style={headingStyle(HEADING_SIZES.h3)}>{children}</h4>,
  h5: ({ children }) => <h5 style={headingStyle(HEADING_SIZES.h3)}>{children}</h5>,
  h6: ({ children }) => <h6 style={headingStyle(HEADING_SIZES.h3)}>{children}</h6>,

  p: ({ children }) => (
    <p style={{ fontSize: '0.9rem', color: 'var(--ink-2)', lineHeight: 1.65, margin: '0 0 10px' }}>{children}</p>
  ),

  // nofollow matters here specifically: these pages are public and the links were
  // written by an employer, so we do not pass ranking signal to whatever they link.
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer nofollow"
      style={{ color: 'var(--link)', textDecoration: 'underline' }}
    >
      {children}
    </a>
  ),

  // Inline code. Block code is handled by `pre` below — react-markdown nests the
  // <code> inside <pre>, so this keeps the inline chip off the block.
  code: ({ children }) => (
    <code
      style={{
        fontFamily: 'var(--font-mono)',
        fontSize: '0.82em',
        background: 'var(--paper-2)',
        padding: '1px 5px',
        borderRadius: 4,
      }}
    >
      {children}
    </code>
  ),

  // Deliberately NO syntax highlighting: it would mean another dependency and a
  // language-detection pass over employer-supplied text for purely cosmetic gain.
  pre: ({ children }) => (
    <pre
      style={{
        background: 'var(--paper-2)',
        padding: 12,
        borderRadius: 6,
        overflowX: 'auto',
        fontSize: '0.82rem',
        lineHeight: 1.5,
        margin: '0 0 12px',
      }}
    >
      {children}
    </pre>
  ),

  ul: ({ children }) => (
    <ul style={{ margin: '0 0 10px', paddingLeft: 22, fontSize: '0.9rem', color: 'var(--ink-2)', lineHeight: 1.65 }}>{children}</ul>
  ),
  ol: ({ children }) => (
    <ol style={{ margin: '0 0 10px', paddingLeft: 22, fontSize: '0.9rem', color: 'var(--ink-2)', lineHeight: 1.65 }}>{children}</ol>
  ),
  li: ({ children }) => <li style={{ marginBottom: 3 }}>{children}</li>,

  blockquote: ({ children }) => (
    <blockquote
      style={{
        margin: '0 0 12px', padding: '2px 0 2px 12px',
        borderLeft: '3px solid var(--border-strong)', color: 'var(--ink-muted)',
      }}
    >
      {children}
    </blockquote>
  ),

  hr: () => <hr style={{ border: 0, borderTop: '1px solid var(--border)', margin: '16px 0' }} />,

  // Tables come from remark-gfm.
  table: ({ children }) => (
    <div style={{ overflowX: 'auto', margin: '0 0 12px' }}>
      <table style={{ borderCollapse: 'collapse', fontSize: '0.85rem', width: '100%' }}>{children}</table>
    </div>
  ),
  th: ({ children }) => (
    <th style={{ border: '1px solid var(--border)', padding: '6px 9px', textAlign: 'left', fontWeight: 600, color: 'var(--ink)' }}>
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td style={{ border: '1px solid var(--border)', padding: '6px 9px', color: 'var(--ink-2)' }}>{children}</td>
  ),

  /**
   * Images render as a LINK, never an <img>.
   *
   * An employer-supplied image URL on a public page is a third-party request made
   * from the candidate's browser the moment the page loads — it leaks their IP and
   * user agent to whatever host the employer chose, with no consent and no way to
   * decline. Rendering the URL as a link keeps the content reachable while leaving
   * that request the candidate's decision.
   */
  img: ({ src, alt }) => {
    const href = typeof src === 'string' ? src : '';
    if (!href) return null;
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer nofollow"
        style={{ color: 'var(--link)', textDecoration: 'underline', fontSize: '0.85rem' }}
      >
        {alt || 'View image'}
      </a>
    );
  },
};

export default function Markdown({ children }: { children: string }) {
  if (!children || !children.trim()) return null;
  return (
    <div style={{ color: 'var(--ink-2)' }}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {children}
      </ReactMarkdown>
    </div>
  );
}
