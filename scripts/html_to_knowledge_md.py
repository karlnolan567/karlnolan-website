#!/usr/bin/env python3
"""Extract main content from static HTML pages into chatbot knowledge markdown
for the GCP Ask BCAI assistant (not an n8n runtime).

By default, existing knowledge files are kept (hand-tuned copy). Pass --force
to overwrite them from HTML. Retired files (hidden workshops/training) are
always removed.
"""

from __future__ import annotations

import html
import re
import sys
from pathlib import Path

from bs4 import BeautifulSoup, NavigableString, Tag

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "chatbot-knowledge"
SITE = "https://www.bespoke-ai.ie"

# Public commercial pages only. Workshops and training stay off the corpus
# while they are hidden from the live site.
PAGES = [
    ("index.html", "website-home.md", "Bespoke AI — Home Page"),
    ("what-we-automate.html", "what-we-automate.md", "What We Automate"),
    ("case-studies.html", "case-studies.md", "Case Studies"),
    ("po-sales-order.html", "po-sales-order.md", "PO → Sales Order Pilot"),
    ("smart-inbox.html", "smart-inbox.md", "Smart Inbox Pilot"),
]

RETIRED = (
    "workshops.md",
    "workshop-1-foundations.md",
    "workshop-2-engineering.md",
    "workshop-3-automation.md",
)

SKIP_CLASSES = {
    "skip-link",
    "bg-effects",
    "contact-form-honey",
    "mobile-menu",
    "mobile-menu-btn",
    "profile-photo-fallback",
    "profile-avatar-fallback",
    "footer-brand__mark",
    "hidden",
    "announce-bar",
    "case-study-shot__hint",
}

SKIP_IDS = {
    "workshop-announce",
}

_current_page = "index.html"


def abs_href(href: str) -> str:
    href = html.unescape(href).strip()
    if href.startswith(("mailto:", "tel:", "https://", "http://")):
        return href
    if href.startswith("/#"):
        return SITE + href
    if href.startswith("#"):
        page = "" if _current_page == "index.html" else _current_page
        return f"{SITE}/{page}{href}"
    if href.startswith("/"):
        return SITE + href
    return f"{SITE}/{href}"


def text_of(node: Tag | NavigableString) -> str:
    if isinstance(node, NavigableString):
        return str(node)
    if node.name == "script" or node.name == "style":
        return ""
    classes = set(node.get("class") or [])
    node_id = node.get("id")
    if (
        classes & SKIP_CLASSES
        or node_id in SKIP_IDS
        or node.get("hidden") is not None
        or node.get("aria-hidden") == "true"
    ):
        return ""
    if node.name in {"h1", "h2", "h3", "h4"}:
        level = int(node.name[1])
        inner = "".join(text_of(c) for c in node.children).strip()
        return f"\n{'#' * level} {inner}\n\n"
    if node.name == "p":
        inner = inline(node).strip()
        return f"{inner}\n\n" if inner else ""
    if node.name == "li":
        inner = inline(node).strip()
        return f"- {inner}\n" if inner else ""
    if node.name in {"ul", "ol"}:
        return "".join(text_of(c) for c in node.children) + "\n"
    if node.name == "dl":
        return render_dl(node)
    if node.name == "a" and node.get("href"):
        label = "".join(text_of(c) for c in node.children).strip() or node["href"]
        return f"[{label}]({abs_href(node['href'])})"
    if node.name == "strong":
        inner = inline(node).strip()
        return f"**{inner}**" if inner else ""
    if node.name == "br":
        return "\n"
    if node.name == "img":
        alt = node.get("alt", "").strip()
        return f"[image: {alt}]\n" if alt else ""
    if isinstance(node, Tag):
        return "".join(text_of(c) for c in node.children)
    return ""


def inline(node: Tag) -> str:
    parts: list[str] = []
    for child in node.children:
        if isinstance(child, NavigableString):
            parts.append(re.sub(r"\s+", " ", str(child)))
        elif isinstance(child, Tag):
            if child.name == "a" and child.get("href"):
                label = inline(child).strip() or child["href"]
                parts.append(f"[{label}]({abs_href(child['href'])})")
            elif child.name == "strong":
                parts.append(f"**{inline(child).strip()}**")
            elif child.name == "i":
                continue
            else:
                parts.append(inline(child))
    return "".join(parts)


def render_dl(node: Tag) -> str:
    lines: list[str] = []
    for child in node.children:
        if not isinstance(child, Tag):
            continue
        if child.name == "div":
            dt = child.find("dt")
            dd = child.find("dd")
            if dt and dd:
                lines.append(f"- **{inline(dt).strip()}:** {inline(dd).strip()}")
    return "\n".join(lines) + "\n\n" if lines else ""


def extract_main(page: Path) -> str:
    global _current_page
    _current_page = page.name
    soup = BeautifulSoup(page.read_text(encoding="utf-8"), "html.parser")
    main = soup.find("main") or soup.body
    if not main:
        return ""
    body = text_of(main)
    body = re.sub(r"\n{3,}", "\n\n", body)
    body = html.unescape(body)
    return body.strip() + "\n"


def front_matter(title: str, source: str) -> str:
    url = SITE + "/" if source == "index.html" else f"{SITE}/{source}"
    return (
        f"---\n"
        f"title: {title}\n"
        f"source: {url}\n"
        f"scope: website-knowledge\n"
        f"---\n\n"
        f"# {title}\n\n"
        f"> Synced from `{source}` for the website chatbot knowledge base.\n\n"
    )


