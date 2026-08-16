# Playwright Link Checks Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Gate every `main` deploy on a Playwright link crawl (same-origin + outbound with retries) and a Docker image smoke check so missing pages never reach production again.

**Architecture:** Node + Playwright crawl all root HTML pages against a static `webServer`, waiting for header/footer partials before collecting links. CI runs that crawl, then builds/runs the site Docker image and GETs every same-origin HTML route. Deploy SSH job runs only if both pass.

**Tech Stack:** Node 20+, `@playwright/test`, Playwright `webServer`, Docker CLI in GitHub Actions, existing Caddy site image.

## Global Constraints

- Outbound retries: **3 attempts**, short backoff (1s then 2s), then hard-fail
- Skip schemes: `mailto:`, `tel:`, `javascript:`
- Wait for partials: `html` must not have `data-includes-pending` before collecting links
- Docker smoke checks **same-origin HTML only** (no outbound re-check)
- Deploy job must `needs: [link-crawl, docker-smoke]`
- Do not commit `.env` or secrets; entrypoint defaults are enough for smoke
- Keep v1 out of scope: visual regression, form submits, chat QA, live post-deploy probe

## File map

| Path | Responsibility |
| --- | --- |
| `package.json` | `test` / `test:docker-smoke` scripts; Playwright dep |
| `package-lock.json` | Locked installs for CI `npm ci` |
| `playwright.config.js` | Base URL, webServer, timeouts |
| `tests/link-check/helpers.js` | URL normalize, skip rules, fetch with retries, HTML discovery |
| `tests/link-check/crawl.spec.js` | Visit pages, collect links/assets, assert statuses |
| `tests/link-check/docker-smoke.mjs` | Build/run site image; GET every root `*.html` |
| `.github/workflows/deploy.yml` | `link-crawl` → `docker-smoke` → `deploy` |
| `README.md` | Short “Tests” section |

---

### Task 1: Scaffold Node + Playwright

**Files:**
- Create: `package.json`
- Create: `playwright.config.js`
- Modify: `.gitignore` (ensure `test-results/`, `playwright-report/` ignored if not already)

**Interfaces:**
- Consumes: none
- Produces: `npm test` runs Playwright; baseURL `http://127.0.0.1:8765`

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "bespoke-ai-website",
  "private": true,
  "scripts": {
    "test": "playwright test",
    "test:docker-smoke": "node tests/link-check/docker-smoke.mjs"
  },
  "devDependencies": {
    "@playwright/test": "^1.54.2"
  }
}
```

- [ ] **Step 2: Create `playwright.config.js`**

```js
// @ts-check
const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests/link-check',
  testMatch: /crawl\.spec\.js/,
  timeout: 120_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: 'http://127.0.0.1:8765',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'python3 -m http.server 8765',
    cwd: __dirname,
    url: 'http://127.0.0.1:8765/',
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
```

- [ ] **Step 3: Append Playwright artifacts to `.gitignore`**

Add if missing:

```
test-results/
playwright-report/
playwright/.cache/
```

- [ ] **Step 4: Install dependencies and browsers**

Run:

```bash
cd /Users/karl/src/web_site
npm install
npx playwright install chromium
```

Expected: `node_modules/` present; `package-lock.json` created; Chromium installed.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json playwright.config.js .gitignore
git commit -m "Add Playwright scaffolding for site link checks."
```

---

### Task 2: Link-check helpers

**Files:**
- Create: `tests/link-check/helpers.js`
- Create: `tests/link-check/helpers.test.js` (Node assert unit checks run via `node --test`)

**Interfaces:**
- Consumes: none
- Produces:
  - `listHtmlPages(rootDir: string): string[]` — relative paths like `index.html`
  - `shouldSkipHref(href: string): boolean`
  - `normalizeUrl(href: string, pageUrl: string): string | null` — absolute URL without hash, or null if skip
  - `isSameOrigin(url: string, origin: string): boolean`
  - `checkUrl(url: string, opts?: { retries?: number, isOutbound?: boolean }): Promise<{ ok: boolean, status: number, error?: string }>`
  - Constants: `OUTBOUND_RETRIES = 3`, `OUTBOUND_BACKOFF_MS = [1000, 2000]`

- [ ] **Step 1: Write failing unit tests**

Create `tests/link-check/helpers.test.js`:

