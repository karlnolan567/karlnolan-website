# Pay-when-satisfied — site spec

**Date:** 2026-09-20
**Status:** Destination of [You don't pay until you're 100% satisfied](https://github.com/karlnolan567/karlnolan-website/issues/35). Implement in [Put pay-when-satisfied on the live site](https://github.com/karlnolan567/karlnolan-website/issues/40). No HTML in this ticket.

**Prototype (throwaway, visual source for the home card):** `prototype-pay-when-satisfied.html?variant=B`

## Goal

Put **You don't pay until you're 100% satisfied with the solution** front and center on the home hero, keep the live ROI gate, repeat the same short sentence on Engineering and the two playbook pages, and strip public euro floors and paid scoping from the offer.

## Decisions locked

| Topic | Choice |
|--------|--------|
| Public sentence | **You don't pay until you're 100% satisfied with the solution.** |
| Word "guarantee" | Never in visitor-facing words (pages, meta, chatbot) |
| Home treatment | Glass card, variant B, under the save-time line |
| Quiet label on the card | `// 100% satisfaction` |
| ROI gate | Keep: cost, margin, or hours; straight talk on what is worth building |
| "Tested before you run it" | Keep |
| Applies to | **Build** only |
| Deposit / progress invoices | None on the Build. Invoice after they are 100% satisfied with the solution |
| Who decides satisfied | The client, about the delivered Build |
| If not satisfied | Rework the agreed Build until they are, or they pay nothing for that Build |
| Bad-faith fence | Spec only (they stop engaging, or they want a different product than quoted). Not on the hero, not in the bot |
| Discovery / feasibility | Free. No scoping fee on the public offer (may return later; not on the site now) |
| Build price | Priced per job on the discovery call. No public **€8,000**, **€900**, or **€250/mo** |
| Support | Optional after go-live, quoted case by case |
| Pages with the sentence | `index.html`, `ai-engineering.html`, `po-sales-order.html`, `smart-inbox.html` |
| Inner-page treatment | The **sentence**, not the home glass card |
| Not on | Header, About, Client results, workshops, Support, `scoping.html` |
| Six-card ROI section | Do not ship (`#how-automation-pays`) |
| Ask BCAI | Quote the sentence on price / payment / risk / "what if it doesn't work" only |

## Home hero (`index.html`)

First-screen order (do not reorder):

1. H1: Building software you can trust. / Targeted AI only where it makes sense.
2. Save time and money, and also reduce errors - without losing control of data or delivery.
3. Glass card (`glass-panel card`), centred, matching the prototype:
   - Mono: `// 100% satisfaction` (`text-mono-label--green`)
   - Sentence as card title weight: **You don't pay until you're 100% satisfied with the solution.**
4. ROI lead (unchanged meaning): pick one defined problem, tie it to a cost, margin, or hours metric, design through test, automated tests in the build. Straight talk on what is worth building, and what is not.
5. Proof line: `27+ years delivering software · tested before you run it`
6. Path line (rewrite; paid scoping and "pay at quote" are gone):

   **Free discovery call → design → a build quote → implement and test → handover. Optional support, quoted case by case.**

7. Existing CTAs.

Visual: reuse existing tokens. No site-wide banner. No new design system. Mobile: the card must sit in the first screen under the save-time line, as in the prototype.

## Inner pages (sentence only)

Same sentence, not the glass card. Place in the hero/lede so it is visible without scrolling past the H1.

### `ai-engineering.html`

After the existing lead ("We prove it before you run it."), add the sentence as body copy (not a second H1).

Replace the footer line that says "Quote gate and paid scoping" with How We Work, no scoping mention.

### `po-sales-order.html` and `smart-inbox.html`

- Add the sentence in the hero, under the current lede.
- Strip **€8,000**, **€8,000 + VAT**, and **€900** from title, meta, OG, hero, and the `#price` section.
- Retarget `#price`: not a euro floor. Heading in the "priced per job" family, e.g. **Priced on the discovery call**. Include the pay-when-satisfied sentence or a pointer that they do not pay the Build until they are 100% satisfied with the solution.
- Drop "No separate €900 scoping day" (there is no scoping offer). Feasibility is free, inside discovery and design.
- Playbook footer links on home: not "Fixed pilot from €8,000". Use **See the playbook** (or equivalent) plus Client results as today.

## How Engagements Work (`index.html` `#engagement`)

Remove the paid-scoping intro and the `scoping.html` link.

Keep the three steps. Step 3: drop **€250/mo**. Optional support after go-live is quoted case by case.

Discovery-call bullets: drop any path that sounds like they pay at quote. After "If it's a fit": design → a build quote → implement and test → handover. They do not pay the Build until they are 100% satisfied with the solution.

## `scoping.html`

Leave the public offer:

- Remove every inbound link (`index.html`, `ai-engineering.html`, chatbot knowledge, any other public page).
- Keep `noindex` (already present). Do not add it to nav.
- Do not put the pay-when-satisfied sentence on this page.
- Do not delete the file in this change (old URLs can sit unlisted). Do not advertise it.

## Ask BCAI (`chatbot-knowledge/bot-guardrails.md` and synced knowledge)

When the visitor asks about **price, payment, risk, or "what if it doesn't work"**, quote the locked sentence, then: Build only; priced per job; discovery and the look before the quote are free; [Book a call](https://www.bespoke-ai.ie/#discovery-call).

Must not:

- Lead every answer with the line
- Say "guarantee"
- Promise a CSAT lift, extra revenue, or a euro of ROI
- Quote **€8,000**, **€900**, **€250/mo**, or any unpublished price
- Mention or sell a paid scoping fee
- Apply pay-when-satisfied to workshops or Support
- Narrate the bad-faith fence

Sync `chatbot-knowledge/website-home.md`, `po-sales-order.md`, `smart-inbox.md` (and regenerate from HTML if that is the usual pipeline).

## Tests

Extend `tests/public-offer/contracts.test.js` (or add a focused file) so CI fails if:

- Home hero lacks the locked sentence
- Home still contains **€250/mo**, **€8,000**, paid scoping, or `scoping.html`
- `ai-engineering.html`, `po-sales-order.html`, `smart-inbox.html` lack the sentence
- Playbook pages still publish **€8,000** or **€900**
- Guardrails still publish those floors or a CSAT/euro-ROI promise as something the bot may invent
- Visitor-facing copy uses the word **guarantee** for this offer

Existing em-dash scan still applies to HTML / chatbot / js / css.

## Bad-faith fence (spec only)

Not for the hero, inner-page sentence, or Ask BCAI.

Karl reworks the **agreed Build** until the client is 100% satisfied with that solution, or they pay nothing for that Build. The fence is only:

- they stop engaging, or
- they want a different product than the quoted Build.

Do not write this on the site. No public terms paragraph. The fence lives in this spec and on the build quote. Ask BCAI does not narrate it.

## Out of scope for implementation

- Shipping the six-card ROI journey
- Header / About / Client results / workshops carrying the sentence
- Reopening other wayfinder maps
- Promising a euro of ROI or a CSAT lift
- Invoice/VAT dating mechanics
- Folding `prototype-pay-when-satisfied.html` into production (leave it throwaway; it is not a public page)

## Success

A visitor on home sees the glass card under the save-time line, still reads the ROI gate, and is not shown **€8,000**, **€900**, **€250/mo**, or paid scoping. Engineering and both playbook pages carry the same sentence. Ask BCAI may quote it on price/payment/risk questions only.
