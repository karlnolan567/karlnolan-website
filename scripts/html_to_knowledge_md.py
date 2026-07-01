#!/usr/bin/env python3
"""Extract main content from static HTML pages into chatbot knowledge markdown."""

from __future__ import annotations

import html
import re
import sys
from pathlib import Path

from bs4 import BeautifulSoup, NavigableString, Tag

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "chatbot-knowledge"

PAGES = [
    ("index.html", "website-home.md", "Bespoke Core AI — Home Page"),
    ("what-we-automate.html", "what-we-automate.md", "What We Automate"),
    ("workshops.html", "workshops.md", "Workshops"),
    ("workshop-1.html", "workshop-1-foundations.md", "Workshop 1 — AI Foundations"),
    ("workshop-2.html", "workshop-2-engineering.md", "Workshop 2 — AI Engineering"),
    ("workshop-3.html", "workshop-3-automation.md", "Workshop 3 — Agentic Workflow Automation"),
]

SKIP_CLASSES = {
    "skip-link",
    "bg-effects",
    "contact-form-honey",
    "mobile-menu",
    "mobile-menu-btn",
    "profile-photo-fallback",
    "profile-avatar-fallback",
    "footer-brand__mark",
}


def text_of(node: Tag | NavigableString) -> str:
    if isinstance(node, NavigableString):
        return str(node)
    if node.name == "script" or node.name == "style":
        return ""
    classes = set(node.get("class") or [])
    if classes & SKIP_CLASSES or node.get("hidden") is not None or node.get("aria-hidden") == "true":
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
        href = html.unescape(node["href"])
        return f"[{label}]({href})"
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
                parts.append(f"[{label}]({html.unescape(child['href'])})")
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
    soup = BeautifulSoup(page.read_text(encoding="utf-8"), "html.parser")
    main = soup.find("main") or soup.body
    if not main:
        return ""
    body = text_of(main)
    body = re.sub(r"\n{3,}", "\n\n", body)
    body = html.unescape(body)
    return body.strip() + "\n"


def front_matter(title: str, source: str) -> str:
    return (
        f"---\n"
        f"title: {title}\n"
        f"source: http://135.181.39.41/{source}\n"
        f"scope: website-knowledge\n"
        f"---\n\n"
        f"# {title}\n\n"
        f"> Auto-generated from `{source}` for the website chatbot knowledge base.\n\n"
    )


def write_guardrails() -> None:
    content = """---
title: Chatbot guardrails
scope: bot-policy
---

# Chatbot guardrails

## Scope

This assistant answers questions **only** about Bespoke Core AI Engineering Limited, its services, workshops, case studies, and content on http://135.181.39.41/

## Off-topic questions

If a user asks about topics unrelated to the website or Bespoke Core AI (general trivia, other companies, unrelated technical help, etc.), respond:

**"That isn't something I can help with here — I'm only able to answer questions about Bespoke Core AI and this website."**

Do not attempt to answer off-topic questions.

## Pricing, quotes, and commercial terms

Bespoke Core AI does **not** publish fixed service pricing on the website. Pilot and consulting fees are scoped per engagement.

If the user asks about **pricing**, **cost**, **quotes**, **day rates**, **pilot fees**, **how much**, **budget**, or **what it costs**:

1. Do not invent numbers or ranges.
2. Direct them to book a free discovery call: [Book a call](http://135.181.39.41/#discovery-call)
3. Mention that first engagements are single-workflow pilots scoped on the call.

### Workshop pricing exception

Workshop track prices **are** published on the workshops page. You may quote workshop early-bird / standard / final prices from `workshops.md` when asked specifically about **workshop** fees.

For **consulting / automation pilot** pricing, always redirect to the discovery call section.

## Page sections (use markdown links — never bare URLs)

| Topic | Link label | Markdown link |
| --- | --- | --- |
| Process / how we work | How we work | [How we work](http://135.181.39.41/#engagement) |
| About Karl / company | About | [About](http://135.181.39.41/#about) |
| Pilots / where to start | Where to start | [Where to start](http://135.181.39.41/#where-to-start) |
| Case studies / client results | Case studies | [Case studies](http://135.181.39.41/#case-studies) |
| Services / what we do | Services | [Services](http://135.181.39.41/#our-service) |
| Book a discovery call | Book a call | [Book a call](http://135.181.39.41/#discovery-call) |
| Privacy notice | Privacy notice | [Privacy notice](http://135.181.39.41/#privacy) |

**Never paste raw URLs** like `http://135.181.39.41/#discovery-call` in replies — always use the markdown link with the short label from the table above.

Questions about **process** or **how you work** → [How we work](http://135.181.39.41/#engagement), not the discovery call link.

## Contact and booking

- Discovery call: [Book a call](http://135.181.39.41/#discovery-call)
- LinkedIn: [LinkedIn](https://www.linkedin.com/in/karl-nolan-69433b29/)
- Company: Bespoke Core AI Engineering Limited, Limerick, Ireland
"""
    (OUT / "bot-guardrails.md").write_text(content, encoding="utf-8")


def main() -> int:
    OUT.mkdir(parents=True, exist_ok=True)
    for html_name, md_name, title in PAGES:
        src = ROOT / html_name
        if not src.exists():
            print(f"skip missing {html_name}", file=sys.stderr)
            continue
        md = front_matter(title, html_name) + extract_main(src)
        (OUT / md_name).write_text(md, encoding="utf-8")
        print(f"wrote {md_name}")
    write_guardrails()
    print("wrote bot-guardrails.md")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
