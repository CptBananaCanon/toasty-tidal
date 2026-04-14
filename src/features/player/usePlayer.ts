import { useState, useEffect } from 'react';
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
  const [currentIndex, setCurrentIndex] = useState<number>(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState<RepeatMode>('off');
  const [position, setPosition] = useState(0);

  const currentTrack = queue[currentIndex] ?? null;

  // Mock timer — ticks every real second while playing
  useEffect(() => {
    if (!isPlaying || currentIndex === -1) return;
    const id = setInterval(() => setPosition((p) => p + 1), 1000);
    return () => clearInterval(id);
  }, [isPlaying, currentIndex]);

  // End-of-track handler
  useEffect(() => {
    const duration = currentTrack?.duration ?? 0;
    if (duration === 0 || position < duration) return;

    if (repeat === 'one') {
      setPosition(0);
    } else if (repeat === 'all') {
      const nextIdx = currentIndex < queue.length - 1 ? currentIndex + 1 : 0;
      setCurrentIndex(nextIdx);
      setPosition(0);
    } else {
      setIsPlaying(false);
    }
  }, [position, repeat, currentTrack, currentIndex, queue.length]);

  function play(track: Track, incomingQueue: Track[]) {
    const idx = incomingQueue.findIndex((t) => t.id === track.id);
    if (idx !== -1) {
      setQueue(incomingQueue);
      setCurrentIndex(idx);
    } else {
      setQueue([track]);
      setCurrentIndex(0);
    }
    setPosition(0);
    setIsPlaying(true);
  }

  function togglePlayPause() {
    if (currentIndex === -1) return;
    setIsPlaying((prev) => !prev);
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
  }

  function playPrevious() {
    if (currentIndex <= 0) return;
    setCurrentIndex((i) => i - 1);
    setPosition(0);
    setIsPlaying(true);
  }

  function playNext() {
    if (currentIndex === -1 || currentIndex >= queue.length - 1) return;
    setCurrentIndex((i) => i + 1);
    setPosition(0);
    setIsPlaying(true);
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
