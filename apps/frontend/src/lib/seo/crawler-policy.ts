// FILE: src/lib/seo/crawler-policy.ts
// Which bots may crawl jobmesh.in. One list, used by robots.ts (the polite
// request) and middleware.ts (a 403 for the bots that ignore it).
//
// Policy: "allow search, block training".
//   ALLOWED — search engines and AI *answer* crawlers. These put JobMesh in
//     Google/Bing results and get it cited or recommended in ChatGPT search,
//     Claude, Perplexity, Apple and Google AI Overviews (which use Googlebot).
//     They bring visitors.
//   BLOCKED — crawlers that copy pages to TRAIN models or build scraped
//     datasets. They send no visitors, and on a job board they mostly re-host
//     the listings elsewhere.
//
// SEO tool crawlers (AhrefsBot, SemrushBot, DataForSeoBot...) are deliberately
// NOT blocked: they power the SEO/backlink data this site's own tooling
// (OpenRush) reads. Block them only if that stops mattering.
//
// Review this list a couple of times a year — vendors add and rename bots.

/** AI search / answer and user-initiated fetchers. Named in robots.txt for clarity. */
export const ALLOWED_AI_AGENTS = [
  'OAI-SearchBot',      // ChatGPT search index
  'ChatGPT-User',       // ChatGPT fetching a page a user asked about
  'Claude-SearchBot',   // Claude search index
  'Claude-User',        // Claude fetching a page a user asked about
  'PerplexityBot',      // Perplexity index
  'Perplexity-User',    // Perplexity user-initiated fetch
  'DuckAssistBot',      // DuckDuckGo AI answers
  'MistralAI-User',     // Le Chat user-initiated fetch
] as const;

/** Training-data and bulk-dataset crawlers. Disallowed in robots.txt AND refused with 403. */
export const BLOCKED_AGENTS = [
  'GPTBot',                        // OpenAI model training
  'ClaudeBot',                     // Anthropic model training
  'anthropic-ai',                  // Anthropic (legacy training token)
  'Google-Extended',               // Gemini training (does NOT affect Google Search or AI Overviews)
  'Applebot-Extended',             // Apple model training (Applebot search stays allowed)
  'CCBot',                         // Common Crawl, the base of most training sets
  'Bytespider',                    // ByteDance; known to ignore robots.txt
  'Meta-ExternalAgent',            // Meta AI training
  'FacebookBot',                   // Meta speech/LLM training
  'Amazonbot',                     // Amazon model training
  'cohere-ai',
  'cohere-training-data-crawler',
  'AI2Bot',                        // Allen Institute datasets
  'Diffbot',                       // scraped-data resale
  'ImagesiftBot',
  'Omgilibot',
  'omgili',
  'Timpibot',
  'PanguBot',                      // Huawei model training
  'PetalBot',                      // Huawei
  'img2dataset',
  'Kangaroo Bot',
  'Webzio-Extended',
] as const;

/**
 * User-agent substrings refused outright by middleware. Matching is on
 * substrings, case-insensitive, and only on this explicit list — a normal
 * browser UA can never contain these tokens.
 */
const BLOCKED_UA_PATTERN = new RegExp(
  BLOCKED_AGENTS.map((agent) => agent.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'),
  'i',
);

export function isBlockedCrawler(userAgent: string | null | undefined): boolean {
  if (!userAgent) return false;
  // Applebot-Extended / Google-Extended are robots.txt tokens, not real UAs:
  // Apple and Google crawl with Applebot / Googlebot and honour the token. A UA
  // match on them is harmless (they never appear in a UA) and costs nothing.
  return BLOCKED_UA_PATTERN.test(userAgent);
}
