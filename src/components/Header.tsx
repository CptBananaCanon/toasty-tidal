import { AuthButton } from '../features/auth/AuthButton';
import { AuthState } from '../features/auth/useAuth';

interface Props {
  auth: AuthState;
}

export function Header({ auth }: Props) {
  return (
    <header className="header">
      <span className="header__logo">TIDAL</span>
      <AuthButton
        status={auth.status}
        error={auth.error}
        onSignIn={auth.signIn}
        onSignOut={auth.signOut}
      />
    </header>
  );
}
