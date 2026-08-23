// FILE: src/CompanyConfig/ashby-extractors.js
// Per-field readers for one Ashby posting, plus the India string test they use.
// Split out of ashbyConfig.js (section 2): these change when Ashby's JSON shape
// changes, independently of the paging and fetch logic that stayed behind.
//
// Methods keep `this`, which still resolves to the merged config at call time --
// extractLocation calls this.isIndiaString, and that keeps working after the spread.

const ashbyExtractors = {
    // Extract job ID
    extractJobID(job) {
        // Use jobUrl as unique ID
        const urlParts = job.jobUrl.split('/');
        return `ashby_${job._boardName}_${urlParts[urlParts.length - 1]}`;
    },
    
    // Extract job title
    extractJobTitle(job) {
        return job.title;
    },
    
    // Extract company name
    extractCompany(job) {
        // Format board name to readable company name
        return job._boardName
            .replace(/-/g, ' ')
            .replace(/_/g, ' ')
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    },
    
    // Extract location
    extractLocation(job) {
        // Combine all India locations
        let locations = [];
        
        // Add primary location if it's India
        if (job.location && this.isIndiaString(job.location)) {
            locations.push(job.location);
        }
        
        // Add secondary India locations
        if (job.secondaryLocations && job.secondaryLocations.length > 0) {
            for (const secLoc of job.secondaryLocations) {
                if (secLoc.location && this.isIndiaString(secLoc.location)) {
                    locations.push(secLoc.location);
                }
            }
        }
        
        return locations.length > 0 ? locations.join(', ') : 'India';
    },
    
    // Helper to check if a location string is India-related
    isIndiaString(locationStr) {
        const indianCities = [
            'bangalore', 'bengaluru', 'mumbai', 'delhi', 'new delhi',
            'hyderabad', 'pune', 'chennai', 'noida', 'gurgaon', 'gurugram',
            'kolkata', 'ahmedabad', 'jaipur', 'lucknow', 'chandigarh',
            'indore', 'nagpur', 'coimbatore', 'kochi', 'cochin',
            'thiruvananthapuram', 'trivandrum'
        ];
        
        const locLower = locationStr.toLowerCase();
        return locLower.includes('india') || 
               indianCities.some(city => locLower.includes(city));
    },
    
    // Extract description
    extractDescription(job) {
        // Prefer plain text, fallback to HTML
        return job.descriptionPlain || job.descriptionHtml || '';
    },
    
    // Extract URL
    extractURL(job) {
        return job.applyUrl || job.jobUrl;
    },
    
    // Extract posted date
    extractPostedDate(job) {
        return job.publishedDate;
    },
};

export { ashbyExtractors };
