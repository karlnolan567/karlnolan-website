const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '../..');

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8');
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

  it('sets the home title and meta to the tagline', () => {
    const home = read('index.html');
    assert.match(home, /<title>Bespoke AI \| Doing one automation at a time<\/title>/);
    assert.match(
      home,
      /Defined-problem software from design through test: a new system or a governed workflow\. Straight talk on what's worth building\./
    );
    assert.doesNotMatch(home, /Agents &amp; Automation/);
  });

  it('leads the hero with design through test, not a playbook CTA', () => {
    const home = read('index.html');
    const hero = home.slice(
      home.indexOf('section--hero'),
      home.indexOf('id="workshop-announce"')
    );
    assert.match(hero, /Building software you can trust/);
    assert.match(hero, /by automating one workflow at a time/);
    assert.doesNotMatch(hero, /Automate workflows with AI, when needed/);
    assert.doesNotMatch(hero, /you don't pay until you're satisfied/);
    assert.doesNotMatch(hero, /Save time and money/);
    assert.match(hero, /automated tests in the build/);
    assert.doesNotMatch(hero, /tested before you run it/);
    assert.doesNotMatch(hero, /ai-engineering\.html/);
    assert.doesNotMatch(hero, /po-sales-order\.html/);
    assert.doesNotMatch(hero, /30-minute manual task/);
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

  it('puts the pay-when-satisfied sentence on home and playbooks', () => {
    const sentence = /You don't pay until you're 100% satisfied with the solution\./;
    const home = read('index.html');
    const hero = home.slice(
      home.indexOf('section--hero'),
      home.indexOf('id="workshop-announce"')
    );
    assert.match(home, sentence);
    assert.match(hero, /\/\/ Senior architecture/);
    assert.match(hero, /27\+ years of enterprise software delivery, built right into your existing stack\./);
    assert.doesNotMatch(hero, /\/\/ 100% satisfaction/);
    assert.match(hero, /cost, margin, or hours/);
    assert.doesNotMatch(hero, /tested before you run it/);
    assert.match(hero, /Optional support, quoted case by case/);
    assert.match(read('po-sales-order.html'), sentence);
    assert.match(read('smart-inbox.html'), sentence);
    assert.doesNotMatch(read('about.html'), sentence);
    assert.doesNotMatch(read('partials/header.html'), sentence);
    assert.doesNotMatch(read('scoping.html'), sentence);
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

  it('lets Ask BCAI quote pay-when-satisfied without inventing prices or CSAT', () => {
    const bot = read('chatbot-knowledge/bot-guardrails.md');
    assert.match(bot, /You don't pay until you're 100% satisfied with the solution\./);
    assert.match(bot, /priced per job/i);
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
