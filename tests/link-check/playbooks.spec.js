const fs = require('node:fs');
const path = require('node:path');
const { test, expect } = require('@playwright/test');

test('home does not include Where to Start', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(
    () => !document.documentElement.hasAttribute('data-includes-pending')
  );

  await expect(page.locator('#where-to-start')).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Where to Start' })).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Playbooks' })).toHaveCount(0);
  await expect(page.locator('#discovery-call')).toHaveCount(1);
});

test('home chatbot knowledge does not include Where to Start', () => {
  const md = fs.readFileSync(
    path.resolve(__dirname, '../../chatbot-knowledge/website-home.md'),
    'utf8'
  );
  expect(md).not.toContain('## Where to Start');
  expect(md).not.toContain('#where-to-start');
  expect(md).toContain('## Book a Discovery Call');
});
