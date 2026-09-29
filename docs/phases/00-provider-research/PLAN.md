# Phase 00 plan — Provider and playback research

Status: **Reviewed**

<!--
Status values, in order: Draft → Reviewed → Approved by owner — <date> (the owner edits
this line) → Implementing → Implemented → Closed.
/run-phase refuses to start unless this line says "Approved by owner".
-->

## Outcome

The owner knows, with dated and sourced evidence, how Toasty can play TIDAL and Spotify
at full length as a stand-alone Linux app, which path to build first for each, and which
audio architecture every source should feed. Spotify full-length playback is proven on
the owner's Premium account through a spike whose PCM passes through our own sink.
Phase 1 is planned against proposed decision records and a filled-in "Decisions from
Phase 0" section, not guesses. No app code changes.

## Current state

Read on 2026-09-30 against `main` at `6466f0e`. `npm run check -- --quick` passes.

**TIDAL auth** (`src/features/auth/tidalAuth.ts`, `useAuth.ts`, `pkce.ts`,
`src/lib/tidalPlayer.ts`, `src-tauri/src/lib.rs`):

- PKCE via `login.tidal.com/authorize`, requested scope is only `user.read`
  (`pkce.ts` `buildAuthorizeUrl`). Whether that scope covers `searchResults` on OpenAPI
  v2 today is unverified — a flakiness candidate for T01/T02.
- Token exchange stores `access_token`, expiry and scopes in `localStorage`; the
  `refresh_token` is never read or stored, so nothing can refresh.
- `restoreSession()` applies the stored token without checking `tidal_token_expires`;
  if the expiry key is missing it invents "now + 1 h". An expired token is used as-is
  until the API rejects it.
- `start_loopback_listener` (Rust) binds 127.0.0.1:8898 and accepts **exactly one**
  connection in a thread that lives until something connects. A second sign-in attempt
  before a callback fails with "Failed to bind"; any stray request to the port (e.g. a
  favicon or pre-connect) would consume the one accept. Both are hypotheses for T02.
- The SDK bridge (`bridgeCredentials`) wipes the SDK's `tidal-creds` cache on every
  init and runs in the background with errors only logged; `EventProducer.init` is
  known to hang without credentials (comment in `tidalPlayer.ts`).
- Deep-link (`toasty-tidal://`) handling is kept as a second callback path.

**TIDAL search** (`src/lib/tidalApi.ts`, `src/features/search/useSearch.ts`):
`GET openapi.tidal.com/v2/searchResults/{query}` with a long `include` list,
`countryCode` hardcoded to `US`, `limit=20`. Non-2xx throws the raw body into the UI.
Signed out, it returns mock data. No retry, no 401 handling, no rate-limit handling.
Mappers are untested and read results from `included` filtered by the primary
relationships.

**Playback** (`src/features/player/usePlayer.ts`): TIDAL via `@tidal-music/player`
(webview, 30-second previews); local via one `HTMLAudioElement` fed Blob URLs from
`plugin-fs readFile` (whole file in memory). Dev-only CORS proxy for the TIDAL audio
CDN in `index.html` + `vite.config.ts`.

**Environment** (checked 2026-09-30): Node v26.8.1 (supports `--env-file`), cargo
1.95.0, PulseAudio-on-PipeWire 1.6.8, alsa-lib installed (needed by `cpal`). No
`spikes/` directory yet; `.gitignore` already ignores `spikes/**/target/` and
`spikes/**/node_modules/`. `npm run check` covers `src/` (tsc) and
`src-tauri/Cargo.toml` (cargo check) only, so spikes can't break it.

**Findings to carry forward, not fix here** (AC7 forbids `src/` changes):

- `tidalAuth.ts` logs the full callback URL (containing the authorization code), the
  OAuth `state` and a code prefix; `lib.rs` prints the callback request path with the
  code. This breaks `CLAUDE.md`'s "never log tokens, codes or credentials". Recorded in
  `tidal.md` as Phase 1 input.
- Because the dev console contains those codes, the owner's reproduction step (T04)
  asks for UI error text and HTTP statuses, never console dumps.

**Conflicts between brief, docs and code:**

1. `docs/WORKFLOW.md` says briefs are written by the architect; the Phase 1 brief says
   its "Decisions from Phase 0" section is "added by `/close-phase` of Phase 0"; this
   phase's brief (R5/AC6) asks the phase to add it. Resolution in this plan: T12 drafts
   the section during `/run-phase`, clearly marked *proposed, pending owner acceptance*,
   and `/close-phase` finalises it. The owner can take it to the architect before
   accepting.
