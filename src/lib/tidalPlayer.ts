import * as Auth from '@tidal-music/auth';
import * as EventProducer from '@tidal-music/event-producer';
import * as Player from '@tidal-music/player';

const CLIENT_ID = import.meta.env.VITE_TIDAL_CLIENT_ID as string;

// ---------------------------------------------------------------------------
// Two-phase initialization:
//
// Phase 1 — Auth only (authInitPromise): just Auth.init(). Fast, no network
//   calls to TIDAL event endpoints. Required before Auth.setCredentials().
//
// Phase 2 — Full player (playerInitPromise): EventProducer.init() + Player
//   setup. EventProducer makes a network request that can hang indefinitely
//   when called before credentials are available (e.g. on cold app start).
//   Kicked off in the background after bridgeCredentials() succeeds so it
//   never blocks the auth callback.
// ---------------------------------------------------------------------------
let authInitPromise: Promise<void> | null = null;
let playerInitPromise: Promise<void> | null = null;

function initAuth(): Promise<void> {
  if (!authInitPromise) {
    // Wipe any SDK-managed credential cache from a previous session before
    // calling Auth.init(). If stale credentials are present Auth.init() tries
    // to refresh them, making a network request that can hang indefinitely and
    // permanently blocks every subsequent bridgeCredentials() call.
    // Our own token storage (tidal_access_token) is the source of truth;
    // the SDK cache is rebuilt by bridgeCredentials() on every sign-in/restore.
    localStorage.removeItem('tidal-creds');

    console.log('[PLAYER] Auth.init — clientId present:', !!CLIENT_ID, '| scopes: []');
    authInitPromise = Auth.init({
      clientId: CLIENT_ID,
      credentialsStorageKey: 'tidal-creds',
      // scopes: [] — vacuously satisfies scope validation in setCredentials()
      // regardless of what TIDAL's token response returns.
      scopes: [],
    })
      .then(() => { console.log('[PLAYER] Auth.init complete'); })
      .catch((err: unknown) => {
        authInitPromise = null; // allow retry on next sign-in attempt
        throw err;
      });
  }
  return authInitPromise;
}

// Reset both cached init promises. Called on sign-out so the next sign-in
// gets a clean Auth.init() with no stale credential state.
export function resetAuth(): void {
  authInitPromise = null;
  playerInitPromise = null;
}

export function initTidalPlayer(): Promise<void> {
  if (!playerInitPromise) {
    playerInitPromise = (async () => {
      await initAuth();

      // EventProducer.init() makes outbound network requests. Call it only
      // after auth so credentials are available and the connection succeeds.
      //
      // The player's load() hard-checks eventSenderStore.hasEventSender()
      // before doing anything. There is no stub path; this package must be
      // initialised. PERFORMANCE and TARGETING categories are blocked so
      // analytics events are dropped locally and never queued.
      console.log('[PLAYER] EventProducer.init — starting');
      await EventProducer.init({
        appInfo: { appName: 'Toasty', appVersion: '0.1.0' },
        blockedConsentCategories: { NECESSARY: false, PERFORMANCE: true, TARGETING: true },
        credentialsProvider: Auth.credentialsProvider,
        platform: { browserName: 'Tauri WebView', browserVersion: '1.0.0', osName: 'Desktop' },
        strictMode: false,
        tlConsumerUri: 'https://et.tidal.com/v1/events',
        tlPublicConsumerUri: 'https://et.tidal.com/v1/public/events',
      });
      console.log('[PLAYER] EventProducer.init complete');

      Player.setCredentialsProvider(Auth.credentialsProvider);
      console.log('[PLAYER] setCredentialsProvider called');
      Player.setEventSender(EventProducer);
      console.log('[PLAYER] setEventSender called — player ready');
    })();
  }
  return playerInitPromise;
}

// ---------------------------------------------------------------------------
// Bridge an access token obtained via our PKCE flow into the SDK credential
// system. Must be called after every successful token exchange and on restore.
//
// @param token        - raw access token string
// @param expires      - expiry as a millisecond timestamp (Date.now() + expires_in * 1000)
// @param grantedScopes - from the token response 'scope' field, split on ' '
// ---------------------------------------------------------------------------
export async function bridgeCredentials(
  token: string,
  expires: number,
  grantedScopes: string[],
): Promise<void> {
  // Only Auth.init() is required before setCredentials(). Awaiting the full
  // initTidalPlayer() here would block on EventProducer.init() which makes
  // outbound network requests and can hang on cold start (no credentials yet).
  await initAuth();

  console.log('[PLAYER] bridgeCredentials — expires:', expires, '| grantedScopes:', grantedScopes);

  await Auth.setCredentials({
    accessToken: {
      clientId: CLIENT_ID,
      token,
      expires,
      grantedScopes,
      requestedScopes: grantedScopes,
    },
  });

  console.log('[PLAYER] bridgeCredentials — Auth.setCredentials succeeded');

  // Now that credentials are set, kick off full player init in the background.
  // EventProducer.init() can now succeed with valid credentials.
  initTidalPlayer().catch(console.error);
}
