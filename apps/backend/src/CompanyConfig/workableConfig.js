import fetch from 'node-fetch';
import { StripHtml, SanitizeHtml } from '../utils.js';
import { normalizeWorkplaceType, normalizeEmploymentType } from '../core/Locationprefilters.js';
import { normalizeArray } from '../core/jobExtractor.js';
import { workableExtractors } from './workable-extractors.js';

// ─── Pagination & Fetching ────────────────────────────────────────────────
// The old per-company API (www.workable.com/api/accounts/{slug}) is unreliable
// — it returns 302s, 404s, and needs proxy workarounds for datacenter IPs.
//
// The working API is jobs.workable.com/api/v1/jobs which is a search/aggregator
// endpoint. We query it with location=India to get ALL Workable India jobs
// in one go, paginated via nextPageToken. No slugs, no proxy needed.
// ───────────────────────────────────────────────────────────────────────────

const API_BASE = 'https://jobs.workable.com/api/v1/jobs';
const PAGE_SIZE = 40;
const MAX_PAGES = 20; 

// Indian cities for location filtering
const INDIAN_CITIES = [
    'bangalore', 'bengaluru', 'mumbai', 'delhi', 'new delhi',
    'hyderabad', 'pune', 'chennai', 'noida', 'gurgaon', 'gurugram',
    'kolkata', 'ahmedabad', 'jaipur', 'lucknow', 'chandigarh',
    'indore', 'nagpur', 'coimbatore', 'kochi', 'cochin',
    'thiruvananthapuram', 'trivandrum', 'visakhapatnam', 'vizag',
    'bhubaneswar', 'mangalore', 'mysore', 'mysuru', 'vadodara',
    'surat', 'patna', 'ranchi', 'guwahati', 'bhopal',
];

function hasIndiaLocation(job) {
    // Check country name
    const country = (job.location?.countryName || '').toLowerCase();
    if (country === 'india') return true;

    // Check city against known Indian cities
    const city = (job.location?.city || '').toLowerCase();
    if (INDIAN_CITIES.some(c => city.includes(c))) return true;

    // Check locations array (full location strings like "Bangalore, Karnataka, India")
    if (Array.isArray(job.locations)) {
        for (const loc of job.locations) {
            const lower = loc.toLowerCase();
            if (lower.includes('india') || INDIAN_CITIES.some(c => lower.includes(c))) return true;
        }
    }

    return false;
}

export const workableConfig = {
    siteName: 'Workable Jobs',
    limit: 20,
    _allJobsQueue: [],
    _initialized: false,
    needsDescriptionScraping: false, // description comes from the API response

    // ─── Pre-fetch phase: paginate the India search API ───────────────────
    async initialize() {
        if (this._initialized) return;

        this._allJobsQueue = [];

        console.log(`[Workable] Fetching India jobs from jobs.workable.com API...`);

        let pageToken = null;
        let totalFetched = 0;
        let pageCount = 0;

        try {
            do {
                const params = new URLSearchParams({
                    location: 'India',
                   
                });
                if (pageToken) params.set('pageToken', pageToken);

                const url = `${API_BASE}?${params.toString()}`;

                const controller = new AbortController();
                const timeout = setTimeout(() => controller.abort(), 20000);

                const res = await fetch(url, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
                        'Accept': 'application/json',
                    },
                    signal: controller.signal,
                });
                clearTimeout(timeout);

                if (!res.ok) {
                    console.log(`[Workable] ⚠️ API returned HTTP ${res.status} — stopping pagination`);
                    break;
                }

                const data = await res.json();
                const jobs = data.jobs || [];

                if (jobs.length === 0) break;

                // Double-check India location (the API's location filter is fuzzy)
                const indiaJobs = jobs.filter(hasIndiaLocation);
                this._allJobsQueue.push(...indiaJobs);
                totalFetched += indiaJobs.length;
                pageCount++;
                pageToken = data.nextPageToken || null;

                console.log(`[Workable] Page ${pageCount}: ${indiaJobs.length} India jobs (${jobs.length} raw, ${totalFetched} total so far)`);

                // Polite delay between pages
                if (pageToken) {
                    await new Promise(r => setTimeout(r, 500));
                }

            } while (pageToken && pageCount < MAX_PAGES);

        } catch (err) {
            console.log(`[Workable] ⚠️ Fetch error: ${err.message}`);
        }

        console.log(`[Workable] ✅ Done: ${totalFetched} India jobs queued from ${pageCount} page(s)`);

        // Log jobs grouped by company
        if (this._allJobsQueue.length > 0) {
            const companyCounts = {};
            for (const job of this._allJobsQueue) {
                const comp = job.company?.title || 'Unknown';
                companyCounts[comp] = (companyCounts[comp] || 0) + 1;
            }

            const companies = Object.entries(companyCounts).sort((a, b) => b[1] - a[1]);
            for (let i = 0; i < Math.min(companies.length, 20); i++) {
                console.log(`[Workable] ✅ ${companies[i][0]}: ${companies[i][1]} jobs in India`);
            }
            if (companies.length > 20) {
                console.log(`[Workable] ... and ${companies.length - 20} more companies.`);
            }
        }

        this._initialized = true;
    },

    // ─── Called by scraperEngine ───────────────────────────────────────────
    async fetchPage(offset, limit) {
        if (!this._initialized) await this.initialize();
        const jobs = this._allJobsQueue.slice(offset, offset + limit);
        return { jobs, total: this._allJobsQueue.length };
    },

    getJobs(data) { return data.jobs || []; },
    getTotal(data) { return data.total || 0; },

    // ─── Field extractors ─────────────────────────────────────────────────
    // The jobs.workable.com API returns objects with this shape:
    //   { id, title, state, description, employmentType, benefitsSection,
    //     requirementsSection, url, language, locations, location { city,
    //     subregion, countryName }, created, updated, company { id, title,
    //     website, image, description, url }, workplace, department }

    // Field readers live in workable-extractors.js; spread here so the exported
    // config keeps the exact shape scraperEngine already reads.
    ...workableExtractors,
};
