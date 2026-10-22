# 0013 — Local release, LAN access and the tablebase

Status: accepted; amended by [0014](0014-single-threaded-engine-on-webkit.md) (an iPad gets one thread over HTTPS too)

## Context

The first release is run locally, from the production build, on a desktop and — over the local network — on a tablet. Hosting is a later step. Two browser rules shape this: `SharedArrayBuffer` (multi-threaded Stockfish) needs cross-origin isolation, and cross-origin isolation, Cache Storage and `navigator.clipboard` need a _secure context_. `localhost` is one; `http://192.168.x.x` is not.

## Decision

- **`npm run preview` listens on all interfaces** and prints the LAN address (`host: true`, `allowedHosts: true` in `vite.config.ts`; the bundle is static and holds nothing secret). `npm run dev` does the same.
- **Plain HTTP on the LAN works, in single-threaded mode.** The page cannot be cross-origin isolated there, so `detectCapabilities` reports no threads and the app uses the single-threaded build; nothing else changes. The Full engine is not cached between visits in that mode (no Cache Storage), the copy buttons report that copying failed rather than throwing, and saved-board ids fall back to a random string. All three were already written for an insecure context; `e2e/flows.spec.ts` now runs over a LAN address to keep it so.
- **`npm run preview:lan` serves HTTPS** with a self-signed certificate (`@vitejs/plugin-basic-ssl`, opt-in with `LAN_HTTPS=1`). The tablet shows a certificate warning once; after accepting it the page is a secure context, cross-origin isolated, with threads and a cached Full engine. This is for trying the multi-threaded engine on a tablet, not for hosting.
- **`E2E_BASE_URL=<url> npx playwright test`** runs the suite against a server that is already running (used for the LAN checks), without starting its own.
- **No tablebase lookup.** The Lichess tablebase would add exact results for positions of seven pieces or fewer, but it is a network call that sends the position to a third party. The product promise is that everything is computed in the browser and nothing leaves it; `e2e/flows.spec.ts` asserts the page makes no request to any other origin. An opt-in setting is possible later; shipping it in the first release would weaken the promise to buy a nice-to-have.

## Consequences

- A tablet on the LAN needs either HTTP (works, one thread) or HTTPS with a certificate exception (all features). The README says so.
- Any real host must send COOP/COEP and serve the wasm files; that list is in the README under "Hosting requirements".
