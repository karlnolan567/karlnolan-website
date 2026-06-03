# Karl Nolan Ltd — Website

Static portfolio site for [Karl Nolan Ltd](https://karlnolan.ltd).

## Local preview

```bash
python3 -m http.server 8765
```

Open http://127.0.0.1:8765/

## Deploy with GitHub Pages

1. Create a new repository on GitHub (or use this repo).
2. Ensure `index.html` is at the repository root.
3. Go to **Settings → Pages** in your repository.
4. Under **Build and deployment**, set the source to **Deploy from a branch** (usually `main`).
5. Select the `/ (root)` folder and click **Save**. Your site will be live in less than a minute.

The site URL will be `https://<username>.github.io/<repository-name>/` unless you configure a custom domain.

## Customize

Edit the `SITE` object at the bottom of `index.html` for contact email, LinkedIn URL, and canonical URL.

Profile photo: `images/Karl Nolan.jpeg`
