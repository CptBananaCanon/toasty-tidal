# Roadmap

The whole destination is visible so decisions can support it. Work happens one phase at
a time; only the phase named in `CURRENT_PHASE.md` is active.

Phase status: `proposed → briefed → planning → approved → implementing → closing → done`
(or `parked`). A phase is done when the owner merges its branch.

| # | Phase | Status | Depends on |
|---|---|---|---|
| 0 | Provider and playback research | **Briefed — next to plan** | — |
| 1 | Foundation rebuild | Briefed (finalised by Phase 0's decisions) | 0 |
| 2 | Spotify | Proposed | 1 |
| 3 | UI rebuild from Claude Design | Briefed; design track runs in parallel from now | 1 |
| 4 | Local library | Proposed | 1 |
| 5 | Playlists | Proposed | 1, 4 |
| 6 | Visualizations | Proposed | 1 (audio engine) |
| 7 | Desktop polish | Proposed | 1 |
| — | TIDAL full-length playback | Parked — needs an active TIDAL subscription to test | 0, 1 |

Order after Phase 1 can change; the owner decides when a phase is opened. Briefs for
proposed phases are written (by the architect, in the Toasty project chat) when they
become next.

## Phase 0 — Provider and playback research

Find every way to get full-length playback from TIDAL and Spotify on Linux inside a
stand-alone Tauri app, rank them, and prove the best Spotify path with a spike on the
owner's Premium account. Decide the audio engine architecture (webview audio vs a Rust
pipeline every source feeds). Explain why today's TIDAL login and search are flaky.
Output: `docs/research/`, decision records, Phase 1's brief finalised. No app code.

Brief: `phases/00-provider-research/BRIEF.md`

## Phase 1 — Foundation rebuild

Rebuild the app on a structure that holds the whole vision: domain core, one queue
engine, provider boundary, the audio engine chosen in Phase 0, local and TIDAL providers
ported to it, a stable TIDAL layer (token refresh, tested mappers), real tooling
(`npm run check` with lint, unit tests, clippy). The UI stays plain on purpose. Parity
with everything that works today, plus volume, shuffle and repeat that work.

Brief: `phases/01-foundation-rebuild/BRIEF.md`

## Phase 2 — Spotify

Spotify as a full provider: login, search, library (saved tracks, albums, playlists),
full-length stand-alone playback on the path Phase 0 proved, in the shared queue.

## Phase 3 — UI rebuild from Claude Design

The owner designs Toasty in Claude Design (design track starts now, in parallel); this
phase imports the resulting design system as `DESIGN.md` + tokens and rebuilds every
screen against it. Adds a design-checker agent.

Brief: `phases/03-ui-rebuild/BRIEF.md`

## Phase 4 — Local library

Watched folders, recursive scanning, tag and artwork reading, a local library database,
album/artist/track views merged with streaming favourites, drag-and-drop files.

## Phase 5 — Playlists

Toasty playlists across sources: create, rename, reorder, delete; add from anywhere;
playlist from album; import/sync streaming playlists where the provider allows.

## Phase 6 — Visualizations

GPU visualizations (three.js or similar) fed by real audio data from the engine;
fullscreen and in-player modes.

## Phase 7 — Desktop polish

MPRIS and media keys, tray, mini player, keyboard shortcuts, EQ, gapless verification,
startup performance, packaging.

## TIDAL full-length playback (parked)

Implement Phase 0's recommended TIDAL full-length path. Parked until the owner has an
active TIDAL subscription; until then TIDAL runs on whatever Phase 1 can support
(official-SDK previews at minimum).
