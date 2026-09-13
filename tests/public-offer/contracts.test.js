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
    assert.match(header, /Software from design to test/);
    assert.match(footer, /Software from design to test/);
    assert.doesNotMatch(header, /AI Workflow Automation/);
    assert.doesNotMatch(footer, /AI Training/);
  });

  it('sets the home title and meta to software from design to test', () => {
    const home = read('index.html');
    assert.match(home, /<title>Bespoke AI \| Software from design to test<\/title>/);
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
    assert.match(hero, /automated tests in the build/);
    assert.match(hero, /tested before you run it/);
    assert.match(hero, /ai-engineering\.html/);
    assert.doesNotMatch(hero, /po-sales-order\.html/);
    assert.doesNotMatch(hero, /30-minute manual task/);
  });

  it('catalogs three kinds of Builds and does not name Nexus', () => {
    const home = read('index.html');
    const offer = home.slice(
      home.indexOf('id="offer"'),
      home.indexOf('id="client-results"')
    );
    assert.match(offer, /New systems/);
    assert.match(offer, /Quality diagnostics and reports/);
    assert.match(offer, /Governed workflow automation/);
    assert.match(offer, /Connecting what you already run/);
    assert.match(offer, /Property searching/);
    assert.doesNotMatch(offer, /what-we-automate\.html/);
    assert.doesNotMatch(offer, /agentic-impact-workshop/);
    assert.doesNotMatch(home, /Nexus/);
  });

  it('retargets Engineering to Design, Implementation, and Test', () => {
    const page = read('ai-engineering.html');
    assert.match(page, /<title>Bespoke AI \| Engineering<\/title>/);
    assert.match(page, />Design</);
    assert.match(page, />Implementation</);
    assert.match(page, />Test</);
    assert.doesNotMatch(page, /Custom Pipelines/);
    assert.doesNotMatch(page, /when a playbook is not enough/i);
    assert.doesNotMatch(page, /Nexus/);
  });

  it('puts architecture in About core focus, not as a named Nexus product', () => {
    const about = read('about.html');
    assert.match(about, /Software development/);
    assert.match(about, /<th scope="row">Architecture<\/th>/);
    assert.match(about, /Governed automation/);
    assert.doesNotMatch(about, /Autonomous coding workflows/);
    assert.doesNotMatch(about, /Nexus/);
    assert.match(about, /ai-engineering\.html/);
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

  it('does not offer training or workshops in chatbot guardrails', () => {
    const bot = read('chatbot-knowledge/bot-guardrails.md');
    assert.match(bot, /does not offer[\s\*]+training or workshop/i);
    assert.doesNotMatch(bot, /open when announced/i);
  });

  it('keeps workshop flag off and drops the scoping workshop CTA', () => {
    assert.match(read('js/site-config.js'), /showWorkshop:\s*false/);
    assert.doesNotMatch(read('scoping.html'), /agentic-impact-workshop/);
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
    .filter((name) => name.endsWith('.html'))
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
