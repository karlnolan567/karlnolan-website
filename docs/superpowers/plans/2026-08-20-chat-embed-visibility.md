# Chat embed visibility Implementation Plan

> **For agentic workers:** Implement task-by-task. Steps use checkbox syntax. Do not push; user will test locally first. Do not commit unless the user asks.

**Goal:** Make the GenAI chat embed launcher highly visible with an orange FAB, badge, and proactive teaser.

**Architecture:** Extend `js/chat-embed.js` markup/behavior and `css/styles.css` styles only. Session dismiss via `sessionStorage`. Iframe panel unchanged.

**Tech Stack:** Vanilla JS, existing site CSS tokens / patterns.

## Global Constraints

- Touch only the live embed path (`chat-embed.js` + related CSS); leave `chatbot.js` alone.
- Teaser copy: “Ask me anything about our services & website”; metadata “Ask BCAI • Just now”.
- Avatar/launcher icon: `images/logo-icon.png`.
- Bright orange launcher; red `1` badge.
- Dismiss for browser session only (`sessionStorage`).
- No git push; no commit unless requested.
- Bump `SITE.partialVersion` (and template if needed) so cache-bust picks up JS/CSS.

---

## File map

| File | Responsibility |
|------|----------------|
| `js/chat-embed.js` | Teaser/badge markup, open/dismiss, sessionStorage |
| `css/styles.css` | Orange launcher, badge, teaser pill, motion |
| `js/site-config.js` | Bump `partialVersion` |
| `js/site-config.template.js` | Keep version in sync if present |

---

### Task 1: Teaser + badge markup and session dismiss

**Files:** `js/chat-embed.js`

- [ ] Add teaser pill (avatar, copy, metadata, dismiss button) and badge element to root HTML
- [ ] Use logo image on launcher instead of FA comments icon
- [ ] Wire `sessionStorage` key (e.g. `bcai-chat-nudge-dismissed`)
- [ ] Show teaser after short delay if not dismissed; hide on open / dismiss
- [ ] Clicking teaser body opens chat; dismiss button only hides nudge

### Task 2: Visible styles

**Files:** `css/styles.css`

- [ ] Restyle `.chat-embed__toggle` as bright orange circle with logo sizing
- [ ] Add badge and teaser styles (white pill, shadow, layout)
- [ ] Add enter animation; ensure mobile doesn’t overflow viewport
- [ ] Hide teaser/badge when chat panel is open (class or `[hidden]`)

### Task 3: Cache bust + local verify

**Files:** `js/site-config.js`, `js/site-config.template.js`

- [ ] Bump `partialVersion`
- [ ] Serve with `python3 -m http.server 8765` and verify launcher, teaser, dismiss, open, session hide
