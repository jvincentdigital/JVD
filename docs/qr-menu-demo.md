# 3D QR menu demo

`/[locale]/demo/qr-menu` shows a 3D dish (mofongo or café con leche) that bursts into a working QR code when tapped. The code points at `/[locale]/demo/menu`, a sample menu for a made-up restaurant ("La Fonda de Muestra"). The bar card in the Local Business section links to the demo. Both pages are `noindex` and not in the sitemap.

## How it is built

- `lib/burst-qr/` is a copy of the shared Burst QR engine. The canonical copy, README and "how to add an object" guide live in `/home/john/jvd-outputs/burst-qr/`. Do not edit the copy here: fix it there and copy it back. The folder is in `.prettierignore` so the two stay identical.
- three.js 0.160.0 is not a dependency. The engine loads it from `cdn.jsdelivr.net` (the `+esm` builds) only when the demo mounts. That is why `next.config.mjs` allows `https://cdn.jsdelivr.net` in `script-src`.
- `components/QrMenuDemo.tsx` holds the dish and style switches, the tap caption and Download PNG. The QR link is built from `window.location.origin`, so it works on localhost, previews and production.
- Copy lives in `messages/*.json` under `demo.qrMenu` and `demo.menu`, plus `local.demoLink`.

## Checking it

There is no GPU in headless test browsers, so the scene runs at about 3 frames a second there and a real tap takes about 15 seconds to finish. Decode the live canvas (`canvas.toDataURL()`) and the Download PNG with jsQR. Both should give the exact `/[locale]/demo/menu` URL in both styles and for both dishes.

## 3D QR gallery (`/[locale]/demo/qr-codes`), 2026-10-27

The sales page for every 3D-to-QR style, in English and Spanish, hidden from search like the menu demo. Linked from the QR menu demo ("More 3D QR styles").

- **Burst into a code** (`components/QrGallery.tsx`, 3D engine): mofongo and café con leche (codes open the sample menu), a studio mic and a game controller (codes open the site home). The controller is `padOffset` from `lib/burst-qr/objects/gear.js` with JVD-green lights (`palette.glow`).
- **Flip to a code** (plain CSS): a hangtag and a "Follow us" tile. First tap flips to the code, second tap opens the link, Escape flips back.
- **Generic only** (John, 2026-10-27): no client's brand, colours or logo (no Frecuencia, IMPerfect or Fluffcore/Rad), and no real social network logos.
- Engine files are copies of `/home/john/jvd-outputs/burst-qr/` (canonical). Fix things there and copy again.

### Categories and lab pieces (2026-10-27, later)

John asked for everything we have made, by category, on the lab branch only: Food & drink, Flowers & gifts, Fashion & merch, Music & media, Gaming, Social media. Client pieces carry a "Client work" badge (`client` in `OBJECTS` / `CATEGORIES`): Rad (Fluffcore), the IMPerfect team pad, two-tone, pro pad and keyboard + mouse, and the Frecuencia neon social tiles. **Remove every client piece before this page goes public** (John chose generic only for the public page). The flowers (Bloom QR, `public/lab/bloom-3d.html`) and the neon tiles (`public/lab/socials.html`) are whole demo pages shown in an iframe; `next.config.mjs` lets `/lab/*` be framed by this site only (`frame-ancestors 'self'`), everything else stays `'none'`.
