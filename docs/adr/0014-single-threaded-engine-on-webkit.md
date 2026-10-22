# 0014 — Single-threaded engine on WebKit

Status: accepted

## Context

The multi-threaded Stockfish builds run on Emscripten pthreads: every engine thread is a nested Worker, synchronised with `Atomics.wait`/`notify` on shared memory. On WebKit (Safari, and every browser on iOS and iPadOS) the threaded engine sometimes stops answering when the device is busy: at start-up (no `uciok`), in the middle of a search (output stops) or at its end (no `bestmove`). The app then shows "Starting the engine…" or "Calculating…" until the page is reloaded. It showed up as WebKit-only flaky end-to-end tests in CI.

Measured by driving the Lite engine directly (the same blob-wrapper worker as `engine/stockfish/`) in 10 pages at once on Playwright's browsers:

| Browser  | Build                       | Runs | Hung |
| -------- | --------------------------- | ---- | ---- |
| WebKit   | multi-threaded, 1–7 threads | 172  | 4    |
| WebKit   | single-threaded             | 210  | 0    |
| Chromium | multi-threaded, 2–7 threads | 72   | 0    |
| Firefox  | multi-threaded, 7 threads   | 60   | 0    |

A likely cause is a lost-wakeup race in WebKit's `Atomics.wait`/`waitAsync` ([WebKit bug 248631](https://bugs.webkit.org/show_bug.cgi?id=248631)). It is outside this project either way.

## Decision

- `detectCapabilities` reports no threads on WebKit (a user agent with `AppleWebKit/` and no `Chrome/` or `Chromium/`), so Safari and every iOS browser use the single-threaded build, even when the page is cross-origin isolated.
- Nothing else changes: the threads control is hidden there and the Full engine warns that it will be slower, as in any browser without threads. COOP/COEP stay, because Chromium and Firefox need them for threads.

## Consequences

- On Safari and iOS the engine uses one core: slower, but it does not hang. On an iPad, `npm run preview:lan` (HTTPS) is still worth it for the cached Full engine and the clipboard, not for threads (amends ADR 0013).
- To re-check after a WebKit release: remove the WebKit check, then run `e2e/analysis.spec.ts` and `e2e/flows.spec.ts` on the four WebKit projects with `--repeat-each=3 --workers=8`. Before this change, 7 of about 110 such runs hung.
