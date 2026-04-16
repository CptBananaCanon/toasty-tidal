import { useState, useEffect, useRef } from 'react';
import { RepeatMode } from './usePlayer';
import './PlayerControls.css';

interface Props {
  isPlaying: boolean;
  hasTrack: boolean;
  shuffle: boolean;
  repeat: RepeatMode;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onShuffle: () => void;
  onRepeat: () => void;
}

export function PlayerControls({
  isPlaying, hasTrack, shuffle, repeat,
  onPlay, onPause, onStop, onPrevious, onNext, onShuffle, onRepeat,
}: Props) {
  // Two independent latches — both can be physically down at the same time.
  // Audio plays only when playLatched=true AND pauseLatched=false.
  const [playLatched, setPlayLatched]   = useState(isPlaying);
  const [pauseLatched, setPauseLatched] = useState(false);

  // Ref so the isPlaying effect can read pauseLatched without it being a dep.
  const pauseLatchedRef = useRef(false);

  useEffect(() => {
    if (isPlaying) {
      // SDK confirmed playback — Play down, Pause up.
      setPlayLatched(true);
      setPauseLatched(false);
      pauseLatchedRef.current = false;
    } else if (!pauseLatchedRef.current) {
      // Stopped by external event (track ended, error) not by our pause button.
      setPlayLatched(false);
    }
    // If !isPlaying && pauseLatched: we caused the pause — keep both buttons down.
  }, [isPlaying]);

  function handlePlay() {
    setPlayLatched(true);
    if (!pauseLatchedRef.current) {
      // Pause is up — pressing Play starts/resumes normally.
      onPlay();
    }
    // Pause is already down — both buttons latch but audio stays held.
  }

  function handlePause() {
    const next = !pauseLatched;
    setPauseLatched(next);
    pauseLatchedRef.current = next;
    if (next) {
      // Pause button going DOWN — hold the deck.
      onPause();
    } else if (playLatched) {
      // Pause button popping UP while Play is still down — resume.
      onPlay();
    }
  }

  function handleStop() {
    setPlayLatched(false);
    setPauseLatched(false);
    pauseLatchedRef.current = false;
    onStop();
  }

  return (
    <div className="boombox-panel" role="group" aria-label="Transport controls">

      {/* ── Mode: shuffle ── */}
      <button
        className={`boombox-btn boombox-btn--mode${shuffle ? ' boombox-btn--active' : ''}`}
        onClick={onShuffle}
        aria-label="Shuffle"
        aria-pressed={shuffle}
        title="Shuffle"
      >
        <span className="boombox-btn__icon">⇄</span>
      </button>

      <div className="boombox-divider" aria-hidden="true" />

      {/* ── Transport: prev / next ── */}
      <button
        className="boombox-btn"
        onClick={onPrevious}
        disabled={!hasTrack}
        aria-label="Previous"
      >
        <span className="boombox-btn__icon">⏮</span>
      </button>

      {/* ── Playback: play / pause / stop ── */}
      <button
        className={`boombox-btn${playLatched ? ' boombox-btn--active' : ''}`}
        onClick={handlePlay}
        aria-label="Play"
        aria-pressed={playLatched}
      >
        <span className="boombox-btn__icon">▶</span>
      </button>

      <button
        className={`boombox-btn${pauseLatched ? ' boombox-btn--active' : ''}`}
        onClick={handlePause}
        aria-label="Pause"
        aria-pressed={pauseLatched}
      >
        <span className="boombox-btn__icon">⏸</span>
      </button>

      <button
        className="boombox-btn boombox-btn--stop"
        onClick={handleStop}
        aria-label="Stop"
      >
        <span className="boombox-btn__icon">■</span>
      </button>

      <button
        className="boombox-btn"
        onClick={onNext}
        disabled={!hasTrack}
        aria-label="Next"
      >
        <span className="boombox-btn__icon">⏭</span>
      </button>

      <div className="boombox-divider" aria-hidden="true" />

      {/* ── Mode: repeat ── */}
      <button
        className={`boombox-btn boombox-btn--mode${repeat !== 'off' ? ' boombox-btn--active' : ''}`}
        onClick={onRepeat}
        aria-label={`Repeat: ${repeat}`}
        aria-pressed={repeat !== 'off'}
        title={repeat === 'off' ? 'Repeat off' : repeat === 'all' ? 'Repeat all' : 'Repeat one'}
      >
        <span className="boombox-btn__icon boombox-btn__icon--repeat">
          ↺{repeat === 'one' && <span className="boombox-btn__badge">1</span>}
        </span>
      </button>

    </div>
  );
}
