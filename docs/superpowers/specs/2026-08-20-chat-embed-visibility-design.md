# Chat embed visibility — Design

**Date:** 2026-08-20  
**Status:** Approved in conversation (full treatment, orange launcher, logo avatar, session dismiss)

## Goal

Make the live GenAI chat embed hard to miss on the dark site, matching the Intercom-style pattern: bright circular launcher, notification badge, and a proactive welcome teaser.

## Decisions locked

| Decision | Choice |
|----------|--------|
| Scope | Live GenAI embed only (`js/chat-embed.js` + CSS) |
| Fallback n8n widget | Unchanged |
| Launcher color | Bright orange (screenshot-style contrast) |
| Teaser avatar | `images/logo-icon.png` |
| Teaser copy | “Ask me anything about our services & website” |
| Metadata | `Ask BCAI • Just now` |
| Dismiss persistence | `sessionStorage` — hide for the browser session after open or dismiss |
| Panel / iframe | Unchanged |

## Visual chrome

- **Launcher:** ~56px bright orange circle, soft drop shadow, centered logo icon (not Font Awesome comments).
- **Badge:** Red circle with white `1` at top-right of launcher; hidden when teaser is dismissed or chat is open.
- **Teaser:** White pill above/left of launcher — logo avatar, bold message, muted metadata, soft shadow. Small dismiss control for “dismiss without opening.”
- **Motion:** Teaser fades/slides in shortly after load; launcher hover lift.

## Behavior

1. On load, if session has not dismissed the nudge, show badge immediately and teaser after a short delay (~400ms).
2. Clicking the teaser (message area) or launcher opens the chat panel and dismisses the nudge for the session.
3. Clicking the teaser dismiss control hides teaser + badge without opening chat.
4. While chat is open, teaser and badge stay hidden.
5. Closing the chat does not re-show the nudge in the same session.

## Out of scope

- Restyling the n8n Ask BCAI widget
- Changing iframe chat UX / greeting inside GenAI
- Cross-visit persistence (localStorage)
- New headshot assets
