// Contracts for the buyer-led home page (site critique, 18 Oct 2026).
// Encodes: pilot offer, Chamber strip, partner section, Example builds,
// one voice, no AI-template styling, readable contrast, and a chat bubble
// that stays out of the hero on mobile.
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '../..');

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8');
}

function sectionById(html, id) {
  const idx = html.indexOf(`id="${id}"`);
  if (idx === -1) return '';
  const start = html.lastIndexOf('<section', idx);
  const end = html.indexOf('</section>', idx);
  return html.slice(start, end);
}

function visibleText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/g, ' ')
    .replace(/<style[\s\S]*?<\/style>/g, ' ')
    .replace(/<head[\s\S]*?<\/head>/g, ' ')
    .replace(/<[^>]+>/g, ' ');
}

function publicPages() {
  return fs
    .readdirSync(ROOT)
    .filter((n) => n.endsWith('.html') && !n.startsWith('prototype-'))
    .filter((n) => !/noindex/i.test(read(n)));
}

function cssRule(css, selector) {
  const esc = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const m = css.match(new RegExp(`(^|\\n)${esc}\\s*\\{([^}]*)\\}`));
  return m ? m[2] : '';
}

function luminance(hex) {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16) / 255);
  const lin = (c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

function contrast(a, b) {
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}

describe('home: fixed-scope pilot offer', () => {
  const home = read('index.html');
  const pilot = sectionById(home, 'pilot');

  it('has a pilot block with scope, duration, fixed price and next step', () => {
    assert.ok(pilot, 'expected <section id="pilot">');
    assert.match(pilot, /fixed-scope pilot/i);
    assert.match(pilot, /included/i);
    assert.match(pilot, /duration/i);
    assert.match(pilot, /fixed price agreed before (any )?work starts/i);
    assert.match(pilot, /next step/i);
    assert.match(pilot, /data-booking-link|#discovery-call/);
  });

  it('does not publish an invented euro figure anywhere on home', () => {
    assert.doesNotMatch(home, /€\s?\d/);
    assert.doesNotMatch(home, /&euro;\s?\d/);
    assert.doesNotMatch(home, /EUR\s?\d/);
  });

  it('keeps the honest lines that build trust', () => {
    assert.match(home, /If it isn’t worth building, we’ll tell you straight|If it isn't worth building, we'll tell you straight/);
    assert.match(home, /No production access or sensitive data required upfront/);
  });
});

describe('home: Limerick Chamber and partner routes', () => {
  const home = read('index.html');

  it('leads the Chamber strip with 10% off, not a free audit', () => {
    const strip = sectionById(home, 'chamber-offer');
    assert.ok(strip, 'expected <section id="chamber-offer">');
    assert.match(strip, /Limerick Chamber members:<\/strong> 10% off your first pilot, until 31 January 2027\./);
    assert.doesNotMatch(strip, /audit/i);
    for (const rel of ['chatbot-knowledge/website-home.md', 'chatbot-knowledge/bot-guardrails.md']) {
      assert.doesNotMatch(read(rel), /free 30-minute AI automation audit/i, rel);
    }
  });

  it('Why not do it yourself? has a box on engineering experience', () => {
    const alt = sectionById(home, 'vs-alternatives');
    assert.ok(alt, 'expected <section id="vs-alternatives">');
    assert.equal((alt.match(/<article /g) || []).length, 3);
    assert.match(alt, /class="grid-3"/);
    assert.match(alt, /<h3 class="card-title">Built by someone who has led software teams<\/h3>/);
    assert.match(alt, /managed teams of developers/);
    assert.match(alt, /bad code/);
    const titles = [...alt.matchAll(/<h3 class="card-title">([^<]+)<\/h3>/g)].map((m) => m[1]);
    assert.deepEqual(titles, ['Built by someone who has led software teams', 'Guardrails, security and an audit trail', "We don't use AI for the sake of it"]);
    const md = read('chatbot-knowledge/website-home.md');
    const mdTitles = [...md.slice(md.indexOf('## Why not do it yourself?'), md.indexOf('## Managed Service Provider (MSP) Partners')).matchAll(/^### (.+)$/gm)].map((m) => m[1]);
    assert.deepEqual(mdTitles, titles);
    assert.match(read('chatbot-knowledge/website-home.md'), /### Built by someone who has led software teams/);
  });

  it('has a section for IT and Dynamics 365 partners', () => {
    const partners = sectionById(home, 'partners');
    assert.ok(partners, 'expected <section id="partners">');
    assert.match(partners, />Managed Service Provider \(MSP\) Partners<\/h2>/);
    assert.match(read('chatbot-knowledge/website-home.md'), /^## Managed Service Provider \(MSP\) Partners$/m);
    assert.match(partners, /white-label/i);
    assert.match(partners, /<strong class="text-white">AI strategy:<\/strong>/);
    assert.match(read('chatbot-knowledge/website-home.md'), /\*\*AI strategy:\*\*/);
    assert.match(read('chatbot-knowledge/bot-guardrails.md'), /AI strategy/);
    assert.match(partners, /referral/i);
    assert.match(partners, /automation layer/i);
  });
});

describe('home: Example builds, not Client results', () => {
  const home = read('index.html');
  const proof = sectionById(home, 'client-results');

  it('keeps the anchor and renames the heading', () => {
    assert.ok(proof, 'expected id="client-results"');
    const h2 = proof.match(/<h2[\s\S]*?<\/h2>/)[0];
    assert.match(h2, /Example builds/);
    assert.doesNotMatch(proof, /Client results/i);
  });

  it('features exactly three buyer-fit cards and links to the rest', () => {
    const cards = [...proof.matchAll(/<a\b[^>]*class="[^"]*\bcard\b[^"]*"[^>]*>/g)].map((m) => m[0]);
    assert.equal(cards.length, 3, `expected 3 featured cards, got ${cards.length}`);
    const hrefs = cards.join(' ');
    assert.match(hrefs, /#case-study-po-so/);
    assert.match(hrefs, /#case-study-invoice/);
    assert.match(hrefs, /#case-study-supplier/);
    assert.match(proof, /href="case-studies\.html"/);
  });

  it('keeps every write-up on case-studies.html', () => {
    const cs = read('case-studies.html');
    const ids = cs.match(/id="case-study-[a-z-]+"/g) || [];
    assert.ok(ids.length >= 12, `expected 12 write-ups, got ${ids.length}`);
    const h1 = cs.match(/<h1[\s\S]*?<\/h1>/)[0];
    assert.match(h1, /Example builds/);
  });

  it('does not call unnamed systems client results on public pages or nav', () => {
    for (const rel of [...publicPages(), 'partials/header.html', 'partials/footer.html']) {
      assert.doesNotMatch(visibleText(read(rel)), /Client results/i, rel);
    }
    for (const rel of ['chatbot-knowledge/bot-guardrails.md', 'chatbot-knowledge/website-home.md']) {
      assert.doesNotMatch(read(rel), /Client results/i, rel);
    }
  });

  it('does not mention Nexus on home', () => {
    assert.doesNotMatch(home, /Nexus/);
  });
});

describe('home: process stated once', () => {
  const home = read('index.html');

  it('removes the duplicate process image', () => {
    assert.doesNotMatch(home, /bespoke-ai-engagements-work\.png/);
  });

  it('uses one support wording', () => {
    assert.match(home, /Optional support, quoted case by case\./);
    assert.doesNotMatch(home, /Optional support after go-live is quoted case by case/);
  });

  it('drops buyer-unfriendly jargon', () => {
    assert.doesNotMatch(home, /day-two operations/);
    assert.doesNotMatch(home, /human gate/);
  });
});

describe('one voice: "we" for the business, "I" only for Karl personally', () => {
  const singular = /\b(I|I'm|I'll|I've|I'd|I’m|I’ll|me|my|myself)\b/;
  // Personal passages that stay first person singular.
  function stripPersonal(src) {
    return src
      .replace(/I'm Karl Nolan\. Bespoke AI is my software and automation company in Limerick city\./g, '')
      .replace(/<article[^>]*>\s*<h3 class="card-title">Built by someone who has led software teams[\s\S]*?<\/article>/g, '')
      .replace(/### Built by someone who has led software teams[\s\S]*?(?=\n## )/g, '')
      .replace(/<section id="about"[\s\S]*?<\/section>/g, '')
      .replace(/## Karl Nolan[\s\S]*?(?=\n## )/g, '')
      .replace(/backed by my AI and software development experience/g, '');
  }
  for (const rel of ['index.html', 'case-studies.html']) {
    it(`${rel} speaks as "we" outside Karl's personal passages`, () => {
      const text = visibleText(stripPersonal(read(rel)));
      const hit = text.match(singular);
      assert.equal(hit, null, hit ? `${rel}: "...${text.slice(Math.max(0, hit.index - 40), hit.index + 40).replace(/\s+/g, ' ')}..."` : '');
    });
  }
  for (const rel of ['chatbot-knowledge/website-home.md', 'chatbot-knowledge/case-studies.md']) {
    it(`${rel} matches the "we" voice`, () => {
      const text = stripPersonal(read(rel));
      const hit = text.match(singular);
      assert.equal(hit, null, hit ? `${rel}: "...${text.slice(Math.max(0, hit.index - 40), hit.index + 40)}..."` : '');
    });
  }
  it("keeps Karl's personal passages in the first person", () => {
    const home = read('index.html');
    assert.match(home, /I'm Karl Nolan\./);
    assert.match(sectionById(home, 'about'), /I design the system, build it myself/);
    assert.match(home, /I know what bad code and bad design look like/);
    assert.match(home, /Talk to us about partnering/);
  });
});

describe('styling: no AI-template tells', () => {
  it('has no "// " eyebrow labels on public pages', () => {
    for (const rel of [...publicPages(), 'partials/header.html', 'partials/footer.html']) {
      const html = read(rel).replace(/<script[\s\S]*?<\/script>/g, '');
      const hit = html.match(/>\s*\/\/ [^<]*/);
      assert.equal(hit, null, `${rel}: ${hit && hit[0]}`);
    }
  });

  it('has no gradient text on public pages', () => {
    for (const rel of publicPages()) {
      assert.doesNotMatch(read(rel), /text-gradient/, rel);
    }
  });

  it('primary button is a solid colour with >= 4.5:1 contrast for white text', () => {
    const css = read('css/styles.css');
    const rule = cssRule(css, '.btn-primary');
    assert.ok(rule, 'expected a .btn-primary rule');
    assert.doesNotMatch(rule, /gradient/);
    const bg = rule.match(/background(?:-color)?:\s*(#[0-9a-fA-F]{3,6})\s*;/);
    assert.ok(bg, 'expected a solid hex background on .btn-primary');
    assert.match(rule, /color:\s*#fff(fff)?\s*;/);
    const ratio = contrast(bg[1], '#ffffff');
    assert.ok(ratio >= 4.5, `contrast ${ratio.toFixed(2)} < 4.5`);
  });

  it('buttons have no cyan or blue glow shadows', () => {
    const css = read('css/styles.css');
    const rules = [...css.matchAll(/([^{}]*\.btn[^{}]*)\{([^}]*)\}/g)];
    assert.ok(rules.length > 0);
    for (const [, sel, body] of rules) {
      const shadow = body.match(/box-shadow:[^;]*/);
      if (!shadow) continue;
      assert.doesNotMatch(shadow[0], /rgba\(\s*(6,\s*182,\s*212|59,\s*130,\s*246)/, sel.trim());
    }
  });

  it('card body text is at least 15px', () => {
    const css = read('css/styles.css');
    const rule = cssRule(css, '.text-body-sm');
    const size = rule.match(/font-size:\s*([\d.]+)(rem|px)/);
    assert.ok(size, 'expected a font-size on .text-body-sm');
    const px = size[2] === 'rem' ? parseFloat(size[1]) * 16 : parseFloat(size[1]);
    assert.ok(px >= 15, `.text-body-sm is ${px}px`);
  });

  it('bumps the home stylesheet cache-bust past the pre-critique version', () => {
    const v = read('index.html').match(/css\/styles\.css\?v=(\d{8})([a-z]?)/);
    assert.ok(v);
    assert.ok(v[1] >= '20261018', `styles.css?v=${v[1]}${v[2]}`);
  });
});

describe('home: pilot intro copy', () => {
  it('asks for one pain point, quick payback and fixing broken processes first', () => {
    const pilot = sectionById(read('index.html'), 'pilot');
    assert.match(pilot, /Pick one pain point/);
    assert.match(pilot, /pays back fastest/);
    assert.match(pilot, /We don't automate a broken process/);
    assert.doesNotMatch(pilot, /I start with|I fix it first/);
    assert.doesNotMatch(pilot, /Pick the job your team re-keys every day/);
    assert.match(read('chatbot-knowledge/website-home.md'), /We don't automate a broken process/);
  });
});

describe('home: intro video', () => {
  it('sits in the hero, not the Karl Nolan section', () => {
    const home = read('index.html');
    const hero = home.slice(home.indexOf('<section class="section--hero"'), home.indexOf('<section id="chamber-offer"'));
    assert.match(hero, /class="hero-layout"/);
    assert.match(hero, /<video class="hero-intro__video"[^>]*preload="metadata"/);
    assert.match(hero, /<track kind="captions"/);
    assert.doesNotMatch(sectionById(home, 'about'), /<video/);
  });
});

describe('navigation and chat bubble', () => {
  it('keeps Get in Touch in the header and mobile menu on every page', () => {
    const header = read('partials/header.html');
    assert.match(header, /id="header-cta"[^>]*>Get in Touch</);
    assert.match(header, /id="mobile-menu-cta"[^>]*>Get in Touch</);
    const includes = read('js/includes.js');
    assert.match(includes, /text: 'Get in Touch' \};\n\s*\}\n/);
  });

  it('nav names the proof section Example Builds', () => {
    const header = read('partials/header.html');
    const footer = read('partials/footer.html');
    assert.match(header, /data-nav="client-results"[^>]*>Example Builds</);
    assert.match(footer, /data-nav="client-results"[^>]*>Example Builds</);
  });

  it('lists nav links in the same order as the home page sections', () => {
    const index = read('index.html');
    const files = { header: read('partials/header.html'), footer: read('partials/footer.html') };
    for (const [name, html] of Object.entries(files)) {
      const navs = html.match(/<nav[\s\S]*?<\/nav>|<div id="mobile-menu"[\s\S]*?<\/div>/g);
      assert.ok(navs && navs.length, `no nav in ${name}`);
      for (const nav of navs) {
        const ids = [...nav.matchAll(/data-nav="([^"]+)"/g)].map((m) => m[1]);
        const positions = ids.map((id) => index.indexOf(`<section id="${id}"`));
        positions.forEach((p, i) => assert.ok(p >= 0, `section #${ids[i]} missing`));
        assert.deepEqual(positions, [...positions].sort((a, b) => a - b), `${name} nav order ${ids.join(", ")}`);
      }
    }
  });

  it('orders SITE.navOrder like the home page sections', () => {
    const index = read('index.html');
    for (const rel of ['js/site-config.js', 'js/site-config.template.js']) {
      const m = read(rel).match(/navOrder:\s*\[([^\]]*)\]/);
      assert.ok(m, `navOrder missing in ${rel}`);
      const ids = [...m[1].matchAll(/'([^']+)'/g)].map((x) => x[1]);
      const positions = ids.map((id) => index.indexOf(`<section id="${id}"`));
      assert.deepEqual(positions, [...positions].sort((a, b) => a - b), `${rel} navOrder ${ids.join(", ")}`);
    }
  });

  it('chat teaser waits and stays icon-only on small screens', () => {
    const js = read('js/chat-embed.js');
    const delay = js.match(/NUDGE_DELAY_MS\s*=\s*(\d+)/);
    assert.ok(delay, 'expected NUDGE_DELAY_MS');
    assert.ok(Number(delay[1]) >= 5000, `nudge delay ${delay[1]}ms`);
    assert.match(js, /matchMedia\(\s*'\(max-width: 767px\)'\s*\)/);
    const css = read('css/styles.css');
    assert.match(css, /@media \(max-width: 767px\)\s*\{[^}]*\.chat-embed__nudge\s*\{[^}]*display:\s*none/);
  });
});

describe('no cloud-native microservices pitch in offer copy', () => {
  const pattern = /cloud[\s-]?native|micro[\s-]?services?/i;

  it('is absent from public pages, partials, chatbot knowledge, and js', () => {
    const files = [
      ...fs.readdirSync(ROOT).filter((n) => n.endsWith('.html') && !n.startsWith('prototype-')),
      ...fs.readdirSync(path.join(ROOT, 'partials')).map((n) => `partials/${n}`),
      ...fs.readdirSync(path.join(ROOT, 'chatbot-knowledge')).map((n) => `chatbot-knowledge/${n}`),
      ...fs.readdirSync(path.join(ROOT, 'js')).filter((n) => n.endsWith('.js')).map((n) => `js/${n}`),
    ];
    for (const rel of files) {
      let text = read(rel);
      if (rel === 'about.html') {
        // Karl's own background (past enterprise work) may name it; the offer may not.
        text = text.replace(/<div class="profile-intro">[\s\S]*?<\/div>/, '');
      }
      assert.doesNotMatch(text, pattern, rel);
    }
  });
});

describe('no priced maintenance, support or retainer offers', () => {
  const monthlyPrice = /(€|&euro;|EUR\s?)\s?[\d,.]+k?\s*(\+\s*VAT\s*)?(\/\s?(mo|month)\b|per\s+month|a\s+month|monthly|p\/m\b)/i;
  const pricedUpkeep = /(maintenance|retainer|support)[^.\n]{0,60}(€|&euro;|EUR\s?)\s?\d|(€|&euro;|EUR\s?)\s?\d[^.\n]{0,40}(maintenance|retainer|support)/i;

  function walk(dir, exts) {
    const out = [];
    for (const e of fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
      const rel = path.join(dir, e.name);
      if (e.isDirectory()) out.push(...walk(rel, exts));
      else if (exts.some((x) => e.name.endsWith(x))) out.push(rel);
    }
    return out;
  }

  it('does not appear in any served page, partial, demo, js, or chatbot knowledge', () => {
    const files = [
      ...fs.readdirSync(ROOT).filter((n) => n.endsWith('.html') && !n.startsWith('prototype-')),
      ...walk('partials', ['.html']),
      ...walk('demos', ['.html', '.js']),
      ...walk('js', ['.js']),
      ...walk('chatbot-knowledge', ['.md']),
    ];
    for (const rel of files) {
      const text = read(rel);
      assert.doesNotMatch(text, monthlyPrice, rel);
      assert.doesNotMatch(text, pricedUpkeep, rel);
    }
  });

  it('keeps the neutral support line on home', () => {
    assert.match(read('index.html'), /Optional support, quoted case by case\./);
  });
});
