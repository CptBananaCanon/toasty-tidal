// ---------------------------------------------------------------------------
// PKCE helpers — all crypto runs client-side using Web Crypto API.
// No client secret is used or needed.
// ---------------------------------------------------------------------------

function base64url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** Generate a cryptographically random 32-byte verifier, base64url-encoded. */
export function generateVerifier(): string {
  const buf = new Uint8Array(32);
  crypto.getRandomValues(buf);
  return base64url(buf.buffer);
}

/** Generate a random OAuth state value for CSRF protection. */
export function generateState(): string {
  const buf = new Uint8Array(16);
  crypto.getRandomValues(buf);
  return base64url(buf.buffer);
}

/** Derive the S256 code challenge from a verifier. */
export async function generateChallenge(verifier: string): Promise<string> {
  const encoded = new TextEncoder().encode(verifier);
  const hash = await crypto.subtle.digest('SHA-256', encoded);
  return base64url(hash);
}

/** Build the TIDAL authorization URL for the PKCE flow. */
export function buildAuthorizeUrl(
  clientId: string,
  redirectUri: string,
  challenge: string,
  state: string,
): string {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: redirectUri,
    code_challenge: challenge,
    code_challenge_method: 'S256',
    scope: 'user.read',
    state,
  });
  return `https://login.tidal.com/authorize?${params.toString()}`;
}
