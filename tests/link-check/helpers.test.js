const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const {
  shouldSkipHref,
  normalizeUrl,
  isSameOrigin,
  listHtmlPages,
} = require('./helpers');

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

describe('isAntiBotReachable', () => {
  const { isAntiBotReachable } = require('./helpers');

  it('accepts LinkedIn 999 and Google Forms 401', () => {
    assert.equal(
      isAntiBotReachable('https://www.linkedin.com/in/x', 999),
      true
    );
    assert.equal(
      isAntiBotReachable(
        'https://docs.google.com/forms/d/abc/viewform',
        401
      ),
      true
    );
    assert.equal(isAntiBotReachable('https://example.com/', 404), false);
  });
});
