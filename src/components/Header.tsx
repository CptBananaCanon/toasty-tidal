import { getCurrentWindow } from '@tauri-apps/api/window';
import { AuthButton } from '../features/auth/AuthButton';
import { AuthState } from '../features/auth/useAuth';
import { SearchInput } from '../features/search/SearchInput';
import { WindowControls } from './WindowControls';

interface Props {
  auth: AuthState;
  query: string;
  onQueryChange: (value: string) => void;
}

function handleDragRegionMouseDown(e: React.MouseEvent) {
  if (e.button !== 0) return;
  const target = e.target as HTMLElement;
  if (target.closest('button, input, a')) return;

  const startX = e.clientX;
  const startY = e.clientY;

  const onMove = (mv: MouseEvent) => {
    if (Math.abs(mv.clientX - startX) > 4 || Math.abs(mv.clientY - startY) > 4) {
      cleanup();
      getCurrentWindow().startDragging().catch(console.error);
    }
  };

  const cleanup = () => {
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('mouseup', cleanup);
  };

  document.addEventListener('mousemove', onMove);
  document.addEventListener('mouseup', cleanup);
}

export function Header({ auth, query, onQueryChange }: Props) {
  return (
    <header className="header" onMouseDown={handleDragRegionMouseDown}>
      <span className="header__logo">TOASTY</span>
      <div className="header__search">
        <SearchInput value={query} onChange={onQueryChange} />
      </div>
      <div className="header__right">
        <AuthButton
          status={auth.status}
          error={auth.error}
          onSignIn={auth.signIn}
          onSignOut={auth.signOut}
        />
        <WindowControls />
      </div>
    </header>
  );
}
