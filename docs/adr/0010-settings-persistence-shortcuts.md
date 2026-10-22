# 0010 — Settings, versioned persistence, shortcuts and saved boards

Status: accepted

## Context

Users choose notation, auto-queen, engine size, themes and language, and keep named boards. All of it must survive a reload, and a later release must be able to change how it is stored without losing what people already saved. Keyboard shortcuts must work across features that may not import each other, and must not get in the way of assistive technology or typing.

## Decision

- **One migration mechanism.** `state/migrate.ts` exports `createMigrate({ version, migrations, sanitize })`, which builds the `migrate` function of a Zustand `persist` store. `migrations[n]` upgrades what version `n` wrote to version `n + 1`; a schema change is: bump `version`, add `migrations[oldVersion]`, add a test with the old payload. Data then always goes through `sanitize`, so corrupt, hand-edited or newer-than-known data is repaired field by field and never discarded wholesale. Zustand calls `migrate` only when the stored version differs, so every persisted store also sets `merge: createMerge(sanitize)`, which sanitizes data saved under the current version. Saved boards drop only the entries that are unusable (bad FEN, empty name, duplicate id).
- **Schema history is documented where it lives** (`state/savedBoards.ts`). Saved boards are at version 2: version 1 stored `{ id, name, fen, savedAt }`; version 2 adds `pgn` (the game up to the move on screen) and `orientation`. `state/savedBoards.test.ts` and `e2e/settings.spec.ts` write the exact version-1 payload to storage and check the boards still load, are upgraded, and keep working. That is the proof the mechanism does what it claims.
- **Stores.** `useSettings` (`nmc-settings`: notation, auto-queen, engine size, board theme, piece theme, shortcuts on/off), `useSavedBoards` (`nmc-saved-boards`). Theme and language keep their own stores because the theme is also read by an inline script before first paint. Every write goes through the same sanitizer as a migration.
- **`state` may import `board`**, only for the theme catalogue, so the persisted settings can validate theme ids. The alternative (state holding unchecked strings) lets a stale id from storage reach the board.
- **Notation** (`core/notation.ts`): standard algebraic, figurine (piece symbols) or UCI coordinates. Engine and game code always use SAN and `Move`; only the display goes through `formatMove`.
- **Auto-queen** is a `Board` prop (`autoPromote`), so the board stays controlled and knows nothing about settings.
- **Engine size.** Lite is the default. Picking Full asks first, naming the download size and listing the reasons it may be a poor idea on this device (phone, little memory, no threads). A changed size resets and disposes the analysis controller, so the next Calculate loads the chosen engine; the browser caches the Full download after the first time.
- **Shortcuts** (`ui/shortcuts`): one `keydown` listener for the page and a registry. Each feature registers its own shortcuts with `useShortcuts` (labels and group names already translated), the help dialog lists whatever is registered, and no feature imports another. Rules: nothing fires while the key press was already handled (`defaultPrevented`), inside fields and widgets that use the keyboard themselves (inputs, selects, sliders, radios, menus, dialogs), or with modifiers that were not asked for. Home and End are left to the page. Shortcuts can be turned off in the settings (WCAG 2.1.4, single-key shortcuts) and every shortcut action also exists as a button, so none is keyboard-only; the list opens from a header button as well as `?`.
- **Saved boards** keep at most 100 named boards (newest first), rename inline, delete after a confirmation, and load as one undo step.
- **Translations.** Dialog primitives take their close-button label as a prop (the `ui` layer cannot import i18n). `app/translations.test.ts` checks every registered namespace: same keys in en and pt-BR, same `{{placeholders}}`, no empty strings, nothing left in English.

## Consequences

- A new persisted store gets versioning and repair by using `createMigrate` and `createMerge`; forgetting a migration shows up as a failing test with the old payload, not as a user's lost data.
- Settings that only matter at use time (notation, themes) are read by the component that needs them from the store, so they update live without prop drilling.
- Single-key shortcuts exist, so the off switch is part of the product, not an option.
