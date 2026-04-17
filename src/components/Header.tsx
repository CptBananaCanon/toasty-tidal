import { AuthButton } from '../features/auth/AuthButton';
import { AuthState } from '../features/auth/useAuth';
import { SearchInput } from '../features/search/SearchInput';

interface Props {
  auth: AuthState;
  query: string;
  onQueryChange: (value: string) => void;
}

export function Header({ auth, query, onQueryChange }: Props) {
  return (
    <header className="header">
      <span className="header__logo">TOASTY</span>
      <div className="header__search">
        <SearchInput value={query} onChange={onQueryChange} />
      </div>
      <div className="auth-row">
        <AuthButton
          status={auth.status}
          error={auth.error}
          onSignIn={auth.signIn}
          onSignOut={auth.signOut}
        />
      </div>
    </header>
  );
}
