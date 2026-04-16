import { useState, useEffect, useRef, useCallback } from 'react';
import * as Player from '@tidal-music/player';
import { Track } from '../../types';

export type RepeatMode = 'off' | 'all' | 'one';

export interface PlayerState {
  currentTrack: Track | null;
  isPlaying: boolean;
  shuffle: boolean;
  repeat: RepeatMode;
  position: number;
  play: (track: Track, queue: Track[]) => void;
  togglePlayPause: () => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
  seek: (seconds: number) => void;
  playPrevious: () => void;
  playNext: () => void;
}

export function usePlayer(): PlayerState {
  const [queue, setQueue] = useState<Track[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState<RepeatMode>('off');
  const [position, setPosition] = useState(0);

  // ---------------------------------------------------------------------------
  // Refs — keep event-handler closures current without re-registering listeners
  // ---------------------------------------------------------------------------
  const queueRef = useRef<Track[]>([]);
  const currentIndexRef = useRef(-1);
  const repeatRef = useRef<RepeatMode>('off');
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Sync refs every render (before effects run)
  queueRef.current = queue;
  currentIndexRef.current = currentIndex;
  repeatRef.current = repeat;

  const currentTrack = queue[currentIndex] ?? null;

  // ---------------------------------------------------------------------------
  // Polling — starts only while PLAYING, stops on every non-playing transition
  // ---------------------------------------------------------------------------
  const stopPolling = useCallback(() => {
    if (pollRef.current !== null) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const startPolling = useCallback(() => {
    stopPolling();
    pollRef.current = setInterval(() => {
      setPosition(Player.getAssetPosition());
    }, 250);
  }, [stopPolling]);

  // ---------------------------------------------------------------------------
  // SDK event listeners — attached once, cleaned up on unmount
  // ---------------------------------------------------------------------------
  useEffect(() => {
    function onStateChange(e: Event) {
      const { state } = (e as CustomEvent<{ state: string }>).detail;
      if (state === 'PLAYING') {
        setIsPlaying(true);
        startPolling();
      } else {
        // NOT_PLAYING, STALLED, IDLE
        setIsPlaying(false);
        stopPolling();
      }
    }

    function onEnded() {
      stopPolling();
      setIsPlaying(false);

      const idx = currentIndexRef.current;
      const q = queueRef.current;
      const rep = repeatRef.current;

      if (rep === 'one') {
        const track = q[idx];
        if (track) {
          Player.load({ productType: 'track', productId: track.id, sourceId: 'queue', sourceType: 'QUEUE' })
            .then(() => Player.play())
            .catch(console.error);
        }
        return;
      }

      const isLast = idx >= q.length - 1;
      const nextIdx = rep === 'all' && isLast ? 0 : idx + 1;

      // repeat === 'off' at end of queue: stop
      if (rep === 'off' && isLast) return;

      setCurrentIndex(nextIdx);
      const next = q[nextIdx];
      if (next) {
        Player.load({ productType: 'track', productId: next.id, sourceId: 'queue', sourceType: 'QUEUE' })
          .then(() => Player.play())
          .catch(console.error);
      }
    }

    function onError() {
      stopPolling();
      setIsPlaying(false);
    }

    Player.events.addEventListener('playback-state-change', onStateChange);
    Player.events.addEventListener('ended', onEnded);
    Player.events.addEventListener('error', onError);

    return () => {
      Player.events.removeEventListener('playback-state-change', onStateChange);
      Player.events.removeEventListener('ended', onEnded);
      Player.events.removeEventListener('error', onError);
      stopPolling();
    };
  }, [startPolling, stopPolling]);

  // ---------------------------------------------------------------------------
  // Public actions
  // ---------------------------------------------------------------------------
  function play(track: Track, incomingQueue: Track[]) {
    const idx = incomingQueue.findIndex((t) => t.id === track.id);
    const newQueue = idx !== -1 ? incomingQueue : [track];
    const newIdx = idx !== -1 ? idx : 0;
    setQueue(newQueue);
    setCurrentIndex(newIdx);
    setPosition(0);

    Player.load({
      productType: 'track',
      productId: track.id,
      sourceId: 'search',
      sourceType: 'SEARCH',
    })
      .then(() => Player.play())
      .catch(console.error);
  }

  function togglePlayPause() {
    if (currentIndex === -1) return;
    if (isPlaying) {
      Player.pause();
    } else {
      Player.play().catch(console.error);
    }
  }

  function toggleShuffle() {
    setShuffle((prev) => !prev);
  }

  function cycleRepeat() {
    setRepeat((prev) => {
      if (prev === 'off') return 'all';
      if (prev === 'all') return 'one';
      return 'off';
    });
  }

  function seek(seconds: number) {
    const clamped = Math.max(0, Math.min(seconds, currentTrack?.duration ?? 0));
    setPosition(clamped);
    Player.seek(clamped)?.catch(console.error);
  }

  function playPrevious() {
    if (currentIndex <= 0) return;
    const newIdx = currentIndex - 1;
    const track = queue[newIdx];
    if (!track) return;
    setCurrentIndex(newIdx);
    setPosition(0);
    Player.load({ productType: 'track', productId: track.id, sourceId: 'queue', sourceType: 'QUEUE' })
      .then(() => Player.play())
      .catch(console.error);
  }

  function playNext() {
    if (currentIndex === -1 || currentIndex >= queue.length - 1) return;
    const newIdx = currentIndex + 1;
    const track = queue[newIdx];
    if (!track) return;
    setCurrentIndex(newIdx);
    setPosition(0);
    Player.load({ productType: 'track', productId: track.id, sourceId: 'queue', sourceType: 'QUEUE' })
      .then(() => Player.play())
      .catch(console.error);
  }

  return {
    currentTrack,
    isPlaying,
    shuffle,
    repeat,
    position,
    play,
    togglePlayPause,
    toggleShuffle,
    cycleRepeat,
    seek,
    playPrevious,
    playNext,
  };
}
