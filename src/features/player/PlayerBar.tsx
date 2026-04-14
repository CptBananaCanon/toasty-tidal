import { useState } from 'react';
import { Track } from '../../types';
import { RepeatMode } from './usePlayer';

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

interface Props {
  track: Track | null;
  isPlaying: boolean;
  shuffle: boolean;
  repeat: RepeatMode;
  position: number;
  onPlayPause: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onShuffle: () => void;
  onRepeat: () => void;
  onSeek: (seconds: number) => void;
}

export function PlayerBar({
  track, isPlaying, shuffle, repeat, position,
  onPlayPause, onPrevious, onNext, onShuffle, onRepeat, onSeek,
}: Props) {
  const [volume, setVolume] = useState(80);
  const [showVolume, setShowVolume] = useState(false);

  const duration = track?.duration ?? 0;
  const fillPct = duration > 0 ? `${(position / duration) * 100}%` : '0%';
  const volPct = `${volume}%`;

  return (
    <div className="player-bar">

      {/* ── Left: art + track info ── */}
      <div className="player-bar__info">
        <div className="player-bar__art">
          {track?.coverUrl
            ? <img className="player-bar__art-img" src={track.coverUrl} alt="cover" />
            : <div className="player-bar__art-placeholder" />
          }
        </div>
        <div className="player-bar__meta">
          {track ? (
            <>
              <span className="player-bar__title">{track.title}</span>
              <span className="player-bar__artist">{track.artist.name}</span>
            </>
          ) : (
            <span className="player-bar__empty">No track selected</span>
          )}
        </div>
      </div>

      {/* ── Center: controls + scrubber ── */}
      <div className="player-bar__center">
        <div className="player-bar__controls">
          <button
            className={`player-btn player-btn--sm${shuffle ? ' player-btn--active' : ''}`}
            onClick={onShuffle}
            aria-label="Shuffle"
            title="Shuffle"
          >
            ⇄
          </button>
          <button
            className="player-btn player-btn--sm"
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
            className="player-btn player-btn--sm"
            onClick={onNext}
            disabled={!track}
            aria-label="Next"
          >
            ⏭
          </button>
          <button
            className={`player-btn player-btn--sm player-btn--repeat${repeat !== 'off' ? ' player-btn--active' : ''}`}
            onClick={onRepeat}
            aria-label={`Repeat: ${repeat}`}
            title={repeat === 'off' ? 'Repeat off' : repeat === 'all' ? 'Repeat all' : 'Repeat one'}
          >
            ↺{repeat === 'one' && <span className="player-btn__badge">1</span>}
          </button>
        </div>

        <div className="player-bar__progress">
          <span className="player-bar__time">{formatTime(position)}</span>
          <input
            type="range"
            className="player-bar__scrubber"
            min={0}
            max={duration || 1}
            value={position}
            disabled={!track}
            onChange={(e) => onSeek(Number(e.target.value))}
            style={{ '--fill-pct': fillPct } as React.CSSProperties}
            aria-label="Seek"
          />
          <span className="player-bar__time player-bar__time--end">{formatTime(duration)}</span>
        </div>
      </div>

      {/* ── Right: queue + volume ── */}
      <div className="player-bar__side">
        <button className="player-btn player-btn--sm" aria-label="Queue" title="Queue">
          ☰
        </button>
        <div className="player-bar__vol-wrapper">
          <button
            className={`player-btn player-btn--sm${showVolume ? ' player-btn--active' : ''}`}
            onClick={() => setShowVolume((v) => !v)}
            aria-label="Volume"
            title="Volume"
          >
            {volume === 0 ? '○' : '♪'}
          </button>
          {showVolume && (
            <div className="player-bar__vol-panel">
              <input
                type="range"
                className="player-bar__vol-slider"
                min={0}
                max={100}
                value={volume}
                onChange={(e) => setVolume(Number(e.target.value))}
                style={{ '--fill-pct': volPct } as React.CSSProperties}
                aria-label="Volume level"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
