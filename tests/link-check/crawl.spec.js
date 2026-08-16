const path = require('node:path');
const { test, expect } = require('@playwright/test');
const {
  listHtmlPages,
  normalizeUrl,
  isSameOrigin,
  checkUrl,
} = require('./helpers');

const ROOT = path.resolve(__dirname, '../..');
const ORIGIN = 'http://127.0.0.1:8765';

test('all page links and layout assets resolve', async ({ page }) => {
  const pages = listHtmlPages(ROOT);
  expect(pages.length).toBeGreaterThan(0);

  /** @type {Map<string, Set<string>>} */
  const referrers = new Map();

  function addRef(url, from) {
    if (!referrers.has(url)) referrers.set(url, new Set());
    referrers.get(url).add(from);
  }

  for (const rel of pages) {
    const pagePath = '/' + rel;
    await page.goto(pagePath, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(
      () => !document.documentElement.hasAttribute('data-includes-pending')
    );
    const hasHeader = await page.locator('#site-header').count();
    if (hasHeader) {
      await expect(page.locator('.nav a.nav-link').first()).toBeVisible({
        timeout: 15_000,
      });
    }

    const pageUrl = page.url();
    const hrefs = await page.$$eval('a[href]', (as) =>
      as.map((a) => a.getAttribute('href'))
    );
    for (const href of hrefs) {
      const absolute = normalizeUrl(href, pageUrl);
      if (absolute) addRef(absolute, pagePath);
    }

    const assets = await page.$$eval(
      'link[rel="stylesheet"][href], script[src], img[src]',
      (nodes) =>
        nodes
          .map((n) => n.getAttribute('href') || n.getAttribute('src'))
          .filter(Boolean)
    );
    for (const href of assets) {
      const absolute = normalizeUrl(href, pageUrl);
      if (absolute && isSameOrigin(absolute, ORIGIN)) addRef(absolute, pagePath);
    }
  }

  const failures = [];
  for (const [url, fromSet] of referrers) {
    const outbound = !isSameOrigin(url, ORIGIN);
    const result = await checkUrl(url, { isOutbound: outbound });
    if (!result.ok) {
      failures.push({
        url,
        status: result.status,
        error: result.error,
        from: [...fromSet].sort(),
      });
    }
  }

  expect(
    failures,
    failures
      .map(
        (f) =>
          `${f.url} (${f.error || f.status}) from ${f.from.join(', ')}`
      )
      .join('\n')
  ).toEqual([]);
});
