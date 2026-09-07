'use client';
// FILE: src/components/seeker/today/NewsSection.tsx
// Fresh tech and job news as an editorial column: hairline rows, running
// numbers, serif headlines, mono source and age. Two columns when wide.
// Loads from our own /api/seeker/news.
import { ArrowUpRight, RefreshCw } from 'lucide-react';
import { useTechNews } from '../../../hooks/seeker/useTechNews';
import { formatAppliedRelativeTime } from '../../../utils/progress';
import { Button } from '../../ui';
import { EdSection } from './shared';

export default function NewsSection({ number = '03' }: { number?: string }) {
  const { news, loading, error, refetch } = useTechNews(6);

  return (
    <EdSection
      id="news"
      number={number}
      kicker="Fresh today"
      title="What the industry is reading"
      link={{ label: 'Hacker News', to: 'https://news.ycombinator.com/', external: true }}
    >
      {loading ? (
        <ol className="nw" aria-busy="true" aria-label="Loading news">
          {Array.from({ length: 6 }).map((_, i) => (
            <li key={i} className="nw__row nw__row--skel" style={{ opacity: 1 - i * 0.12 }}>
              <span className="skeleton" style={{ height: 10, width: 120 }} />
              <span className="skeleton" style={{ height: 20, width: `${60 + (i * 17) % 35}%` }} />
            </li>
          ))}
        </ol>
      ) : error || news.length === 0 ? (
        <div className="jb-error td-error" role={error ? 'alert' : undefined}>
          <p className="jb-error__title">{error ? 'News is taking a moment' : 'Nothing new yet'}</p>
          <p className="jb-error__body">{error || 'The feed refreshes every hour.'}</p>
          {error && <Button variant="secondary" size="sm" onClick={refetch} iconLeft={<RefreshCw size={13} />}>Try again</Button>}
        </div>
      ) : (
        <ol className="nw">
          {news.map((n, i) => (
            <li key={n.id} className="rise" style={{ '--i': i } as React.CSSProperties}>
              <a href={n.url} target="_blank" rel="noopener noreferrer" className="nw__row">
                <span className="nw__meta">
                  <span className="nw__num">{String(i + 1).padStart(2, '0')}</span>
                  <span className="nw__src">{n.source}</span>
                  <span className="nw__dot" aria-hidden>·</span>
                  <span>{formatAppliedRelativeTime(n.postedAt)}</span>
                </span>
                <span className="font-display nw__headline">{n.title}</span>
                <span className="nw__foot">
                  <span>{n.points} points · {n.comments} comments</span>
                  <span className="nw__arrow" aria-hidden><ArrowUpRight size={14} /></span>
                </span>
              </a>
            </li>
          ))}
        </ol>
      )}
    </EdSection>
  );
}
