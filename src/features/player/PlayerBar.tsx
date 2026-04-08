import { Track } from '../../types';

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

interface Props {
  track: Track | null;
  isPlaying: boolean;
  onPlayPause: () => void;
  onPrevious: () => void;
  onNext: () => void;
}

export function PlayerBar({ track, isPlaying, onPlayPause, onPrevious, onNext }: Props) {
  return (
    <div className="player-bar">
      <div className="player-bar__track-info">
        {track ? (
          <>
            <span className="player-bar__title">{track.title}</span>
            <span className="player-bar__artist">{track.artist.name}</span>
            <span className="player-bar__duration">{formatDuration(track.duration)}</span>
          </>
        ) : (
          <span className="player-bar__empty">No track selected</span>
        )}
      </div>

      <div className="player-bar__controls">
        <button
          className="player-btn"
          onClick={onPrevious}
          disabled={!track}
          aria-label="Previous"
        >
          ⏮
        </button>
        <button
          className="player-btn player-btn--primary"
          onClick={onPlayPause}
          disabled={!track}
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? '⏸' : '▶'}
        </button>
        <button
          className="player-btn"
          onClick={onNext}
          disabled={!track}
          aria-label="Next"
        >
          ⏭
        </button>
      </div>
    </div>
  );
}
