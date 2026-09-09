# Open-source stock ERP playbook Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a fourth home “Where to Start” playbook card for installing and configuring an affordable open-source stock ERP, and mirror that copy in home chatbot knowledge.

**Architecture:** Reuse the existing Supplier Verification `playbook-card` markup in `index.html` `#where-to-start`. Keep `grid-3` so the fourth card wraps to row two. Hand-edit `chatbot-knowledge/website-home.md` (do not `--force` regenerate). Playwright covers copy, footer target, and desktop wrap.

**Tech Stack:** Static HTML, existing site CSS (`card-tag--teal`, `playbook-card`), Playwright (`tests/link-check/*.spec.js`), chatbot knowledge markdown.

## Global Constraints

- Card lives only in `index.html` `#where-to-start`, after Supplier Verification
- Verbatim copy from spec `docs/superpowers/specs/2026-09-09-open-source-stock-erp-playbook-design.md`
- Product stays generic (“open-source ERP”); no vendor names (Odoo, ERPNext, Dolibarr)
- No euro figure, no typical-weeks claim, no Client results link
- Footer: `href="#discovery-call"` with `link-brand` and Font Awesome arrow
- Do not run `python3 scripts/html_to_knowledge_md.py --force`
- Do not change hero, nav, `what-we-automate.html`, `about.html`, case studies, PO → sales order, or smart inbox
- Do not reflow the playbook grid to 2×2
- CSS change only if the desktop wrap test fails
- Do not commit unless the user asks; do not push

---

## File map

| File | Responsibility |
|------|----------------|
| `tests/link-check/playbooks.spec.js` | Assert four playbooks, verbatim stock-ERP copy, discovery footer, desktop wrap, knowledge file |
| `index.html` | Fourth `playbook-card` in `#where-to-start` |
| `chatbot-knowledge/website-home.md` | Same playbook in the Where to Start section |
| `css/styles.css` | Touch **only** if Task 2 wrap test fails — see Task 3 |

---

### Task 1: Failing Playwright coverage for the fourth playbook

**Files:**
- Create: `tests/link-check/playbooks.spec.js`

**Interfaces:**
- Consumes: Playwright `test` / `expect`, `baseURL` `http://127.0.0.1:8765`, `webServer` from `playwright.config.js`
- Produces: two tests — `where-to-start includes open-source stock ERP playbook` and `home chatbot knowledge includes the stock ERP playbook`

- [ ] **Step 1: Write the failing tests**

Create `tests/link-check/playbooks.spec.js`:

```javascript
const fs = require('node:fs');
const path = require('node:path');
const { test, expect } = require('@playwright/test');

const WHO =
  "Owners and ops leads still running sales and inventory on spreadsheets, paper, or manual tracking. Not a fit if a working ERP is already in place.";
const WHAT =
  'We install and configure an affordable open-source ERP, migrate your current stock and sales records, and train the team to run it day to day. The system is chosen on the discovery call; quote after we see how you work today.';
const OUTCOME =
  'Spreadsheets, paper, and manual sales/inventory tracking replaced by one live stock system the team can run themselves.';

test('where-to-start includes open-source stock ERP playbook', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(
    () => !document.documentElement.hasAttribute('data-includes-pending')
  );

  const cards = page.locator('#where-to-start .playbook-card');
  await expect(cards).toHaveCount(4);

  const last = cards.nth(3);
  await expect(last.locator('.card-tag')).toHaveText('Inventory Operations');
  await expect(last.locator('.card-title')).toHaveText('Open-source stock ERP');
  await expect(last.locator('dd').nth(0)).toHaveText(WHO);
  await expect(last.locator('dd').nth(1)).toHaveText(WHAT);
  await expect(last.locator('dd.outcome')).toHaveText(OUTCOME);

  const footer = last.locator('.playbook-card__footer a');
  await expect(footer).toHaveText(/Book a discovery call/);
  await expect(footer).toHaveAttribute('href', '#discovery-call');
  await expect(page.locator('#discovery-call')).toHaveCount(1);

  const titles = await cards.locator('.card-title').allTextContents();
  expect(titles.slice(0, 3)).toEqual([
    'PO → Sales Order',
    'Smart Inbox Triage',
    'Supplier Verification',
  ]);

  const boxes = await cards.evaluateAll((els) =>
    els.map((el) => {
      const r = el.getBoundingClientRect();
      return { x: r.x, y: r.y, height: r.height };
    })
  );
  expect(boxes[3].y).toBeGreaterThan(boxes[0].y + boxes[0].height / 2);
  expect(Math.abs(boxes[3].x - boxes[0].x)).toBeLessThan(24);
});

test('home chatbot knowledge includes the stock ERP playbook', () => {
  const md = fs.readFileSync(
    path.resolve(__dirname, '../../chatbot-knowledge/website-home.md'),
    'utf8'
  );
  expect(md).toContain('### Open-source stock ERP');
  expect(md).toContain('Inventory Operations');
  expect(md).toContain(WHO);
  expect(md).toContain(WHAT);
  expect(md).toContain(OUTCOME);
  expect(md).toContain('https://www.bespoke-ai.ie/#discovery-call');
  expect(md).not.toMatch(/Odoo|ERPNext|Dolibarr/i);
  expect(md).not.toMatch(/€\d/);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
npx playwright test tests/link-check/playbooks.spec.js
```

