const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { listHtmlPages } = require('../link-check/helpers');

const ROOT = path.resolve(__dirname, '../..');

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8');
}

function listRootHtml() {
  return listHtmlPages(ROOT);
}

describe('analytics and CDN contracts', () => {
  it('does not ship Google Analytics', () => {
    const includes = read('js/includes.js');
    const config = read('js/site-config.js');
    const template = read('js/site-config.template.js');
    assert.doesNotMatch(includes, /initGoogleAnalytics|googletagmanager|gtag\(/);
    assert.doesNotMatch(config, /gaMeasurementId|G-YBVQT5NFWE/);
    assert.doesNotMatch(template, /gaMeasurementId|G-YBVQT5NFWE/);
  });

  it('does not load Google Fonts or cdnjs Font Awesome from root pages', () => {
    for (const page of listRootHtml()) {
      const html = read(page);
      assert.doesNotMatch(
        html,
        /fonts\.googleapis\.com|fonts\.gstatic\.com|cdnjs\.cloudflare\.com\/ajax\/libs\/font-awesome/,
        page
      );
    }
  });

  it('self-hosts fonts and icon webfonts', () => {
    assert.match(read('css/fonts.css'), /InterVariable|Inter/);
    assert.match(read('css/fonts.css'), /JetBrains Mono/);
    assert.ok(fs.existsSync(path.join(ROOT, 'fonts/InterVariable.woff2')));
    assert.ok(fs.existsSync(path.join(ROOT, 'fonts/JetBrainsMono-Variable.woff2')));
    assert.ok(fs.existsSync(path.join(ROOT, 'webfonts/fa-solid-900.woff2')));
    assert.ok(fs.existsSync(path.join(ROOT, 'webfonts/fa-brands-400.woff2')));
  });
});

describe('privacy page and footer', () => {
  it('includes privacy.html at the repo root', () => {
    assert.ok(listRootHtml().includes('privacy.html'));
  });

  it('footer links to the privacy page instead of an accordion', () => {
    const footer = read('partials/footer.html');
    assert.match(footer, /href="privacy\.html"/);
    assert.doesNotMatch(footer, /<details[\s\S]*id="privacy"/);
    assert.doesNotMatch(footer, /Google Analytics|GA4/);
  });

  it('privacy page names the controller, DPC, transfers, and cookies policy', () => {
    const page = read('privacy.html');
    assert.match(page, /Bespoke Core AI Engineering Limited/);
    assert.match(page, /820893/);
    assert.match(page, /3 Heather Grove/);
    assert.match(page, /V94 N5RC/);
    assert.match(page, /Data Protection Commission/);
    assert.match(page, /Data Privacy Framework/);
    assert.match(page, /Standard Contractual Clauses/);
    assert.match(page, /analytics or advertising cookies/i);
    assert.match(page, /does not load Google Analytics/);
    assert.doesNotMatch(page, /This site uses Google Analytics|GA4/);
  });
});

describe('click-to-load booking markup', () => {
  it('home booking iframe has no Google src and a load button', () => {
    const html = read('index.html');
    assert.match(html, /id="load-booking-calendar"/);
    assert.doesNotMatch(
      html,
      /id="discovery-booking-embed"[^>]*src="https:\/\/calendar\.google\.com/
    );
    assert.match(html, /href="privacy\.html"/);
  });
});