def write_guardrails() -> None:
    content = """---
title: Chatbot guardrails
scope: bot-policy
---

# Chatbot guardrails

## Scope

This assistant answers questions **only** about Bespoke AI, its services, case studies, and content on https://www.bespoke-ai.ie/

## Off-topic questions

If a user asks about topics unrelated to the website or Bespoke AI (general trivia, other companies, unrelated technical help, etc.), respond:

**"That isn't something I can help with here — I'm only able to answer questions about Bespoke AI and this website."**

Do not attempt to answer off-topic questions.

## Pricing, quotes, and commercial terms

If the user asks about **pilot**, **build**, **implementation**, or **ongoing consulting** pricing, cost, quotes, day rates, budget, or what it costs:

1. Do not invent numbers or ranges beyond what is published below.
2. Direct them to book a free discovery call: [Book a call](https://www.bespoke-ai.ie/#discovery-call)
3. Mention that first engagements are single-workflow pilots.

### PO → sales order and smart inbox (published floors)

The **PO → sales order** and **smart inbox** offers **do** publish a floor: typical pilots from **€8,000 + VAT**, fixed after a free discovery call. Feasibility is included — do **not** sell a separate €900 scoping day for these paths.

You may quote that floor and point to [PO → sales order pilot](https://www.bespoke-ai.ie/po-sales-order.html) or [Smart inbox pilot](https://www.bespoke-ai.ie/smart-inbox.html). Do **not** invent a top-end price, a euro ROI, extra-revenue guarantees, or a CSAT promise.

- PO → SO: throughput (more POs through the same desk); revenue is conditional on demand already sitting in the queue. Fit: ~80+ POs/week, shared order inbox, ERP writeback, human approver. Not a fit: chatbot demos, day-one auto-write to the ERP, low volume.
- Smart inbox: faster flagging and same-day drafts; no CSAT or revenue guarantee. Fit: ~250+ emails/week, shared mailbox, human approver. Not a fit: chatbot/FAQ bot as the product, day-one auto-send, low volume.

Optional light monthly support after go-live is published as **from €250/mo**. You may quote that floor; do not invent a higher retainer.

### Other automation / engineering

Other automation pilots and engineering work are **scoped per engagement**. Do not invent prices for those. Direct to [Playbooks](https://www.bespoke-ai.ie/#where-to-start) or [Book a call](https://www.bespoke-ai.ie/#discovery-call).

### Training and workshops are not current public offers

Do **not** quote workshop track prices, Gemini training seat prices, or the Agentic Impact Workshop fee. Those pages are not a current public offer. If asked, say training and workshop cohorts open when announced, and point to [Book a call](https://www.bespoke-ai.ie/#discovery-call).

Do **not** offer or quote a hotel Workflow Assessment, phone discovery product, or €750/day assessment rate. Those are not public offers. If asked, say Bespoke AI focuses on fixed-scope automation pilots and AI engineering engagements, and point to [Playbooks](https://www.bespoke-ai.ie/#where-to-start) or [Book a call](https://www.bespoke-ai.ie/#discovery-call).

## Page sections (use markdown links — never bare URLs)

| Topic | Link label | Markdown link |
| --- | --- | --- |
| What we can build | What we can build | [What we can build](https://www.bespoke-ai.ie/#offer) |
| Process / how we work | How we work | [How we work](https://www.bespoke-ai.ie/#engagement) |
| About Karl / company | About | [About](https://www.bespoke-ai.ie/about.html) |
| Playbooks / where to start | Playbooks | [Playbooks](https://www.bespoke-ai.ie/#where-to-start) |
| PO → sales order pilot | PO → sales order pilot | [PO → sales order pilot](https://www.bespoke-ai.ie/po-sales-order.html) |
| Smart inbox pilot | Smart inbox pilot | [Smart inbox pilot](https://www.bespoke-ai.ie/smart-inbox.html) |
| AI engineering | Engineering | [Engineering](https://www.bespoke-ai.ie/ai-engineering.html) |
| Case studies / client results | Case studies | [Case studies](https://www.bespoke-ai.ie/case-studies.html) |
| What we automate | What we automate | [What we automate](https://www.bespoke-ai.ie/what-we-automate.html) |
| Book a discovery call | Book a call | [Book a call](https://www.bespoke-ai.ie/#discovery-call) |
| Privacy notice | Privacy notice | [Privacy notice](https://www.bespoke-ai.ie/#privacy) |

**Never paste raw URLs** like `https://www.bespoke-ai.ie/#discovery-call` in replies — always use the markdown link with the short label from the table above.

Questions about **process** or **how you work** → [How we work](https://www.bespoke-ai.ie/#engagement), not the discovery call link.

## Contact and booking

- Discovery call: [Book a call](https://www.bespoke-ai.ie/#discovery-call)
- LinkedIn: [LinkedIn](https://www.linkedin.com/in/karl-nolan-bespoke-ai/)
- Company: Bespoke Core AI Engineering Limited, Limerick, Ireland
"""
    (OUT / "bot-guardrails.md").write_text(content, encoding="utf-8")


def retire_hidden_offers() -> None:
    for name in RETIRED:
        path = OUT / name
        if path.exists():
            path.unlink()
            print(f"removed {name}")


def main() -> int:
    force = "--force" in sys.argv
    OUT.mkdir(parents=True, exist_ok=True)
    for html_name, md_name, title in PAGES:
        src = ROOT / html_name
        dest = OUT / md_name
        if not src.exists():
            print(f"skip missing {html_name}", file=sys.stderr)
            continue
        if dest.exists() and not force:
            print(f"keep {md_name} (exists; pass --force to overwrite)")
            continue
        md = front_matter(title, html_name) + extract_main(src)
        dest.write_text(md, encoding="utf-8")
        print(f"wrote {md_name}")
    write_guardrails()
    print("wrote bot-guardrails.md")
    retire_hidden_offers()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