Expected: FAIL. Home test: `toHaveCount(4)` received `3`. Knowledge test: missing `### Open-source stock ERP`.

- [ ] **Step 3: Commit** (only if the user asked)

```bash
git add tests/link-check/playbooks.spec.js
git commit -m "$(cat <<'EOF'
test: cover open-source stock ERP home playbook

EOF
)"
```

---

### Task 2: Add the home playbook card

**Files:**
- Modify: `index.html` (the `#where-to-start` `.grid-3` that currently ends with the Supplier Verification `</article>`)
- Test: `tests/link-check/playbooks.spec.js` (home test should pass; knowledge test still fails)

**Interfaces:**
- Consumes: existing Supplier Verification article markup and classes
- Produces: fourth `.playbook-card` titled `Open-source stock ERP` with footer `#discovery-call`

- [ ] **Step 1: Insert the card after Supplier Verification, before the grid `</div>`**

In `index.html`, immediately after the Supplier Verification `</article>` (the one whose footer links to `case-studies.html#case-study-supplier`) and still inside `.grid-3`, add:

```html
                <article class="glass-panel glass-panel-hover card playbook-card">
                    <span class="card-tag card-tag--teal">Inventory Operations</span>
                    <h3 class="card-title">Open-source stock ERP</h3>
                    <dl class="card-dl playbook-dl">
                        <div><dt>Who it's for</dt><dd>Owners and ops leads still running sales and inventory on spreadsheets, paper, or manual tracking. Not a fit if a working ERP is already in place.</dd></div>
                        <div><dt>What you get</dt><dd>We install and configure an affordable open-source ERP, migrate your current stock and sales records, and train the team to run it day to day. The system is chosen on the discovery call; quote after we see how you work today.</dd></div>
                        <div><dt class="outcome-label">Typical outcome</dt><dd class="outcome">Spreadsheets, paper, and manual sales/inventory tracking replaced by one live stock system the team can run themselves.</dd></div>
                    </dl>
                    <p class="playbook-card__footer text-body-sm">
                        <a href="#discovery-call" class="link-brand">Book a discovery call <i class="fa-solid fa-arrow-right" aria-hidden="true"></i></a>
                    </p>
                </article>
```

Do not edit the section intro paragraph. Do not edit the three existing cards. Do not add a Client results link on this card.

- [ ] **Step 2: Re-run Playwright for this file**

Run:

```bash
npx playwright test tests/link-check/playbooks.spec.js
```

Expected: home test PASS. Knowledge test still FAIL (heading missing in markdown). If the home test fails on the wrap assertion (`boxes[3].y` / `boxes[3].x`) and the copy assertions passed, stop and do Task 3. If copy failed, fix the HTML to match the strings in the spec exactly (including the apostrophe in `Who it's for` and `it's` — do not use `’` curly quotes).

