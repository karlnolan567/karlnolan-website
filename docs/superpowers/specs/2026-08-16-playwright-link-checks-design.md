# Playwright link checks (pre-deploy gate)

**Date:** 2026-08-16  
**Status:** Approved  
**Repo:** `karlnolan567/karlnolan-website` (bespoke-ai.ie)

## Problem

Push to `main` deploys immediately via SSH + Docker rebuild with no automated checks. A Dockerfile that listed HTML files explicitly omitted new pages (`po-sales-order.html`, `smart-inbox.html`), so production 404’d while the files existed in git and were linked from the homepage.

## Goals

1. Confirm every link on the site resolves before live deploy.
2. Catch both broken `href`s in HTML **and** pages missing from the Docker image.
3. Run locally (`npm test`) and in CI; deploy only after CI passes.
4. Include outbound URLs; hard-fail after retries so flaky third parties don’t fail on a single blip.

## Non-goals (v1)

- Visual regression / screenshot diffs
- Form submission or booking calendar flows
- Chat widget conversation quality
- Authenticated or private URLs
- Checking live production after deploy (optional later)

## Approach

Playwright-based crawl against a local static server, plus a Docker same-origin smoke check in CI.

### Local

1. Add Node tooling: `package.json`, lockfile, Playwright as a devDependency.
2. `npm test` starts a static file server on the repo root (Playwright `webServer` or equivalent).
3. Discover all root `*.html` pages (and any needed under subdirs if present).
4. Visit each page; wait until header/footer partials are injected (`includes.js`) so nav links are in the DOM.
5. Collect URLs from `a[href]`, and from critical same-origin assets referenced by the page (at minimum CSS/JS/images used by layout; prefer failing if a linked stylesheet/script 404s).
6. Resolve relative URLs against the page URL.
7. Skip: `mailto:`, `tel:`, empty hashes that only mean “this page”, `javascript:`.
8. For hash links (`page.html#section` or `#section`): assert the page loads; optionally assert the target id exists (nice-to-have; not required for v1 if costly).
9. For each unique absolute URL:
   - **Same-origin:** request must return 2xx (redirects followed to final 2xx).
   - **Outbound:** up to **3 attempts** with short backoff; then hard-fail if still non-success.
10. Report failing URL, status, and referring page(s).

### CI

Extend `.github/workflows/deploy.yml` (or split into `test` + `deploy` jobs in the same workflow) so deploy is gated:

| Job | What | Pass criteria |
| --- | --- | --- |
| `link-crawl` | Checkout → `npm ci` → install Playwright browsers → `npm test` (static server + full crawl including outbound with retries) | Exit 0 |
| `docker-smoke` | `docker build` site image → run container on a free port (no need for full compose/Caddy edge) → hit every **same-origin** HTML route discovered (from crawl list or `sitemap.xml` + known pages) | All return 2xx |
| `deploy` | Existing SSH pull + `docker compose up -d --build` | Runs only if both jobs succeed; `needs: [link-crawl, docker-smoke]` |

Triggers remain: `push` to `main`, `workflow_dispatch`.

### Outbound retry policy

- Attempts: 3  
- Backoff: short (e.g. 1s, 2s)  
- Success: HTTP 2xx after redirects (treat 3xx as followed)  
- Failure: non-2xx after 3 attempts → fail the job  
- Optional allowlist later if a known flaky host appears; not in v1 unless required during implementation

### Docker smoke detail

- Build from repo `Dockerfile` (the production site image).
- Run with defaults from `docker/entrypoint.sh` (no production secrets required; `.env` optional for smoke).
- Assert routes that would have caught the prior bug: at least every HTML file copied into the image / listed in `sitemap.xml`, including `po-sales-order.html` and `smart-inbox.html`.
- External links are **not** re-checked in this job (already covered by `link-crawl`).

## Spec self-review (2026-08-16)

- No TBD/placeholder sections.
- Entrypoint already supplies env defaults — docker smoke does not depend on VPS secrets.
- Asset checking is “layout-critical same-origin”; exact selectors left to implementation plan.
- Hash-target id existence is optional in v1.

## Developer workflow

```bash
npm ci
npx playwright install --with-deps   # first time / CI
npm test                             # before push
git push                             # CI crawl + docker smoke + deploy
```

Document the above briefly in `README.md` under a “Tests” section.

## Success criteria

- Locally, removing an `href` target or deleting a linked HTML file makes `npm test` fail.
- Locally / in CI docker smoke, a Dockerfile that omits an HTML page linked from the site fails before deploy.
- A single outbound timeout does not fail the job; three consecutive failures do.
- Push to `main` does not SSH-deploy if either check fails.

## Risks

| Risk | Mitigation |
| --- | --- |
| Third-party outages block deploys | Retries; document how to temporarily skip via workflow_dispatch + future allowlist if needed |
| Partials load race | Wait for a nav marker (e.g. `.nav` with expected link count or `data-includes` cleared) before collecting links |
| CI time / browser download | Cache Playwright browsers; keep crawl to unique URLs |
| Entrypoint needs `.env` | Use `.env.example` values in smoke job |

## Decisions locked

- Gate: **both** local and CI (CI blocks deploy)
- SUT: **static crawl + Docker smoke**
- Link scope: **same-origin + outbound**
- Outbound: **hard fail after retries**
- Tooling: **Playwright** (not linkinator-only)
