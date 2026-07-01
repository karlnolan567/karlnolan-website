(function () {
  if (!SITE.chatWebhookUrl || SITE.chatWebhookUrl.indexOf('REPLACE_WITH_ID') !== -1) {
    return;
  }

  var SESSION_KEY = 'bcai-chat-session';
  var sessionId = sessionStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    sessionId = (typeof crypto !== 'undefined' && crypto.randomUUID)
      ? crypto.randomUUID()
      : 'sess-' + Date.now() + '-' + Math.random().toString(36).slice(2);
    sessionStorage.setItem(SESSION_KEY, sessionId);
  }

  var isOpen = false;
  var isSending = false;

  var root = document.createElement('div');
  root.className = 'chatbot';
  root.innerHTML =
    '<button type="button" class="chatbot__toggle" aria-expanded="false" aria-controls="bcai-chat-panel">' +
      '<i class="fa-solid fa-comments" aria-hidden="true"></i>' +
      '<span class="chatbot__toggle-label">Ask BCAI</span>' +
    '</button>' +
    '<section id="bcai-chat-panel" class="chatbot__panel" hidden aria-label="Ask BCAI chat">' +
      '<header class="chatbot__header">' +
        '<div class="chatbot__header-text">' +
          '<p class="chatbot__title">Ask BCAI</p>' +
          '<p class="chatbot__subtitle">Questions about our services &amp; website</p>' +
        '</div>' +
        '<button type="button" class="chatbot__close" aria-label="Close chat">' +
          '<i class="fa-solid fa-xmark" aria-hidden="true"></i>' +
        '</button>' +
      '</header>' +
      '<div class="chatbot__messages" role="log" aria-live="polite" aria-relevant="additions"></div>' +
      '<form class="chatbot__form">' +
        '<label class="visually-hidden" for="bcai-chat-input">Your message</label>' +
        '<textarea id="bcai-chat-input" class="chatbot__input" rows="1" placeholder="Ask about our services…" required></textarea>' +
        '<button type="submit" class="chatbot__send" aria-label="Send message">' +
          '<i class="fa-solid fa-paper-plane" aria-hidden="true"></i>' +
        '</button>' +
      '</form>' +
    '</section>';

  document.body.appendChild(root);

  var toggleBtn = root.querySelector('.chatbot__toggle');
  var panel = root.querySelector('.chatbot__panel');
  var closeBtn = root.querySelector('.chatbot__close');
  var messagesEl = root.querySelector('.chatbot__messages');
  var form = root.querySelector('.chatbot__form');
  var input = root.querySelector('.chatbot__input');
  var greeted = false;
  var warmCacheRequested = false;

  function warmKnowledgeCache() {
    var url = SITE.chatWarmCacheUrl;
    if (!url || warmCacheRequested) {
      return;
    }
    warmCacheRequested = true;
    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    }).catch(function () {
      warmCacheRequested = false;
    });
  }

  function setOpen(open) {
    isOpen = open;
    panel.hidden = !open;
    toggleBtn.setAttribute('aria-expanded', String(open));
    if (open) {
      warmKnowledgeCache();
      if (!greeted) {
        appendMessage('assistant', SITE.chatGreeting || 'Hi — I\'m Ask BCAI. I can answer questions about Bespoke Core AI and this website. What would you like to know?');
        greeted = true;
      }
      input.focus();
    }
  }

  function escapeHtml(text) {
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function formatPlainMessage(text) {
    return escapeHtml(text).replace(/\n/g, '<br>');
  }

  function friendlyLinkLabel(url) {
    var hash = url.indexOf('#') !== -1 ? url.slice(url.indexOf('#')) : '';
    var labels = {
      '#discovery-call': 'Book a call',
      '#our-service': 'Services',
      '#engagement': 'How we work',
      '#about': 'About',
      '#where-to-start': 'Where to start',
      '#case-studies': 'Case studies',
      '#privacy': 'Privacy notice',
    };
    if (hash && labels[hash]) {
      return labels[hash];
    }
    if (url.indexOf('linkedin.com/in/karl-nolan') !== -1) {
      return 'LinkedIn';
    }
    return null;
  }

  function inlineMarkdown(text) {
    var s = text;
    s = s.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer" class="chatbot__link">$1</a>');
    s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    s = s.replace(/__([^_]+)__/g, '<strong>$1</strong>');
    s = s.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    s = s.replace(/(^|[\s(])((https?:\/\/[^\s<]+))/g, function (_, pre, url) {
      var label = friendlyLinkLabel(url) || url;
      return pre + '<a href="' + url + '" target="_blank" rel="noopener noreferrer" class="chatbot__link">' + label + '</a>';
    });
    return s;
  }

  function markdownToHtml(text) {
    var lines = escapeHtml(text).split('\n');
    var html = [];
    var inList = false;
    var listTag = null;

    function closeList() {
      if (inList) {
        html.push('</' + listTag + '>');
        inList = false;
        listTag = null;
      }
    }

    for (var i = 0; i < lines.length; i++) {
      var trimmed = lines[i].trim();
      if (!trimmed) {
        closeList();
        continue;
      }

      var h3 = trimmed.match(/^###\s+(.+)$/);
      var h2 = trimmed.match(/^##\s+(.+)$/);
      var h1 = trimmed.match(/^#\s+(.+)$/);
      var ul = trimmed.match(/^[-*]\s+(.+)$/);
      var ol = trimmed.match(/^\d+\.\s+(.+)$/);

      if (h3) {
        closeList();
        html.push('<h4 class="chatbot__h">' + inlineMarkdown(h3[1]) + '</h4>');
        continue;
      }
      if (h2) {
        closeList();
        html.push('<h3 class="chatbot__h">' + inlineMarkdown(h2[1]) + '</h3>');
        continue;
      }
      if (h1) {
        closeList();
        html.push('<h3 class="chatbot__h chatbot__h--lg">' + inlineMarkdown(h1[1]) + '</h3>');
        continue;
      }
      if (ul) {
        if (!inList || listTag !== 'ul') {
          closeList();
          html.push('<ul class="chatbot__list">');
          inList = true;
          listTag = 'ul';
        }
        html.push('<li>' + inlineMarkdown(ul[1]) + '</li>');
        continue;
      }
      if (ol) {
        if (!inList || listTag !== 'ol') {
          closeList();
          html.push('<ol class="chatbot__list">');
          inList = true;
          listTag = 'ol';
        }
        html.push('<li>' + inlineMarkdown(ol[1]) + '</li>');
        continue;
      }

      closeList();
      html.push('<p class="chatbot__p">' + inlineMarkdown(trimmed) + '</p>');
    }

    closeList();
    return html.join('');
  }

  function appendMessage(role, text) {
    var bubble = document.createElement('div');
    bubble.className = 'chatbot__message chatbot__message--' + role;
    bubble.innerHTML = role === 'assistant' ? markdownToHtml(text) : formatPlainMessage(text);
    messagesEl.appendChild(bubble);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    return bubble;
  }

  function createStreamingBubble() {
    var bubble = document.createElement('div');
    bubble.className = 'chatbot__message chatbot__message--assistant chatbot__message--streaming';
    bubble.setAttribute('aria-busy', 'true');
    messagesEl.appendChild(bubble);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    return bubble;
  }

  function parseStreamLine(line) {
    var trimmed = String(line).trim();
    if (!trimmed || trimmed === '[DONE]') {
      return null;
    }
    if (trimmed.indexOf('data:') === 0) {
      trimmed = trimmed.slice(5).trim();
    }
    if (!trimmed) {
      return null;
    }
    try {
      return JSON.parse(trimmed);
    } catch (err) {
      return null;
    }
  }

  function extractStreamContent(chunk) {
    if (!chunk || typeof chunk !== 'object') {
      return '';
    }
    if (chunk.type === 'item' && chunk.content != null) {
      return String(chunk.content);
    }
    if (chunk.type === 'webhook-response') {
      if (typeof chunk.content === 'string') {
        return chunk.content;
      }
      if (chunk.content && chunk.content.output) {
        return String(chunk.content.output);
      }
    }
    return '';
  }

  function extractReplyFromRaw(text) {
    var trimmed = String(text || '').trim();
    if (!trimmed) {
      return '';
    }
    try {
      return extractReply(JSON.parse(trimmed));
    } catch (err) {
      return '';
    }
  }

  function readStreamingResponse(res, callbacks) {
    if (!res.body || !res.body.getReader) {
      throw new Error('Streaming not supported');
    }

    var reader = res.body.getReader();
    var decoder = new TextDecoder();
    var buffer = '';
    var rawText = '';
    var fullText = '';

    function processBuffer(isFinal) {
      var parts = buffer.split('\n');
      buffer = isFinal ? '' : (parts.pop() || '');

      for (var i = 0; i < parts.length; i++) {
        var chunk = parseStreamLine(parts[i]);
        if (!chunk) {
          continue;
        }
        var piece = extractStreamContent(chunk);
        if (piece) {
          fullText += piece;
          if (callbacks.onChunk) {
            callbacks.onChunk(fullText, piece);
          }
        }
      }
    }

    function pump() {
      return reader.read().then(function (result) {
        if (result.done) {
          if (buffer.trim()) {
            processBuffer(true);
          }
          if (!fullText.trim()) {
            fullText = extractReplyFromRaw(rawText);
            if (fullText && callbacks.onChunk) {
              callbacks.onChunk(fullText, fullText);
            }
          }
          if (!fullText.trim()) {
            throw new Error('Empty response');
          }
          if (callbacks.onDone) {
            callbacks.onDone(fullText);
          }
          return fullText;
        }

        var decoded = decoder.decode(result.value, { stream: true });
        rawText += decoded;
        buffer += decoded;
        processBuffer(false);
        return pump();
      });
    }

    return pump();
  }

  function extractReply(data) {
    if (!data) return '';
    if (typeof data === 'string') return data;
    if (data.output) return data.output;
    if (data.text) return data.text;
    if (data.message) return data.message;
    if (data.data && (data.data.output || data.data.text)) {
      return data.data.output || data.data.text;
    }
    if (Array.isArray(data)) {
      var first = data[0];
      if (first && first.json) {
        return first.json.output || first.json.text || '';
      }
    }
    return '';
  }

  function sendMessage(text, callbacks) {
    callbacks = callbacks || {};

    return fetch(SITE.chatWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/event-stream, application/json',
      },
      body: JSON.stringify({
        action: 'sendMessage',
        chatInput: text,
        sessionId: sessionId,
      }),
    }).then(function (res) {
      if (!res.ok) {
        throw new Error('Chat request failed (' + res.status + ')');
      }

      if (res.body && res.body.getReader) {
        return readStreamingResponse(res, callbacks);
      }

      return res.json().then(function (data) {
        var reply = extractReply(data);
        if (!reply) {
          throw new Error('Empty response');
        }
        if (callbacks.onChunk) {
          callbacks.onChunk(reply, reply);
        }
        if (callbacks.onDone) {
          callbacks.onDone(reply);
        }
        return reply;
      });
    });
  }

  toggleBtn.addEventListener('click', function () {
    setOpen(!isOpen);
  });

  closeBtn.addEventListener('click', function () {
    setOpen(false);
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && isOpen) {
      setOpen(false);
    }
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (isSending) return;

    var text = input.value.trim();
    if (!text) return;

    appendMessage('user', text);
    input.value = '';
    isSending = true;
    form.classList.add('chatbot__form--sending');

    var thinking = document.createElement('div');
    thinking.className = 'chatbot__message chatbot__message--assistant chatbot__message--thinking';
    thinking.textContent = 'Thinking…';
    messagesEl.appendChild(thinking);
    messagesEl.scrollTop = messagesEl.scrollHeight;

    var streamBubble = null;

    sendMessage(text, {
      onChunk: function (fullText) {
        if (!streamBubble) {
          thinking.remove();
          streamBubble = createStreamingBubble();
        }
        streamBubble.textContent = fullText;
        messagesEl.scrollTop = messagesEl.scrollHeight;
      },
      onDone: function (fullText) {
        if (!streamBubble) {
          thinking.remove();
          streamBubble = createStreamingBubble();
        }
        streamBubble.classList.remove('chatbot__message--streaming');
        streamBubble.removeAttribute('aria-busy');
        streamBubble.innerHTML = markdownToHtml(fullText);
        messagesEl.scrollTop = messagesEl.scrollHeight;
      },
    })
      .catch(function () {
        if (streamBubble) {
          streamBubble.remove();
        } else {
          thinking.remove();
        }
        appendMessage(
          'assistant',
          'Sorry — I could not reach the assistant right now. Please try again shortly, or [book a discovery call](http://178.104.254.165/#discovery-call).'
        );
      })
      .finally(function () {
        isSending = false;
        form.classList.remove('chatbot__form--sending');
        input.focus();
      });
  });

  input.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      form.requestSubmit();
    }
  });
})();
