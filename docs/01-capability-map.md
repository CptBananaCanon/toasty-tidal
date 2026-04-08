# TIDAL capability map for a desktop client

## What looks possible from the public platform
### Auth
- Client credentials flow for non-user catalog access
- Authorization code flow with PKCE for user login
- Refresh token flow

### Catalog and discovery
- Search
- Album metadata
- Artist metadata
- Track metadata
- Playlist / mix / user resources where exposed by the public API
- Region-aware requests via countryCode

### Playback
- Use the official TIDAL Player SDK / Player module
- For a third-party app, design around preview playback first
- Treat full playback as unavailable unless TIDAL explicitly approves and documents it for your app tier

## What this project should ship first
### MVP 0
- App shell
- Environment config
- OAuth login wiring
- Search box
- Search results list
- Track detail panel
- Player bar
- Play / pause / next UI stubs

### MVP 1
- Actual search requests
- Artist / album / track detail views
- Preview playback
- Volume / scrub if supported by official player components
- Recent searches
- Error handling

### MVP 2
- Favorites / playlists only after confirming scope + endpoint support in your registered app
- Rich queue if supported cleanly by official player path
- Better offline caching of metadata only, never audio

## What to avoid
- Anything that modifies or circumvents playback restrictions
- Downloading / caching audio
- Cross-service playback merging
- Voice control
- AI features using TIDAL content
- Business/public-setting use
