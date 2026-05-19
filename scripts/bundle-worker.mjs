/**
 * Post-build bundler for Cloudflare Workers deployment.
 *
 * @cloudflare/next-on-pages generates a multi-file worker:
 *   .vercel/output/static/_worker.js/index.js  (entry)
 *   .vercel/output/static/_worker.js/__next-on-pages-dist__/  (route modules)
 *
 * `wrangler deploy` (Workers) only uploads index.js — the dist directory
 * is never available at runtime, so every API call crashes with:
 *   "No such module __next-on-pages-dist__/functions/..."
 *
 * This script patches index.js to replace variable dynamic imports with a
 * static module map, then uses esbuild to bundle everything into one file:
 *   .vercel/output/static/_worker.bundled.js
 *
 * wrangler.toml points `main` at the bundled output.
 */
import { readFileSync, writeFileSync, readdirSync, existsSync, unlinkSync } from 'node:fs'
import { join, relative, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'
import { execSync } from 'node:child_process'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const WORKER_DIR = join(ROOT, '.vercel/output/static/_worker.js')
const DIST_DIR = join(WORKER_DIR, '__next-on-pages-dist__')
const INDEX_JS = join(WORKER_DIR, 'index.js')
const OUTPUT_FILE = join(ROOT, '.vercel/output/static/_worker.bundled.js')

// Run @cloudflare/next-on-pages if the worker output doesn't exist yet
// (happens when bundle-worker runs without a prior build step, e.g. `wrangler deploy` locally)
if (!existsSync(INDEX_JS)) {
  console.log('[bundle-worker] Worker not built yet — running @cloudflare/next-on-pages...')
  execSync('npx @cloudflare/next-on-pages', { stdio: 'inherit', cwd: ROOT })
}

function walk(dir, files = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) walk(full, files)
    else if (entry.name.endsWith('.js')) files.push(full)
  }
  return files
}

const distFiles = walk(DIST_DIR)
console.log(`[bundle-worker] Found ${distFiles.length} dist modules to inline`)

const importLines = []
const mapEntries = []

for (let i = 0; i < distFiles.length; i++) {
  const file = distFiles[i]
  // rel    = "__next-on-pages-dist__/functions/api/auth/check.func.js"
  // relDot = "./__next-on-pages-dist__/functions/api/auth/check.func.js"
  const rel = relative(WORKER_DIR, file)
  const relDot = './' + rel
  const varName = `__dist_mod_${i}__`
  importLines.push(`import * as ${varName} from ${JSON.stringify(relDot)};`)
  // Both forms appear in index.js: entrypoints use rel, cache calls use relDot
  mapEntries.push(`  ${JSON.stringify(rel)}: ${varName},`)
  mapEntries.push(`  ${JSON.stringify(relDot)}: ${varName},`)
}

let src = readFileSync(INDEX_JS, 'utf8')

// Patch 1: function/middleware dispatch.
// Matches: await import(e.entrypoint)
// The surrounding `let <varname>=` is NOT included — the minifier renames the
// variable between fresh and cached builds (e.g. `h` vs `d`), so we only
// replace the import call expression itself.
const P1_RE = /await import\(e\.entrypoint\)/
if (!P1_RE.test(src)) {
  const ctx = src.slice(Math.max(0, src.indexOf('entrypoint') - 60), src.indexOf('entrypoint') + 80)
  console.error('[bundle-worker] Context around "entrypoint":', JSON.stringify(ctx))
  throw new Error('[bundle-worker] Patch 1 failed: could not find "await import(e.entrypoint)"')
}
src = src.replace(P1_RE, '__resolveDynamicImport(e.entrypoint)')

// Patch 2: cache module loader.
// Matches: async function T(e){return import(e)}
const P2_BEFORE = 'async function T(e){return import(e)}'
const P2_AFTER = 'function T(e){return Promise.resolve(__resolveDynamicImport(e))}'
if (!src.includes(P2_BEFORE)) {
  const ctx = src.slice(Math.max(0, src.indexOf('import(e)') - 60), src.indexOf('import(e)') + 80)
  console.error('[bundle-worker] Context around "import(e)":', JSON.stringify(ctx))
  throw new Error('[bundle-worker] Patch 2 failed: could not find "async function T(e){return import(e)}"')
}
src = src.replace(P2_BEFORE, P2_AFTER)

const moduleMapCode = `
const __STATIC_MODULES__ = {
${mapEntries.join('\n')}
};
function __resolveDynamicImport(path) {
  const mod = __STATIC_MODULES__[path];
  if (mod) return mod;
  // Unknown paths (e.g. blob assets) return an empty module — callers catch errors
  return {};
}
`

const patchedEntry = join(WORKER_DIR, '_index_patched.mjs')
writeFileSync(patchedEntry, importLines.join('\n') + '\n' + moduleMapCode + '\n' + src)

const require = createRequire(import.meta.url)
const { build } = require('esbuild')

try {
  await build({
    entryPoints: [patchedEntry],
    outfile: OUTPUT_FILE,
    bundle: true,
    format: 'esm',
    platform: 'browser',
    target: 'es2022',
    minify: false,
    // Keep node built-ins as external — Workers runtime resolves them at runtime
    external: ['node:*', 'async_hooks'],
    logLevel: 'info',
  })
  console.log(`[bundle-worker] ✅ ${OUTPUT_FILE}`)
} finally {
  try { unlinkSync(patchedEntry) } catch {}
}
