# 0008 — Engine layer: `Engine` interface, UCI client, Stockfish worker

Status: accepted; amended by [0014](0014-single-threaded-engine-on-webkit.md) (no threads on WebKit)

## Context

Analysis must never block the UI, must never show the result of a search the user has already replaced, must run the strongest engine the device can afford, and must not tie features to Stockfish: swapping or adding an engine should not touch anything above `engine/`.

## Decision

- **`Engine` interface** (`engine/types.ts`) is the whole contract: `load`, `configure`, `analyze(position, {limits, multiPv}) → Search`, `stop`, `dispose`, plus `status`, `bounds` and `subscribe` (status, load progress, errors). A `Search` is an async stream of `info` events ending in exactly one `bestmove`, plus `done` and `stop()`. Nothing in it mentions Stockfish or UCI; scores and moves are core's `Score` and `Move`.
- **Every search is tagged.** `analyze` assigns a `SearchId` that is on every event. Searches run one at a time: a new `analyze` stops the running search and sends `position`/`go` only after the old `bestmove` has arrived, so engine output is attributed to the right search by construction, not by filtering. A search replaced before it started never reaches the engine; the replaced one ends with `reason: 'superseded'` (its move must not be shown). Late output after a `bestmove` is dropped. All failures, including a crash or bad limits, are delivered as `bestmove` events with `reason: 'failed'`; `analyze` does not throw.
- **Typed UCI client, separate from the engine.** `uci/parse.ts` turns lines into a `UciMessage` union (never throws, ignores unknown fields), `uci/commands.ts` serialises commands (rejecting line breaks, so a FEN cannot inject a command), `uci/client.ts` adds the handshake and `isready` sync over a small `UciTransport` (line in, line out, errors, terminate). `UciEngine` implements `Engine` for any UCI engine given a `connect()` that returns a transport. **Adding an engine** is either another `connect()` (another binary, a native process in tests) or, for a non-UCI engine, a direct `Engine` implementation.
- **Stockfish 19 adapter** (`engine/stockfish/`) uses the `stockfish` (nmrugg) npm builds: Lite (~1.7 MB) and Full (~94 MB), each multi-threaded and single-threaded. `scripts/fetch-engine.mjs` copies them from `node_modules` into `public/engine/` on install and before dev/build (git-ignored; `ENGINE_SIZES=lite` skips Full). The wasm is downloaded on the **main thread** (progress, size check) and stored in Cache Storage, so the Full engine is downloaded once; an incomplete cache entry is discarded.
- **Worker wrapper instead of the URL hash.** Stockfish.js can read the wasm location from its script URL's `#hash`, but Safari refuses to start a worker whose URL has a fragment under COEP. The transport therefore starts a tiny blob worker that redirects the engine's single `fetch` to the cached wasm blob and then `importScripts` the engine. Thread workers re-run the same wrapper. Verified in Chromium, Firefox and WebKit (desktop, phone and tablet profiles).
- **Capabilities** (`capabilities.ts`): threads need cross-origin isolation and `SharedArrayBuffer`; otherwise the single-threaded build is used. Defaults leave a core to the UI, cap threads (8 desktop, 2 phone) and hash (64 MB desktop, 16 MB phone or low memory); bounds cap the settable values. Lite is always the default; `fullEngineWarnings` tells the UI when to warn before Full (phone, little memory, no threads).
- **Settings apply at the next search.** `configure` clamps to `bounds`; `Threads`, `Hash` and `MultiPV` are sent, and confirmed with `isready`, right before `go`, only when they changed.
- **Synchronous transports.** The search is registered before `go` is sent, because the Node build answers inside `send`; found by running the real engine in tests.

## Consequences

- Tests cover the parser with recorded Stockfish 19 output (`scripts/record-uci-fixtures.mjs`), the lifecycle with a scripted transport, mates in 1, 2 and 3 (and being mated, checkmate, stalemate, MultiPV, restart) against the real engine in Node, and the whole stack in three browser engines (`e2e/engine.spec.ts`, which uses the Vite dev server because there is no engine UI yet).
- `dist/` contains about 200 MB of Full builds. A host with a file-size limit can build with `ENGINE_SIZES=lite` (Full then fails to load with a clear error) or serve `engine/` elsewhere via the `baseUrl` option.
- A background tab pausing a search is the analysis feature's job: it calls `stop()` on `visibilitychange` and `analyze()` again on return.
- The Node build of Stockfish is a module-level singleton; the test transport loads a fresh copy per instance.