```js
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
  shouldSkipHref,
  normalizeUrl,
  isSameOrigin,
  listHtmlPages,
} = require('./helpers');
const path = require('node:path');

describe('shouldSkipHref', () => {
  it('skips mailto tel javascript and bare hash', () => {
    assert.equal(shouldSkipHref('mailto:a@b.com'), true);
    assert.equal(shouldSkipHref('tel:+353'), true);
    assert.equal(shouldSkipHref('javascript:void(0)'), true);
    assert.equal(shouldSkipHref('#'), true);
    assert.equal(shouldSkipHref(''), true);
  });

  it('keeps real paths and hashes', () => {
    assert.equal(shouldSkipHref('po-sales-order.html'), false);
    assert.equal(shouldSkipHref('#where-to-start'), false);
    assert.equal(shouldSkipHref('https://www.linkedin.com/in/x'), false);
  });
});

describe('normalizeUrl', () => {
  const page = 'http://127.0.0.1:8765/index.html';

  it('resolves relative and strips hash', () => {
    assert.equal(
      normalizeUrl('po-sales-order.html', page),
      'http://127.0.0.1:8765/po-sales-order.html'
    );
    assert.equal(
      normalizeUrl('#where-to-start', page),
      'http://127.0.0.1:8765/index.html'
    );
  });

  it('returns null for skipped hrefs', () => {
    assert.equal(normalizeUrl('mailto:x@y.z', page), null);
  });
});

describe('isSameOrigin', () => {
  it('compares origins', () => {
    assert.equal(
      isSameOrigin('http://127.0.0.1:8765/a.html', 'http://127.0.0.1:8765'),
      true
    );
    assert.equal(
      isSameOrigin('https://www.linkedin.com/in/x', 'http://127.0.0.1:8765'),
      false
    );
  });
});

describe('listHtmlPages', () => {
  it('includes po-sales-order.html at repo root', () => {
    const root = path.resolve(__dirname, '../..');
    const pages = listHtmlPages(root);
    assert.ok(pages.includes('po-sales-order.html'));
    assert.ok(pages.includes('index.html'));
    assert.ok(pages.includes('smart-inbox.html'));
  });
});
```

- [ ] **Step 2: Run unit tests — expect fail**

Run: `node --test tests/link-check/helpers.test.js`

Expected: FAIL (cannot find module `./helpers` or exports missing).

- [ ] **Step 3: Implement `tests/link-check/helpers.js`**

```js
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
        headers: { 'user-agent': 'bespoke-ai-link-check/1.0' },
      });
      lastStatus = res.status;
      if (res.ok) return { ok: true, status: res.status };
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
  checkUrl,
};
```

- [ ] **Step 4: Run unit tests — expect pass**

Run: `node --test tests/link-check/helpers.test.js`

Expected: all tests pass.

- [ ] **Step 5: Wire unit tests into `package.json`**

```json
"scripts": {
  "test": "npm run test:unit && playwright test",
  "test:unit": "node --test tests/link-check/helpers.test.js",
  "test:docker-smoke": "node tests/link-check/docker-smoke.mjs"
}
```

- [ ] **Step 6: Commit**

```bash
git add tests/link-check/helpers.js tests/link-check/helpers.test.js package.json
git commit -m "Add link-check URL helpers with unit coverage."
```

---

### Task 3: Playwright crawl spec

**Files:**
- Create: `tests/link-check/crawl.spec.js`

**Interfaces:**
- Consumes: helpers from Task 2; Playwright `baseURL` / `webServer` from Task 1
- Produces: `npm test` fails if any collected URL is broken

- [ ] **Step 1: Write the crawl spec**

Create `tests/link-check/crawl.spec.js`:

```js
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

test('all page links and layout assets resolve', async ({ page, request }) => {
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
    // Partials inject nav; require at least one primary nav link when header exists
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
    failures.map((f) => `${f.url} (${f.error || f.status}) from ${f.from.join(', ')}`).join('\n')
  ).toEqual([]);
});
```

- [ ] **Step 2: Run crawl — expect pass on healthy tree**

Run: `npm test`

Expected: unit tests pass; Playwright starts `python3 -m http.server 8765`; crawl passes (may take 1–3 minutes because of outbound).

If an outbound host flakes, confirm retries then re-run once; only add allowlist if a host is chronically broken (out of v1 unless blocked).

- [ ] **Step 3: Prove failure mode (same-origin)**

Temporarily rename:

```bash
mv po-sales-order.html po-sales-order.html.bak
npm test
```

Expected: FAIL mentioning `po-sales-order.html`.

Restore:

```bash
mv po-sales-order.html.bak po-sales-order.html
```

- [ ] **Step 4: Commit**

```bash
git add tests/link-check/crawl.spec.js
git commit -m "Add Playwright crawl that asserts all collected links."
```

---

### Task 4: Docker smoke script

**Files:**
- Create: `tests/link-check/docker-smoke.mjs`

**Interfaces:**
- Consumes: `listHtmlPages` logic (inline or duplicate thin copy — prefer requiring `./helpers.js` via `createRequire`)
- Produces: `npm run test:docker-smoke` exits 0 only if every root HTML returns 2xx from the built image

- [ ] **Step 1: Implement `tests/link-check/docker-smoke.mjs`**

