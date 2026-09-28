import { describe, expect, it } from 'vitest';
import { isBlockedCrawler } from '../../src/lib/seo/crawler-policy';

describe('isBlockedCrawler', () => {
  it.each([
    'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; GPTBot/1.2; +https://openai.com/gptbot)',
    'Mozilla/5.0 (compatible; ClaudeBot/1.0; +claudebot@anthropic.com)',
    'CCBot/2.0 (https://commoncrawl.org/faq/)',
    'Mozilla/5.0 (Linux; Android 5.0) AppleWebKit/537.36 (KHTML, like Gecko) Mobile Safari/537.36 (compatible; Bytespider; spider-feedback@bytedance.com)',
    'meta-externalagent/1.1 (+https://developers.facebook.com/docs/sharing/webmasters/crawler)',
  ])('blocks training scraper: %s', (ua) => {
    expect(isBlockedCrawler(ua)).toBe(true);
  });

  it.each([
    'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
    'Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)',
    'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; OAI-SearchBot/1.0; +https://openai.com/searchbot)',
    'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; ChatGPT-User/1.0; +https://openai.com/bot',
    'Mozilla/5.0 (compatible; Claude-SearchBot/1.0; +https://www.anthropic.com)',
    'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; PerplexityBot/1.0; +https://perplexity.ai/perplexitybot)',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
    'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
    'Mozilla/5.0 (compatible; Applebot/0.1; +http://www.apple.com/go/applebot)',
    'Mozilla/5.0 (compatible; AhrefsBot/7.0; +http://ahrefs.com/robot/)',
    '',
  ])('allows: %s', (ua) => {
    expect(isBlockedCrawler(ua)).toBe(false);
  });
});
