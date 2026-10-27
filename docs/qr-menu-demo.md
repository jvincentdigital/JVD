# 3D QR menu demo

`/[locale]/demo/qr-menu` shows a 3D dish (mofongo or café con leche) that bursts into a working QR code when tapped. The code points at `/[locale]/demo/menu`, a sample menu for a made-up restaurant ("La Fonda de Muestra"). The bar card in the Local Business section links to the demo. Both pages are `noindex` and not in the sitemap.

## How it is built

- `lib/burst-qr/` is a copy of the shared Burst QR engine. The canonical copy, README and "how to add an object" guide live in `/home/john/jvd-outputs/burst-qr/`. Do not edit the copy here: fix it there and copy it back. The folder is in `.prettierignore` so the two stay identical.
- three.js 0.160.0 is not a dependency. The engine loads it from `cdn.jsdelivr.net` (the `+esm` builds) only when the demo mounts. That is why `next.config.mjs` allows `https://cdn.jsdelivr.net` in `script-src`.
- `components/QrMenuDemo.tsx` holds the dish and style switches, the tap caption and Download PNG. The QR link is built from `window.location.origin`, so it works on localhost, previews and production.
- Copy lives in `messages/*.json` under `demo.qrMenu` and `demo.menu`, plus `local.demoLink`.

## Checking it

There is no GPU in headless test browsers, so the scene runs at about 3 frames a second there and a real tap takes about 15 seconds to finish. Decode the live canvas (`canvas.toDataURL()`) and the Download PNG with jsQR. Both should give the exact `/[locale]/demo/menu` URL in both styles and for both dishes.
