(function () {
  const cfg = window.PROPERTY_BOT_CONFIG || {};
  const gate = document.getElementById("gate");
  const app = document.getElementById("app");
  const chatEmbed = document.getElementById("chat-embed");
  const gateForm = document.getElementById("gate-form");
  const gateError = document.getElementById("gate-error");
  const chatForm = document.getElementById("chat-form");
  const messageInput = document.getElementById("message");
  const messages = document.getElementById("messages");
  const results = document.getElementById("results");
  const resultsHeading = document.getElementById("results-heading");
  const resultsSubhead = document.getElementById("results-subhead");
  const modeSale = document.getElementById("mode-sale");
  const modeRent = document.getElementById("mode-rent");
  const resultsPager = document.getElementById("results-pager");
  const pagePrev = document.getElementById("page-prev");
  const pageNext = document.getElementById("page-next");
  const pageStatus = document.getElementById("page-status");
  const suggestionsEl = document.getElementById("suggestions");
  const startAgainBtn = document.getElementById("start-again");
  const chatToggle = document.getElementById("chat-toggle");
  const chatClose = document.getElementById("chat-close");
  const chatPanel = document.getElementById("chat-panel");
  const micBtn = document.getElementById("mic-btn");
  const heroMicBtn = document.getElementById("hero-mic-btn");
  const openChatCta = document.getElementById("open-chat-cta");
  const heroSearchForm = document.getElementById("hero-search-form");
  const heroSearchInput = document.getElementById("hero-search-input");
  const heroSearchSubmit = document.getElementById("hero-search-submit");
  const heroStartAgainBtn = document.getElementById("hero-start-again");
  const nearMeToggle = document.getElementById("near-me-toggle");

  const PAGE_SIZE = 10;
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition || null;

  const SUGGESTIONS_BY_MODE = {
    sale: [
      { label: "Under €300k", prompt: "properties under 300k" },
      { label: "City buy", prompt: "2 bed apartments in Limerick City" },
      { label: "Near UL", prompt: "homes near UL with parking" },
      { label: "Family", prompt: "3 bed house in Castletroy" },
    ],
    rent: [
      { label: "City let", prompt: "2 bed apartments in Limerick City" },
      { label: "Near UL", prompt: "house near UL" },
      { label: "Family let", prompt: "4 bed house" },
      { label: "City 1-bed", prompt: "1 bed apartment" },
    ],
  };

  let sessionId = newSessionId();
  let busy = false;
  let chatOpen = false;
  let marketMode = "sale"; // default: for sale only
  let nearMeOn = false; // UI-only preview for Distilled; no geolocation yet
  let lastQuery = "";
  let currentOffset = 0;
  let totalMatched = 0;
  let recognition = null;
  let listening = false;
  let speechGotFinal = false;
  let speechTargetInput = messageInput;
  let speechUseChat = true;

  function newSessionId() {
    return (
      crypto.randomUUID?.() ||
      `s-${Date.now()}-${Math.random().toString(16).slice(2)}`
    );
  }

  function apiUrl(path) {
    return `${String(cfg.apiBaseUrl || "").replace(/\/$/, "")}${path}`;
  }

  function isCompactChatViewport() {
    return window.matchMedia("(max-width: 700px)").matches;
  }

  function setChatOpen(open) {
    chatOpen = open;
    chatPanel.hidden = !open;
    chatToggle.setAttribute("aria-expanded", String(open));
    chatToggle.setAttribute("aria-label", open ? "Close chat" : "Open chat");
    if (open) {
      messageInput.focus();
    }
  }

  function renderSuggestions() {
    suggestionsEl.innerHTML = "";
    for (const item of SUGGESTIONS_BY_MODE[marketMode]) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "suggestion";
      btn.setAttribute("role", "listitem");
      btn.innerHTML = `<strong>${item.label}</strong>${item.prompt}`;
      btn.addEventListener("click", () => {
        if (busy) return;
        void submitPrompt(item.prompt);
      });
      suggestionsEl.appendChild(btn);
    }
  }

  function showResultsEmpty() {
    lastQuery = "";
    currentOffset = 0;
    totalMatched = 0;
    resultsPager.hidden = true;
    const marketLabel = marketMode === "rent" ? "rentals" : "homes for sale";
    resultsHeading.textContent = "Ready when you are";
    resultsSubhead.textContent = `Matching ${marketLabel} will appear in this list.`;
    const starters =
      marketMode === "sale"
        ? [
            { label: "Under €300k", prompt: "properties under 300k" },
            { label: "Castletroy", prompt: "3 bed Castletroy" },
            { label: "Near UL", prompt: "homes near UL with parking" },
          ]
        : [
            { label: "City 2-bed", prompt: "2 bed apartments in Limerick City" },
            { label: "Under €1,500", prompt: "rentals under 1500" },
            { label: "Dooradoyle", prompt: "2 bed Dooradoyle" },
          ];
    results.innerHTML = `
      <div class="listings-empty">
        <div class="listings-empty__visual" aria-hidden="true">
          <span class="listings-empty__house"></span>
          <span class="listings-empty__house listings-empty__house--mid"></span>
          <span class="listings-empty__house"></span>
        </div>
        <h3>No search yet</h3>
        <p class="muted">
          Tap a starter or type in the search bar above — results show up here like a Daft results list.
        </p>
        <div class="listings-empty__prompts">
          ${starters
            .map(
              (s) => `
            <button type="button" class="listings-empty__prompt" data-empty-prompt="${s.prompt}">
              <span class="listings-empty__prompt-label">${s.label}</span>
              <span class="listings-empty__prompt-text">${s.prompt}</span>
            </button>`
            )
            .join("")}
        </div>
      </div>
    `;
    results.querySelectorAll("[data-empty-prompt]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const text = btn.getAttribute("data-empty-prompt") || "";
        if (!text || busy) return;
        if (heroSearchInput) heroSearchInput.value = text;
        void submitPrompt(text, { useChat: false });
      });
    });
  }

  function formatPrice(card) {
    const value = `€${Number(card.price).toLocaleString("en-IE")}`;
    return card.listing_type === "rent" ? `${value} per month` : value;
  }

  function updatePager(shownCount) {
    if (!totalMatched) {
      resultsPager.hidden = true;
      return;
    }
    const start = totalMatched === 0 ? 0 : currentOffset + 1;
    const end = currentOffset + shownCount;
    pageStatus.textContent = `Showing ${start}–${end} of ${totalMatched}`;
    pagePrev.disabled = currentOffset <= 0 || busy;
    pageNext.disabled = end >= totalMatched || busy;
    resultsPager.hidden = totalMatched <= PAGE_SIZE;
  }

  function setNearMe(on) {
    nearMeOn = Boolean(on);
    if (!nearMeToggle) return;
    nearMeToggle.setAttribute("aria-pressed", String(nearMeOn));
  }

  function setMarketMode(mode) {
    if (mode !== "sale" && mode !== "rent") return;
    if (mode === marketMode) return;
    marketMode = mode;
    modeSale.setAttribute("aria-pressed", String(mode === "sale"));
    modeRent.setAttribute("aria-pressed", String(mode === "rent"));
    renderSuggestions();
    // New market = new search: drop chat history, filters, and results.
    void resetSession({
      keepChatOpen: true,
      notice:
        mode === "rent"
          ? "Switched to rentals — starting a new search."
          : "Switched to for sale — starting a new search.",
    });
  }

  function renderCards(cards, meta) {
    const list = Array.isArray(cards) ? cards : [];
    totalMatched = Number(meta?.total_matched || list.length);
    currentOffset = Number(meta?.offset || 0);
    const marketLabel = marketMode === "rent" ? "rentals" : "properties for sale";

    if (!list.length) {
      resultsHeading.textContent = `0 ${marketLabel} found`;
      resultsSubhead.textContent = "Try relaxing price, beds, or area in the chat.";
      resultsPager.hidden = true;
      results.innerHTML = `
        <div class="listings-zero">
          <h3>No matching ${marketLabel}</h3>
          <p class="muted">Nothing in this demo index matched that search.</p>
        </div>
      `;
      return;
    }

    resultsHeading.textContent = `${totalMatched} ${marketLabel} found`;
    resultsSubhead.textContent = "";
    results.innerHTML = "";

    for (const card of list) {
      const article = document.createElement("article");
      article.className = "listing";

      const media = document.createElement("div");
      media.className = "listing__media";

      const images = Array.isArray(card.image_urls)
        ? card.image_urls.filter(Boolean)
        : card.thumbnail_url
          ? [card.thumbnail_url]
          : [];
      let imageIndex = 0;

      const img = document.createElement("img");
      img.alt = card.title || "Property photo";
      img.loading = "lazy";
      img.decoding = "async";
      img.addEventListener("error", () => {
        if (images.length <= 1) {
          img.remove();
          media.classList.add("listing__media--fallback");
          return;
        }
        images.splice(imageIndex, 1);
        if (!images.length) {
          img.remove();
          media.classList.add("listing__media--fallback");
          return;
        }
        imageIndex = imageIndex % images.length;
        showImage();
      });

      const openLink = document.createElement("a");
      openLink.className = "listing__media-link";
      openLink.href = card.url;
      openLink.target = "_blank";
      openLink.rel = "noopener noreferrer";
      openLink.setAttribute(
        "aria-label",
        `View ${card.title || "property"} on Daft`
      );

      const badge = document.createElement("span");
      badge.className = "listing__badge";
      badge.textContent = card.listing_type === "rent" ? "To Let" : "For Sale";

      const counter = document.createElement("span");
      counter.className = "listing__counter";

      const prevBtn = document.createElement("button");
      prevBtn.type = "button";
      prevBtn.className = "listing__nav listing__nav--prev";
      prevBtn.setAttribute("aria-label", "Previous photo");
      prevBtn.innerHTML =
        '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M15.4 7.4 10.8 12l4.6 4.6L14 18l-6-6 6-6z"/></svg>';

      const nextBtn = document.createElement("button");
      nextBtn.type = "button";
      nextBtn.className = "listing__nav listing__nav--next";
      nextBtn.setAttribute("aria-label", "Next photo");
      nextBtn.innerHTML =
        '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="m8.6 7.4 4.6 4.6-4.6 4.6L10 18l6-6-6-6z"/></svg>';

      function showImage() {
        if (!images.length) return;
        img.src = images[imageIndex];
        counter.textContent = `${imageIndex + 1} / ${images.length}`;
        const multi = images.length > 1;
        prevBtn.hidden = !multi;
        nextBtn.hidden = !multi;
        counter.hidden = !multi;
      }

      function step(delta) {
        if (images.length <= 1) return;
        imageIndex = (imageIndex + delta + images.length) % images.length;
        showImage();
      }

      prevBtn.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        step(-1);
      });
      nextBtn.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        step(1);
      });

      if (images.length) {
        media.appendChild(img);
        media.appendChild(openLink);
        showImage();
      } else {
        media.classList.add("listing__media--fallback");
        media.appendChild(openLink);
        prevBtn.hidden = true;
        nextBtn.hidden = true;
        counter.hidden = true;
      }

      media.appendChild(badge);
      media.appendChild(counter);
      media.appendChild(prevBtn);
      media.appendChild(nextBtn);

      const body = document.createElement("div");
      body.className = "listing__body";

      const price = document.createElement("p");
      price.className = "listing__price";
      price.textContent = formatPrice(card);

      const address = document.createElement("h3");
      address.className = "listing__address";
      address.textContent = card.title || card.address;

      const metaLine = document.createElement("p");
      metaLine.className = "listing__meta";
      const bits = [];
      if (card.beds != null) bits.push(`${card.beds} Bed`);
      if (card.baths != null) bits.push(`${card.baths} Bath`);
      if (card.property_type) {
        bits.push(
          card.property_type.charAt(0).toUpperCase() + card.property_type.slice(1)
        );
      }
      metaLine.innerHTML = bits.map((b) => `<span>${b}</span>`).join("");

      const location = document.createElement("p");
      location.className = "listing__meta";
      location.textContent = card.address;

      body.appendChild(price);
      body.appendChild(address);
      body.appendChild(metaLine);
      body.appendChild(location);

      if (card.why_matched) {
        const why = document.createElement("p");
        why.className = "listing__why";
        why.textContent = card.why_matched;
        body.appendChild(why);
      }

      const cta = document.createElement("a");
      cta.className = "listing__cta";
      cta.href = card.url;
      cta.target = "_blank";
      cta.rel = "noopener noreferrer";
      cta.textContent = "View on Daft →";
      body.appendChild(cta);

      article.appendChild(media);
      article.appendChild(body);
      results.appendChild(article);
    }

    updatePager(list.length);
  }

  async function resetSession({ keepChatOpen = true, notice = "" } = {}) {
    const previous = sessionId;
    sessionId = newSessionId();
    lastQuery = "";
    currentOffset = 0;
    totalMatched = 0;
    setNearMe(false);
    messages.innerHTML = "";
    messageInput.value = "";
    if (heroSearchInput) heroSearchInput.value = "";
    showResultsEmpty();
    try {
      await fetch(apiUrl("/session/reset"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: previous, token: cfg.demoToken }),
      });
    } catch (_) {
      // Client-side session id rotation is enough if the reset call fails.
    }
    if (notice) {
      addBubble("bot", notice);
    }
    if (keepChatOpen) {
      setChatOpen(true);
      messageInput.focus();
    } else {
      setChatOpen(false);
      if (heroSearchInput) heroSearchInput.focus();
    }
  }

  function addBubble(role, text) {
    const el = document.createElement("div");
    el.className = `bubble ${role}`;
    el.textContent = text;
    messages.appendChild(el);
    messages.scrollTop = messages.scrollHeight;
    return el;
  }

  async function sendMessage(text, { offset = 0, quiet = false } = {}) {
    if (!quiet) {
      addBubble("user", text);
    }
    const botBubble = quiet ? null : addBubble("bot", "");
    let narrative = "";
    lastQuery = text;
    currentOffset = offset;

    const response = await fetch(apiUrl("/chat"), {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "text/event-stream" },
      body: JSON.stringify({
        session_id: sessionId,
        message: text,
        token: cfg.demoToken,
        listing_type: marketMode,
        offset,
        page_size: PAGE_SIZE,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      if (botBubble) botBubble.textContent = `Error ${response.status}: ${errText}`;
      else addBubble("bot", `Error ${response.status}: ${errText}`);
      return false;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const chunks = buffer.split("\n\n");
      buffer = chunks.pop() || "";
      for (const chunk of chunks) {
        const lines = chunk.split("\n");
        let eventName = "message";
        const dataLines = [];
        for (const line of lines) {
          if (line.startsWith("event:")) eventName = line.slice(6).trim();
          if (line.startsWith("data:")) dataLines.push(line.slice(5).trim());
        }
        if (!dataLines.length) continue;
        const payload = JSON.parse(dataLines.join("\n"));
        if (eventName === "token") {
          if (botBubble) {
            narrative += payload.text || "";
            botBubble.textContent = narrative;
            messages.scrollTop = messages.scrollHeight;
          }
        } else if (eventName === "results") {
          renderCards(payload.cards || [], payload);
        }
      }
    }
    return true;
  }

  async function submitPrompt(text, { useChat = true } = {}) {
    if (busy) return;
    stopListening();
    busy = true;
    syncMicEnabled();
    const sendBtn = chatForm.querySelector("button[type='submit']");
    sendBtn.disabled = true;
    if (heroSearchSubmit) heroSearchSubmit.disabled = true;
    if (useChat) {
      messageInput.value = "";
      if (!chatOpen) setChatOpen(true);
      if (heroSearchInput) heroSearchInput.value = text;
    } else if (heroSearchInput) {
      heroSearchInput.value = text;
    }
    let searchOk = false;
    try {
      searchOk =
        (await sendMessage(text, { offset: 0, quiet: !useChat })) === true;
    } catch (err) {
      if (useChat) {
        addBubble("bot", `Request failed: ${err}`);
      } else {
        resultsHeading.textContent = "Search failed";
        resultsSubhead.textContent = String(err);
      }
    } finally {
      busy = false;
      sendBtn.disabled = false;
      if (heroSearchSubmit) heroSearchSubmit.disabled = false;
      syncMicEnabled();
      updatePager(
        Math.min(PAGE_SIZE, Math.max(0, totalMatched - currentOffset))
      );
      if (!useChat) {
        results.scrollIntoView({ behavior: "smooth", block: "start" });
        if (heroSearchInput) heroSearchInput.focus();
      } else if (searchOk && isCompactChatViewport()) {
        setChatOpen(false);
        results.scrollIntoView({ behavior: "smooth", block: "start" });
      } else {
        messageInput.focus();
      }
    }
  }

  async function goToPage(nextOffset) {
    if (busy || !lastQuery) return;
    if (nextOffset < 0) return;
    busy = true;
    syncMicEnabled();
    pagePrev.disabled = true;
    pageNext.disabled = true;
    try {
      await sendMessage(lastQuery, { offset: nextOffset, quiet: true });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      addBubble("bot", `Paging failed: ${err}`);
    } finally {
      busy = false;
      syncMicEnabled();
      updatePager(
        Math.min(PAGE_SIZE, Math.max(0, totalMatched - currentOffset))
      );
    }
  }

  function unlockDemo() {
    gate.hidden = true;
    app.hidden = false;
    chatEmbed.hidden = false;
    gateError.hidden = true;
    showResultsEmpty();
    setChatOpen(false);
    if (heroSearchInput) heroSearchInput.focus();
  }

  gateForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const password = document.getElementById("password").value;
    if (password === cfg.pagePassword) {
      unlockDemo();
    } else {
      gateError.hidden = false;
    }
  });

  chatToggle.addEventListener("click", () => setChatOpen(!chatOpen));
  chatClose.addEventListener("click", () => setChatOpen(false));
  if (openChatCta) {
    openChatCta.addEventListener("click", () => setChatOpen(true));
  }
  if (heroSearchForm && heroSearchInput) {
    heroSearchForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const text = heroSearchInput.value.trim();
      if (!text || busy) return;
      void submitPrompt(text, { useChat: false });
    });
  }
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && chatOpen) setChatOpen(false);
  });

  startAgainBtn.addEventListener("click", () => {
    if (busy) return;
    void resetSession();
  });
  if (heroStartAgainBtn) {
    heroStartAgainBtn.addEventListener("click", () => {
      if (busy) return;
      void resetSession({ keepChatOpen: false });
    });
  }

  modeSale.addEventListener("click", () => {
    if (busy || marketMode === "sale") return;
    setMarketMode("sale");
  });
  modeRent.addEventListener("click", () => {
    if (busy || marketMode === "rent") return;
    setMarketMode("rent");
  });
  if (nearMeToggle) {
    nearMeToggle.addEventListener("click", () => {
      setNearMe(!nearMeOn);
    });
  }

  pagePrev.addEventListener("click", () => {
    void goToPage(Math.max(0, currentOffset - PAGE_SIZE));
  });
  pageNext.addEventListener("click", () => {
    void goToPage(currentOffset + PAGE_SIZE);
  });

  chatForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const text = messageInput.value.trim();
    if (!text) return;
    await submitPrompt(text);
  });

  function setListening(on) {
    listening = on;
    const buttons = [
      { btn: micBtn, listeningClass: "composer__mic--listening" },
      { btn: heroMicBtn, listeningClass: "search-panel__mic--listening" },
    ];
    for (const { btn, listeningClass } of buttons) {
      if (!btn) continue;
      btn.classList.toggle(listeningClass, on);
      btn.setAttribute("aria-pressed", String(on));
      btn.setAttribute(
        "aria-label",
        on ? "Stop listening" : "Speak your search"
      );
      btn.title = on ? "Stop listening" : "Speak your search";
    }
  }

  function stopListening() {
    if (recognition && listening) {
      try {
        recognition.stop();
      } catch (_err) {
        /* already stopped */
      }
    }
    setListening(false);
  }

  function syncMicEnabled() {
    if (!SpeechRecognition) return;
    for (const btn of [micBtn, heroMicBtn]) {
      if (btn) btn.disabled = busy;
    }
  }

  function bindMicButton(btn, { targetInput, useChat }) {
    if (!btn || !recognition) return;
    btn.addEventListener("click", () => {
      if (busy) return;
      if (listening) {
        stopListening();
        return;
      }
      speechTargetInput = targetInput;
      speechUseChat = useChat;
      try {
        recognition.start();
      } catch (_err) {
        /* already started */
      }
    });
  }

  function setupSpeech() {
    const hasMicUi = Boolean(micBtn || heroMicBtn);
    if (!hasMicUi) return;
    if (!SpeechRecognition) {
      if (micBtn) micBtn.hidden = true;
      if (heroMicBtn) heroMicBtn.hidden = true;
      return;
    }

    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-IE";

    recognition.addEventListener("start", () => {
      speechGotFinal = false;
      setListening(true);
    });

    recognition.addEventListener("result", (event) => {
      let interim = "";
      let finalText = "";
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const piece = event.results[i][0].transcript;
        if (event.results[i].isFinal) finalText += piece;
        else interim += piece;
      }
      const target = speechTargetInput || messageInput;
      if (!target) return;
      if (finalText.trim()) {
        speechGotFinal = true;
        target.value = finalText.trim();
      } else if (interim.trim()) {
        target.value = interim.trim();
      }
    });

    recognition.addEventListener("error", (event) => {
      setListening(false);
      if (event.error === "not-allowed") {
        const notice =
          "Microphone permission is blocked. Allow the mic in the browser, or type your search.";
        if (speechUseChat) {
          addBubble("bot", notice);
        } else if (resultsSubhead) {
          resultsSubhead.textContent = notice;
        }
      }
    });

    recognition.addEventListener("end", () => {
      const target = speechTargetInput || messageInput;
      const text = target ? target.value.trim() : "";
      const shouldSend = speechGotFinal && Boolean(text) && !busy;
      setListening(false);
      if (shouldSend) {
        void submitPrompt(text, { useChat: speechUseChat });
      }
    });

    bindMicButton(micBtn, { targetInput: messageInput, useChat: true });
    bindMicButton(heroMicBtn, {
      targetInput: heroSearchInput,
      useChat: false,
    });
  }

  setupSpeech();
  renderSuggestions();
  showResultsEmpty();
})();