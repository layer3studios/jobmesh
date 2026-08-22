'use client';
// FILE: src/components/seeker/today/NewsSection.tsx
// Tech & job news for the Today sidebar. Replaces the per-page repetition by
// surfacing a few fresh stories from the public Hacker News API.
import { ArrowRight, ArrowUpRight, Newspaper } from 'lucide-react';
import { useTechNews } from '../../../hooks/seeker/useTechNews';
import { formatAppliedRelativeTime } from '../../../utils/progress';
import { eyebrowStyle } from './shared';

export default function NewsSection() {
  const { news, loading, error } = useTechNews(5);

  return (
    <section>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
        <div>
          <p style={eyebrowStyle}>Fresh today</p>
          <h2 className="font-display" style={{
            fontSize: '1.25rem', fontWeight: 600, color: 'var(--ink)',
            letterSpacing: '-0.02em',
          }}>Tech &amp; job news</h2>
        </div>
        <a
          href="https://news.ycombinator.com/"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            fontSize: '0.82rem', color: 'var(--ink-muted)',
            textDecoration: 'none', fontWeight: 500,
          }}
        >See all <ArrowRight size={12} /></a>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {loading ? (
          Array(4).fill(0).map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 56, borderRadius: 11 }} />
          ))
        ) : error || news.length === 0 ? (
          <div style={{
            padding: '20px 14px', background: 'var(--surface)',
            border: '1px solid var(--border)', borderRadius: 12, textAlign: 'center',
          }}>
            <Newspaper size={20} style={{ color: 'var(--ink-faint)', marginBottom: 8 }} />
            <p style={{ fontSize: '0.875rem', color: 'var(--ink-muted)' }}>
              {error || 'No news right now. Check back later.'}
            </p>
          </div>
        ) : (
          news.map(n => (
            <a
              key={n.id}
              href={n.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex', alignItems: 'flex-start', gap: 10,
                padding: '11px 12px', background: 'var(--surface)',
                border: '1px solid var(--border)', borderRadius: 11,
                textDecoration: 'none', transition: 'border-color 160ms ease',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-strong)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: '0.85rem', fontWeight: 500, color: 'var(--ink)', lineHeight: 1.35,
                  overflow: 'hidden', textOverflow: 'ellipsis',
                  display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                }}>{n.title}</div>
                <div style={{
                  fontSize: '0.72rem', color: 'var(--ink-muted)', marginTop: 4,
                  display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>{n.source}</span>
                  <span style={{ flexShrink: 0 }}>·</span>
                  <span style={{ flexShrink: 0 }}>{formatAppliedRelativeTime(n.postedAt)}</span>
                </div>
              </div>
              <ArrowUpRight size={13} style={{ color: 'var(--ink-faint)', flexShrink: 0, marginTop: 2 }} />
            </a>
          ))
        )}
      </div>
    </section>
  );
}
