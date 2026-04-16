import * as Auth from '@tidal-music/auth';
import * as EventProducer from '@tidal-music/event-producer';
import * as Player from '@tidal-music/player';

const CLIENT_ID = import.meta.env.VITE_TIDAL_CLIENT_ID as string;

// ---------------------------------------------------------------------------
// One-time initialization — cached promise so the entire chain runs exactly
// once regardless of how many callers invoke initTidalPlayer().
// ---------------------------------------------------------------------------
let initPromise: Promise<void> | null = null;

export function initTidalPlayer(): Promise<void> {
  if (!initPromise) {
    initPromise = (async () => {
      // ── Auth ────────────────────────────────────────────────────────────
      // scopes: [] — intentionally empty.
      //
      // setCredentials() validates: state.credentials.scopes.every(s => grantedScopes.includes(s))
      // If we declare ['playback'] but TIDAL's token response returns different scope
      // strings (e.g. 'r_usr', 'user.read'), that check fails with A0007.
      // An empty scopes array makes the every() vacuously true regardless of
      // what TIDAL returns, so the bridge always succeeds.
      console.log('[PLAYER] Auth.init — clientId present:', !!CLIENT_ID, '| scopes: []');
      await Auth.init({
        clientId: CLIENT_ID,
        credentialsStorageKey: 'tidal-creds',
        scopes: [],
      });
      console.log('[PLAYER] Auth.init complete');

      // ── EventProducer ───────────────────────────────────────────────────
      // The player's load() hard-checks eventSenderStore.hasEventSender()
      // before doing anything. The type is `typeof EventProducer` — the whole
      // module namespace. There is no stub path; this package must be initialised.
      //
      // PERFORMANCE and TARGETING categories are blocked so analytics events
      // are dropped locally and never queued. NECESSARY events (streaming
      // metrics) are still allowed. If the consumer URIs below are unreachable,
      // those requests fail silently — playback is unaffected.
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

      // ── Player ──────────────────────────────────────────────────────────
      Player.setCredentialsProvider(Auth.credentialsProvider);
      console.log('[PLAYER] setCredentialsProvider called');

      Player.setEventSender(EventProducer);
      console.log('[PLAYER] setEventSender called — player ready');
    })();
  }
  return initPromise;
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
  await initTidalPlayer();

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
}
