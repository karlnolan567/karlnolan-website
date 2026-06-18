# Bespoke AI Workflow Engineering Ltd — Website

Static portfolio site for **Bespoke AI Workflow Engineering Ltd** (Limerick, Ireland).

Live preview: [http://178.104.254.165/](http://178.104.254.165/)  
Planned domain: `ai-development.ie` (when registered)

## Local preview

```bash
python3 -m http.server 8765
```

Open http://127.0.0.1:8765/

## Local docs (not in git)

The `docs/` folder is for local working files only (business case, CV drafts, outreach templates). It is listed in `.gitignore` and is **not** committed or deployed.

## Deploy

The site is static HTML at the repository root (`index.html`, `images/`). Deploy only those public assets — not `docs/`.

### GitHub Pages

1. Ensure `index.html` is at the repository root.
2. Go to **Settings → Pages** → deploy from `main`, `/ (root)`.

### VPS (nginx)

Sync `index.html` and `images/` to the web root on the server.

## Customize

Edit the `SITE` object at the bottom of `index.html` for contact email, LinkedIn URL, canonical URL, and `googleFormUrl` (your Google Form link).

Lead intake setup (Google Form, Apps Script, outreach email snippets): see `lead-intake/SETUP.txt`.

Profile photo: `images/Karl Nolan.jpeg`