2. Decision 0001 says the official TIDAL route is preview-only "as of April 2026" and
   that the Web Playback SDK can't run in WebKitGTK. Both are claims this phase must
   re-verify (R1, R2), not assume.
3. `CLAUDE.md` says the dev CORS workaround is "needed for official-SDK playback in
   `tauri dev`". Its future depends on R4; noted, not changed.
4. `.env.example` says "NEVER add TIDAL_CLIENT_SECRET here or to any client-side
   file", while T04 asks the owner to put `TIDAL_CLIENT_SECRET` in `.env.local`, which
   Vite reads. That's safe: `vite.config.ts` sets no `envPrefix`, so Vite exposes only
   `VITE_*` variables to the frontend, and the secret isn't `VITE_`-prefixed. The line in
   `.env.example` is about committed and client-side files, and `.env.local` is neither.
   The probe README says this is intentional. `.env.example` isn't changed in this
   phase.

## Approach

**Three research documents, one spike that proves Spotify, one probe that reproduces
TIDAL's catalog behaviour, then decisions.**

- `docs/research/tidal.md`, `spotify.md`, `audio-engine.md`. Every claim about an API,
  library or policy carries a source (URL, or repo + path + commit, or a capture file)
  and the date checked, and says whether it was verified or only claimed. Each ends with
  the ranked options table from AC5 (path, full-length?, quality, stand-alone?, fits
  decision 0001?, stability, effort) and one recommendation.
- **Identifiers are named, never written out.** Decision 0001 limit 4 keeps client IDs,
  secrets and tokens out of committed files and docs. So a client ID or secret is
  referred to only by where it lives: repo + path + commit (e.g. "the client ID constant
  in `<repo>/<path>` at `<commit>`") or the crate constant (librespot's client-ID constant,
  named by its identifier and file, not quoted). Its value is never copied into
  research docs, captures, decision records or spike source. Spikes that need one
  either import the crate constant or read it from the owner's environment at runtime.
  This applies to every task, and the reviews of T03, T04, T07 and T11 check it.
- **TIDAL probe** — `spikes/tidal-api-probe/`: a dependency-free Node script the owner
  runs with `node --env-file=.env.local …` (shell-agnostic; the owner uses fish). It
  reads `VITE_TIDAL_CLIENT_ID` and a `TIDAL_CLIENT_SECRET` (not `VITE_`-prefixed, so it
  can never be bundled into the frontend), gets a client-credentials token if the
  platform allows it for catalog, runs a fixed set of catalog searches (several queries,
  several `countryCode`s, the prototype's `include` list and a minimal one), and prints
  only HTTP status, rate-limit headers, timing and result counts. It uses **only** the
  client-credentials token: it doesn't get a user token (no browser flow, no reading
  the webview's storage). The signed-in path is reproduced through the app in T04(b).
  It writes the response bodies, with tokens and personal data scrubbed, to
  `docs/research/captures/tidal/` so they survive the spike's deletion and Phase 1 can
  adopt them as fixtures. The scrubbing also removes the client ID wherever a response
  echoes it. It never prints the token. Exactly what grant and endpoints it uses comes
  from T01's verified findings, not from this plan.
- **Spotify spike** — `spikes/spotify-librespot/`: a self-contained Rust binary on a
  pinned librespot release (the version and crates chosen in T06 from what currently
  works). Login through an OAuth flow in the owner's browser (whatever current librespot
  supports; T06 decides). **No credentials cache and no audio cache on disk** — librespot
  is configured with neither, so decision 0001 limits 1 and 4 hold; the owner logs in on
  every run. Audio goes to **our own `Sink` implementation** that receives decoded PCM
  and writes it to the default device via `cpal` (not a librespot backend), and prints
  once per second the sample rate, channel count, frames received and a peak level —
  evidence that the PCM is in our hands, which is what the engine needs. Takes one track
  URI/URL as argument. Never prints tokens. Its logger is pinned in code, not left to
  `RUST_LOG` or librespot's defaults: `info` for the spike itself, and `warn` or higher
  for librespot's session, OAuth and core modules, so no `debug`/`trace` output that
  could carry tokens or URLs with codes. The client ID comes from the librespot crate
  constant or the owner's environment, never a literal in the source.
