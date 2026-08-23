import { companySlugs } from './recruitee-companies.js';
import {
  REQUEST_TIMEOUT_MS, sleep, randomDelay, buildProxyUrl,
  fetchJsonFromUrl, fetchRecruiteeOffers,
} from './recruitee-fetch.js';


const indianCities = [
  'bangalore', 'bengaluru', 'mumbai', 'delhi', 'new delhi',
  'hyderabad', 'pune', 'chennai', 'noida', 'gurgaon', 'gurugram',
  'kolkata', 'ahmedabad', 'jaipur', 'lucknow', 'chandigarh',
  'indore', 'nagpur', 'coimbatore', 'kochi', 'cochin',
  'thiruvananthapuram', 'trivandrum', 'visakhapatnam', 'vizag',
  'bhubaneswar', 'mangalore', 'mysore', 'mysuru', 'vadodara',
  'surat', 'patna', 'ranchi', 'guwahati', 'bhopal'
];



export const recruiteeConfig = {
  siteName: 'Recruitee Jobs',

  _allJobsQueue: [],
  _initialized: false,

  async initialize() {
    if (this._initialized) return;

    const via = process.env.WORKABLE_PROXY_URL ? 'proxy' : 'direct';
    console.log(`[Recruitee] Fetching jobs from ${companySlugs.length} companies via ${via}...`);

    let successCount = 0;
    let notFoundCount = 0;
    let errorCount = 0;

    for (const slug of companySlugs) {
      try {
        const result = await fetchRecruiteeOffers(slug);

        if (result.kind === 'not-found') {
          notFoundCount++;
          console.warn(`[Recruitee] ⚠️  ${slug}: 404 — skipping`);
          await sleep(randomDelay());
          continue;
        }

        if (result.kind !== 'ok') {
          errorCount++;
          console.error(`[Recruitee] ❌ ${slug}: ${result.error} — skipping`);
          await sleep(randomDelay());
          continue;
        }

        const data = result.data || {};
        const offers = Array.isArray(data.offers) ? data.offers : [];

        const indiaOffers = offers
          .filter(offer => this.hasIndiaLocation(offer))
          .map(offer => ({
            ...offer,
            _slug: slug,
            _companyName: offer.company_name || slug,
          }));

        if (indiaOffers.length > 0) {
          const companyName = indiaOffers[0]._companyName;
          console.log(`[Recruitee] ✅ ${slug} (${companyName}): ${indiaOffers.length} India jobs (${offers.length} total)`);
          this._allJobsQueue.push(...indiaOffers);
          successCount++;
        } else {
          const companyName = offers[0]?.company_name || slug;
          console.log(`[Recruitee]    ${slug} (${companyName}): ${offers.length} jobs, 0 in India`);
        }
      } catch (error) {
        errorCount++;
        console.error(`[Recruitee] ❌ ${slug}: ${error.message} — skipping`);
      }

      await sleep(randomDelay());
    }

    console.log(`[Recruitee] ✅ Summary: ${successCount} with India jobs | ${notFoundCount} not on Recruitee | ${errorCount} errors`);
    console.log(`[Recruitee] 📊 Total India jobs queued: ${this._allJobsQueue.length}`);
    this._initialized = true;
  },

  hasIndiaLocation(offer) {
    if (!Array.isArray(offer.locations) || offer.locations.length === 0) {
      return false;
    }

    return offer.locations.some(loc => {
      if (loc.country_code === 'IN') return true;
      if (loc.country && loc.country.toLowerCase() === 'india') return true;
      if (loc.city) {
        const cityLower = String(loc.city).toLowerCase();
        if (indianCities.some(c => cityLower.includes(c))) return true;
      }
      return false;
    });
  },

  async fetchPage(offset, limit) {
    if (!this._initialized) {
      await this.initialize();
    }
    const jobs = this._allJobsQueue.slice(offset, offset + limit);
    return { jobs, total: this._allJobsQueue.length };
  },

  getJobs(data) {
    return data.jobs || [];
  },

  getTotal(data) {
    return data.total || 0;
  },

  extractJobID(offer) {
    return `recruitee_${offer._slug}_${offer.id}`;
  },

  extractJobTitle(offer) {
    return offer.title;
  },

  extractCompany(offer) {
    return offer.company_name || offer._companyName || offer._slug;
  },

  extractLocation(offer) {
    if (!Array.isArray(offer.locations) || offer.locations.length === 0) return null;
    const first = offer.locations[0];
    return [first.city, first.state, first.country].filter(Boolean).join(', ') || null;
  },

  extractDescription(offer) {
    const parts = [offer.description, offer.requirements].filter(Boolean);
    return parts.join('\n\n') || '';
  },

  extractURL(offer) {
    return offer.careers_apply_url || offer.careers_url || null;
  },

  extractPostedDate(offer) {
    if (!offer.published_at) return null;
    const date = new Date(offer.published_at);
    return isNaN(date.getTime()) ? null : date;
  },
};
