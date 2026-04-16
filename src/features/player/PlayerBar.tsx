import { useState } from 'react';
import { Track } from '../../types';
import { PlayerControls } from './PlayerControls';
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
  onSeek: (seconds: number) => void;
  onShuffle: () => void;
  onRepeat: () => void;
}

export function PlayerBar({
  track, isPlaying, shuffle, repeat, position,
  onPlayPause, onPrevious, onNext, onSeek, onShuffle, onRepeat,
}: Props) {
  const [volume, setVolume] = useState(80);
  const [showVolume, setShowVolume] = useState(false);

  const duration = track?.duration ?? 0;
  const fillPct = duration > 0 ? `${(position / duration) * 100}%` : '0%';
  const volPct = `${volume}%`;

  // Derive separate play/pause/stop handlers from the single togglePlayPause.
  // Play  → only fires togglePlayPause when not already playing.
  // Pause → only fires togglePlayPause when currently playing.
  // Stop  → same as pause functionally (no dedicated reset in usePlayer yet).
  function handlePlay() {
    if (!isPlaying) onPlayPause();
  }
  function handlePause() {
    if (isPlaying) onPlayPause();
  }
  function handleStop() {
    if (isPlaying) onPlayPause();
  }

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

      {/* ── Center: boombox controls + scrubber ── */}
      <div className="player-bar__center">
        <PlayerControls
          isPlaying={isPlaying}
          hasTrack={track !== null}
          shuffle={shuffle}
          repeat={repeat}
          onPlay={handlePlay}
          onPause={handlePause}
          onStop={handleStop}
          onPrevious={onPrevious}
          onNext={onNext}
          onShuffle={onShuffle}
          onRepeat={onRepeat}
        />

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

      {/* ── Right: volume ── */}
      <div className="player-bar__side">
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
