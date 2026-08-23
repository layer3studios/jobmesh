// FILE: src/CompanyConfig/lever-location-filter.js
// Lever's India filter: the city list it matches on, and the predicate the adapter
// runs over each posting. Split out of leverConfig.js (section 2).
//
// DELIBERATELY NOT shared with the other adapters' city lists. They look similar
// but are not identical, and merging them would be a behaviour change dressed up
// as a refactor -- each board reports locations in its own shape.

// Indian cities for filtering
const indianCities = [
  'bangalore', 'bengaluru', 'mumbai', 'delhi', 'new delhi',
  'hyderabad', 'pune', 'chennai', 'noida', 'gurgaon', 'gurugram',
  'kolkata', 'ahmedabad', 'jaipur', 'lucknow', 'chandigarh',
  'indore', 'nagpur', 'coimbatore', 'kochi', 'cochin',
  'thiruvananthapuram', 'trivandrum', 'visakhapatnam', 'vizag',
  'bhubaneswar', 'mangalore', 'mysore', 'mysuru', 'vadodara',
  'surat', 'patna', 'ranchi', 'guwahati', 'bhopal',
];

const indiaKeywords = ['india', 'in', 'ind'];

/**
 * Check if job has India location
 */
/**
 * Check if job has India location
 * Filters for Indian cities and remote jobs
 */
function hasIndiaLocation(job) {
  try {
    // 1. CHECK COUNTRY CODE FIRST (MOST RELIABLE!)
    if (job.country) {
      const countryCode = job.country.toLowerCase().trim();
      // Only accept 'in' or 'ind'
      if (countryCode === 'in' || countryCode === 'ind') {
        return true;
      }
      // If country is set but NOT India, reject immediately
      if (countryCode !== 'in' && countryCode !== 'ind') {
        return false;
      }
    }

    // 2. Check primary location
    if (job.categories?.location) {
      const locationLower = job.categories.location.toLowerCase().trim();
      
      // Check for India keywords
      if (indiaKeywords.some(keyword => {
        return locationLower === keyword || 
               locationLower.includes(`, ${keyword}`) ||
               locationLower.includes(`${keyword},`) ||
               locationLower.startsWith(`${keyword} `) ||
               locationLower.endsWith(` ${keyword}`);
      })) {
        return true;
      }
      
      // Check for Indian cities
      if (indianCities.some(city => {
        return locationLower === city ||
               locationLower.includes(`, ${city}`) ||
               locationLower.startsWith(`${city},`);
      })) {
        return true;
      }
      
    }

    // 3. Check all locations array
    if (job.categories?.allLocations && Array.isArray(job.categories.allLocations)) {
      for (const location of job.categories.allLocations) {
        const locationLower = location.toLowerCase().trim();
        
        // India match
        if (indiaKeywords.some(keyword => {
          return locationLower === keyword || 
                 locationLower.includes(`, ${keyword}`) ||
                 locationLower.includes(`${keyword},`);
        })) {
          return true;
        }
        
        // Indian cities
        if (indianCities.some(city => {
          return locationLower === city ||
                 locationLower.includes(`, ${city}`);
        })) {
          return true;
        }
      }
    }

    // DEFAULT: Not an India job
    return false;
    
  } catch (error) {
    console.error('Error checking India location:', error);
    return false;
  }
}

export { indianCities, indiaKeywords, hasIndiaLocation };
