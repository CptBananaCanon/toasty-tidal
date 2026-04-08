import { AuthStatus } from './useAuth';

interface Props {
  status: AuthStatus;
  error: string | null;
  onSignIn: () => void;
  onSignOut: () => void;
}

export function AuthButton({ status, error, onSignIn, onSignOut }: Props) {
  if (status === 'loading') {
    return <span className="auth-label auth-label--muted">Signing in…</span>;
  }

  if (status === 'authenticated') {
    return (
      <div className="auth-row">
        <span className="auth-label auth-label--ok">Signed in</span>
        <button className="auth-btn auth-btn--ghost" onClick={onSignOut}>
          Sign out
        </button>
      </div>
    );
  }

  // idle or error
  return (
    <div className="auth-row">
      {error && <span className="auth-label auth-label--error">{error}</span>}
      <button className="auth-btn auth-btn--primary" onClick={onSignIn}>
        Sign in to TIDAL
      </button>
    </div>
  );
}
