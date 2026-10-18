const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '../..');

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8');
}

const OLD_PAY_SENTENCE = /You don't pay until you're 100% satisfied with the solution\./;
const SIGN_OFF_SENTENCE = /You sign off against test cases agreed up front, before the final invoice\./;

/** The home hero section, from its opening tag to its closing tag. */
function heroOf(home) {
  const start = home.lastIndexOf('<section', home.indexOf('section--hero'));
  const end = home.indexOf('</section>', start);
  return home.slice(start, end);
}

/** A <section id="..."> block by id. */
function sectionById(html, id) {
  const idx = html.indexOf(`id="${id}"`);
  if (idx === -1) return '';
  const start = html.lastIndexOf('<section', idx);
  const end = html.indexOf('</section>', idx);
  return html.slice(start, end);
}

/** Visible text: drop scripts, styles, JSON-LD, and tags. */
function visibleText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/g, ' ')
    .replace(/<style[\s\S]*?<\/style>/g, ' ')
    .replace(/<head[\s\S]*?<\/head>/g, ' ')
    .replace(/<[^>]+>/g, ' ');
}

/** Root pages a search engine can index (not noindex, not prototypes). */
function publicPages() {
  return listHtml('').filter((rel) => !/noindex/i.test(read(rel)));
}

describe('public-offer repositioning', () => {
  it('uses the locked tagline in header and footer', () => {
    const header = read('partials/header.html');
    const footer = read('partials/footer.html');
    assert.match(header, /Doing one automation at a time/);
    assert.match(footer, /Doing one automation at a time/);
    assert.doesNotMatch(header, /AI Workflow Automation/);
    assert.doesNotMatch(footer, /AI Training/);
  });

  it('sets the home title and meta to AI automation for Irish SMEs in Limerick', () => {
    const home = read('index.html');
    const title = home.match(/<title>([^<]+)<\/title>/)[1];
    assert.match(title, /AI automation/, title);
    assert.match(title, /Limerick/, title);
    assert.doesNotMatch(title, /Doing one automation at a time/, title);
    const desc = home.match(/<meta name="description" content="([^"]+)">/)[1];
    assert.match(desc, /orders/i, desc);
    assert.match(desc, /invoices/i, desc);
    assert.match(desc, /dockets/i, desc);
    assert.match(desc, /Limerick|Ireland/, desc);
    assert.match(home, /"areaServed": "Worldwide"/);
    assert.doesNotMatch(home, /Do you work with businesses in Limerick\?/);
    assert.doesNotMatch(home, /Working in Limerick/);
    assert.doesNotMatch(home, /Mid-West/);
    assert.doesNotMatch(home, /Agents &amp; Automation/);
    assert.match(read('partials/footer.html'), /Limerick city/);
    assert.doesNotMatch(read('index.html').replace(/"streetAddress".*/, ''), /Dooradoyle/);
    assert.doesNotMatch(read('partials/footer.html'), /Dooradoyle/);
  });

  it('leads the hero with the buyer pain and one primary CTA', () => {
    const home = read('index.html');
    const hero = heroOf(home);
    const h1 = hero.match(/<h1[\s\S]*?<\/h1>/)[0];
    assert.match(h1, /Stop re-keying orders, invoices and dockets\./);
    assert.match(
      hero,
      /<p class="text-lead hero-lead">When your CRM, ERP and older databases don't agree, we build reliable, auditable integrations that make them work and talk together\.<\/p>/
    );
    assert.doesNotMatch(hero, /Fixed-scope automation pilots for Irish small and medium businesses/);
    assert.doesNotMatch(hero, /Building software you can trust/);
    assert.doesNotMatch(hero, /workshop/i);
    assert.doesNotMatch(hero, /Save time and money/);
    assert.doesNotMatch(hero, /ai-engineering\.html/);
    assert.doesNotMatch(hero, /30-minute manual task/);
    const primaries = [...hero.matchAll(/<a\b[^>]*class="[^"]*\bbtn-primary\b[^"]*"[^>]*>([\s\S]*?)<\/a>/g)];
    assert.equal(primaries.length, 1, 'hero should have exactly one primary CTA');
    assert.match(primaries[0][0], /data-booking-link/);
    assert.match(primaries[0][1], /Book a Discovery Call/);
    assert.ok(
      home.indexOf('id="workshop-announce"') === -1 ||
        home.indexOf('id="workshop-announce"') > home.indexOf('section--hero') + hero.length,
      'workshop announce card must not sit in the hero'
    );
  });

  it('does not publish a What We Can Build catalog', () => {
    const home = read('index.html');
    assert.doesNotMatch(home, /What We Can Build/);
    assert.doesNotMatch(home, /id="offer"/);
    assert.doesNotMatch(home, /Nexus/);
    assert.match(home, /id="client-results"/);
    assert.doesNotMatch(read('partials/header.html'), /What We Can Build/);
    assert.doesNotMatch(read('partials/footer.html'), /What We Can Build/);
    assert.doesNotMatch(read('chatbot-knowledge/bot-guardrails.md'), /#offer/);
    assert.doesNotMatch(read('chatbot-knowledge/website-home.md'), /What We Can Build/);
  });

  it('does not publish an Engineering page', () => {
    assert.equal(fs.existsSync(path.join(ROOT, 'ai-engineering.html')), false);
    for (const rel of [
      'partials/header.html',
      'partials/footer.html',
      'about.html',
      'index.html',
      'sitemap.xml',
      'chatbot-knowledge/bot-guardrails.md',
      'js/site-config.js',
    ]) {
      assert.doesNotMatch(read(rel), /ai-engineering/, rel);
    }
  });

  it('does not sell architecture as a named Nexus product on About', () => {
    const about = read('about.html');
    assert.doesNotMatch(about, /\/\/ Core focus/);
    assert.doesNotMatch(about, /<th scope="row">Architecture<\/th>/);
    assert.doesNotMatch(about, /Autonomous coding workflows/);
    assert.doesNotMatch(about, /Nexus/);
    assert.doesNotMatch(about, /ai-engineering\.html/);
    assert.doesNotMatch(about, />AI Engineering</);
  });

  it('noindexes training and workshop pages without deleting them', () => {
    const pages = [
      'training.html',
      'workshops.html',
      'workshop.html',
      'workshop-1.html',
      'workshop-2.html',
      'workshop-3.html',
      'agentic-impact-workshop.html',
      'workshop-one-pager.html',
    ];
    for (const rel of pages) {
      const html = read(rel);
      assert.match(html, /noindex/i, rel);
      assert.doesNotMatch(html, /http-equiv="refresh"[^>]*url=\//i, rel);
    }
  });

  it('does not submit noindex URLs in the sitemap', () => {
    const sitemap = read('sitemap.xml');
    const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
    assert.ok(locs.length > 0, 'sitemap should list public URLs');
    for (const loc of locs) {
      const pathname = new URL(loc).pathname;
      const rel = pathname === '/' ? 'index.html' : pathname.replace(/^\//, '');
      const html = read(rel);
      assert.doesNotMatch(html, /noindex/i, loc);
    }
  });

  it('does not offer training or workshops in chatbot guardrails', () => {
    const bot = read('chatbot-knowledge/bot-guardrails.md');
    assert.match(bot, /does not offer[\s\*]+training or workshop/i);
    assert.match(bot, /core public offer is \*\*software development\*\*/i);
    assert.doesNotMatch(bot, /open when announced/i);
  });

  it('keeps workshop flag off and drops the scoping workshop CTA', () => {
    assert.match(read('js/site-config.js'), /showWorkshop:\s*false/);
    assert.doesNotMatch(read('scoping.html'), /agentic-impact-workshop/);
  });

  it('replaces pay-when-satisfied with sign-off against agreed test cases', () => {
    for (const rel of [
      'index.html',
      'po-sales-order.html',
      'smart-inbox.html',
      'about.html',
      'partials/header.html',
      'chatbot-knowledge/bot-guardrails.md',
      'chatbot-knowledge/website-home.md',
      'chatbot-knowledge/po-sales-order.md',
      'chatbot-knowledge/smart-inbox.md',
    ]) {
      const text = read(rel);
      assert.doesNotMatch(text, OLD_PAY_SENTENCE, rel);
      assert.doesNotMatch(text, /100% satisfied/, rel);
    }
    for (const rel of [
      'index.html',
      'po-sales-order.html',
      'smart-inbox.html',
      'chatbot-knowledge/bot-guardrails.md',
    ]) {
      assert.match(read(rel), SIGN_OFF_SENTENCE, rel);
    }
    const hero = heroOf(read('index.html'));
    assert.doesNotMatch(hero, /\/\/ Senior architecture/);
  });

  it('documents Sign-off in the CONTEXT glossary instead of Pay-when-satisfied', () => {
    const ctx = read('CONTEXT.md');
    assert.match(ctx, /\*\*Sign-off\*\*:/);
    assert.match(ctx, /test cases agreed up front/);
    assert.doesNotMatch(ctx, /\*\*Pay-when-satisfied\*\*:/);
    assert.doesNotMatch(ctx, /100% satisfied/);
  });

  it('strips public euro floors and paid scoping from the live offer', () => {
    const home = read('index.html');
    assert.doesNotMatch(home, /€250\/mo/);
    assert.doesNotMatch(home, /€8,000/);
    assert.doesNotMatch(home, /paid scoping/i);
    assert.doesNotMatch(home, /scoping\.html/);
    for (const rel of ['po-sales-order.html', 'smart-inbox.html']) {
      const page = read(rel);
      assert.doesNotMatch(page, /€8,000/, rel);
      assert.doesNotMatch(page, /€900/, rel);
    }
    for (const rel of [
      'chatbot-knowledge/website-home.md',
      'chatbot-knowledge/po-sales-order.md',
      'chatbot-knowledge/smart-inbox.md',
    ]) {
      const md = read(rel);
      assert.doesNotMatch(md, /scoping\.html/, rel);
      assert.doesNotMatch(md, /€8,000/, rel);
      assert.doesNotMatch(md, /€250\/mo/, rel);
      assert.doesNotMatch(md, /€900/, rel);
    }
  });

  it('lets Ask BCAI quote sign-off without inventing prices or CSAT', () => {
    const bot = read('chatbot-knowledge/bot-guardrails.md');
    assert.match(bot, SIGN_OFF_SENTENCE);
    assert.doesNotMatch(bot, OLD_PAY_SENTENCE);
    assert.match(bot, /priced per job/i);
    assert.match(bot, /fixed price agreed before (any )?work starts/i);
    assert.doesNotMatch(bot, /€8,000/);
    assert.doesNotMatch(bot, /€900/);
    assert.doesNotMatch(bot, /€250\/mo/);
    assert.doesNotMatch(bot, /from €250/);
    assert.doesNotMatch(bot, /do\s+\*\*not\*\* invent a top-end price, a euro ROI, extra-revenue guarantees, or a CSAT promise/);
  });

  it('does not use em dashes in visitor-facing site files', () => {
    const emDash = /—|&mdash;|&#8212;|&#x2014;|%E2%80%94/i;
    const files = [
      ...listHtml(''),
      ...listHtml('partials'),
      ...listDir('chatbot-knowledge', '.md'),
      ...listDir('js', '.js'),
      ...listDir('css', '.css'),
      ...walk('demos', ['.html', '.js', '.css']),
    ];
    files.push('scripts/html_to_knowledge_md.py');
    assert.ok(files.length > 20, 'expected to scan the public site tree');
    for (const rel of files) {
      assert.doesNotMatch(read(rel), emDash, rel);
    }
  });
});

function listHtml(dir) {
  const abs = dir ? path.join(ROOT, dir) : ROOT;
  return fs
    .readdirSync(abs)
    .filter((name) => name.endsWith('.html') && !name.startsWith('prototype-'))
    .map((name) => (dir ? path.join(dir, name) : name));
}

function listDir(dir, ext) {
  return fs
    .readdirSync(path.join(ROOT, dir))
    .filter((name) => name.endsWith(ext))
    .map((name) => path.join(dir, name));
}

function walk(dir, exts) {
  const abs = path.join(ROOT, dir);
  const out = [];
  for (const entry of fs.readdirSync(abs, { withFileTypes: true })) {
    const rel = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...walk(rel, exts));
    } else if (exts.some((ext) => entry.name.endsWith(ext))) {
      out.push(rel);
    }
  }
  return out;
}
