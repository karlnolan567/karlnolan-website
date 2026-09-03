(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }
  if (root) {
    root.PrivacyControls = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  var CHAT_CONSENT_KEY = 'bcai-chat-cloud-ok';

  function hasChatConsent(storage) {
    if (!storage || typeof storage.getItem !== 'function') {
      return false;
    }
    try {
      return storage.getItem(CHAT_CONSENT_KEY) === '1';
    } catch (e) {
      return false;
    }
  }

  function persistChatConsent(storage) {
    if (!storage || typeof storage.setItem !== 'function') {
      return;
    }
    try {
      storage.setItem(CHAT_CONSENT_KEY, '1');
    } catch (e) {
      /* ignore quota / private mode */
    }
  }

  function shouldLoadChatFrame(storage) {
    return hasChatConsent(storage);
  }

  function privacyPageUrlFromHash(hash) {
    return hash === '#privacy' ? 'privacy.html' : null;
  }

  function loadBookingEmbed(iframe, src) {
    if (!iframe || !src) {
      return false;
    }
    iframe.src = src;
    return true;
  }

  return {
    CHAT_CONSENT_KEY: CHAT_CONSENT_KEY,
    hasChatConsent: hasChatConsent,
    persistChatConsent: persistChatConsent,
    shouldLoadChatFrame: shouldLoadChatFrame,
    privacyPageUrlFromHash: privacyPageUrlFromHash,
    loadBookingEmbed: loadBookingEmbed,
  };
});
