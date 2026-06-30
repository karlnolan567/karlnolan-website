# Bespoke Core AI Engineering Limited — Website

Static portfolio site for **Bespoke Core AI Engineering Limited** (Limerick, Ireland).

Live preview: [http://178.104.254.165/](http://178.104.254.165/)  
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

## Deploy

The site is static HTML at the repository root (`index.html`, `workshop.html`, `css/styles.css`, `js/`, `partials/`, `images/`). Deploy only those public assets — not `docs/` or `node_modules/`.

Edit [`css/styles.css`](css/styles.css) directly before deploying if you changed styles.

### GitHub Pages

1. Ensure `index.html` is at the repository root.
2. Go to **Settings → Pages** → deploy from `main`, `/ (root)`.

### VPS (nginx)

```bash
ssh root@178.104.254.165
```

Sync `index.html`, `workshop.html`, `css/styles.css`, `js/`, `partials/`, and `images/` to the web root on the server.

## Customize

Edit the `SITE` object in [`js/site-config.js`](js/site-config.js) for contact email, LinkedIn URL, canonical URL, and form links.

Discovery call requests use [FormSubmit](https://formsubmit.co/) (no backend). On the **first** submission, FormSubmit emails `contactEmail` an activation link — click it once so future requests are forwarded.

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

