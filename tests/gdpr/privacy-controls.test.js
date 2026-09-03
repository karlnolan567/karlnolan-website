const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
  CHAT_CONSENT_KEY,
  hasChatConsent,
  persistChatConsent,
  shouldLoadChatFrame,
  privacyPageUrlFromHash,
  loadBookingEmbed,
} = require('../../js/privacy-controls.js');

describe('chat cloud consent', () => {
  it('does not load the chat frame until Continue is stored', () => {
    const storage = new MapStorage();
    assert.equal(hasChatConsent(storage), false);
    assert.equal(shouldLoadChatFrame(storage), false);
    persistChatConsent(storage);
    assert.equal(storage.getItem(CHAT_CONSENT_KEY), '1');
    assert.equal(hasChatConsent(storage), true);
    assert.equal(shouldLoadChatFrame(storage), true);
  });

  it('treats missing storage as no consent', () => {
    assert.equal(hasChatConsent(null), false);
    assert.equal(shouldLoadChatFrame(undefined), false);
  });
});

describe('privacy hash', () => {
  it('sends #privacy to the dedicated page', () => {
    assert.equal(privacyPageUrlFromHash('#privacy'), 'privacy.html');
    assert.equal(privacyPageUrlFromHash('#discovery-call'), null);
    assert.equal(privacyPageUrlFromHash(''), null);
  });
});

describe('booking embed', () => {
  it('does not set iframe src until loadBookingEmbed is called', () => {
    const iframe = { src: '' };
    assert.equal(iframe.src, '');
    const loaded = loadBookingEmbed(iframe, 'https://calendar.google.com/example');
    assert.equal(loaded, true);
    assert.equal(iframe.src, 'https://calendar.google.com/example');
  });

  it('refuses to load without an iframe or src', () => {
    assert.equal(loadBookingEmbed(null, 'https://calendar.google.com/example'), false);
    assert.equal(loadBookingEmbed({ src: '' }, ''), false);
  });
});

function MapStorage() {
  this.data = new Map();
}
MapStorage.prototype.getItem = function (key) {
  return this.data.has(key) ? this.data.get(key) : null;
};
MapStorage.prototype.setItem = function (key, value) {
  this.data.set(key, String(value));
};
