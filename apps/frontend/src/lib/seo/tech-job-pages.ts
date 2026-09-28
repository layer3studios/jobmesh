// FILE: src/lib/seo/tech-job-pages.ts
// The keyword landing pages under /tech-jobs/[slug]. Each one answers a search
// people actually make in India (volumes from keyword research, Sep 2026:
// "remote jobs in india" 12.1k/mo, "it jobs in bangalore" 2.9k, "it jobs in
// pune" 2.4k, "it jobs in chennai" 2.4k, "java developer jobs in bangalore"
// 1.3k, "software engineer jobs in india" 1.3k ...) with the live jobs that
// match it, filtered by the backend feed. Adding a page = adding an entry here;
// the route, sitemap and hub pick it up.
import type { SeekerJobsQuery } from '../server-api/seeker';

export type TechJobPageKind = 'city' | 'role' | 'mode';

export interface TechJobPage {
  slug: string;
  kind: TechJobPageKind;
  /** The H1 and the heart of the <title>. Mirrors the search phrase. */
  heading: string;
  /** Short label for link grids ("Bangalore", "Java developer"). */
  label: string;
  /** Meta description; `{count}` is replaced with the live job count. */
  description: string;
  /** One unique paragraph of context so pages are not interchangeable. */
  intro: string;
  query: SeekerJobsQuery;
}

const city = (slug: string, name: string, locations: string[], intro: string): TechJobPage => ({
  slug: `it-jobs-in-${slug}`,
  kind: 'city',
  heading: `IT jobs in ${name}`,
  label: name,
  description: `{count} open IT and software jobs in ${name} from companies hiring directly. Updated daily, with direct apply links and no recruiters in between.`,
  intro,
  query: { locations },
});

const role = (slug: string, name: string, search: string, intro: string): TechJobPage => ({
  slug: `${slug}-jobs-in-india`,
  kind: 'role',
  heading: `${name} jobs in India`,
  label: name,
  description: `{count} open ${name.toLowerCase()} jobs in India, posted by the companies hiring. Fresh every day, with salary where disclosed and a direct apply link.`,
  intro,
  query: { search },
});

export const TECH_JOB_PAGES: TechJobPage[] = [
  {
    slug: 'remote-jobs-in-india',
    kind: 'mode',
    heading: 'Remote tech jobs in India',
    label: 'Remote',
    description: '{count} remote software and IT jobs open to candidates in India. Work-from-home roles from real employers, updated daily, apply directly.',
    intro: 'Every role here is listed by its employer as fully remote. Some are remote within India only, others hire across time zones, so check the location line on each listing before you apply.',
    query: { workplace: 'remote' },
  },
  {
    slug: 'fresher-tech-jobs',
    kind: 'mode',
    heading: 'Tech jobs for freshers in India',
    label: 'Freshers',
    description: '{count} entry-level software and IT jobs for freshers and 0-1 year graduates in India. Updated daily, straight from the companies hiring.',
    intro: 'Roles here are tagged entry level or 0-1 years of experience. Graduate programs, junior developer and trainee positions all land here as soon as companies post them.',
    query: { entryLevel: true },
  },
  city('bangalore', 'Bangalore', ['Bangalore', 'Bengaluru'],
    'Bangalore (Bengaluru) has the largest concentration of product companies, startups and global engineering centres in India, from fintech and SaaS to chip design.'),
  city('hyderabad', 'Hyderabad', ['Hyderabad'],
    'Hyderabad hosts some of the biggest engineering campuses of global tech companies, alongside a fast-growing startup scene around HITEC City and Gachibowli.'),
  city('pune', 'Pune', ['Pune'],
    'Pune mixes large IT services employers with product companies and automotive and embedded software teams around Hinjewadi, Kharadi and Baner.'),
  city('chennai', 'Chennai', ['Chennai'],
    'Chennai is home to major SaaS companies, IT services firms and banking technology centres along OMR and in Guindy.'),
  city('mumbai', 'Mumbai', ['Mumbai', 'Navi Mumbai', 'Thane'],
    'Mumbai tech hiring leans towards fintech, trading, media and consumer internet, with roles across Mumbai, Navi Mumbai and Thane.'),
  city('delhi-ncr', 'Delhi NCR', ['Delhi', 'Gurugram', 'Gurgaon', 'Noida'],
    'Delhi NCR covers Delhi, Gurugram and Noida, where consumer internet, e-commerce, fintech and consulting firms run large engineering teams.'),
  city('kolkata', 'Kolkata', ['Kolkata'],
    'Kolkata has a growing base of IT services and product teams in Salt Lake Sector V and New Town.'),
  role('software-engineer', 'Software engineer', '"software engineer"',
    'Software engineer is the broadest title in tech hiring: backend, frontend, full-stack and platform roles at every level, from SDE-1 to staff engineer.'),
  role('java-developer', 'Java developer', 'java',
    'Java remains the backbone of banking, e-commerce and enterprise backends in India, usually alongside Spring Boot, microservices and cloud platforms.'),
  role('python-developer', 'Python developer', 'python',
    'Python roles span backend services with Django and FastAPI, data engineering, automation and machine learning.'),
  role('frontend-developer', 'Frontend developer', 'frontend',
    'Frontend roles centre on React and TypeScript, with Next.js, design systems and web performance increasingly asked for.'),
  role('devops-engineer', 'DevOps engineer', 'devops',
    'DevOps and SRE roles cover CI/CD, Kubernetes, AWS, GCP or Azure, infrastructure as code and on-call reliability work.'),
  role('data-scientist', 'Data scientist', '"data scientist"',
    'Data science roles range from analytics and experimentation to building production machine learning models.'),
  role('ai-engineer', 'AI engineer', '"machine learning"',
    'AI and machine learning engineering roles include LLM applications, model training and serving, and ML platform work.'),
  role('product-manager', 'Product manager', '"product manager"',
    'Product management roles at tech companies, from associate PM to group product manager, across consumer and B2B products.'),
  role('android-developer', 'Android developer', 'android',
    'Android roles focus on Kotlin and Jetpack Compose, with some teams still maintaining Java codebases.'),
];

export function findTechJobPage(slug: string): TechJobPage | undefined {
  return TECH_JOB_PAGES.find(page => page.slug === slug);
}

/** Fewer live jobs than this and the page asks not to be indexed (thin content). */
export const MIN_JOBS_TO_INDEX = 3;
