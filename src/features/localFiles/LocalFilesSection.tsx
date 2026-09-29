import { Track } from '../../types';

interface Props {
  localTracks: Track[];
  isLoading: boolean;
  error: string | null;
  selectedId: string | null;
  playingId: string | null;
  onSelect: (track: Track) => void;
  onAddToQueue: (track: Track) => void;
}

export function LocalFilesSection({
  localTracks,
  isLoading,
  error,
  selectedId,
  playingId,
  onSelect,
  onAddToQueue,
}: Props) {
  if (!isLoading && localTracks.length === 0 && !error) return null;

  return (
    <div className="local-files-section">
      <div className="local-files-section__header">
        <span className="local-files-section__label">Local Files</span>
        <span className="local-files-section__badge">dev</span>
      </div>

      {isLoading && (
        <p className="search-status search-status--loading">Scanning…</p>
      )}

      {error && (
        <p className="search-status search-status--error">Local scan failed: {error}</p>
      )}

      {!isLoading && localTracks.length > 0 && (
        <ul className="search-results">
          {localTracks.map((track) => {
            const isSelected = track.id === selectedId;
            const isPlaying  = track.id === playingId;
            return (
              <li
                key={track.id}
                className={`result-item${isSelected ? ' result-item--selected' : ''}${isPlaying ? ' result-item--playing' : ''}`}
                onClick={() => onSelect(track)}
              >
                <div className="result-item__art-wrap">
                  {isPlaying ? (
                    <div className="result-item__playing-overlay">
                      <div className="playing-bars">
                        <div className="playing-bars__bar" />
                        <div className="playing-bars__bar" />
                        <div className="playing-bars__bar" />
                      </div>
                    </div>
                  ) : (
                    <div className="result-item__art-placeholder" />
                  )}
                </div>

                <span className="result-item__title">{track.title}</span>
                <span className="result-item__artist">Local File</span>
                <span className="result-item__album" />
                <span className="result-item__duration" />

                <button
                  className="result-item__queue-btn"
                  aria-label="Add to queue"
                  onClick={(e) => { e.stopPropagation(); onAddToQueue(track); }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M19 11h-6V5h-2v6H5v2h6v6h2v-6h6z" />
                  </svg>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
