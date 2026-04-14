import { AuthButton } from '../features/auth/AuthButton';
import { AuthState } from '../features/auth/useAuth';
import { SearchInput } from '../features/search/SearchInput';
import logo from '../assets/toasty-logo.png';

interface Props {
  auth: AuthState;
  query: string;
  onQueryChange: (value: string) => void;
  crtEnabled: boolean;
  onCrtToggle: () => void;
}

export function Header({ auth, query, onQueryChange, crtEnabled, onCrtToggle }: Props) {
  return (
    <header className="header">
      <img src={logo} alt="Toasty" className="header__logo" />
      <div className="header__search">
        <SearchInput value={query} onChange={onQueryChange} />
      </div>
      <div className="auth-row">
        <label className="crt-toggle" title="Toggle CRT scanlines">
          <span className={`crt-toggle__label${crtEnabled ? ' crt-toggle__label--on' : ''}`}>
            CRT
          </span>
          <input
            type="checkbox"
            className="crt-toggle__input"
            checked={crtEnabled}
            onChange={onCrtToggle}
          />
          <span className="crt-toggle__track" />
        </label>
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
