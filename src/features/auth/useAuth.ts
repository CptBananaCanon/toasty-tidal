import { useState, useEffect } from 'react';
import { listen } from '@tauri-apps/api/event';
import { onOpenUrl, getCurrent } from '@tauri-apps/plugin-deep-link';
import { startLogin, handleCallback, restoreSession, signOut as doSignOut } from './tidalAuth';

export type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'error';

export interface AuthState {
  status: AuthStatus;
  error: string | null;
  isAuthenticated: boolean;
  signIn: () => void;
  signOut: () => void;
}

export function useAuth(): AuthState {
  const [status, setStatus] = useState<AuthStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let unlistenOauthEvent: (() => void) | undefined;
    let unlistenDeepLink: (() => void) | undefined;

    (async () => {
      // ── 1. Primary callback path: loopback HTTP listener ─────────────────
      // The Rust command emits 'oauth-callback' with the full redirect URL
      // once the browser hits http://127.0.0.1:8898/callback.
      console.log('[AUTH] registering oauth-callback event listener');
      unlistenOauthEvent = await listen<string>('oauth-callback', (event) => {
        const url = event.payload;
        console.log('[AUTH] oauth-callback event received:', url);

        setError(null);
        setStatus('loading');

        handleCallback(url)
          .then(() => {
            console.log('[AUTH] status → authenticated (from loopback)');
            setStatus('authenticated');
          })
          .catch((err: unknown) => {
            const message = err instanceof Error ? err.message : 'Login failed.';
            console.error('[AUTH] handleCallback error (loopback):', message);
            setError(message);
            setStatus('error');
          });
      });
      console.log('[AUTH] oauth-callback listener registered');

      // ── 2. Cold-start / single-instance handoff (deep-link fallback) ─────
      // getCurrent() handles the case where the app was launched via
      // the custom scheme URL (toasty-tidal://…). Kept for completeness.
      console.log('[AUTH] checking getCurrent()');
      const currentUrls = await getCurrent();
      console.log('[AUTH] getCurrent() result:', currentUrls);
      const launchUrl = currentUrls?.[0];

      if (launchUrl) {
        console.log('[AUTH] deep link present at launch, processing callback');
        setStatus('loading');
        try {
          await handleCallback(launchUrl);
          console.log('[AUTH] status → authenticated (from launch URL)');
          setStatus('authenticated');
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Login failed.';
          console.error('[AUTH] handleCallback error (launch URL):', message);
          setError(message);
          setStatus('error');
        }
      } else {
        // ── 3. Normal startup — restore any persisted token ────────────────
        console.log('[AUTH] no launch URL — attempting restoreSession');
        if (restoreSession()) {
          console.log('[AUTH] status → authenticated (restored session)');
          setStatus('authenticated');
        } else {
          console.log('[AUTH] status → idle (no stored token)');
        }
      }

      // ── 4. Deep-link listener while app is running (fallback) ────────────
      console.log('[AUTH] registering onOpenUrl listener');
      unlistenDeepLink = await onOpenUrl((urls) => {
        console.log('[AUTH] DEEP LINK RECEIVED:', urls);
        const url = urls[0];
        if (!url) {
          console.warn('[AUTH] onOpenUrl fired but urls array was empty');
          return;
        }

        setStatus('loading');
        setError(null);

        handleCallback(url)
          .then(() => {
            console.log('[AUTH] status → authenticated (from onOpenUrl)');
            setStatus('authenticated');
          })
          .catch((err: unknown) => {
            const message = err instanceof Error ? err.message : 'Login failed.';
            console.error('[AUTH] handleCallback error (onOpenUrl):', message);
            setError(message);
            setStatus('error');
          });
      });
      console.log('[AUTH] onOpenUrl listener registered');
    })();

    return () => {
      unlistenOauthEvent?.();
      unlistenDeepLink?.();
    };
  }, []);

  function signIn() {
    console.log('[AUTH] signIn called');
    setError(null);
    startLogin()
      .then(() => {
        // Browser is open; switch to loading so the UI reflects that we're
        // waiting for the user to complete login.
        console.log('[AUTH] browser opened, status → loading');
        setStatus('loading');
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : 'Could not start login.';
        console.error('[AUTH] startLogin error:', message);
        setError(message);
        setStatus('error');
      });
  }

  function signOut() {
    console.log('[AUTH] signOut called');
    doSignOut();
    setStatus('idle');
    setError(null);
  }

  return {
    status,
    error,
    isAuthenticated: status === 'authenticated',
    signIn,
    signOut,
  };
}
