# 0001 — Private use, and full-length playback by any practical client path

Status: **Accepted — 2026-09-30 (owner)**

## Context

Toasty is a private hobby project for one person on Linux. It is never distributed, sold
or published as a service. The owner pays for the streaming subscriptions it plays from
(Spotify Premium now; TIDAL again when resubscribed).

The official third-party routes don't give a stand-alone app full-length playback:

- TIDAL's developer platform and `@tidal-music/player` give third-party apps 30-second
  previews only, even for paying subscribers, with no app-review route as of April 2026.
- Spotify's Web Playback SDK needs Widevine, which Tauri's Linux webview (WebKitGTK)
  doesn't provide; Spotify Connect only remote-controls another Spotify app, which fails
  the stand-alone requirement. Developer mode since February 2026 requires Premium and
  allows 5 users per app — enough for one owner.

Open-source players solve this with unofficial clients (for example librespot for
Spotify, and TIDAL's non-public API as used by several open-source TIDAL clients).

The prototype's guardrails document (April 2026) forbade this and forbade combining
TIDAL with other services. It is retired with this decision.

## Decision

Toasty's goal is full-length, stand-alone playback from every source. To reach it, Toasty
may use unofficial or reverse-engineered client paths — non-public APIs, community
libraries such as librespot, and client identifiers of other apps — for content on the
owner's own paid subscriptions. Where an official API gives the same result (catalog,
search, library), prefer it: it breaks less.

Limits that hold regardless:

1. **Stream, don't keep.** No saving provider audio as files or building offline copies
   beyond a transient playback cache.
2. **No DRM circumvention.** Don't break Widevine/PlayReady/FairPlay-protected streams.
   If a quality tier only exists DRM-protected, use the best tier that doesn't.
3. **Own accounts only.** No shared, bought or borrowed accounts; no credentials of anyone
   else.
4. **Secrets stay out of git.** Client IDs, secrets and tokens live in `.env.local` or the
   OS keyring, never in committed files, docs or logs.
5. **Isolated risk.** Each unofficial path sits behind the provider boundary with the
   official route (or none) as fallback, so a blocked path degrades one source, not the
   player.

## Alternatives considered

- **Official routes only** — previews for TIDAL, Spotify only via Connect. Rejected by the
  owner: fails full-length and stand-alone.
- **Downloading/ripping tools** — rejected: they conflict with limit 1 and add nothing to
  a streaming player.

## Consequences

- This breaks the TIDAL and Spotify developer terms. Accepted risks: paths breaking when
  the services change, and possible account suspension. Research (Phase 0) records how
  often each path has broken and whether accounts have been actioned.
- Keep the repository private: its research and decisions describe these paths.
- Maintenance is part of the cost: each unofficial provider needs a quick way to detect
  breakage (mapper fixtures, a smoke step per provider).
