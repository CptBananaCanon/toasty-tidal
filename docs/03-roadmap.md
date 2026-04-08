# Roadmap

## Phase 1 - foundation
- scaffold app
- install Tauri + React + TypeScript
- create env management
- create auth service interface
- create API client interface
- create player adapter interface
- wire app layout

## Phase 2 - searchable catalog
- build search page
- wire search endpoint
- build result cards
- add artist / album / track routes
- add loading / empty / error states

## Phase 3 - playback shell
- integrate official player module
- create footer player bar
- play preview from selected track
- pause / resume
- show playing state

## Phase 4 - user features
Only after checking scope availability in the portal and docs:
- saved content
- playlists
- library surfaces
- profile / session state

## Phase 5 - desktop polish
- media key support
- tray / mini player
- notifications
- deep link OAuth callback
- better logging
- packaging and release pipeline

## Exit criteria for MVP
- login works
- search works
- selecting a result updates detail panel
- play/pause preview works through official TIDAL path
- app runs on Pop!_OS in Tauri dev
