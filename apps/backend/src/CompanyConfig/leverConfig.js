import fetch from 'node-fetch';
import { AbortController } from 'abort-controller';
import { companySiteNames } from './lever-companies.js';
import { hasIndiaLocation } from './lever-location-filter.js';
import { leverExtractors } from './lever-extractors.js';

/**
 * LEVER CONFIGURATION - EXPANDED VERSION
 * 
 * This version includes more companies that are likely to have jobs.
 * These are verified to work with Lever's API.
 */

const LEVER_BASE_URL = 'https://api.lever.co/v0/postings';

/**
 * Lever Configuration - Compatible with existing architecture
 */
const leverConfig = {
  siteName: 'Lever Jobs',
  
  // No session needed (public API)
  needsSession: false,
  
  // Use GET method
  method: 'GET',
  
  // Each "page" = one company
  limit: 1,

  // Keep paging through company list even when one company has zero jobs
  ignoreLengthCheck: true,
  
  // Base URL
  baseUrl: LEVER_BASE_URL,

  // Total pseudo-pages = total companies configured
  getTotal: () => companySiteNames.length,

  /**
   * Fetch one company's postings and swallow transient/per-company failures.
   * This method must never throw; return [] to skip and continue.
   */
  fetchPage: async (offset, limit) => {
    const companyIndex = offset;

    if (companyIndex >= companySiteNames.length) {
      return [];
    }

    const siteName = companySiteNames[companyIndex];
    const url = `${LEVER_BASE_URL}/${siteName}?mode=json`;
    console.log(`\n[Lever] 🔍 Company ${companyIndex + 1}/${companySiteNames.length}: ${siteName}`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (res.status === 404) {
        console.log(`[Lever] ⚠️  ${siteName}: 404 — slug may be dead, skipping`);
        return [];
      }

      if (!res.ok) {
        console.warn(`[Lever] ⚠️  ${siteName}: HTTP ${res.status} — skipping`);
        return [];
      }

      return await res.json();
    } catch (err) {
      clearTimeout(timeoutId);
      const reason = err?.name === 'AbortError' ? '15s timeout' : (err?.message || 'request failed');
      console.warn(`[Lever] ⚠️  ${siteName}: ${reason} — skipping`);
      return [];
    }
  },
  
  /**
   * Build URL for current company
   */
  buildPageUrl: (offset, limit) => {
    const companyIndex = offset;
    
    if (companyIndex >= companySiteNames.length) {
      console.log(`[Lever] ✅ Finished checking all ${companySiteNames.length} companies`);
      return null;
    }
    
    const siteName = companySiteNames[companyIndex];
    const url = `${LEVER_BASE_URL}/${siteName}?mode=json`;
    
    console.log(`\n[Lever] 🔍 Company ${companyIndex + 1}/${companySiteNames.length}: ${siteName}`);
    
    return url;
  },
  
  /**
   * Extract and filter jobs from API response
   * 
   * DEBUGGING ENABLED: Shows what we receive from API
   */
  getJobs: (data) => {
    // DEBUG: Log what we received
    if (!data) {
      console.log(`       ❌ No data received from API`);
      return [];
    }
    
    const allJobs = Array.isArray(data) ? data : [];
    
    // DEBUG: Log job count
    console.log(`       📊 Received ${allJobs.length} total jobs`);
    
    if (allJobs.length === 0) {
      console.log(`       ⊘  No jobs found for this company`);
      return [];
    }
    
    // DEBUG: Log first job structure (helps diagnose issues)
    if (allJobs.length > 0) {
      const firstJob = allJobs[0];
      console.log(`       🔍 Sample job fields:`, {
        id: firstJob.id ? '✓' : '✗',
        text: firstJob.text ? '✓' : '✗',
        country: firstJob.country || 'none',
        location: firstJob.categories?.location || 'none',
        allLocations: firstJob.categories?.allLocations?.length || 0
      });
    }
    
    // Filter for India
    const indiaJobs = allJobs.filter(hasIndiaLocation);
    
    if (indiaJobs.length > 0) {
      console.log(`       ✅ Found ${indiaJobs.length} India jobs!`);
    } else {
      console.log(`       ⊘  No India jobs (checked ${allJobs.length} jobs)`);
    }
    
    return indiaJobs;
  },
  

  // Field readers live in lever-extractors.js; spread here so the exported config
  // keeps the exact shape scraperEngine reads.
  ...leverExtractors,
};

export { leverConfig };
