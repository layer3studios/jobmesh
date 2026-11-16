// FILE: src/lib/schema/faq-page.ts
// JSON-LD FAQPage, derived from a post's own Markdown. Pure.
//
// WHY DERIVED RATHER THAN A FIELD. The top-ranking page for Indian ATS and
// resume queries (measured November 2026) carries FAQPage schema alongside a
// visible FAQ section, and that markup is what wins the expandable results and
// the AI answer citations. Adding a separate `faqs` array to the blog model
// would mean a second place to keep the same questions, which drift apart the
// first time someone edits one and not the other. Google requires the marked-up
// Q&A to match what the visitor can read, so taking it from the rendered body
// is the only version that cannot disagree with the page.
//
// The convention: an H2 whose text mentions "frequently asked questions" or
// "FAQ", followed by H3 questions, each with the answer prose beneath it.
// Nothing else in a post is treated as an FAQ.

const FAQ_HEADING = /^##\s+.*\b(frequently asked questions|faq|faqs)\b/i;
const H2 = /^##\s+/;
const H3 = /^###\s+/;

export interface FaqEntry {
  question: string;
  answer: string;
}

/** Strips the Markdown a plain-text answer should not carry into JSON-LD. */
function toPlainText(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/g, ' ')      // fenced code
    .replace(/`([^`]+)`/g, '$1')           // inline code
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ') // images
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1') // links → their text
    .replace(/^\s{0,3}[-*+]\s+/gm, '')     // list bullets
    .replace(/\*\*([^*]+)\*\*/g, '$1')     // bold
    .replace(/\*([^*]+)\*/g, '$1')         // italic
    .replace(/^>\s?/gm, '')                // blockquote
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Pull the Q&A pairs out of a post body, or an empty array when it has no FAQ
 * section. Callers skip emitting the schema entirely when this is empty —
 * FAQPage markup on a page with no visible FAQ is exactly the mismatch Google
 * issues manual actions for.
 */
export function extractFaqs(body: string): FaqEntry[] {
  if (typeof body !== 'string' || !body) return [];
  const lines = body.split('\n');

  const start = lines.findIndex((line) => FAQ_HEADING.test(line));
  if (start === -1) return [];

  const faqs: FaqEntry[] = [];
  let question: string | null = null;
  let answer: string[] = [];

  const flush = () => {
    if (!question) return;
    const text = toPlainText(answer.join('\n'));
    if (text) faqs.push({ question, answer: text });
    question = null;
    answer = [];
  };

  for (let i = start + 1; i < lines.length; i += 1) {
    const line = lines[i];
    // A following H2 ends the FAQ section.
    if (H2.test(line)) break;
    if (H3.test(line)) {
      flush();
      question = toPlainText(line.replace(H3, ''));
      continue;
    }
    if (question) answer.push(line);
  }
  flush();

  return faqs;
}

/**
 * FAQPage JSON-LD for a post, or null when the post has no FAQ section.
 * Returning null rather than an empty FAQPage is deliberate: empty or
 * fabricated structured data is worse than none.
 */
export function buildFaqPageSchema(body: string): Record<string, unknown> | null {
  const faqs = extractFaqs(body);
  if (faqs.length === 0) return null;

  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: { '@type': 'Answer', text: faq.answer },
    })),
  };
}
