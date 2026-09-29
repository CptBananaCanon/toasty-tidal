# Vision

## One music player, multiple sources

Toasty is a private desktop music player that puts local files and streaming services
behind one experience. You think about tracks, albums, artists, playlists and the queue —
not about which service a song comes from. The source is metadata, not a mode.

It combines the personality, speed and directness of classic desktop players (Winamp is
the spiritual reference) with the library and discovery comfort of modern streaming
apps, and the multi-source, offline-friendly model of players like Symfonium. These are
references, not templates: Toasty has its own identity.

## Who it is for

One owner, on Linux, on their own subscriptions. Never distributed, never a product.
That freedom is used deliberately (decision 0001): full-length playback from every source
is the goal, including through unofficial client paths.

## What it does when it's done

- **Plays everything, fully.** Local files (FLAC, MP3, Ogg, WAV, M4A, …), TIDAL and Spotify
  at full length in the best quality each allows, in one queue, with gapless transitions
  between sources.
- **A real library.** Watched local folders with tags and artwork; streaming favourites and
  playlists alongside them; artist and album views that don't care where tracks come from.
- **Playlists across sources.** Create, edit, reorder; add from anywhere; make a playlist
  from an album; mix local and streaming tracks in one list.
- **Search everything at once**, with results grouped by kind, not by provider.
- **Visualizations worth watching.** GPU-driven (three.js or similar), reacting to the real
  audio — a desktop app, not a web page with limits.
- **Desktop-player ergonomics.** Media keys and MPRIS, tray, mini player, keyboard-first
  control, EQ, fast startup.
- **Personality.** A retrowave / 1980s-inspired look, defined in Claude Design (Phase 3).

## Principles

- **One queue, one engine.** Every source feeds the same queue and, where possible, the
  same audio pipeline, so gapless playback, EQ, volume and visualizations work the same
  for every track.
- **Providers are plugins, not modes.** Each source implements a small boundary (auth,
  catalog/search, playback). Adding a source doesn't touch the others; a broken source
  doesn't break the player.
- **Local-first.** Local playback works with no network and no accounts.
- **Small, coherent steps.** Build what the current phase needs; leave doors open, don't
  build the house next door.
- **Low ceremony.** A hobby project: minimal tests where they pay off, manual smoke checks
  for the rest.
