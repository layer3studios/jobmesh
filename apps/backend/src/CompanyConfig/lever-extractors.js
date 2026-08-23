// FILE: src/CompanyConfig/lever-extractors.js
// Per-field readers for one Lever posting. Split out of leverConfig.js (section 2):
// these change when Lever's JSON shape changes, independently of the paging and
// fetch logic that stayed behind.
//
// Exported as one object the adapter spreads, so the exported config keeps the
// exact shape scraperEngine already reads.

const leverExtractors = {
  /**
   * Extract unique job ID
   */
  extractJobID: (job) => {
    return `lever_${job.id}`;
  },

  /**
   * Extract job title
   */
  extractJobTitle: (job) => {
    return job.text || 'Untitled Position';
  },

  /**
   * Extract company name
   */
  extractCompany: (job) => {
    if (job.hostedUrl) {
      try {
        const url = new URL(job.hostedUrl);
        const parts = url.pathname.split('/').filter(Boolean);
        if (parts.length > 0) {
          return parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
        }
      } catch (e) {
        // Fall through
      }
    }
    
    return 'Company via Lever';
  },

  /**
   * Extract location(s)
   */
  extractLocation: (job) => {
    const locations = [];
    
    if (job.categories && job.categories.location) {
      locations.push(job.categories.location);
    }
    
    if (job.categories && job.categories.allLocations && Array.isArray(job.categories.allLocations)) {
      for (const loc of job.categories.allLocations) {
        if (!locations.includes(loc)) {
          locations.push(loc);
        }
      }
    }
    
    if (job.workplaceType && job.workplaceType !== 'unspecified' && job.workplaceType !== 'on-site') {
      const workplaceLabel = job.workplaceType.charAt(0).toUpperCase() + job.workplaceType.slice(1);
      locations.push(workplaceLabel);
    }
    
    return locations.length > 0 ? locations.join(', ') : 'Location not specified';
  },

  /**
   * Extract description
   */
  extractDescription: (job) => {
    if (job.descriptionPlain) {
      return job.descriptionPlain;
    }
    
    if (job.description) {
      return job.description.replace(/<[^>]*>/g, '').trim();
    }
    
    return 'No description available';
  },

  /**
   * Extract URL
   */
  extractURL: (job) => {
    if (job.applyUrl) {
      return job.applyUrl;
    }
    
    if (job.hostedUrl) {
      return job.hostedUrl;
    }
    
    return null;
  },

  /**
   * Extract posting date
   */
  extractPostedDate: (job) => {
    return null;
  },
};

export { leverExtractors };
