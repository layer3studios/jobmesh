// FILE: src/CompanyConfig/recruitee-fetch.js
// Recruitee's HTTP layer: timeout, jitter, the optional proxy hop and the offer
// fetch itself. Split out of recruiteeConfig.js (section 2) -- this is transport,
// and it changes for network reasons rather than for job-shape reasons.

import fetch from 'node-fetch';

const REQUEST_TIMEOUT_MS = 30000;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function randomDelay() {
  return 3000 + Math.floor(Math.random() * 4000); // 3–7s between companies
}

function buildProxyUrl(targetUrl) {
  const proxyBase = process.env.WORKABLE_PROXY_URL;
  if (!proxyBase) return null;
  const separator = proxyBase.includes('?') ? '&' : '?';
  return `${proxyBase}${separator}url=${encodeURIComponent(targetUrl)}`;
}

async function fetchJsonFromUrl(url) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    return await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json, text/plain, */*',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      },
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

async function fetchRecruiteeOffers(slug) {
  const targetUrl = `https://${slug}.recruitee.com/api/offers/`;
  const proxyUrl = buildProxyUrl(targetUrl);

  const response = await fetchJsonFromUrl(proxyUrl || targetUrl);

  if (response.status === 404) {
    return { kind: 'not-found' };
  }

  if (!response.ok) {
    return { kind: 'failed', error: `HTTP ${response.status}` };
  }

  try {
    const data = await response.json();
    return { kind: 'ok', data };
  } catch {
    return { kind: 'failed', error: 'Invalid JSON response' };
  }
}

export { REQUEST_TIMEOUT_MS, sleep, randomDelay, buildProxyUrl, fetchJsonFromUrl, fetchRecruiteeOffers };