- **Time box for the spike:** one build task (T07), one owner run (T08), and at most two
  fix rounds after the first owner run. If it still doesn't play, AC3's alternative
  applies: `spotify.md` explains why and ranks the alternatives.
- **WebKitGTK/Widevine check:** part of T08, the owner pastes a one-line
  `navigator.requestMediaKeySystemAccess('com.widevine.alpha', …)` snippet (written in
  the spike README) into the devtools console of the current app under `tauri dev` and
  reports the result. Cheap, first-hand evidence for R2's "confirm or refute".
- **Audio engine** is desk research plus what the Spotify spike proved about the PCM
  path; no separate engine spike (see Deferred).
- **Decisions** 0002–0005 are written as *Proposed*; the owner accepts them (usually at
  merge). The Phase 1 section is drafted from them.

**Rejected:** running the TIDAL probe or spike as an agent (credentials must not pass
through agents; `.env.local` is denied to them); reproducing search from console logs
(they contain auth codes); using librespot's credential cache for convenience (conflicts
with decision 0001 limit 4); a Node/JS Spotify spike (doesn't prove the Rust PCM path).

## Task checklist

- [ ] T01 — `docs/research/tidal.md`, part 1: the official platform today — developer
  portal, OpenAPI v2 (search endpoint shape, `countryCode`, `include`, pagination),
  `@tidal-music/*` SDKs, auth flows (PKCE, client credentials, device code if offered),
  scopes needed for catalog search vs user data, refresh-token behaviour and token
  lifetimes, rate limits, what playback third-party apps get and any sign of change to
  the preview-only rule. Sourced and dated · AC1 · researcher
- [ ] T02 — `tidal.md`, part 2: why login and search are flaky — each suspected cause
  with code evidence (file + line at `6466f0e`) and the API fact from T01 it rests on:
  no refresh token, no expiry check on restore, hardcoded `US`, `user.read`-only scope,
  one-shot loopback listener, background SDK bridge, raw error bodies, logging of codes.
  Each marked *confirmed / plausible / ruled out*, and which ones T04 can confirm
  without a subscription · AC1 · researcher
- [ ] T03 — Build `spikes/tidal-api-probe/` (per Approach) with a `README.md` giving the
  owner's exact command, what to report back, and a note that putting
  `TIDAL_CLIENT_SECRET` in `.env.local` is intended (Conflict 4). The agent runs it
  only **without** `--env-file` (never pointing at `.env.local`), to check it fails
  cleanly and prints nothing sensitive. No client ID or secret literals in the source ·
  AC1, AC7 · researcher · review
- [ ] T04 — Owner at the machine (TIDAL): (a) if needed, add `TIDAL_CLIENT_SECRET` from
  their TIDAL developer app to `.env.local` themselves; run the probe per its README;
  (b) if they can still sign in to TIDAL (see Q1), run `npm run tauri dev`, sign in, run
  three searches, quit, start again, search again, and later (after the token's
  lifetime, if practical) search once more; report UI error texts and HTTP statuses only,
  no console output. **Before committing anything**, the researcher scans every
  capture file for access tokens, the client ID or secret, authorization codes, and
  personal data (user IDs, e-mail, usernames, IP addresses). Any hit is scrubbed and
  the scan repeated before the commit. The researcher then commits the captures,
  records the results in `tidal.md` and updates T02's verdicts. The reviewer re-checks
  the committed captures · AC1, AC7 · researcher · review
- [ ] T05 — `tidal.md`, part 3: every known full-length path in open-source clients
  (`tidalapi` and players built on it, desktop wrappers, others found) — auth (device
  code, PKCE, which client IDs they use — named by repo + path + commit, never
  as values), stream formats and qualities (FLAC, DASH, MQA/encryption
  types), which respect decision 0001 (no DRM circumvention), breakage history with dates,
  reported account actions. Ends with the ranked options table and the recommendation:
  catalog/search layer, full-length path, and what can be built and tested before the
  owner resubscribes · AC1, AC5 · researcher
- [ ] T06 — `docs/research/spotify.md`, part 1: official platform after the February 2026
  changes (Web API endpoints available in developer mode, PKCE and refresh, limits);
  stand-alone playback options — librespot and its forks/derivatives and anything else
  current — with auth (OAuth vs stored credentials, which client ID — named by crate
  constant or repo + path + commit, never as a value), formats and
  quality, how to take PCM into our own pipeline (the `Sink` trait or equivalent),
  maintenance health, breakage history, account actions; desk evidence on the Web
  Playback SDK in WebKitGTK. Names the librespot version and login method T07 uses ·
  AC2 · researcher
- [ ] T07 — Build `spikes/spotify-librespot/` (per Approach): pinned librespot, browser
  OAuth login, no credential or audio cache, custom `Sink` → `cpal`, per-second PCM
  stats, no token output, logger levels pinned in code (librespot session/OAuth/core at
  `warn` or higher), client ID from the crate constant or the environment and never a
  literal; `README.md` with system prerequisites, the exact
  `cargo run --release -- <track>` command, the Widevine console snippet, and what to
  report. Agent verifies it builds (`cargo build`) and fails cleanly without login. The
  review checks the disabled caches, the pinned log levels and that no identifier
  literals are present · AC3, AC7 · researcher · review
- [ ] T08 — Owner at the machine (Spotify): run the spike per its README, log in in the
  browser with their own Premium account, listen to one full track to the end through
  the spike, and report: did it play fully, sound quality impressions, the printed
  format/level lines (they contain no secrets), any errors; then run the Widevine
  snippet in the current app's devtools and report its output. Researcher records the
  results in `spotify.md`. Up to two fix rounds on failure (time box), then document ·
  AC2, AC3 · researcher
- [ ] T09 — `spotify.md`, part 2: spike findings (what worked, latency to first audio,
  format delivered to the sink, login friction without a credential cache and how the
  real provider would store credentials within decision 0001), the ranked options table
  and the Phase 2 recommendation · AC2, AC3, AC5 · researcher
- [ ] T10 — `docs/research/audio-engine.md`: webview audio vs a Rust pipeline
  (symphonia + cpal/rodio, GStreamer, others), judged on gapless across sources, one
  volume/EQ, FFT to the UI at 60 fps, control latency, streaming large local files,
  PipeWire/Pulse/ALSA, effort; how each recommended provider path plugs in; what happens
  to the official TIDAL SDK path (webview-only). Ranked table, one recommendation with
  trade-offs · AC4, AC5 · researcher
- [ ] T11 — Proposed decision records: `0002` Spotify playback path, `0003` TIDAL
  playback path including the interim before resubscribing, `0004` audio engine
  architecture, `0005` provider boundary shape (what every provider implements: auth,
  catalog/search, playback source handing audio to the engine, health/failure
  isolation). Status *Proposed*, format per `docs/decisions/README.md` · AC6 ·
  researcher · review
- [ ] T12 — Draft the "Decisions from Phase 0" section of
  `docs/phases/01-foundation-rebuild/BRIEF.md` from T11, marked *proposed — pending
  owner acceptance*, turning each recommendation into Phase 1 scope (including the
  logging-of-codes and TIDAL auth findings from T02/T04). No other part of that brief is
  changed · AC6 · researcher
- [ ] T13 — Phase audit for AC7 and the citation rule: `git diff --stat main...HEAD --
  src src-tauri` is empty; secret scan of every committed file on the branch (tokens,
  client IDs, secrets, auth codes, e-mail/usernames in captures); no audio files tracked
  (`git ls-files` for audio extensions); spike code reviewed for disabled caches; spot-
  check that research claims carry sources and dates; full `npm run check` passes.
  Gaps in citations or dates are fixed in the docs. **A secret, token, client ID or
  personal-data hit in any committed file stops the phase**: mark T13 `[~]`, record the
  file and commit (not the value) under Open questions, and hand it to the owner. The
  value is already in branch history, which agents may not rewrite, so a docs-only fix
  isn't enough; the owner decides about rotating the credential and cleaning the
  history · AC1, AC2, AC4, AC7

Markers: `[ ]` open, `[x]` done, `[~]` blocked — blocked by Qn.

### Acceptance criteria → tasks → evidence

| AC | Tasks | Evidence |
|---|---|---|
| AC1 | T01–T05, T13 | `docs/research/tidal.md`; `docs/research/captures/tidal/` |
| AC2 | T06, T08, T09, T13 | `docs/research/spotify.md` |
| AC3 | T07, T08, T09 | Owner's listening report in `spotify.md` and the Progress log; smoke step 3 |
| AC4 | T10, T13 | `docs/research/audio-engine.md` |
| AC5 | T05, T09, T10 | Ranked tables at the end of each research doc |
| AC6 | T11, T12 | `docs/decisions/0002`–`0005`; Phase 1 brief section |
| AC7 | T03, T04, T07, T13 | T13 audit output in the Progress log; T04's pre-commit capture scan; per-task reviews of T03/T04/T07 |

No unit tests: this phase changes no application code, and the testing policy doesn't
cover throwaway spikes.

## Open questions

- Q1 — Can the owner still sign in to TIDAL (a lapsed or free account), and does their
  TIDAL developer app still exist so they can put its client secret in `.env.local`?
  Not blocking: T04 runs whichever parts are possible and `tidal.md` records what
  couldn't be reproduced · affects: T04 · answer: _pending_
- Q2 — For the TIDAL interim before resubscribing, is it acceptable that TIDAL tracks
  play nothing (catalog/search only) if the recommended audio engine can't carry the
  webview-only official SDK previews, or must 30-second previews keep working in Phase 1?
  Not blocking the research; T10/T11 present both options and the owner answers when
  accepting `0003`/`0004` · affects: T11, T12 · answer: _pending_

## Manual smoke list (draft)

1. `git diff --stat main...phase/00-provider-research -- src src-tauri` prints nothing.
2. Run the TIDAL probe per `spikes/tidal-api-probe/README.md`; it prints statuses and
   counts, no token.
3. Run the Spotify spike per `spikes/spotify-librespot/README.md`, log in, and hear a
   full-length track to the end; the per-second PCM lines appear.
4. After the spike exits, check that no audio or credential cache was left behind (the
   README names where librespot would have written one; nothing is there).
5. Read the recommendation and ranked table at the end of `tidal.md`, `spotify.md` and
   `audio-engine.md`; each has one clear recommendation.
6. Open two random claims in each research doc and follow their source; each has a date.
7. Read proposed decisions `0002`–`0005`; answer Q2; accept, amend or reject each.
8. Read the "Decisions from Phase 0" section in the Phase 1 brief; it matches the
   decisions you accepted.

## Risks

- **Account action.** Running librespot or TIDAL's non-public API on the owner's real
  accounts can trigger an action. Accepted by decision 0001; limited by using only the
  owner's own account, one track, no caching, no parallel sessions, and recording any
  known reports in the research docs before T08 runs.
- **Spotify path broken right now.** librespot's login has broken before when Spotify
  changed auth. Time-boxed; AC3 allows a documented explanation with ranked
  alternatives.
- **Credentials leaking into git or logs.** Probes read secrets only at runtime from
  `.env.local` via `--env-file`; identifiers are named, never quoted; nothing prints
  tokens; spike log levels are pinned; captures are scanned before they're committed
  (T04); T03/T04/T07 get per-task reviews; T13 scans everything committed and escalates
  any hit to the owner, because pushed history can't be rewritten by agents.
- **Stale research.** Every claim carries a date; the docs say which claims were
  verified first-hand.
- **Scope creep into building the engine.** No engine spike and no app code; the
  Spotify spike stops at "a track plays through our sink".

## Deferred

- Any change to `src/` or `src-tauri/`, including removing the code-logging and fixing
  TIDAL auth/search (Phase 1).
- Building providers, the queue or the audio engine (Phases 1–2).
- An audio-engine spike (gapless, FFT, symphonia local decode) — Phase 1 if T10 finds it
  needed.
- TIDAL full-length implementation or any full-length TIDAL spike (parked until a
  subscription).
- Adopting the probe's captures as `tests/fixtures/tidal/` (Phase 1 decides).
- Updating `CLAUDE.md`, `ROADMAP.md`, `CURRENT_PHASE.md`, and deleting spikes —
  `/close-phase`.

## Progress log

Appended by the loop, newest last: task id, commit, review verdict, anything the next
task needs to know.

## Plan review

Written by the reviewer during `/plan-phase`: findings (blocking / important /
follow-up) and a verdict. The planner's responses follow each finding.

Reviewed 2026-09-30 against the brief, decision 0001, `docs/WORKFLOW.md`, the run-phase
skill and the code at `6466f0e`. The "Current state" claims hold: `pkce.ts` asks only for
`user.read`; `tidalAuth.ts:186` makes up a one-hour expiry and does no expiry check;
`tidalAuth.ts:67,70,90,114-115` log the state, the authorize URL and the full callback
URL; `lib.rs:44,75` print the path that carries the code; `tidalApi.ts:8` hardcodes `US`;
`tsconfig.json` includes only `src` and `scripts/check.mjs` runs cargo only on
`src-tauri/Cargo.toml`, so spikes can't break the check. Every AC maps to tasks and to
evidence that could fail. Owner steps are covered by run-phase's "owner at the machine"
step.

**Important**

- R1 — Decision 0001 limit 4 says client IDs must never appear in "committed files,
  docs". T05 asks for "client IDs used" by open-source TIDAL clients, and T06 asks
  "which client ID" librespot uses. A researcher will naturally paste those literal
  values into `tidal.md`/`spotify.md`, and the spike might hardcode one in its source.
  T13 would then find them only after they have been pushed, and history can't be
  rewritten. Fix: say in Approach (and in T05/T06/T07) that client IDs and secrets are
  named by where they live (repo + path + commit, or the librespot crate constant), never
  written out as values in docs, captures or spike source.
- R2 — T04 commits files the owner's credentialed run produced
  (`docs/research/captures/tidal/`), but it isn't tagged `· review`. The only scan is T13,
  which comes after the push, and its "fixes, if any, are docs-only" can't remove a
  leaked value from branch history (CLAUDE.md forbids rewriting it). Fix: tag T04
  `· review`, or make a secret/PII scan of the captures a step in T04 before its commit.
  Also make T13 say that a hit in a committed file stops the phase and goes to the
  owner, not to a docs-only fix.

**Follow-up**

- R3 — The probe is to run searches "with and without the `user.read`-scoped path where
  applicable", but it only gets a client-credentials token. Nothing says how it would get
  a user token without a browser flow or reading the webview's storage. Either drop that
  clause (T04b covers the signed-in path through the app) or say how the token is
  obtained, keeping it away from agents.
- R4 — T03: say that the agent runs the probe *without* `--env-file` (not
  `--env-file=.env.local` with the file missing). That keeps the agent's command away
  from `.env.local`, which `.claude/settings.json` denies.
- R5 — `.env.example` says "NEVER add TIDAL_CLIENT_SECRET here or to any client-side
  file", while T04 asks the owner to add it to `.env.local`, which Vite reads. That's
  safe under Vite's default `VITE_` prefix (`vite.config.ts` sets no `envPrefix`), but
  it's a doc/plan conflict: list it under "Conflicts", and tell the owner in the probe
  README that this is intended.
- R6 — T07: pin the spike's log level (e.g. no `debug`/`trace` from librespot's
  session/OAuth modules) so "never prints tokens" doesn't depend on librespot's logging
  defaults. T07's review should check this.

