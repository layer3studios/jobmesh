// FILE: src/CompanyConfig/workable-extractors.js
// Per-field readers for one Workable posting. Split out of workableConfig.js
// (section 2).

const workableExtractors = {
    extractJobID(job) {
        return `workable_${job.id}`;
    },

    extractJobTitle(job) {
        return job.title || '';
    },

    extractCompany(job) {
        return job.company?.title || '';
    },

    extractLocation(job) {
        const parts = [
            job.location?.city,
            job.location?.countryName,
        ].filter(Boolean);
        return parts.join(', ') || 'India';
    },

    extractAllLocations(job) {
        if (Array.isArray(job.locations) && job.locations.length > 0) {
            return normalizeArray(job.locations);
        }
        const loc = [job.location?.city, job.location?.countryName].filter(Boolean).join(', ');
        return normalizeArray([loc]);
    },

    extractDepartment(job) {
        return job.department || null;
    },

    extractDescription(job) {
        const parts = [
            job.description || '',
            job.requirementsSection || '',
            job.benefitsSection || '',
        ].filter(Boolean);
        return StripHtml(parts.join('\n'));
    },

    extractDescriptionHtml(job) {
        const parts = [
            job.description || '',
            job.requirementsSection || '',
            job.benefitsSection || '',
        ].filter(Boolean);
        return SanitizeHtml(parts.join(''));
    },

    extractURL(job) {
        return job.url || null;
    },

    extractDirectApplyURL(job) {
        return job.url || null;
    },

    extractPostedDate(job) {
        return job.created ? new Date(job.created) : null;
    },

    extractCountry(job) {
        const country = job.location?.countryName;
        if (!country) return null;
        const lower = country.trim().toLowerCase();
        if (lower === 'india') return 'IN';
        return country;
    },

    extractWorkplaceType(job) {
        return normalizeWorkplaceType(job.workplace);
    },

    extractIsRemote(job) {
        return String(job.workplace || '').toLowerCase() === 'remote';
    },

    extractEmploymentType(job) {
        return normalizeEmploymentType(job.employmentType);
    },

    extractExperienceLevel(job) {
        // The search API doesn't have an experience field — let processor derive from title
        return null;
    },

    extractOffice(job) {
        return job.location?.city || null;
    },

    extractATSPlatform() {
        return 'workable';
    },

    extractTags(job) {
        return normalizeArray([
            job.department,
            job.employmentType,
            job.workplace ? `Workplace: ${job.workplace}` : null,
        ]);
    },

    // No salary fields in the Workable public search API
    extractSalaryCurrency() { return null; },
    extractSalaryMin() { return null; },
    extractSalaryMax() { return null; },
    extractSalaryInterval() { return null; },

    // No team field in Workable
    extractTeam() { return null; },
};

export { workableExtractors };
