# Toasty

A private desktop music player for Linux: local files, TIDAL and Spotify in one player,
one queue, one library. Tauri v2 + React + TypeScript + Rust.

A private hobby project — not distributed, not affiliated with TIDAL or Spotify.

**Status:** being rebuilt from a prototype. See `docs/ROADMAP.md` and
`docs/CURRENT_PHASE.md`.

## Run it

Prerequisites: Rust (stable), Node.js 20+, GStreamer (`gstreamer1.0-plugins-good`,
`-bad`, `gstreamer1.0-libav`).

```bash
npm install
cp .env.example .env.local   # fill in provider client IDs
npm run tauri dev
```

`npm run check` verifies the build; `npm run tauri build` produces `.deb`/`.rpm`.

## Docs

- `CLAUDE.md` — how the code works and the rules for working in it
- `docs/VISION.md`, `docs/ROADMAP.md`, `docs/CURRENT_PHASE.md`
- `docs/WORKFLOW.md` — how phases are planned and built with Claude Code
- `docs/decisions/`, `docs/research/`
