import { AuthState } from '../auth/useAuth';
import tidalLogo from '../../assets/tidal-logo.svg';
import spotifyLogo from '../../assets/spotify-logo.svg';

interface Props {
  auth: AuthState;
  onBack: () => void;
}

export function SettingsPage({ auth, onBack }: Props) {
  return (
    <div className="settings-page">
      <button className="settings-page__back" onClick={onBack} aria-label="Go back">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
        </svg>
        Back
      </button>

      <h2 className="settings-page__title">Settings</h2>

      <div className="settings-page__body">
        <section className="settings-section">
          <h3 className="settings-section__title">Connections</h3>

          <div className="settings-connection-list">
            {/* TIDAL */}
            <div className="settings-connection">
              <div className="settings-connection__identity">
                <img src={tidalLogo} alt="TIDAL" className="settings-connection__logo" />
                <span className="settings-connection__name">TIDAL</span>
              </div>
              <div className="settings-connection__action">
                {auth.isAuthenticated ? (
                  <>
                    <span className="settings-connection__status settings-connection__status--connected">
                      Connected
                    </span>
                    <button
                      className="settings-btn settings-btn--ghost"
                      onClick={auth.signOut}
                    >
                      Disconnect
                    </button>
                  </>
                ) : auth.status === 'loading' ? (
                  <span className="settings-connection__status settings-connection__status--pending">
                    Signing in…
                  </span>
                ) : (
                  <>
                    {auth.error && (
                      <span className="settings-connection__error">{auth.error}</span>
                    )}
                    <button
                      className="settings-btn settings-btn--primary"
                      onClick={auth.signIn}
                    >
                      Connect
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Spotify */}
            <div className="settings-connection">
              <div className="settings-connection__identity">
                <img src={spotifyLogo} alt="Spotify" className="settings-connection__logo" />
                <span className="settings-connection__name">Spotify</span>
              </div>
              <div className="settings-connection__action">
                <span className="settings-connection__status settings-connection__status--disconnected">
                  Not connected
                </span>
                <button className="settings-btn settings-btn--ghost" disabled>
                  Coming soon
                </button>
              </div>
            </div>

            {/* Local Files */}
            <div className="settings-connection">
              <div className="settings-connection__identity">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="settings-connection__logo-icon" aria-hidden="true">
                  <path d="M20 6h-8l-2-2H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2z" />
                </svg>
                <span className="settings-connection__name">Local Files</span>
              </div>
              <div className="settings-connection__action">
                <button className="settings-btn settings-btn--ghost" disabled>
                  Add Local Folder
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
