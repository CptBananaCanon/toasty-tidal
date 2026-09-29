# Toasty

A private desktop music player for Linux: local files and streaming services (TIDAL,
Spotify) in one player — one library, one queue, one set of playlists. Built with Tauri v2,
React 18 + TypeScript and Rust. A private hobby project that is never distributed (see
`docs/decisions/0001-private-use-and-full-length-playback.md`).

**The repository is being rebuilt.** The code on `main` is a prototype with a weak
structure. Phase 1 (`docs/phases/01-foundation-rebuild/`) replaces it. Until then, the
"Current code" notes below describe what exists, not what should be copied.

## Read before planning or building

1. This file
2. `docs/VISION.md` — the destination
3. `docs/ROADMAP.md` — every phase and its status
4. `docs/WORKFLOW.md` — how phases are planned, built, reviewed and closed
5. `docs/CURRENT_PHASE.md` → the active phase's `BRIEF.md` (and `PLAN.md` once it exists)
6. `docs/decisions/` — accepted decisions; `docs/research/` — provider findings

The whole roadmap is context. Only the phase named in `docs/CURRENT_PHASE.md` is in scope.
Code is the source of truth: if a doc and the code disagree, trust the code and say so.

## Workflow

Phases run through `/plan-phase`, `/run-phase` and `/close-phase` with the agents in
`.claude/agents/` — see `docs/WORKFLOW.md`. Git rules, for every session:

- Work on a branch (`phase/<nn>-<slug>`, or `setup/…`/`fix/…` outside phases), never `main`.
- Commit freely on the branch; push the branch. Never push to `main`, merge, force-push or
  rewrite history — the owner merges.
- Never commit secrets. `.env.local` holds client IDs and credentials and stays untracked.

## Commands

    npm install
    npm run tauri dev          # the app (Vite on :1420 + Tauri window)
    npm run check -- --quick   # typecheck — inside a task
    npm run check              # full check (+ cargo check); "done" means this passes
    npm run tauri build        # .deb/.rpm

`npm run dev` alone runs the UI in a browser without Tauri APIs — rarely useful.
Linux audio needs GStreamer (good/bad/libav). `main.rs` sets `__NV_DISABLE_EXPLICIT_SYNC=1`
(NVIDIA workaround) — keep it.

Testing is deliberately minimal: unit tests only where a bug would be silent or
expensive (queue logic, provider response mappers against saved real responses,
token/expiry logic, parsers). No UI or end-to-end tests. Each phase ends with a short
manual smoke list for the owner — say plainly what you could not verify.

## Providers and playback

- Goal: full-length playback from every source on the owner's own paid subscriptions.
  Unofficial client paths (reverse-engineered APIs, librespot, other apps' client IDs) are
  allowed under ADR 0001, within its limits: stream only (no saving provider audio as
  files), no CDM/DRM (Widevine etc.) circumvention, no credential sharing, credentials
  only in `.env.local` or the OS keyring.
- Each source sits behind one provider boundary; a broken provider must never take down
  the others or local playback.
- Don't invent endpoints or response fields. Verify against docs, source of working
  open-source clients, or captured real responses (scrubbed of tokens) kept as fixtures.
- Never log tokens, codes or credentials.

## Current code (prototype, replaced in Phase 1)

- `src/features/player/usePlayer.ts` — the playback engine and the real queue
  (`Track[]` + `currentIndex`); dispatches on `track.source`: TIDAL via `@tidal-music/player`,
  local via one `HTMLAudioElement` fed Blob URLs from `plugin-fs readFile`.
- `src/features/queue/useQueue.ts` — display-only queue model; `App.tsx` keeps it in sync
  with the player by hand.
- `src/features/auth/*` + `src/lib/tidalPlayer.ts` — TIDAL PKCE login via a Rust loopback
  listener on 127.0.0.1:8898; two-phase SDK init (EventProducer hangs without credentials);
  no token refresh.
- `src/lib/tidalApi.ts` — TIDAL OpenAPI v2 search (JSON:API), mock results when signed out.
- `src-tauri/src/lib.rs` — `start_loopback_listener`, `scan_local_folder` (non-recursive;
  folder hardcoded in `useLocalFiles.ts`).
- Dev-only CORS workaround: a classic script in `index.html` rewrites TIDAL audio CDN
  fetches to a proxy in `vite.config.ts`. Needed for official-SDK playback in `tauri dev`.
- Not working: shuffle and volume are UI-only; next/previous ignore repeat.

While this code is live, don't change playback, auth or the queue outside a phase that
owns them. A phase that replaces them must keep or restore every behaviour that works
today before it closes.

## Conventions

- TypeScript strict; the check must pass. Rust: keep commands small and typed; logic that
  needs native access, performance or audio lives in Rust, everything else in TS.
- New native capability = command in Rust + registered handler + permission in
  `src-tauri/capabilities/`.
- Visual direction comes from Claude Design (Phase 3). Until `DESIGN.md` exists, UI work
  is functional and unstyled — don't invest in styling.
- No opportunistic refactors or dependency upgrades outside the phase plan; note them
  instead. Ask when a behaviour decision isn't settled by the brief or plan.