Verdict: revise first

### Revision check

Checked 2026-09-30 against the brief, decision 0001, the run-phase skill,
`.claude/settings.json`, `vite.config.ts`, `.env.example` and the code at `6466f0e`.

- R1 — resolved. Approach states the "named, never written out" rule for docs, captures,
  decision records and spike source; T05, T06 and T07 repeat it; the probe scrubs an
  echoed client ID.
- R2 — resolved. T04 is tagged `· review` with a scan before its commit, and run-phase
  reviews before it pushes. T13 now stops on a hit and hands it to the owner. AC7 lists
  T04.
- R3 — resolved. The probe uses only a client-credentials token; the signed-in path is
  T04(b) through the app.
- R4 — resolved. T03 runs the probe only without `--env-file`.
- R5 — resolved. Conflict 4 is correct: `vite.config.ts` sets no `envPrefix`, only
  `tidalAuth.ts`/`tidalPlayer.ts` read `import.meta.env`, and both read `VITE_*` keys.
  The probe README carries the note.
- R6 — resolved in substance (Approach and T07; T07's review checks it).

New follow-ups (not blocking):

- R7 — Agents can't read `.env.local`, so the researcher's T04 scan and T13's scan can't
  search for the owner's actual TIDAL client ID or secret by value. They can only match
  patterns, and a short alphanumeric ID doesn't match any reliable pattern. Fix: have
  the probe check its own capture files for the ID, secret and token it holds at runtime
  and print only "scrub check: ok/FAILED". Also add a smoke step in which the owner
  greps the branch for the values in `.env.local`.
- R8 — The rule applies to every task, but the Approach says only the T03, T04, T07 and
  T11 reviews check it. T05 and T06 are the tasks most likely to quote a client ID, and
  they're pushed without review until T13. Fix: tag T05 and T06 `· review`, or add a
  pre-commit self-check line to both.
- R9 — The log pin names only librespot's session, OAuth and core modules. Other
  librespot crates (audio, playback, metadata) are left at whatever level the global
  filter gives them. Fix: set the global default to `warn` and raise only the spike's
  own crate to `info`.

Verdict: ready for owner approval
