import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { listHtmlPages } = require('./helpers.js');

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');
const IMAGE = 'bespoke-ai-site-smoke:local';
const CONTAINER = 'bespoke-ai-site-smoke';
const PORT = process.env.SMOKE_PORT || '18080';

function run(cmd, args, opts = {}) {
  const res = spawnSync(cmd, args, { stdio: 'inherit', ...opts });
  if (res.status !== 0) {
    throw new Error(`${cmd} ${args.join(' ')} failed with ${res.status}`);
  }
}

function cleanup() {
  spawnSync('docker', ['rm', '-f', CONTAINER], { stdio: 'ignore' });
}

cleanup();
run('docker', ['build', '-t', IMAGE, ROOT]);
run('docker', [
  'run',
  '-d',
  '--name',
  CONTAINER,
  '-p',
  `${PORT}:8080`,
  IMAGE,
]);

const pages = listHtmlPages(ROOT);
const failures = [];

try {
  let ready = false;
  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/`);
      if (res.ok) {
        ready = true;
        break;
      }
    } catch {
      // retry
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  if (!ready) throw new Error('Site container did not become ready');

  for (const rel of pages) {
    const pageUrl =
      rel === 'index.html'
        ? `http://127.0.0.1:${PORT}/index.html`
        : `http://127.0.0.1:${PORT}/${rel}`;
    const res = await fetch(pageUrl, { redirect: 'follow' });
    if (!res.ok) {
      failures.push(`${rel} → HTTP ${res.status}`);
    }
  }
} finally {
  cleanup();
}

if (failures.length) {
  console.error('Docker smoke failures:\n' + failures.join('\n'));
  process.exit(1);
}

console.log(`Docker smoke OK (${pages.length} HTML pages)`);