```js
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { listHtmlPages } = require('./helpers.js');

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');
const IMAGE = 'bespoke-ai-site-smoke:local';
const CONTAINER = 'bespoke-ai-site-smoke';
const PORT = process.env.SMOKE_PORT || '18080';

function run(cmd, args, opts = {}) {
  const res = spawnSync(cmd, args, { stdio: 'inherit', ...opts });
  if (res.status !== 0) {
    throw new Error(`${cmd} ${args.join(' ')} failed with ${res.status}`);
  }
}

function cleanup() {
  spawnSync('docker', ['rm', '-f', CONTAINER], { stdio: 'ignore' });
}

cleanup();
run('docker', ['build', '-t', IMAGE, ROOT]);
run('docker', [
  'run',
  '-d',
  '--name',
  CONTAINER,
  '-p',
  `${PORT}:8080`,
  IMAGE,
]);

const pages = listHtmlPages(ROOT);
const failures = [];

try {
  // Wait for Caddy
  let ready = false;
  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/`);
      if (res.ok) {
        ready = true;
        break;
      }
    } catch {
      // retry
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  if (!ready) throw new Error('Site container did not become ready');

  for (const rel of pages) {
    const pageUrl =
      rel === 'index.html'
        ? `http://127.0.0.1:${PORT}/index.html`
        : `http://127.0.0.1:${PORT}/${rel}`;
    const res = await fetch(pageUrl, { redirect: 'follow' });
    if (!res.ok) {
      failures.push(`${rel} → HTTP ${res.status}`);
    }
  }
} finally {
  cleanup();
}

if (failures.length) {
  console.error('Docker smoke failures:\n' + failures.join('\n'));
  process.exit(1);
}

console.log(`Docker smoke OK (${pages.length} HTML pages)`);
```

- [ ] **Step 2: Run docker smoke — expect pass**

Run: `npm run test:docker-smoke`

Expected: image builds; all HTML pages 200; container removed; exit 0.

- [ ] **Step 3: Prove Dockerfile omission fails**

Temporarily edit `Dockerfile` COPY back to an explicit list **without** `po-sales-order.html` (or comment out `COPY *.html` and copy only `index.html`), run smoke, expect fail on `po-sales-order.html`, then restore `COPY *.html ./`.

- [ ] **Step 4: Commit**

```bash
git add tests/link-check/docker-smoke.mjs
git commit -m "Add Docker image smoke check for all HTML pages."
```

---

### Task 5: Gate deploy workflow

**Files:**
- Modify: `.github/workflows/deploy.yml`

**Interfaces:**
- Consumes: `npm test`, `npm run test:docker-smoke`
- Produces: `deploy` job only after `link-crawl` and `docker-smoke` succeed

- [ ] **Step 1: Replace workflow with gated jobs**

```yaml
name: Deploy to VPS

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  link-crawl:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: npm
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      - run: npm test

  docker-smoke:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: npm
      - run: npm ci
      - run: npm run test:docker-smoke

  deploy:
    needs: [link-crawl, docker-smoke]
    runs-on: ubuntu-latest
    steps:
      - name: Deploy over SSH
        uses: appleboy/ssh-action@v1.2.0
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USER }}
          key: ${{ secrets.VPS_SSH_KEY }}
          script: |
            set -euo pipefail
            cd /opt/web_site
            git pull origin main
            docker compose up -d --build
            docker compose ps
```

- [ ] **Step 2: Commit**

```bash
git add .github/workflows/deploy.yml
git commit -m "Gate VPS deploy on Playwright crawl and Docker smoke."
```

---

### Task 6: README Tests section

**Files:**
- Modify: `README.md` (after “Local preview” or near Deploy)

**Interfaces:**
- Consumes: scripts from earlier tasks
- Produces: documented local workflow

- [ ] **Step 1: Add Tests section**

Insert:

```markdown
## Tests

Link crawl (static server + header/footer partials) and optional Docker smoke:

```bash
npm ci
npx playwright install chromium   # first time
npm test                          # unit + Playwright crawl (includes outbound with retries)
npm run test:docker-smoke         # build/run site image; GET every *.html
```

On push to `main`, GitHub Actions runs both checks and only then SSHs to the VPS to deploy.
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "Document local and CI link-check workflow."
```

---

### Task 7: End-to-end verification on a branch (optional before merging habits)

- [ ] **Step 1:** Push a feature branch (or `main` if that is the delivery path) and confirm Actions shows `link-crawl` + `docker-smoke` green, then `deploy`.
- [ ] **Step 2:** Confirm live `https://www.bespoke-ai.ie/po-sales-order.html` still 200 after deploy.

---

## Plan self-review

1. **Spec coverage:** Local crawl, outbound retries, partials wait, Docker smoke, CI gate, README — all have tasks. Hash id existence skipped (optional in spec).
2. **Placeholders:** None; full file contents included.
3. **Consistency:** `listHtmlPages` / `checkUrl` / `normalizeUrl` names match across tasks; `npm test` runs unit + crawl; smoke is separate script for CI parallelism.
