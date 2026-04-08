# AI swarm brief

## Mission
Build a lawful, policy-aware TIDAL desktop client using Tauri + React + TypeScript.
Start with search + select + official-player preview playback.
Do not invent unsupported endpoints or unsupported playback capabilities.

## Rules of engagement
- Prefer official TIDAL packages and docs
- Prefer Tauri-native patterns over custom desktop hacks
- Never add unofficial scraping libraries
- Never write code that downloads or stores audio
- Never expose secrets in the frontend bundle
- Keep commits small and milestone-based
- Every milestone must leave the app runnable

## Definition of done for each task
- builds locally
- typed
- lints cleanly
- no dead code
- no policy violation
- README / docs updated if architecture changed

## First tasks
1. Scaffold project
2. Add base routes and layout
3. Add environment parsing
4. Add auth abstraction
5. Add search service abstraction
6. Add player adapter abstraction
7. Render stub search results from mock data
8. Replace mock with real API
