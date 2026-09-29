# Phase 0 brief — Provider and playback research

Status: **Briefed — ready for planning (2026-09-30)**

## Outcome

The owner knows, with evidence, how Toasty can play TIDAL and Spotify at full length as a
stand-alone Linux app, which path to build first for each, and what audio architecture
every source should feed. Spotify full-length playback is proven on the owner's own
Premium account. Phase 1 can be planned against decisions, not guesses.

This is a research phase: no app code changes. Everything lands in `docs/research/`,
`docs/decisions/`, the Phase 1 brief, and throwaway spikes in `spikes/`.

## Background

- Decision 0001: private use; unofficial client paths are allowed within its limits.
- The prototype plays TIDAL through the official `@tidal-music/player` SDK (30-second
  previews for third-party apps) and local files through an `HTMLAudioElement`. See
  `CLAUDE.md`, "Current code".
- The owner has Spotify Premium; **no active TIDAL subscription right now**, so TIDAL
  full-length paths can be researched and prepared but not tested.
- Reported symptoms: TIDAL login is "wonky" and search "breaks often". Known from the
  code: tokens are never refreshed, an expired token is restored without a check, the
  country code is hardcoded to `US`.

## Required scope

### R1 — TIDAL (`docs/research/tidal.md`)

- The official platform today: developer portal, OpenAPI v2, `@tidal-music/*` SDKs, auth
  flows, scopes, rate limits, what playback third-party apps get. Any sign of a change to
  the preview-only rule.
- Every known full-length path used by open-source clients (e.g. the `tidalapi` Python
  library and the players built on it, TIDAL desktop wrappers, others found on GitHub):
  how auth works (device code, PKCE, client IDs), stream formats and qualities
  (FLAC, DASH, encryption types), which of them respect decision 0001's limits, how
  stable they have been (breakages, dates), known account actions.
- Why today's login and search are flaky, with evidence from the code and the API
  (reproduce what can be reproduced without a subscription — catalog search may work
  without one).
- Recommendation: the catalog/search layer and the full-length playback path to build,
  and what can be built and tested before the owner resubscribes.

### R2 — Spotify (`docs/research/spotify.md`)

- Official platform after the February 2026 changes: Web API endpoints still available in
  developer mode, auth (PKCE, refresh), limits.
- Stand-alone playback options: librespot (Rust, embeddable — the prime candidate),
  its forks and derivatives, anything else current. For each: auth (OAuth vs stored
  credentials), audio formats and quality, how audio can be taken as PCM into our own
  pipeline, maintenance health, breakage history, known account actions.
- Confirm or refute that the Web Playback SDK cannot run in Tauri's Linux webview.
- Recommendation: the path to build in Phase 2.

### R3 — Spotify spike (`spikes/spotify-librespot/`)

- A minimal, time-boxed proof in Rust: log in with the owner's Premium account and play
  one full-length track on the owner's Linux machine, audio handed to our own sink (not
  librespot's default backend) so it proves the PCM path the engine will need.
- The owner runs it (credentials are theirs; the agent never sees them). The plan says
  exactly how.
- Findings recorded in `docs/research/spotify.md`. The spike itself is deleted at close
  unless Phase 1's brief adopts it.

### R4 — Audio engine (`docs/research/audio-engine.md`)

- Where decoding and output should live: webview audio (`HTMLAudioElement`/Web Audio) vs
  a Rust pipeline (e.g. symphonia + cpal/rodio, or GStreamer) that local files, Spotify
  PCM and TIDAL streams all feed.
- Judge against the vision: gapless across sources, one volume/EQ, real audio data for
  visualizations (FFT to the UI at 60 fps), latency of controls, streaming large local
  files (today's `readFile` → Blob loads whole files into memory), Linux audio
  (PipeWire/Pulse/ALSA), effort.
- How each provider path from R1/R2 plugs in; what happens to the official TIDAL SDK path
  (it plays in the webview only).

### R5 — Decisions and Phase 1 input

- Proposed decision records, at least: Spotify playback path, TIDAL playback path
  (including the interim before resubscribing), audio engine architecture, provider
  boundary shape (what every provider implements).
- A "Decisions from Phase 0" section added to `docs/phases/01-foundation-rebuild/BRIEF.md`
  that turns the accepted recommendations into Phase 1 scope.

## Acceptance criteria

- **AC1** `docs/research/tidal.md` covers R1; every claim about an API, library or policy
  cites a source (URL, repo + file, or captured response) and the date checked.
- **AC2** `docs/research/spotify.md` covers R2 and the spike's findings (R3) with the
  same citation rule.
- **AC3** The owner has heard a full-length Spotify track through the spike, played via
  our own sink — or the phase explains exactly why it's not possible and what the
  alternatives are.
- **AC4** `docs/research/audio-engine.md` covers R4 and ends in one recommendation with
  its trade-offs.
- **AC5** Each research document ends with a ranked options table (path, full-length?,
  quality, stand-alone?, fits decision 0001?, stability, effort) and a clear
  recommendation.
- **AC6** Proposed decision records exist for R5's topics, and the Phase 1 brief has its
  "Decisions from Phase 0" section.
- **AC7** No changes under `src/` or `src-tauri/`; no secrets or tokens in any committed
  file; no provider audio saved to disk.

## Out of scope

Building providers or the engine into the app (Phase 1–2). TIDAL full-length
implementation (parked until a subscription). UI work.
