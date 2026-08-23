import fetch from 'node-fetch';
import { companyBoardNames } from './ashby-boards.js';
import { ashbyExtractors } from './ashby-extractors.js';

export const ashbyConfig = {
    siteName: "Ashby Jobs",
    baseUrl: "https://api.ashbyhq.com/posting-api/job-board",
    
    companyBoardNames,
    
    // Internal state
    _allJobsQueue: [],
    _initialized: false,
    
    // Fetch all jobs from all boards upfront
    async initialize() {
        if (this._initialized) return;
        
        console.log(`[Ashby] Fetching jobs from ${this.companyBoardNames.length} companies...`);
        
        let successCount = 0;
        let failCount = 0;
        
        for (const boardName of this.companyBoardNames) {
            try {
                const url = `${this.baseUrl}/${boardName}`;
                const response = await fetch(url);
                
                if (!response.ok) {
                    failCount++;
                    // Only log 404s if you want to see which ones failed
                    // console.log(`[Ashby] ❌ ${boardName}: ${response.status}`);
                    continue;
                }
                
                const data = await response.json();
                
                if (!data.jobs || data.jobs.length === 0) {
                    continue;
                }
                
                // Filter for India jobs
                const indiaJobs = data.jobs.filter(job => {
                    return this.hasIndiaLocation(job);
                }).map(job => ({
                    ...job,
                    _boardName: boardName
                }));
                
                if (indiaJobs.length > 0) {
                    console.log(`[Ashby] ✅ ${boardName}: ${indiaJobs.length} jobs in India (${data.jobs.length} total)`);
                    this._allJobsQueue.push(...indiaJobs);
                    successCount++;
                }
                
                // Rate limit: 300ms between companies
                await new Promise(resolve => setTimeout(resolve, 300));
                
            } catch (error) {
                failCount++;
                console.error(`[Ashby] ❌ ${boardName}: ${error.message}`);
            }
        }
        
        console.log(`[Ashby] ✅ Summary: ${successCount} companies with India jobs, ${failCount} failed/empty`);
        console.log(`[Ashby] 📊 Total jobs found: ${this._allJobsQueue.length}`);
        this._initialized = true;
    },
    
    // Check if job has India location
    hasIndiaLocation(job) {
        const indianCities = [
            'bangalore', 'bengaluru', 'mumbai', 'delhi', 'new delhi',
            'hyderabad', 'pune', 'chennai', 'noida', 'gurgaon', 'gurugram',
            'kolkata', 'ahmedabad', 'jaipur', 'lucknow', 'chandigarh',
            'indore', 'nagpur', 'coimbatore', 'kochi', 'cochin',
            'thiruvananthapuram', 'trivandrum', 'visakhapatnam', 'vizag',
            'bhubaneswar', 'mangalore', 'mysore', 'mysuru', 'vadodara',
            'surat', 'patna', 'ranchi', 'guwahati', 'bhopal'
        ];
        
        // Check primary location
        if (job.location) {
            const locationLower = job.location.toLowerCase();
            if (locationLower.includes('india') || 
                indianCities.some(city => locationLower.includes(city))) {
                return true;
            }
        }
        
        // Check address
        if (job.address?.postalAddress?.addressCountry) {
            const country = job.address.postalAddress.addressCountry.toLowerCase();
            if (country.includes('india') || country === 'in' || country === 'ind') {
                return true;
            }
        }
        
        // Check secondary locations
        if (job.secondaryLocations && job.secondaryLocations.length > 0) {
            for (const secLoc of job.secondaryLocations) {
                if (secLoc.location) {
                    const locLower = secLoc.location.toLowerCase();
                    if (locLower.includes('india') || 
                        indianCities.some(city => locLower.includes(city))) {
                        return true;
                    }
                }
                if (secLoc.address?.addressCountry) {
                    const country = secLoc.address.addressCountry.toLowerCase();
                    if (country.includes('india') || country === 'in' || country === 'ind') {
                        return true;
                    }
                }
            }
        }
        
        return false;
    },
    
    // Fetch jobs page (required by scraperEngine)
    async fetchPage(offset, limit) {
        if (!this._initialized) {
            await this.initialize();
        }
        
        const jobs = this._allJobsQueue.slice(offset, offset + limit);
        return { jobs, total: this._allJobsQueue.length };
    },
    
    // Required by scraperEngine
    getJobs(data) {
        return data.jobs || [];
    },
    
    // Get total
    getTotal(data) {
        return data.total || 0;
    },
    
    // Field readers live in ashby-extractors.js; spread here so the exported
    // config keeps the exact shape scraperEngine already reads.
    ...ashbyExtractors,
};