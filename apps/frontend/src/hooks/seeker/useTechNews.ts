'use client';
import { useState, useEffect, useRef, useCallback } from 'react';

// Tech / job-market news. Served by our own backend (/api/seeker/news), which proxies
// the public Hacker News API and caches the result for ~60 min — so we never
// hammer the upstream and no third-party host is hit from the browser.
const NEWS_ENDPOINT = '/api/seeker/news';

export interface TechNewsItem {
    id: string;
    title: string;
    url: string;
    source: string;
    points: number;
    comments: number;
    postedAt: string;
}

interface UseTechNewsResult {
    news: TechNewsItem[];
    loading: boolean;
    error: string | null;
    refetch: () => void;
}

export function useTechNews(limit = 5): UseTechNewsResult {
    const [news, setNews] = useState<TechNewsItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const abortRef = useRef<AbortController | null>(null);

    const fetchNews = useCallback(() => {
        abortRef.current?.abort();
        const ctrl = new AbortController();
        abortRef.current = ctrl;
        setLoading(true);
        setError(null);

        fetch(NEWS_ENDPOINT, { signal: ctrl.signal, credentials: 'include' })
            .then(r => r.ok ? r.json() : { items: [] })
            .then((d: { items?: TechNewsItem[] }) => {
                const items = Array.isArray(d?.items) ? d.items : [];
                setNews(items.slice(0, limit));
            })
            .catch(e => {
                if (e.name !== 'AbortError') {
                    console.error(e);
                    setError('Failed to load news.');
                }
            })
            .finally(() => { if (!ctrl.signal.aborted) setLoading(false); });
    }, [limit]);

    useEffect(() => {
        fetchNews();
        return () => { abortRef.current?.abort(); };
    }, [fetchNews]);

    return { news, loading, error, refetch: fetchNews };
}
