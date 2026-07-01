# Bespoke Core AI Engineering Limited — Website

Static portfolio site for **Bespoke Core AI Engineering Limited** (Limerick, Ireland).

Live site: [http://135.181.39.41/](http://135.181.39.41/)  
n8n editor: [http://135.181.39.41:5678/](http://135.181.39.41:5678/)  
Planned domain: `ai-development.ie` (when registered)

## Local preview

```bash
python3 -m http.server 8765
```

Open http://127.0.0.1:8765/

Use a local HTTP server (not `file://`) so shared header/footer partials load correctly.

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

The site runs in Docker: Caddy edge proxy + static site container. Production URLs are set via `.env` (see [`.env.example`](.env.example)); the entrypoint renders [`js/site-config.js`](js/site-config.js) from [`js/site-config.template.js`](js/site-config.template.js) at container start. n8n runs separately at `/opt/n8n` on the same host; Caddy proxies `/webhook/*` to it.

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

Open http://135.181.39.41/ and verify pages, header/footer partials, CSS, and images load.

### Update after changes

```bash
cd /opt/web_site
git pull
docker compose up -d --build
```

To change webhook or canonical URLs without rebuilding, edit `.env` and run `docker compose up -d` (entrypoint re-renders `site-config.js`).

### Smoke test checklist

- [ ] Home page loads at `http://135.181.39.41/`
- [ ] Header/footer partials render
- [ ] Workshop and sub-pages work
- [ ] Chat widget and booking webhooks respond

### DNS cutover (when domain is ready)

1. Point A record to `135.181.39.41`
2. Add domain block to [`docker/Caddyfile`](docker/Caddyfile) for automatic HTTPS
3. Update `.env` to `https://yourdomain.ie/...`
4. Update hardcoded canonical/og tags in HTML (separate pass)

### GitHub Pages

1. Ensure `index.html` is at the repository root.
2. Go to **Settings → Pages** → deploy from `main`, `/ (root)`.

## Customize

Edit the `SITE` object in [`js/site-config.js`](js/site-config.js) for contact email, LinkedIn URL, canonical URL, and form links.

Discovery call bookings use an n8n workflow with **Google Calendar** and **Gmail** (see [`n8n/SETUP.txt`](n8n/SETUP.txt) → Discovery Call Booking). Configure `bookingUrl` and `bookingSuccessUrl` in [`js/site-config.js`](js/site-config.js).

Lead intake setup (Google Form, Apps Script, outreach email snippets): see `lead-intake/SETUP.txt`.

Profile photo: `images/Karl Nolan.jpeg`

## Ask BCAI chatbot

The **Ask BCAI** widget calls an n8n workflow (see [`n8n/SETUP.txt`](n8n/SETUP.txt)). Knowledge comes from markdown files in a Google Drive folder — not from the live site HTML.

### Local n8n (development)

Workflow development and testing use the Docker stack in `~/src/n8n-test-project` (see also [`n8n/LOCAL-DEV.txt`](n8n/LOCAL-DEV.txt)).

| | |
|---|---|
| **URL** | http://localhost:5678 |
| **Email** | test@test.com |
| **Password** | `@Passw0rd@` |

Import or sync the workflow from [`n8n/bcai-website-chatbot.workflow.json`](n8n/bcai-website-chatbot.workflow.json). When happy, export from local n8n and promote to production (delete old prod workflow → clean import — see `n8n/SETUP.txt`).

When site content changes, regenerate and re-upload to Drive:

```bash
python3 scripts/html_to_knowledge_md.py
```

Then upload everything in [`chatbot-knowledge/`](chatbot-knowledge/) to the Drive folder (`SITE.googleDriveKnowledgeFolderId` in [`js/site-config.js`](js/site-config.js)).

Prefer **short summary files** in Drive (not full page copies) — the whole folder is injected into the LLM prompt and affects response speed.

