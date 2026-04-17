import { getCurrentWindow } from '@tauri-apps/api/window';

export function WindowControls() {
  return (
    <div className="window-controls">
      <button
        className="window-controls__btn"
        onClick={() => getCurrentWindow().minimize()}
        aria-label="Minimise"
        title="Minimise"
      >
        <svg width="10" height="1" viewBox="0 0 10 1" fill="currentColor">
          <rect width="10" height="1" />
        </svg>
      </button>
      <button
        className="window-controls__btn"
        onClick={() => getCurrentWindow().toggleMaximize()}
        aria-label="Maximise"
        title="Maximise"
      >
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1">
          <rect x="0.5" y="0.5" width="9" height="9" />
        </svg>
      </button>
      <button
        className="window-controls__btn window-controls__btn--close"
        onClick={() => getCurrentWindow().close()}
        aria-label="Close"
        title="Close"
      >
        <svg width="10" height="10" viewBox="0 0 10 10" stroke="currentColor" strokeWidth="1.2">
          <line x1="0" y1="0" x2="10" y2="10" />
          <line x1="10" y1="0" x2="0" y2="10" />
        </svg>
      </button>
    </div>
  );
}
