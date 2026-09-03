const { test, expect } = require('@playwright/test');

test('home does not load analytics or font CDNs', async ({ page }) => {
  const blocked = [];
  page.on('request', (req) => {
    const url = req.url();
    if (
      /googletagmanager\.com|google-analytics\.com|fonts\.googleapis\.com|fonts\.gstatic\.com|cdnjs\.cloudflare\.com\/ajax\/libs\/font-awesome/.test(
        url
      )
    ) {
      blocked.push(url);
    }
  });

  await page.goto('/', { waitUntil: 'networkidle' });
  await page.waitForFunction(
    () => !document.documentElement.hasAttribute('data-includes-pending')
  );
  expect(blocked, blocked.join('\n')).toEqual([]);
});

test('footer privacy link opens the dedicated page', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(
    () => !document.documentElement.hasAttribute('data-includes-pending')
  );
  await page.locator('.footer-privacy-link a').click();
  await expect(page).toHaveURL(/privacy\.html$/);
  await expect(page.locator('h1')).toContainText('Privacy notice');
});

test('booking calendar iframe stays empty until the load button', async ({
  page,
}) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const iframe = page.locator('#discovery-booking-embed');
  await expect(iframe).toHaveAttribute('hidden', '');
  await expect(iframe).not.toHaveAttribute('src', /calendar\.google\.com/);

  await page.locator('#load-booking-calendar').click();
  await expect(iframe).toHaveAttribute('src', /calendar\.google\.com/);
  await expect(iframe).not.toHaveAttribute('hidden', '');
});

test('chat iframe stays empty until Continue', async ({ page }) => {
  await page.goto('/', { waitUntil: 'networkidle' });
  await page.waitForFunction(
    () => !document.documentElement.hasAttribute('data-includes-pending')
  );
  await page.locator('.chat-embed__toggle').click();
  const frame = page.locator('.chat-embed__frame');
  await expect(page.locator('.chat-embed__gate')).toBeVisible();
  await expect(frame).toHaveAttribute('hidden', '');
  await expect(frame).not.toHaveAttribute('src', /run\.app/);

  await page.locator('.chat-embed__gate-continue').click();
  await expect(frame).toHaveAttribute('src', /run\.app/);
  await expect(frame).not.toHaveAttribute('hidden', '');
});
