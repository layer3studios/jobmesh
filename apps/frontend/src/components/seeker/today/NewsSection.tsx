'use client';
// FILE: src/components/seeker/today/NewsSection.tsx
// Fresh tech and job news, as a run of tilting glass cards: a serif headline,
// the source and age in mono, a running number, and an arrow that leans out
// on hover. The first story runs wide. Loads from our own /api/seeker/news.
import { ArrowUpRight, Newspaper, RefreshCw } from 'lucide-react';
import { useTechNews } from '../../../hooks/seeker/useTechNews';
import { formatAppliedRelativeTime } from '../../../utils/progress';
import { Button } from '../../ui';
import { eyebrowStyle } from './shared';
import TiltCard from './TiltCard';

export default function NewsSection() {
  const { news, loading, error, refetch } = useTechNews(5);

  return (
    <section className="nw" aria-labelledby="nw-title">
      <div className="nw__head">
        <div>
          <p style={eyebrowStyle}>Fresh today</p>
          <h2 id="nw-title" className="font-display nw__title">What the industry is reading</h2>
        </div>
        <a href="https://news.ycombinator.com/" target="_blank" rel="noopener noreferrer" className="ws-link-more">
          More on Hacker News <ArrowUpRight size={12} />
        </a>
      </div>

      {loading ? (
        <div className="nw__grid" aria-busy="true" aria-label="Loading news">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="nw__card nw__card--skel skeleton" style={{ opacity: 1 - i * 0.12 }} />
          ))}
        </div>
      ) : error || news.length === 0 ? (
        <div className="jb-error td-error glass ws-section" role={error ? 'alert' : undefined}>
          <Newspaper size={22} style={{ color: 'var(--ink-faint)' }} />
          <p className="jb-error__title">{error ? 'News is taking a moment' : 'Nothing new yet'}</p>
          <p className="jb-error__body">{error || 'The feed refreshes every hour. Check back after your next application.'}</p>
          {error && <Button variant="secondary" size="sm" onClick={refetch} iconLeft={<RefreshCw size={13} />}>Try again</Button>}
        </div>
      ) : (
        <div className="nw__grid">
          {news.map((n, i) => (
            <TiltCard
              key={n.id}
              as="a"
              href={n.url}
              target="_blank"
              rel="noopener noreferrer"
              max={5}
              className={`nw__card rise${i === 0 ? ' nw__card--lead' : ''}`}
              style={{ '--i': i } as React.CSSProperties}
            >
              <div className="nw__meta">
                <span className="nw__index">{String(i + 1).padStart(2, '0')}</span>
                <span className="nw__source">{n.source}</span>
                <span className="nw__dot">·</span>
                <span>{formatAppliedRelativeTime(n.postedAt)}</span>
              </div>
              <h3 className="font-display nw__headline">{n.title}</h3>
              <div className="nw__foot">
                <span className="nw__points">{n.points} points · {n.comments} comments</span>
                <span className="nw__arrow" aria-hidden><ArrowUpRight size={15} /></span>
              </div>
            </TiltCard>
          ))}
        </div>
      )}
    </section>
  );
}
