// FILE: src/gemma/groq-client.js
// HTTP client for Groq's OpenAI-compatible chat completions endpoint.
//
// Deliberately mirrors GemmaClient's interface exactly — same constructor
// shape, same generateContent(system, user, opts) signature, same GemmaApiError
// on failure — so ModelCascade, KeyManager, RateLimitTracker, CircuitBreaker
// and ResponseCache all work against it unchanged. Only three things actually
// differ between the two providers, and they are the only three things here:
//
//   body      OpenAI `messages` + `response_format`, not Google's
//             `contents` + `system_instruction` + `generationConfig`.
//   response  `choices[0].message.content`, not `candidates[0].content.parts`.
//   auth      an `Authorization: Bearer` header, not `?key=` on the URL.
//             This also means a Groq key never appears in a URL, so it cannot
//             leak into an access log the way a query-string key can.
//
// Why Groq for the seeker tier: resume parsing happens while someone waits on
// an upload screen, and Groq answers a full parse in well under a second
// (measured at 676ms for a complete structured extraction). Accuracy is not
// the constraint for this task — the prompt pins an explicit JSON schema and
// resume-parser-service.js re-validates every field — so latency is what
// decides the experience.

import { GemmaApiError } from './gemma-client.js';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** Groq reports an invalid key as 401, where Google uses 400 + a body string. */
const AUTH_STATUSES = new Set([401, 403]);

export class GroqClient {
  constructor({ keyManager, model, baseUrl, fetchFn } = {}) {
    this.keyManager = keyManager;
    this.model = model;
    this.baseUrl = (baseUrl || 'https://api.groq.com/openai/v1').replace(/\/$/, '');
    this.fetchFn = fetchFn || globalThis.fetch;
  }

  buildBody(systemInstruction, userMessage, { temperature = 0.1, responseMimeType = 'application/json' } = {}) {
    const body = {
      model: this.model,
      temperature,
      messages: [
        { role: 'system', content: systemInstruction },
        { role: 'user', content: userMessage },
      ],
    };
    // JSON mode is the single biggest factor in parse reliability — without it
    // a model will wrap perfectly good JSON in prose and the parse fails.
    if (responseMimeType === 'application/json') {
      body.response_format = { type: 'json_object' };
    }
    return body;
  }

  static readText(data) {
    const content = data?.choices?.[0]?.message?.content;
    return typeof content === 'string' ? content : '';
  }

  /**
   * opts.model / opts.apiKey let the ModelCascade drive the exact model+key for
   * one call. With a pinned key this makes a SINGLE attempt and lets the error
   * propagate, because the cascade owns the retry and rotation budget —
   * retrying here would spend it twice. Identical contract to GemmaClient.
   */
  async generateContent(systemInstruction, userMessage, opts = {}) {
    const model = opts.model || this.model;
    const pinnedKey = opts.apiKey || null;
    const maxRetries = pinnedKey ? 0 : (opts.maxRetries ?? 3);
    const body = { ...this.buildBody(systemInstruction, userMessage, opts), model };
    const url = `${this.baseUrl}/chat/completions`;

    for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
      const key = pinnedKey || this.keyManager.getNextKey();
      if (!key) throw new GemmaApiError(0, 'No live Groq API keys');

      const response = await this.fetchFn(url, {
        method: 'POST',
        headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (response.ok) return GroqClient.readText(await response.json());

      const text = await response.text().catch(() => '');

      // Pinned-key mode: surface everything so the cascade can classify it.
      if (pinnedKey) throw new GemmaApiError(response.status, text, response.status >= 500);

      if (response.status === 429) {
        await sleep(2 ** attempt * 1000 + Math.floor(Math.random() * 250));
        continue; // rotate to the next key and retry
      }
      if (AUTH_STATUSES.has(response.status)) {
        this.keyManager.blacklistKey(key);
        continue; // rotate to a surviving key
      }
      if (response.status >= 500) {
        await sleep(2 ** attempt * 500);
        continue;
      }
      throw new GemmaApiError(response.status, text, false);
    }

    throw new GemmaApiError(429, 'Groq retries exhausted', true);
  }
}

export default GroqClient;
