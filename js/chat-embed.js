(function () {
  var embedUrl = SITE.chatEmbedUrl;
  if (!embedUrl) {
    return;
  }

  var isOpen = false;
  var frameLoaded = false;

  var root = document.createElement('div');
  root.className = 'chat-embed';
  root.innerHTML =
    '<button type="button" class="chat-embed__toggle" aria-expanded="false" aria-controls="bcai-chat-embed-panel" aria-label="Open chat">' +
      '<i class="fa-solid fa-comments" aria-hidden="true"></i>' +
    '</button>' +
    '<section id="bcai-chat-embed-panel" class="chat-embed__panel" hidden aria-label="Bespoke AI Assistant">' +
      '<button type="button" class="chat-embed__close" aria-label="Close chat">' +
        '<i class="fa-solid fa-xmark" aria-hidden="true"></i>' +
      '</button>' +
      '<iframe class="chat-embed__frame" title="Bespoke AI Assistant" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allow="clipboard-write"></iframe>' +
    '</section>';

  document.body.appendChild(root);

  var toggleBtn = root.querySelector('.chat-embed__toggle');
  var panel = root.querySelector('.chat-embed__panel');
  var closeBtn = root.querySelector('.chat-embed__close');
  var frame = root.querySelector('.chat-embed__frame');

  function ensureFrameSrc() {
    if (frameLoaded) {
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
      ensureFrameSrc();
    }
  }

  toggleBtn.addEventListener('click', function () {
    setOpen(!isOpen);
  });

  closeBtn.addEventListener('click', function () {
    setOpen(false);
  });

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && isOpen) {
      setOpen(false);
    }
  });
})();
