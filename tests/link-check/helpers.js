const fs = require('node:fs');
const path = require('node:path');

const OUTBOUND_RETRIES = 3;
const OUTBOUND_BACKOFF_MS = [1000, 2000];

function listHtmlPages(rootDir) {
  return fs
    .readdirSync(rootDir)
    .filter((name) => name.endsWith('.html'))
    .sort();
}

function shouldSkipHref(href) {
  if (href == null) return true;
  const trimmed = String(href).trim();
  if (!trimmed || trimmed === '#') return true;
  const lower = trimmed.toLowerCase();
  return (
    lower.startsWith('mailto:') ||
    lower.startsWith('tel:') ||
    lower.startsWith('javascript:')
  );
}

function normalizeUrl(href, pageUrl) {
  if (shouldSkipHref(href)) return null;
  try {
    const resolved = new URL(href, pageUrl);
    resolved.hash = '';
    return resolved.href;
  } catch {
    return null;
  }
}

function isSameOrigin(url, origin) {
  try {
    return new URL(url).origin === new URL(origin).origin;
  } catch {
    return false;
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Hosts that answer but block simple fetch clients (not broken links). */
function isAntiBotReachable(url, status) {
  let host = '';
  try {
    host = new URL(url).hostname;
  } catch {
    return false;
  }
  if (host.endsWith('linkedin.com') && status === 999) return true;
  if (
    (host === 'docs.google.com' || host.endsWith('.google.com')) &&
    (status === 401 || status === 403)
  ) {
    return true;
  }
  return false;
}

/**
 * @param {string} url
 * @param {{ retries?: number, isOutbound?: boolean }} [opts]
 */
async function checkUrl(url, opts = {}) {
  const isOutbound = Boolean(opts.isOutbound);
  const retries = isOutbound ? (opts.retries ?? OUTBOUND_RETRIES) : 1;
  let lastStatus = 0;
  let lastError;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {
        method: 'GET',
        redirect: 'follow',
        headers: {
          'user-agent':
            'Mozilla/5.0 (compatible; BespokeAI-LinkCheck/1.0; +https://www.bespoke-ai.ie/)',
          accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
      });
      lastStatus = res.status;
      if (res.ok) return { ok: true, status: res.status };
      if (isOutbound && isAntiBotReachable(url, res.status)) {
        return { ok: true, status: res.status };
      }
      lastError = `HTTP ${res.status}`;
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
    }

    if (attempt < retries) {
      const backoff = OUTBOUND_BACKOFF_MS[attempt - 1] ?? 2000;
      await sleep(backoff);
    }
  }

  return { ok: false, status: lastStatus, error: lastError };
}

module.exports = {
  OUTBOUND_RETRIES,
  OUTBOUND_BACKOFF_MS,
  listHtmlPages,
  shouldSkipHref,
  normalizeUrl,
  isSameOrigin,
  isAntiBotReachable,
  checkUrl,
};
