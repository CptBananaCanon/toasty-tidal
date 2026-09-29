import { Track } from '../../types';

const PREVIEW_LIMIT = 6;

interface Props {
  localTracks: Track[];
  currentTrack: Track | null;
  isPlaying: boolean;
  onSelect: (track: Track) => void;
  onAddToQueue: (track: Track) => void;
}

export function HomeView({
  localTracks,
  currentTrack,
  isPlaying,
  onSelect,
  onAddToQueue,
}: Props) {
  const featuredTrack = localTracks[0] ?? null;
  const isFeaturedPlaying =
    isPlaying && currentTrack?.id === featuredTrack?.id;
  const isFeaturedSelected = currentTrack?.id === featuredTrack?.id;

  const previewTracks = localTracks.slice(0, PREVIEW_LIMIT);

  return (
    <div className="home-view">

      {/* ── Hero ──────────────────────────────────────────── */}
      <section className="home-hero">
        <div
          className={`home-hero__art${isFeaturedPlaying ? ' home-hero__art--playing' : ''}`}
        >
          {featuredTrack?.coverUrl ? (
            <img
              src={featuredTrack.coverUrl}
              alt={featuredTrack.title}
              className="home-hero__art-img"
            />
          ) : (
            <div className="home-hero__art-placeholder">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z" />
              </svg>
            </div>
          )}
          {isFeaturedPlaying && (
            <div className="home-hero__playing-overlay">
              <div className="playing-bars playing-bars--lg">
                <div className="playing-bars__bar" />
                <div className="playing-bars__bar" />
                <div className="playing-bars__bar" />
                <div className="playing-bars__bar" />
              </div>
            </div>
          )}
        </div>

        <div className="home-hero__body">
          <span className="home-hero__eyebrow">Featured Track</span>
          {featuredTrack ? (
            <>
              <h2 className="home-hero__title">{featuredTrack.title}</h2>
              <p className="home-hero__meta">Local File · Toasty</p>
              <button
                className={`home-hero__play-btn${isFeaturedSelected ? ' home-hero__play-btn--active' : ''}`}
                onClick={() => onSelect(featuredTrack)}
                aria-label={isFeaturedPlaying ? 'Now playing' : `Play ${featuredTrack.title}`}
              >
                {isFeaturedPlaying ? (
                  <>
                    <span className="home-hero__play-icon">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                        <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                      </svg>
                    </span>
                    Now Playing
                  </>
                ) : (
                  <>
                    <span className="home-hero__play-icon">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </span>
                    Play
                  </>
                )}
              </button>
            </>
          ) : (
            <>
              <h2 className="home-hero__title">Welcome to Toasty</h2>
              <p className="home-hero__meta">Add audio files to your Music folder to get started</p>
            </>
          )}
        </div>
      </section>

      {/* ── Local files preview ───────────────────────────── */}
      {previewTracks.length > 0 && (
        <section className="home-section">
          <div className="home-section__header">
            <span className="home-section__label">Local Files</span>
            <span className="local-files-section__badge">dev</span>
          </div>
          <ul className="search-results">
            {previewTracks.map((track) => {
              const isSelected = track.id === currentTrack?.id;
              const isNowPlaying = isPlaying && isSelected;
              return (
                <li
                  key={track.id}
                  className={`result-item${isSelected ? ' result-item--selected' : ''}${isNowPlaying ? ' result-item--playing' : ''}`}
                  onClick={() => onSelect(track)}
                >
                  <div className="result-item__art-wrap">
                    {isNowPlaying && (
                      <div className="result-item__playing-overlay">
                        <div className="playing-bars">
                          <div className="playing-bars__bar" />
                          <div className="playing-bars__bar" />
                          <div className="playing-bars__bar" />
                        </div>
                      </div>
                    )}
                    <div className="result-item__art-placeholder" />
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
        </section>
      )}
    </div>
  );
}
