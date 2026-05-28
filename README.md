# Ayush Patra Photography

A personal photography portfolio and private studio management tool. Built with Next.js 15 and deployed to Cloudflare Pages, with photos stored in Cloudflare R2.

Live at [@patrasarchive](https://www.instagram.com/patrasarchive/) on Instagram.

---

## What it does

**Public gallery** (`/`) — A full-screen, masonry-style gallery of photographs. Photos load progressively in batches of 12 so the page stays fast even with hundreds of images. Each tile shows a shimmer placeholder while the image loads, then fades in cleanly. Clicking any photo opens a lightbox with keyboard navigation (arrow keys, Escape).

**Studio** (`/studio`) — A password-protected upload and management interface. Drag-and-drop photo uploads with per-photo metadata: caption, location, date, camera, and tags. Photos can be deleted from the studio grid. The session lasts 7 days and is signed with HMAC-SHA-256.

---

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 15 (App Router) |
| Runtime | Cloudflare Pages (edge) |
| Storage | Cloudflare R2 |
| Adapter | `@cloudflare/next-on-pages` |
| Language | TypeScript |
| Animation | GSAP (hero only) |

---

## Project structure

```
src/
  app/
    page.tsx              # Public gallery page
    studio/page.tsx       # Studio page (password-protected)
    api/
      auth/               # Login, logout, session check
      photos/             # List, upload, delete photos
      photos/[id]/image/  # Serve individual images from R2
  components/
    Gallery.tsx           # Masonry gallery with progressive loading
    Lightbox.tsx          # Full-screen photo viewer
    StudioPortal.tsx      # Upload + management UI
    Grain.tsx             # Film grain overlay (OffscreenCanvas worker)
    Cursor.tsx            # Custom cursor with time-based lerp
  lib/
    auth.ts               # HMAC session signing and verification
    r2.ts                 # R2 manifest read/write helpers
public/
  grain-worker.js         # Web Worker for off-thread grain generation
```

---

## Local development

### Prerequisites

- Node.js 18+
- A Cloudflare account with an R2 bucket named `ayushpatraphotography-photos`
- Wrangler CLI (`npm i -g wrangler`) logged in via `wrangler login`

### Setup

```bash
npm install
```

Create a `.dev.vars` file in the project root (never commit this):

```
ADMIN_PASSWORD=your-password-here
AUTH_SECRET=a-long-random-secret-here
```

### Running locally

```bash
# Next.js dev server (hot reload, no edge runtime)
npm run dev

# Full Cloudflare Pages preview (edge runtime, R2 bindings)
npm run preview
```

`npm run dev` is faster for UI work. Use `npm run preview` when testing R2 uploads or auth, since it runs the actual Cloudflare edge runtime.

---

## Deployment

The site deploys to Cloudflare Pages. The build command is:

```bash
npx @cloudflare/next-on-pages
```

Set this in the Cloudflare Pages dashboard under **Settings > Build & deployments**.

### R2 bucket binding

In the Pages dashboard: **Settings > Functions > R2 bucket bindings**

| Variable name | R2 bucket |
|---|---|
| `R2_BUCKET` | `ayushpatraphotography-photos` |

### Environment secrets

In the Pages dashboard: **Settings > Environment variables** — add these for both **Production** and **Preview** environments:

| Variable | Description |
|---|---|
| `ADMIN_PASSWORD` | Password for the `/studio` login |
| `AUTH_SECRET` | Random secret used to sign session cookies (min 32 chars) |

Secrets must be set for both environments, not just Production. After saving, trigger a new deployment for the values to take effect.

---

## How photos are stored

Photos live in R2 as individual objects (e.g. `photos/abc123.jpg`). A single manifest file (`_manifest.json`) stores the metadata for all photos as a JSON array. On upload, the image is saved to R2 and the manifest is updated. On delete, both are removed.

The gallery fetches the full manifest once on page load (a small JSON file) and then loads images progressively as the user scrolls, so the edge function is never hit with dozens of concurrent requests at once.

---

## Authentication

The studio uses a single shared password. On login, the server signs a timestamp with HMAC-SHA-256 (using `AUTH_SECRET`) and sets it as an HttpOnly session cookie. The session is verified on every protected request and expires after 7 days. There are no user accounts or third-party auth dependencies.

---

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Next.js dev server on `localhost:3000` |
| `npm run preview` | Cloudflare Pages local preview |
| `npm run build` | Production build |
| `npm run typecheck` | TypeScript type check |
| `npm run lint` | ESLint |
| `npm test` | Vitest unit tests |
