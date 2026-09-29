# Phase 1 brief — Foundation rebuild

Status: **Briefed — scope to be finalised by Phase 0's decisions.** Not ready for planning
until the "Decisions from Phase 0" section below is filled in and accepted.

## Outcome

Toasty runs on a structure that can carry the whole vision. Everything that works in the
prototype still works — better — and the pieces every later phase builds on exist: one
queue engine, one audio engine, a provider boundary, and tooling that catches breakage.
The UI stays plain on purpose; Phase 3 redesigns it.

## Required scope

### Structure

- Replace the prototype's layout with a structure organised around the domain: a core
  (source-agnostic types, the queue engine, playback state), providers (one module per
  source behind a common boundary), the audio engine (per the Phase 0 decision), and a
  thin UI shell. The plan proposes the concrete layout; `CLAUDE.md` documents it at close.
- Rename the project from `tidal-tauri-client` to Toasty everywhere it's an identifier
  (npm package, Rust crate and lib, window title, bundle metadata).

### Playback and queue

- One queue engine with unit tests: play from a context, play next, add to queue, remove,
  clear, reorder, previous/next, repeat off/all/one, shuffle that actually shuffles, and
  cross-source transitions. The queue panel reads the real queue — no second model kept
  in sync by hand.
- Volume works for every source. Seek, position and duration are correct for every source.
- Local files stream instead of loading whole files into memory.

### Providers

- **Local:** the current capability (a configured folder, played in full) moved behind
  the boundary. The folder is configurable rather than hardcoded. (Recursive scanning,
  tags and the library database are Phase 4.)
- **TIDAL:** login that survives restarts and token expiry (refresh, expiry detection, a
  clear signed-out state), search that fails visibly and recovers, response mappers
  tested against saved real responses. Playback on the best path available without a
  subscription (per Phase 0), with the full-length path prepared behind the boundary if
  Phase 0 recommends it.
- Spotify is Phase 2, but the boundary must fit what Phase 0 found about it.

### Tooling

- `npm run check` grows to: typecheck, ESLint, unit tests (Vitest), `cargo clippy -D
  warnings`, `cargo test`. `--quick` stays fast.
- Fixtures for provider responses under `tests/fixtures/<provider>/`, scrubbed.

### Clean-up

- Delete prototype code, styles and assets that the new structure doesn't use, the mock
  search data, and any doc the phase makes stale. Update `CLAUDE.md`'s code map.

## Acceptance criteria

To be completed with Phase 0's decisions. At minimum:

- **AC1** Parity: every behaviour listed under "Current code" in `CLAUDE.md` that works
  today works after the rebuild (manual smoke list).
- **AC2** Queue engine behaviours above are unit-tested and pass.
- **AC3** Volume, shuffle and repeat work for local and TIDAL tracks.
- **AC4** TIDAL: signing in once survives an app restart and an expired access token;
  a failed search shows an error and the next search works.
- **AC5** `npm run check` runs the full tool set and passes.
- **AC6** No prototype leftovers: no unused modules, the old queue model gone, the project
  renamed.

## Decisions from Phase 0

_To be added by `/close-phase` of Phase 0 and accepted by the owner: audio engine,
provider boundary, TIDAL interim and full-length path, anything from the Spotify spike
Phase 1 must accommodate._

## Out of scope

Spotify (Phase 2), visual design (Phase 3), library database, tags, watched folders
(Phase 4), playlists (Phase 5), visualizations (Phase 6).
