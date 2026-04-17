<img width="2558" height="1436" alt="TOASTY-player2" src="https://github.com/user-attachments/assets/1963844d-26c9-45b7-80cc-815e83a23ab5" />
# TOASTY 🎵

> A TIDAL desktop client that doesn't look like it was built in 2009.

Built with Tauri v2 + React + TypeScript. Runs natively on Linux. No Electron, no browser tab, no compromise.

---

## What it does

**Search** your entire TIDAL catalog — tracks, albums, and playlists — with instant filter switching between result types.

**Play** real TIDAL audio using the official `@tidal-music/player` SDK. Full lossless streaming, the same stack TIDAL uses.

**Control** everything from a sleek custom player bar: play/pause, skip, shuffle, repeat, scrubber, and a volume popup. Cover art pulled live from the API.

**Look good doing it.** Custom window chrome, no OS title bar, dark theme with a pink accent that hits different.

---

## Screenshots

<img width="2558" height="1436" alt="TOASTY-player2" src="https://github.com/user-attachments/assets/c72d2bc8-d1ec-4971-90de-c027de8c0015" />

---

## Features

- 🔐 **TIDAL OAuth 2.0** — full PKCE flow with deep-link callback, no secrets in the frontend
- 🔍 **Search** tracks, albums, and playlists with per-type filters
- 🖼️ **Cover art** in both search results and the player bar, resolved via the TIDAL v2 JSON:API
- ▶️ **Real audio playback** — actual lossless TIDAL streaming, not mocked
- ⏭️ **Full transport controls** — play/pause toggle, previous/next, shuffle, repeat (off/all/one)
- ⏱️ **Progress scrubber** with live time display and seek support
- 🔊 **Volume control** with a popup vertical slider
- 🪟 **Borderless window** — custom drag region, custom close/minimise/maximise buttons
- 🎨 **Dark retrowave UI** — Tailwind CSS + shadcn/ui, Audiowide logo font, `#F249E7` accent

---

## Tech stack

| Layer | Choice |
|---|---|
| Native shell | Tauri v2 (Rust) |
| Frontend | React 18 + TypeScript + Vite |
| UI components | shadcn/ui + Tailwind CSS v4 |
| TIDAL auth | `@tidal-music/auth` (official SDK) |
| TIDAL playback | `@tidal-music/player` (official SDK) |
| TIDAL events | `@tidal-music/event-producer` (official SDK) |
| TIDAL catalog | TIDAL OpenAPI v2 (JSON:API) |
| Icons | lucide-react |

---

## Getting started

### Prerequisites

- [Rust](https://rustup.rs/) (stable)
- [Node.js](https://nodejs.org/) 20+
- A TIDAL developer account and app at [developer.tidal.com](https://developer.tidal.com)
- GStreamer (for audio on Linux):

```bash
sudo apt install gstreamer1.0-plugins-good gstreamer1.0-plugins-bad gstreamer1.0-libav
```

### Setup

```bash
git clone https://github.com/your-username/tidal-tauri-client
cd tidal-tauri-client
npm install
```

Create a `.env` file in the project root:

```env
VITE_TIDAL_CLIENT_ID=your_client_id_here
```

Register `toasty-tidal://callback` as a redirect URI in your TIDAL developer app settings.

### Run in development

```bash
npm run tauri dev
```

### Build for production

```bash
npm run tauri build
```

Outputs `.deb` and `.rpm` packages under `src-tauri/target/release/bundle/`.

---

## Project structure

```
src/
├── app/            # App root, CSS, entry point
├── components/     # Shared UI (Header, WindowControls, shadcn/ui)
├── features/
│   ├── auth/       # TIDAL OAuth flow
│   ├── player/     # Player bar, controls, usePlayer hook
│   └── search/     # Search input, results, result items
├── lib/            # tidalApi.ts, tidalPlayer.ts, utils
└── types/          # Shared TypeScript types
```

---

## Notes

- **Linux only** — tested on Pop!_OS / Ubuntu with X11 and Wayland
- **Dev mode CORS** — the Vite dev server proxies TIDAL audio CDN requests locally to work around the `localhost` origin restriction; production builds are unaffected
- **No client secret in the frontend** — ever. The PKCE flow requires only the client ID

---
