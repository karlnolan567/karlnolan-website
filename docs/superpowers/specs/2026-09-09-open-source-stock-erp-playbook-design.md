# Open-source stock ERP playbook — Design

**Date:** 2026-09-09  
**Status:** Approved in conversation; awaiting user review of this spec  
**Repo:** `karlnolan567/karlnolan-website` (bespoke-ai.ie)

## Goal

Add a fourth home-page “Where to Start” playbook so visitors still running sales and inventory on spreadsheets, paper, or manual tracking can see that Bespoke AI installs and configures an affordable open-source ERP — without implying they already have a working system of record.

## Problem

The home page currently sells automation **into systems you already have**. The priced PO → sales order playbook assumes an ERP. Teams with no ERP yet (or with stock still living in spreadsheets and paper) have no matching offer on the page.

## Decisions locked

| Decision | Choice |
|----------|--------|
| Where | Home `#where-to-start` only — fourth `playbook-card` after Supplier Verification |
| Depth | Card only (same skeleton as Supplier Verification) |
| Product | Generic “open-source ERP”; system chosen on the discovery call |
| Audience | Anyone whose sales and inventory still live in spreadsheets, paper, or manual tracking. **Not a fit** if a working ERP is already in place |
| Deliverable | Install, configure, migrate current stock/sales records, and train the team to run it day to day |
| Price / timeline | None on the card — quoted after discovery |
| Footer | Book a discovery call → `#discovery-call` |
| Layout | Keep existing `grid-3`; fourth card wraps onto its own row. No 2×2 reflow |
| Chatbot | Mirror the same copy in `chatbot-knowledge/website-home.md` |
| Later automation | PO → sales order stays a separate offer once an ERP exists |

## Placement

Home `#where-to-start` grid, **after** the Supplier Verification card.

Section intro stays unchanged: PO → sales order and smart inbox remain the priced pilots; this card is quoted on the discovery call, same as supplier verification.

No new page, nav item, or hero line.

## Card content (verbatim)

**Tag:** Inventory Operations (`card-tag--teal`)  
**Title:** Open-source stock ERP

| Field | Copy |
|-------|------|
| Who it's for | Owners and ops leads still running sales and inventory on spreadsheets, paper, or manual tracking. Not a fit if a working ERP is already in place. |
| What you get | We install and configure an affordable open-source ERP, migrate your current stock and sales records, and train the team to run it day to day. The system is chosen on the discovery call; quote after we see how you work today. |
| Typical outcome | Spreadsheets, paper, and manual sales/inventory tracking replaced by one live stock system the team can run themselves. |
| Footer | Book a discovery call (link to `#discovery-call`, same `link-brand` treatment as other playbook footers, with the existing arrow icon) |

Do not add a Client results link. There is no write-up yet.

Do not name a vendor (Odoo, ERPNext, Dolibarr, etc.). Do not invent a go-live week-count or a euro figure.

## Markup and layout

Reuse the existing Supplier Verification article markup:

- `article.glass-panel.glass-panel-hover.card.playbook-card`
- `span.card-tag.card-tag--teal`
- `h3.card-title`
- `dl.card-dl.playbook-dl` with the three `dt`/`dd` pairs (`Typical outcome` keeps `outcome-label` / `outcome`)
- `p.playbook-card__footer` with a single discovery-call link

`#where-to-start .grid-3` already uses a three-column subgrid at desktop. The fourth card must wrap onto the second row (left column). No CSS change unless verification shows the subgrid (`grid-template-rows: repeat(6, auto)` + `grid-row: span 6`) breaking the wrapped card — in that case, fix only what is required for the fourth card to sit cleanly; do not reflow to 2×2.

## Chatbot knowledge

Update `chatbot-knowledge/website-home.md` in the **Where to Start** section so Ask BCAI can describe this offer with the same words as the card (tag, title, three fields, footer meaning).

Edit that file by hand. Do **not** run `python3 scripts/html_to_knowledge_md.py --force` for this change — `--force` overwrites hand-tuned knowledge files.

Do not add this offer to `what-we-automate.md`, case-study knowledge, or bot guardrails unless a later change expands scope.

## Out of scope

- New landing page, nav, or hero “other playbooks” mention
- `what-we-automate.html`, `about.html`, case studies, PO → sales order, smart inbox
- Named ERP product, price, or typical-weeks claim
- Client results write-up
- Treating this as a priced fixed-scope pilot like PO → sales order

## Success criteria

1. Home “Where to Start” shows four playbook cards; Open-source stock ERP is last.
2. Copy matches the table above; footer scrolls to `#discovery-call`.
3. Desktop (≥1024px): first three cards stay on row one; the new card wraps to row two.
4. Tablet (~768px): two-column wrap; mobile: stacked. No overlap or clipped footer.
5. `chatbot-knowledge/website-home.md` matches the card; no extra claims.
6. Existing three playbooks and their links are unchanged.

## Spec self-review (2026-09-09)

- No TBD/placeholder sections.
- Audience, deliverable, and “not a fit if a working ERP exists” are stated once and used in the card copy.
- Chatbot sync is in scope for home knowledge only; `--force` regenerate is explicitly out.
- Layout risk (where-to-start subgrid + fourth card) is named; default is no CSS change.
- Scope is one home card plus one knowledge file — suitable for a single implementation plan.
