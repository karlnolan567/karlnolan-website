(function () {
  var embedUrl = SITE.chatEmbedUrl;
  if (!embedUrl) {
    return;
  }

  var NUDGE_KEY = 'bcai-chat-nudge-dismissed';
  var isOpen = false;
  var frameLoaded = false;
  var nudgeDismissed = false;
  var controls = typeof PrivacyControls !== 'undefined' ? PrivacyControls : null;

  try {
    nudgeDismissed = sessionStorage.getItem(NUDGE_KEY) === '1';
  } catch (e) {
    nudgeDismissed = false;
  }

  var root = document.createElement('div');
  root.className = 'chat-embed';
  root.innerHTML =
    '<div class="chat-embed__nudge" hidden>' +
      '<button type="button" class="chat-embed__teaser" aria-label="Open chat: Ask me anything about our services and website">' +
        '<img class="chat-embed__teaser-avatar" src="images/logo-icon.png" alt="" width="40" height="40">' +
        '<span class="chat-embed__teaser-text">' +
          '<span class="chat-embed__teaser-message">Ask me anything about our services &amp; website</span>' +
        '</span>' +
      '</button>' +
      '<button type="button" class="chat-embed__teaser-dismiss" aria-label="Dismiss chat suggestion">' +
        '<i class="fa-solid fa-xmark" aria-hidden="true"></i>' +
      '</button>' +
    '</div>' +
    '<button type="button" class="chat-embed__toggle" aria-expanded="false" aria-controls="bcai-chat-embed-panel" aria-label="Open chat">' +
      '<img class="chat-embed__toggle-icon" src="images/logo-icon.png" alt="" width="28" height="28">' +
      '<span class="chat-embed__badge" hidden aria-hidden="true">1</span>' +
    '</button>' +
    '<section id="bcai-chat-embed-panel" class="chat-embed__panel" hidden aria-label="Bespoke AI Assistant">' +
      '<button type="button" class="chat-embed__close" aria-label="Close chat">' +
        '<i class="fa-solid fa-xmark" aria-hidden="true"></i>' +
      '</button>' +
      '<div class="chat-embed__gate" hidden>' +
        '<p>Messages you send are processed by Google Cloud in europe-west1 (Belgium) to generate a reply. Do not paste sensitive personal data.</p>' +
        '<p><a href="privacy.html" class="link-brand">Privacy notice</a></p>' +
        '<div class="chat-embed__gate-actions">' +
          '<button type="button" class="chat-embed__gate-continue btn btn-primary">Continue</button>' +
          '<button type="button" class="chat-embed__gate-cancel btn btn-secondary">Cancel</button>' +
        '</div>' +
      '</div>' +
      '<iframe class="chat-embed__frame" title="Bespoke AI Assistant" hidden loading="lazy" referrerpolicy="no-referrer-when-downgrade" allow="clipboard-write"></iframe>' +
    '</section>';

  document.body.appendChild(root);

  var nudgeEl = root.querySelector('.chat-embed__nudge');
  var teaserBtn = root.querySelector('.chat-embed__teaser');
  var dismissBtn = root.querySelector('.chat-embed__teaser-dismiss');
  var toggleBtn = root.querySelector('.chat-embed__toggle');
  var badgeEl = root.querySelector('.chat-embed__badge');
  var panel = root.querySelector('.chat-embed__panel');
  var closeBtn = root.querySelector('.chat-embed__close');
  var gateEl = root.querySelector('.chat-embed__gate');
  var continueBtn = root.querySelector('.chat-embed__gate-continue');
  var cancelBtn = root.querySelector('.chat-embed__gate-cancel');
  var frame = root.querySelector('.chat-embed__frame');

  function chatStorage() {
    try {
      return window.localStorage;
    } catch (e) {
      return null;
    }
  }

  function hasCloudConsent() {
    return controls ? controls.shouldLoadChatFrame(chatStorage()) : false;
  }

  function persistNudgeDismissed() {
    nudgeDismissed = true;
    try {
      sessionStorage.setItem(NUDGE_KEY, '1');
    } catch (e) {
      /* ignore quota / private mode */
    }
  }

  function syncNudgeVisibility() {
    var showNudge = !nudgeDismissed && !isOpen;
    nudgeEl.hidden = !showNudge;
    badgeEl.hidden = !showNudge;
  }

  function syncGate() {
    var consented = hasCloudConsent();
    gateEl.hidden = !isOpen || consented;
    frame.hidden = !isOpen || !consented;
  }

  function ensureFrameSrc() {
    if (frameLoaded || !hasCloudConsent()) {
      return;
    }
    frame.src = embedUrl;
    frameLoaded = true;
  }

  function setOpen(open) {
    isOpen = open;
    panel.hidden = !open;
    toggleBtn.setAttribute('aria-expanded', String(open));
    toggleBtn.setAttribute('aria-label', open ? 'Close chat' : 'Open chat');
    if (open) {
      persistNudgeDismissed();
      if (hasCloudConsent()) {
        ensureFrameSrc();
      }
    }
    syncGate();
    syncNudgeVisibility();
  }

  function dismissNudge(event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    persistNudgeDismissed();
    syncNudgeVisibility();
  }

  toggleBtn.addEventListener('click', function () {
    setOpen(!isOpen);
  });

  teaserBtn.addEventListener('click', function () {
    setOpen(true);
  });

  dismissBtn.addEventListener('click', dismissNudge);

  closeBtn.addEventListener('click', function () {
    setOpen(false);
  });

  continueBtn.addEventListener('click', function () {
    if (controls) {
      controls.persistChatConsent(chatStorage());
    }
    ensureFrameSrc();
    syncGate();
  });

  cancelBtn.addEventListener('click', function () {
    setOpen(false);
  });

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && isOpen) {
      setOpen(false);
    }
  });

  syncNudgeVisibility();

  if (!nudgeDismissed) {
    window.setTimeout(function () {
      if (!nudgeDismissed && !isOpen) {
        nudgeEl.classList.add('chat-embed__nudge--visible');
      }
    }, 400);
  }
})();
