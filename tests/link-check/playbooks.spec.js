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
  await expect(footer).toHaveClass(/link-brand/);
  await expect(footer.locator('i.fa-solid.fa-arrow-right')).toHaveCount(1);

  const cardText = await last.innerText();
  expect(cardText).not.toMatch(/Client results/i);
  expect(cardText).not.toMatch(/typically live/i);
  expect(cardText).not.toMatch(/Odoo|ERPNext|Dolibarr/i);
  expect(cardText).not.toMatch(/€\s*\d/);

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
  expect(md).not.toMatch(/€\s*\d/);
});
