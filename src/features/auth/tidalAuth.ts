import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-shell';
import * as Player from '@tidal-music/player';
import { generateVerifier, generateChallenge, generateState, buildAuthorizeUrl } from './pkce';
import { setAccessToken, clearAccessToken } from '../../lib/tidalApi';
import { bridgeCredentials, resetAuth } from '../../lib/tidalPlayer';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const CLIENT_ID = import.meta.env.VITE_TIDAL_CLIENT_ID as string | undefined;
const REDIRECT_URI =
  (import.meta.env.VITE_TIDAL_REDIRECT_URI as string | undefined) ??
  'http://127.0.0.1:8898/callback';

const TOKEN_URL = 'https://auth.tidal.com/v1/oauth2/token';

// ---------------------------------------------------------------------------
// localStorage keys
// ---------------------------------------------------------------------------
const STORAGE_TOKEN = 'tidal_access_token';
const STORAGE_EXPIRES = 'tidal_token_expires'; // millisecond timestamp
const STORAGE_SCOPES = 'tidal_token_scopes';   // JSON-encoded string[]
const STORAGE_VERIFIER = 'tidal_pkce_verifier';
const STORAGE_STATE = 'tidal_oauth_state';

// ---------------------------------------------------------------------------
// Token response shape (only fields we use)
// ---------------------------------------------------------------------------
interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope?: string;
}

// ---------------------------------------------------------------------------
// Public functions
// ---------------------------------------------------------------------------

/**
 * Kick off the PKCE login flow.
 * Opens the TIDAL authorization page in the user's default system browser.
 * We use the external browser rather than navigating the Tauri WebView directly
 * because TIDAL's login page requires a full browser environment and rejects
 * requests from embedded WebViews.
 */
export async function startLogin(): Promise<void> {
  console.log('[AUTH] startLogin called');
  console.log('[AUTH] CLIENT_ID present:', !!CLIENT_ID);
  console.log('[AUTH] REDIRECT_URI:', REDIRECT_URI);

  if (!CLIENT_ID) {
    throw new Error(
      'VITE_TIDAL_CLIENT_ID is not set. Add it to .env.local and restart the dev server.',
    );
  }

  const verifier = generateVerifier();
  const challenge = await generateChallenge(verifier);
  const state = generateState();

  localStorage.setItem(STORAGE_VERIFIER, verifier);
  localStorage.setItem(STORAGE_STATE, state);

  console.log('[AUTH] verifier stored (first 8 chars):', verifier.slice(0, 8) + '…');
  console.log('[AUTH] state stored:', state);

  const url = buildAuthorizeUrl(CLIENT_ID, REDIRECT_URI, challenge, state);
  console.log('[AUTH] authorize URL:', url);

  // Bind the loopback port now, before the browser opens, so the port is
  // ready the moment TIDAL redirects to it.
  await invoke('start_loopback_listener');
  console.log('[AUTH] loopback listener started on port 8898');

  // Opens in the OS default browser — keeps the Tauri window intact
  await open(url);
  console.log('[AUTH] browser open called');
}

/**
 * Handle the authorization callback received via deep link.
 * Accepts the full deep-link URL (e.g. toasty-tidal://auth/callback?code=…),
 * validates the state, exchanges the code, and persists the token.
 * Throws on any failure so callers can surface an error.
 */
