# AI prompts

## Scaffold prompt
Create a Tauri v2 + React + TypeScript + Vite desktop app.
Add a clean three-region layout: sidebar, content area, bottom player bar.
Do not add any unofficial TIDAL packages.
Create typed adapters for auth, api, and player.
Use mock data first so the app runs before API integration.

## Auth prompt
Implement a TIDAL auth module wrapper with interfaces for:
- initialize
- login
- logout
- getAccessToken
- refreshIfNeeded
Do not hardcode secrets.
Use environment variables and PKCE-oriented flow design.

## Search prompt
Implement a TIDAL search feature module with:
- search input
- debounced query
- typed result models for tracks, albums, artists
- loading, empty, and error states
Keep API calls isolated in a service layer.

## Player prompt
Implement a player adapter around the official TIDAL player path.
Start with preview playback only.
Expose:
- loadTrack
- play
- pause
- stop
- getState
UI should remain independent from SDK details.

## Refactor prompt
Refactor without changing visible behavior.
Move TIDAL-specific code behind lib/tidal adapters.
Tighten types.
Remove duplication.
Keep the app runnable after each commit.
