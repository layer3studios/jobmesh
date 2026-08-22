// FILE: src/types/index.ts
export interface AppUser {
  name: string;
  email: string;
  picture: string;
  slug: string;
}

export interface IJobAutoTags {
  techStack: string[];
  roleCategory: string | null;
  experienceBand: string | null;
  isEntryLevel: boolean | null;
  domain: string[];
  urgency: string | null;
  education: string | null;
}

export interface IJob {
  _id: string;
  JobID: string;
  JobTitle: string;
  Company: string;
  Location: string;
  ApplicationURL: string;
  PostedDate: string | null;
  Description: string;
  Department?: string;
  ContractType?: string;
  sourceSite?: string;
  Status?: string;
  scrapedAt?: string;
  createdAt?: string;

  DirectApplyURL?: string | null;
  Team?: string | null;
  AllLocations?: string[];
  Tags?: string[];
  WorkplaceType?: string | null;
  IsRemote?: boolean | null;

  DescriptionPlain?: string | null;
  DescriptionLists?: Array<{ text: string; content: string }>;
  DescriptionCleaned?: string | null;
  AdditionalInfo?: string | null;

  SalaryMin?: number | null;
  SalaryMax?: number | null;
  SalaryCurrency?: string | null;
  SalaryInterval?: string | null;
  SalaryInfo?: string | null;

  Office?: string | null;
  ATSPlatform?: string | null;

  isEntryLevel?: boolean | null;
  autoTags?: IJobAutoTags | null;
}

export interface AppliedJobEntry {
  jobId: string;
  appliedAt: string;
  stage?: string;
  stageUpdatedAt?: string;
}

export interface AppliedJobDetail extends AppliedJobEntry {
  jobTitle: string;
  company: string;
  applicationURL: string | null;
  location: string | null;
  department: string | null;
  stage: string;
  stageUpdatedAt: string;
  isListingActive: boolean;
}

export interface ICompany {
  _id?: string;
  companyName: string;
  openRoles: number;
  totalRoles?: number;
  cities: string[];
  domain: string;
  careersUrl?: string;
  source: 'scraped' | 'manual';
  logo?: string;
  industry?: string;
}
