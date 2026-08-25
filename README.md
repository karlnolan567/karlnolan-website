# Bespoke AI — Website

Static portfolio site for **Bespoke AI** (Bespoke Core AI Engineering Limited, Limerick, Ireland).

Live site: [https://www.bespoke-ai.ie/](https://www.bespoke-ai.ie/)

## Local preview

```bash
python3 -m http.server 8765
```

Open http://127.0.0.1:8765/

Use a local HTTP server (not `file://`) so shared header/footer partials load correctly.

## Tests

Link crawl (static server + header/footer partials) and Docker smoke:

```bash
npm ci
npx playwright install chromium   # CI / first time; local macOS uses system Chrome
npm test                          # unit + Playwright crawl (includes outbound with retries)
npm run test:docker-smoke         # requires Docker Desktop; build/run site image; GET every *.html
```

On push to `main`, GitHub Actions runs both checks and only then SSHs to the VPS to deploy. Outbound hosts that block bots (LinkedIn 999, Google Forms 401/403) count as reachable.

### Chat widget (GCP GenAI)

The site loads the Google Cloud assistant in an iframe (`SITE.chatEmbedUrl` / `CHAT_EMBED_URL`).

Optional local override: `cp js/site-config.local.js.example js/site-config.local.js` (gitignored) to point localhost at a different embed URL without editing the committed config.

## Styling

The site uses hand-authored CSS in [`css/styles.css`](css/styles.css) with semantic class names and CSS custom properties (design tokens). No build step or npm required.

Shared layout (header, footer) lives in [`partials/`](partials/) and is injected by [`js/includes.js`](js/includes.js). Page-specific behaviour is in [`js/site.js`](js/site.js) and inline scripts at the bottom of each HTML page.

To add a new page:

1. Copy the shell from `index.html` or `workshop.html` (bg-effects, page-shell, include placeholders).
2. Set `data-page` on `<body>` (`home` or `workshop` — or extend [`js/includes.js`](js/includes.js) for new page types).
3. Add page content inside `<main>`.

## Local docs (not in git)

The `docs/` folder is for local working files only (business case, CV drafts, outreach templates). It is listed in `.gitignore` and is **not** committed or deployed.

## Deploy (Docker — VPS `135.181.39.41`)

The site runs in Docker: Caddy edge proxy + static site container. Production URLs are set via `.env` (see [`.env.example`](.env.example)); the entrypoint renders [`js/site-config.js`](js/site-config.js) from [`js/site-config.template.js`](js/site-config.template.js) at container start. Chat and discovery booking run on Google Cloud (GenAI embed + Calendar appointments). This site does not call n8n.

### First-time setup on VPS

```bash
ssh root@135.181.39.41

# Install Docker (if needed)
curl -fsSL https://get.docker.com | sh

# Clone and configure
git clone <your-repo-url> /opt/web_site
cd /opt/web_site
cp .env.example .env

# Build and start
docker compose up -d --build
```

Open https://www.bespoke-ai.ie/ and verify pages, header/footer partials, CSS, and images load.

### Update after changes

```bash
cd /opt/web_site
git pull
docker compose up -d --build
```

To change webhook or canonical URLs without rebuilding, edit `.env` and run `docker compose up -d` (entrypoint re-renders `site-config.js`).

### Smoke test checklist

- [ ] Home page loads at `https://www.bespoke-ai.ie/`
- [ ] Header/footer partials render
- [ ] Workshop and sub-pages work
- [ ] Chat widget and discovery-call booking (Google Calendar embed) work

### DNS cutover (when domain is ready)

Run the interactive go-live wizard from the repo root (domain registration, DNS, Let's Encrypt, `.env`, Caddy, HTML tags, deploy, and smoke tests):

```bash
./scripts/go-live-domain-ssl.sh
```

See [`scripts/go-live-domain-ssl.sh`](scripts/go-live-domain-ssl.sh) for the full step-by-step procedure. Manual checklist:

1. Point A record to `135.181.39.41`
2. Add domain block to [`docker/Caddyfile`](docker/Caddyfile) for automatic HTTPS
3. Update `.env` to `https://yourdomain.ie/...`
4. Update hardcoded canonical/og tags in HTML (separate pass)

### GitHub Pages

1. Ensure `index.html` is at the repository root.
2. Go to **Settings → Pages** → deploy from `main`, `/ (root)`.

## Customize

Edit the `SITE` object in [`js/site-config.js`](js/site-config.js) for contact email, LinkedIn URL, canonical URL, and form links.

Discovery call bookings use a <strong>Google Calendar</strong> appointment schedule embedded on the home page. Configure `bookingScheduleUrl` / `BOOKING_URL` in [`js/site-config.js`](js/site-config.js) / `.env`.

Lead intake setup (Google Form, Apps Script, outreach email snippets): see `lead-intake/SETUP.txt`.

Profile photo: `images/Karl Nolan.jpeg`

## Ask BCAI (GCP)

The live chat widget is the Google Cloud GenAI embed. Update that assistant’s knowledge in GCP.

[`chatbot-knowledge/`](chatbot-knowledge/) is a local markdown export of public pages (no hidden training/workshops). Regenerate with:

```bash
python3 scripts/html_to_knowledge_md.py
```

Existing hand-tuned files are kept; pass `--force` to overwrite them from HTML. Use those files as source copy when updating the GCP agent.

