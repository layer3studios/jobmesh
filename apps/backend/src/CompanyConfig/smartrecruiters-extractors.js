// FILE: src/CompanyConfig/smartrecruiters-extractors.js
// Per-field readers for one SmartRecruiters posting. Split out of
// smartRecruitersConfig.js (section 2).

const smartRecruitersExtractors = {
    // ─── Field extractors ─────────────────────────────────────────────────
    extractJobID(job) {
        return `sr_${job._companyId}_${job.id}`;
    },

    extractJobTitle(job) {
        return job.name || '';
    },

    extractCompany(job) {
        const companyObj = job.company || job._detail?.company;
        if (companyObj?.name) return companyObj.name;
        return String(job._companyId || '')
            .replace(/([a-z])([A-Z])/g, '$1 $2')
            .split(/[-_]/)
            .map(w => w.charAt(0).toUpperCase() + w.slice(1))
            .join(' ');
    },

    extractLocation(job) {
        const loc = job.location || {};
        return loc.fullLocation || [loc.city, loc.region, loc.country?.toUpperCase()].filter(Boolean).join(', ') || 'India';
    },

    extractDescription(job) {
        const sections = job._detail?.jobAd?.sections;
        return assembleDescription(sections, false);
    },

    extractDescriptionHtml(job) {
        const sections = job._detail?.jobAd?.sections;
        return SanitizeHtml(assembleDescription(sections, true));
    },

    extractURL(job) {
        return job._detail?.postingUrl || job._detail?.applyUrl || null;
    },

    extractPostedDate(job) {
        return job.releasedDate || job._detail?.releasedDate || null;
    },
};

export { smartRecruitersExtractors };
