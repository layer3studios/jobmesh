import fetch from 'node-fetch';
import { companyIdentifiers } from './smartrecruiters-companies.js';
import { smartRecruitersExtractors } from './smartrecruiters-extractors.js';
import { StripHtml, SanitizeHtml } from '../utils.js';
import { isIndiaString, normalizeEmploymentType } from '../core/Locationprefilters.js';
import { normalizeArray } from '../core/jobExtractor.js';

// ─── SmartRecruiters experienceLevel → JobMesh taxonomy ───────────────────
const EXPERIENCE_MAP = {
    'internship':       'Entry Level',
    'entry level':      'Entry Level',
    'associate':        'Entry Level',
    'mid-senior level': 'Mid Level',
    'director':         'Leadership',
    'executive':        'Leadership',
    'not applicable':   'N/A',
};

// ─── SmartRecruiters typeOfEmployment → JobMesh taxonomy ──────────────────
const EMPLOYMENT_MAP = {
    'full-time':  'Full-time',
    'part-time':  'Part-time',
    'intern':     'Internship',
    'contract':   'Contract',
    'temporary':  'Contract',
};

// ─── Description assembly ────────────────────────────────────────────────
// SmartRecruiters splits descriptions into 4 named sections:
//   companyDescription, jobDescription, qualifications, additionalInformation
// We concatenate them with section headers preserved.
function assembleDescription(sections, asHtml) {
    if (!sections || typeof sections !== 'object') return '';
    const order = ['companyDescription', 'jobDescription', 'qualifications', 'additionalInformation'];
    const parts = [];
    for (const key of order) {
        const section = sections[key];
        if (!section || !section.text) continue;
        const title = section.title || key;
        if (asHtml) {
            parts.push(`<h3>${title}</h3>${section.text}`);
        } else {
            parts.push(`${title}\n${StripHtml(section.text)}`);
        }
    }
    return parts.join(asHtml ? '\n' : '\n\n');
}

export const smartRecruitersConfig = {
    siteName: "SmartRecruiters Jobs",
    baseUrl: "https://api.smartrecruiters.com/v1/companies",

    // ─── Server-side filters ──────────────────────────────────────────────
    // country=in filters to India at the API level
    filterCountry: 'in',

    // language=en gates out non-English postings before they hit our pipeline.
    // Set to null to catch bilingual jobs the company mis-tagged.
    filterLanguageEn: true,

    // Per-page size (SmartRecruiters caps at 100)
    pageSize: 100,

    // Polite delay between requests (ms)
    requestDelayMs: 250,

    companyIdentifiers,

    // Internal state
    _allJobsQueue: [],
    _initialized: false,

    // ─── Initialize: fetch all companies upfront ─────────────────────────
    async initialize() {
        if (this._initialized) return;

        console.log(`[SmartRecruiters] Fetching jobs from ${this.companyIdentifiers.length} companies...`);

        let totalListed = 0;
        let totalEnriched = 0;
        let failedCompanies = 0;

        for (const companyId of this.companyIdentifiers) {
            try {
                // Step 1: paginate through list endpoint
                const listedJobs = await this.fetchAllListedJobs(companyId);
                totalListed += listedJobs.length;

                if (listedJobs.length === 0) {
                    continue;
                }

                // Step 2: enrich each with detail (description + apply URL)
                const enriched = await this.enrichJobsWithDetails(companyId, listedJobs);
                totalEnriched += enriched.length;
                this._allJobsQueue.push(...enriched);

                console.log(`[SmartRecruiters] ✅ ${companyId}: ${enriched.length}/${listedJobs.length} jobs enriched`);

            } catch (error) {
                failedCompanies++;
                console.error(`[SmartRecruiters] ❌ ${companyId}: ${error.message}`);
            }
        }

        console.log(`[SmartRecruiters] 📊 Summary: ${totalEnriched} jobs enriched (${totalListed} listed, ${failedCompanies} companies failed)`);
        console.log(`[SmartRecruiters] 💼 Total in queue: ${this._allJobsQueue.length}`);
        this._initialized = true;
    },

    // ─── Helper: paginate through all listed jobs for a company ──────────
    async fetchAllListedJobs(companyId) {
        const all = [];
        let offset = 0;
        const maxPages = 30; // safety cap: 100 x 30 = 3000 jobs max per company

        for (let page = 0; page < maxPages; page++) {
            const params = new URLSearchParams({
                limit: String(this.pageSize),
                offset: String(offset),
            });
            if (this.filterCountry) params.set('country', this.filterCountry);
            if (this.filterLanguageEn) params.set('language', 'en');

            const url = `${this.baseUrl}/${encodeURIComponent(companyId)}/postings?${params}`;
            const response = await fetch(url, { headers: { 'Accept': 'application/json' } });

            if (response.status === 404) {
                // Company slug invalid or no longer on SmartRecruiters
                break;
            }

            if (!response.ok) {
                throw new Error(`list HTTP ${response.status}`);
            }
            const data = await response.json();
            const batch = data.content || [];
            all.push(...batch);

            if (batch.length < this.pageSize) break;
            offset += this.pageSize;
            await this.sleep(this.requestDelayMs);
        }
        return all;
    },

    // ─── Helper: enrich list jobs with detail data ───────────────────────
    async enrichJobsWithDetails(companyId, listedJobs) {
        const enriched = [];
        for (const listJob of listedJobs) {
            try {
                const url = `${this.baseUrl}/${encodeURIComponent(companyId)}/postings/${listJob.id}`;
                const response = await fetch(url, { headers: { 'Accept': 'application/json' } });
                if (!response.ok) {
                    console.warn(`[SmartRecruiters] ⚠️  Detail fetch failed for ${companyId}/${listJob.id}: HTTP ${response.status}`);
                    continue;
                }
                const detail = await response.json();
                enriched.push({
                    ...listJob,
                    _detail: detail,
                    _companyId: companyId,
                });
                await this.sleep(this.requestDelayMs);
            } catch (error) {
                console.warn(`[SmartRecruiters] ⚠️  Detail fetch error for ${companyId}/${listJob.id}: ${error.message}`);
            }
        }
        return enriched;
    },

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },

    // ─── Required by scraperEngine ────────────────────────────────────────
    async fetchPage(offset, limit) {
        if (!this._initialized) await this.initialize();
        const jobs = this._allJobsQueue.slice(offset, offset + limit);
        return { jobs, total: this._allJobsQueue.length };
    },

    getJobs(data) { return data.jobs || []; },
    getTotal(data) { return data.total || 0; },

    // Field readers live in smartrecruiters-extractors.js; spread here so the exported
    // config keeps the exact shape scraperEngine already reads.
    ...smartRecruitersExtractors,
};

export default smartRecruitersConfig;