- [ ] **Step 3: Commit** (only if the user asked)

```bash
git add index.html tests/link-check/playbooks.spec.js
git commit -m "$(cat <<'EOF'
feat: add open-source stock ERP playbook on home

EOF
)"
```

---

### Task 3: CSS wrap fix (skip unless Task 2 wrap assertion failed)

**Files:**
- Modify: `css/styles.css` — the block at `#where-to-start .grid-3` inside `@media (min-width: 1024px)` (currently `grid-template-rows: repeat(6, auto)` plus `.playbook-card { grid-row: span 6 }`)
- Modify: `index.html` and any HTML that cache-busts `css/styles.css` **only if** you change CSS (home currently uses `css/styles.css?v=20260903b` — bump the query string on `index.html` to `?v=20260909a`)

**Interfaces:**
- Consumes: existing subgrid playbook layout
- Produces: three cards on row one and the fourth card on row two, left-aligned under PO → Sales Order, without switching to a 2-column playbook grid

Skip this entire task if Task 2’s wrap assertion already passed.

- [ ] **Step 1: Allow a second subgrid row**

Replace the `#where-to-start .grid-3` rule inside `@media (min-width: 1024px)` so explicit rows are not capped at six. Keep three columns from `.grid-3`. Change only this rule:

```css
  #where-to-start .grid-3 {
    grid-template-rows: none;
    grid-auto-rows: auto;
    column-gap: 2rem;
    row-gap: 0.75rem;
  }
```

Leave `#where-to-start .playbook-card` (`display: grid`, `grid-template-rows: subgrid`, `grid-row: span 6`) unchanged.

- [ ] **Step 2: Bump the stylesheet query on `index.html`**

In `index.html` `<head>`, change:

```html
    <link rel="stylesheet" href="css/styles.css?v=20260903b">
```

to:

```html
    <link rel="stylesheet" href="css/styles.css?v=20260909a">
```

- [ ] **Step 3: Re-run the wrap test**

Run:

```bash
npx playwright test tests/link-check/playbooks.spec.js
```

Expected: both tests still — knowledge FAIL, home PASS including wrap. If wrap still fails, do not switch to `grid-template-columns: repeat(2, 1fr)` on `#where-to-start`. Inspect computed grid with a 1280px viewport and adjust `grid-auto-rows` / `grid-row: span 6` until the fourth card’s `y` is below the first card and `x` matches the first card within 24px.

- [ ] **Step 4: Commit** (only if the user asked)

```bash
git add css/styles.css index.html
git commit -m "$(cat <<'EOF'
fix: let the fourth Where to Start card wrap under subgrid

EOF
)"
```

---

### Task 4: Mirror copy in home chatbot knowledge

**Files:**
- Modify: `chatbot-knowledge/website-home.md` — Where to Start section, after the Supplier Verification block and before the “Client results · Need something deeper?” line
- Test: `tests/link-check/playbooks.spec.js` (knowledge test)

**Interfaces:**
- Consumes: verbatim card copy from Task 2 / the spec
- Produces: `### Open-source stock ERP` heading plus the three fields and a discovery-call link to `https://www.bespoke-ai.ie/#discovery-call`

- [ ] **Step 1: Insert the knowledge block by hand**

In `chatbot-knowledge/website-home.md`, after:

```markdown
[Client results](https://www.bespoke-ai.ie/case-studies.html#case-study-supplier)
```

and before:

```markdown
[Client results](https://www.bespoke-ai.ie/case-studies.html) · Need something deeper? [AI Engineering & Custom Pipelines](https://www.bespoke-ai.ie/ai-engineering.html)
```

insert:

```markdown
Inventory Operations

### Open-source stock ERP

- **Who it's for:** Owners and ops leads still running sales and inventory on spreadsheets, paper, or manual tracking. Not a fit if a working ERP is already in place.
- **What you get:** We install and configure an affordable open-source ERP, migrate your current stock and sales records, and train the team to run it day to day. The system is chosen on the discovery call; quote after we see how you work today.
- **Typical outcome:** Spreadsheets, paper, and manual sales/inventory tracking replaced by one live stock system the team can run themselves.

[Book a discovery call](https://www.bespoke-ai.ie/#discovery-call)
```

Do not run `python3 scripts/html_to_knowledge_md.py --force`. Do not edit `what-we-automate.md`, `case-studies.md`, or `bot-guardrails.md`.

- [ ] **Step 2: Run Playwright until both tests pass**

Run:

```bash
npx playwright test tests/link-check/playbooks.spec.js
```

Expected: both tests PASS.

- [ ] **Step 3: Commit** (only if the user asked)

```bash
git add chatbot-knowledge/website-home.md tests/link-check/playbooks.spec.js
git commit -m "$(cat <<'EOF'
docs: teach Ask BCAI the stock ERP playbook

EOF
)"
```

---

### Task 5: Verify viewports and full test suite

**Files:**
- None, unless a defect is found in Task 2/3/4 files

**Interfaces:**
- Consumes: local static server on port 8765 (Playwright `webServer` or `python3 -m http.server 8765`)
- Produces: confirmation that success criteria 1–6 in the spec hold

- [ ] **Step 1: Run the full suite**

Run:

```bash
npm test
```

Expected: unit tests PASS; Playwright crawl, GDPR specs, and `playbooks.spec.js` PASS. No new 404s (the new footer is a same-page `#discovery-call` hash).

- [ ] **Step 2: Check desktop, tablet, and mobile**

Open `http://127.0.0.1:8765/` (start `python3 -m http.server 8765` if Playwright is not already serving). Scroll to Where to Start.

- 1280px: three cards on row one; Open-source stock ERP alone on row two, left column; footer “Book a discovery call” visible; click it and confirm `#discovery-call` is in view
- 768px: two-by-two wrap; no overlapping cards
- 375px: four cards stacked; no clipped footer

Use the browser tools when available; otherwise Playwright viewport screenshots from `playbooks.spec.js` plus the wrap assertion are the evidence.

- [ ] **Step 3: Confirm out of scope stayed out**

Grep:

```bash
grep -n "Open-source stock ERP" what-we-automate.html about.html case-studies.html po-sales-order.html smart-inbox.html chatbot-knowledge/what-we-automate.md chatbot-knowledge/case-studies.md chatbot-knowledge/bot-guardrails.md
```

Expected: no matches (exit 1 / no lines).

Grep the new card for forbidden claims:

```bash
grep -nE "Odoo|ERPNext|Dolibarr|€[0-9]|typically live" index.html chatbot-knowledge/website-home.md


Expected: no matches in the new playbook (existing pages may still say “typically live” on other cards — that is fine). If `typically live` hits `index.html`, confirm it is only on PO → Sales Order, Smart Inbox, or Supplier Verification.

- [ ] **Step 4: Commit** (only if the user asked to commit the whole change)

```bash
git add index.html chatbot-knowledge/website-home.md tests/link-check/playbooks.spec.js css/styles.css
git commit -m "$(cat <<'EOF'
feat: offer open-source stock ERP as a home playbook

EOF
)"
```

Only include `css/styles.css` if Task 3 ran.

---

## Self-review vs spec

| Spec requirement | Task |
|------------------|------|
| Fourth card after Supplier Verification | Task 2 |
| Verbatim who / what / outcome + teal tag + title | Tasks 1–2 |
| Footer `#discovery-call`, no Client results | Tasks 1–2 |
| Keep `grid-3`; wrap to row two; CSS only if broken | Tasks 1–2, Task 3 gated |
| Hand-edit `website-home.md`; no `--force` | Task 4 |
| No new page/nav/hero; no other site pages | Task 5 grep |
| No vendor, price, or week-count | Tasks 1, 4, 5 |
| Desktop / tablet / mobile check | Task 5 |
| Existing three playbooks unchanged | Task 1 title assertion |
