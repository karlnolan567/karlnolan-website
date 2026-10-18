const { test, expect } = require('@playwright/test');

function overlaps(a, b) {
  return !(a.x + a.width <= b.x || b.x + b.width <= a.x || a.y + a.height <= b.y || b.y + b.height <= a.y);
}

test.describe('home hero on a phone (390px)', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('headline and one CTA are on the first screen, chat stays out of the way', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForFunction(() => !document.documentElement.hasAttribute('data-includes-pending'));
    await page.waitForTimeout(1500);

    const h1 = page.locator('#hero-heading');
    await expect(h1).toContainText('Stop re-keying orders, invoices and dockets.');
    await expect(h1).toBeInViewport();

    const cta = page.locator('.section--hero a.btn-primary');
    await expect(cta).toHaveCount(1);
    await expect(cta).toBeInViewport();

    await expect(page.locator('.chat-embed__nudge')).toBeHidden();

    const toggle = await page.locator('.chat-embed__toggle').boundingBox();
    const h1Box = await h1.boundingBox();
    const ctaBox = await cta.boundingBox();
    expect(toggle).toBeTruthy();
    expect(overlaps(toggle, h1Box)).toBe(false);
    expect(overlaps(toggle, ctaBox)).toBe(false);
  });
});

test('desktop hero has one primary CTA and no workshop card', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => !document.documentElement.hasAttribute('data-includes-pending'));
  await expect(page.locator('.section--hero a.btn-primary')).toHaveCount(1);
  await expect(page.locator('.section--hero #workshop-announce')).toHaveCount(0);
  await expect(page.locator('#client-results h2')).toHaveText('Example builds');
  await expect(page.locator('#client-results a.card')).toHaveCount(3);
});

test('desktop hero shows the intro video beside the headline', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => !document.documentElement.hasAttribute('data-includes-pending'));
  const video = page.locator('.section--hero video.hero-intro__video');
  await expect(video).toHaveCount(1);
  await expect(video).toBeInViewport();
  const v = await video.boundingBox();
  const h = await page.locator('#hero-heading').boundingBox();
  expect(v.x).toBeGreaterThan(h.x + h.width - 1);
  expect(v.y).toBeLessThan(h.y + h.height + 400);
  await expect(page.locator('#about video')).toHaveCount(0);
});

test('phone hero puts the intro video under the CTA', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => !document.documentElement.hasAttribute('data-includes-pending'));
  const v = await page.locator('.section--hero video.hero-intro__video').boundingBox();
  const c = await page.locator('.section--hero a.btn-primary').boundingBox();
  expect(v.y).toBeGreaterThan(c.y + c.height);
  expect(v.width).toBeLessThanOrEqual(390);
});