export async function handleCallback(callbackUrl: string): Promise<void> {
  console.log('[AUTH] handleCallback called');
  console.log('[AUTH] full callback URL:', callbackUrl);

  const { searchParams } = new URL(callbackUrl);

  const oauthError = searchParams.get('error');
  if (oauthError) {
    const description = searchParams.get('error_description') ?? oauthError;
    console.error('[AUTH] OAuth error param received:', oauthError, description);
    throw new Error(`TIDAL authorization error: ${description}`);
  }

  const code = searchParams.get('code');
  console.log('[AUTH] code present:', !!code);
  console.log('[AUTH] code (first 8 chars):', code ? code.slice(0, 8) + '…' : 'null');
  if (!code) throw new Error('No authorization code found in callback URL.');

  const verifier = localStorage.getItem(STORAGE_VERIFIER);
  console.log('[AUTH] verifier in localStorage:', !!verifier);
  if (!verifier) {
    throw new Error('PKCE verifier is missing — the login session may have expired.');
  }

  const returnedState = searchParams.get('state');
  const expectedState = localStorage.getItem(STORAGE_STATE);
  console.log('[AUTH] returned state:', returnedState);
  console.log('[AUTH] expected state:', expectedState);
  console.log('[AUTH] state match:', returnedState === expectedState);
  if (!returnedState || returnedState !== expectedState) {
    throw new Error('OAuth state mismatch — possible CSRF, please try signing in again.');
  }

  if (!CLIENT_ID) throw new Error('VITE_TIDAL_CLIENT_ID is not set.');

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: REDIRECT_URI,
    client_id: CLIENT_ID,
    code_verifier: verifier,
  });

  console.log('[AUTH] starting token exchange →', TOKEN_URL);
  console.log('[AUTH] token exchange body (no secret):', body.toString().replace(code, code.slice(0, 8) + '…'));

  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  console.log('[AUTH] token exchange HTTP status:', response.status);

  if (!response.ok) {
    const detail = await response.text().catch(() => '<could not read body>');
    console.error('[AUTH] token exchange failed. status:', response.status, 'body:', detail);
    throw new Error(`Token exchange failed (HTTP ${response.status}): ${detail}`);
  }

  const data = (await response.json()) as TokenResponse;
  console.log('[AUTH] token exchange success. token_type:', data.token_type, 'expires_in:', data.expires_in);

  const expiresAt = Date.now() + data.expires_in * 1000;
  const grantedScopes = data.scope ? data.scope.split(' ') : [];

  localStorage.removeItem(STORAGE_VERIFIER);
  localStorage.removeItem(STORAGE_STATE);
  localStorage.setItem(STORAGE_TOKEN, data.access_token);
  localStorage.setItem(STORAGE_EXPIRES, String(expiresAt));
  localStorage.setItem(STORAGE_SCOPES, JSON.stringify(grantedScopes));
  setAccessToken(data.access_token);
  console.log('[AUTH] access token stored and applied');

  // Bridge credentials to the TIDAL SDK in the background.
  // Auth status (isAuthenticated) is determined by the token alone — we must
  // not await bridgeCredentials() here because Auth.init() / setCredentials()
  // can make network requests that hang indefinitely, which would freeze the
  // auth callback and leave the UI stuck at "Signing in…" with no error.
  bridgeCredentials(data.access_token, expiresAt, grantedScopes).catch(
    (err: unknown) => console.error('[AUTH] SDK credentials bridge failed:', err),
  );
  console.log('[AUTH] SDK credentials bridge started in background');
}

/**
 * Restore a previously persisted token on app startup.
 * Returns true if a token was found and applied.
 */
export async function restoreSession(): Promise<boolean> {
  const token = localStorage.getItem(STORAGE_TOKEN);
  console.log('[AUTH] restoreSession: token found in localStorage:', !!token);
  if (!token) return false;

  setAccessToken(token);

  const expiresStr = localStorage.getItem(STORAGE_EXPIRES);
  const scopesStr = localStorage.getItem(STORAGE_SCOPES);
  const expires = expiresStr ? Number(expiresStr) : Date.now() + 3_600_000;
  const grantedScopes: string[] = scopesStr ? (JSON.parse(scopesStr) as string[]) : [];

  // Same reasoning as handleCallback: bridge in background, never block
  // restoreSession() on a potentially-hanging network call from the SDK.
  if (grantedScopes.length > 0) {
    bridgeCredentials(token, expires, grantedScopes).catch((err: unknown) => {
      console.warn('[AUTH] SDK credentials bridge failed on restore:', err);
    });
  } else {
    console.warn('[AUTH] restoreSession: no stored scopes — SDK bridge skipped');
  }

  return true;
}

/**
 * Clear all auth state — token from memory, storage, and verifier.
 * Also stops any active SDK playback.
 */
export function signOut(): void {
  localStorage.removeItem(STORAGE_TOKEN);
  localStorage.removeItem(STORAGE_EXPIRES);
  localStorage.removeItem(STORAGE_SCOPES);
  localStorage.removeItem(STORAGE_VERIFIER);
  localStorage.removeItem(STORAGE_STATE);
  localStorage.removeItem('tidal-creds'); // clear SDK credential cache
  clearAccessToken();
  resetAuth(); // reset cached init promises so next sign-in starts fresh
  Player.reset().catch(console.error);
  console.log('[AUTH] signed out — localStorage and in-memory token cleared');
}
