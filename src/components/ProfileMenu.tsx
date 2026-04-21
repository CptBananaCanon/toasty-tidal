import { useState, useRef, useEffect } from 'react';
import { AuthState } from '../features/auth/useAuth';
import tidalLogo from '../assets/tidal-logo.svg';
import spotifyLogo from '../assets/spotify-logo.svg';

interface Props {
  auth: AuthState;
  onOpenSettings: () => void;
}

export function ProfileMenu({ auth, onOpenSettings }: Props) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onOutsideClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onOutsideClick);
    return () => document.removeEventListener('mousedown', onOutsideClick);
  }, [open]);

  return (
    <div className="profile-menu-wrapper" ref={wrapperRef}>
      <div className="service-indicators">
        <div
          className="service-indicator"
          title={auth.isAuthenticated ? 'TIDAL: Connected' : 'TIDAL: Disconnected'}
        >
          <img src={tidalLogo} alt="TIDAL" className="service-indicator__icon" />
          <span
            className={`service-indicator__dot ${
              auth.isAuthenticated
                ? 'service-indicator__dot--green'
                : 'service-indicator__dot--red'
            }`}
          />
        </div>
        <div className="service-indicator" title="Spotify: Not connected">
          <img src={spotifyLogo} alt="Spotify" className="service-indicator__icon" />
          <span className="service-indicator__dot service-indicator__dot--red" />
        </div>
      </div>

      <button
        className="profile-btn"
        onClick={() => setOpen((o) => !o)}
        aria-label="Open profile menu"
        aria-expanded={open}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
        </svg>
      </button>

      {open && (
        <div className="profile-dropdown" role="menu">
          <button className="profile-dropdown__item profile-dropdown__item--disabled" disabled role="menuitem">
            Profile
          </button>
          <button
            className="profile-dropdown__item"
            role="menuitem"
            onClick={() => { setOpen(false); onOpenSettings(); }}
          >
            Settings
          </button>
          <button className="profile-dropdown__item profile-dropdown__item--disabled" disabled role="menuitem">
            Help
          </button>
        </div>
      )}
    </div>
  );
}
