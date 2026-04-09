import { useState } from 'react';
import { Track } from '../../types';

export interface PlayerState {
  currentTrack: Track | null;
  isPlaying: boolean;
  play: (track: Track, queue: Track[]) => void;
  togglePlayPause: () => void;
  playPrevious: () => void;
  playNext: () => void;
}

export function usePlayer(): PlayerState {
  const [queue, setQueue] = useState<Track[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(-1);
  const [isPlaying, setIsPlaying] = useState(false);

  const currentTrack = queue[currentIndex] ?? null;

  function play(track: Track, incomingQueue: Track[]) {
    const idx = incomingQueue.findIndex((t) => t.id === track.id);
    if (idx !== -1) {
      setQueue(incomingQueue);
      setCurrentIndex(idx);
    } else {
      setQueue([track]);
      setCurrentIndex(0);
    }
    setIsPlaying(true);
  }

  function togglePlayPause() {
    if (currentIndex === -1) return;
    setIsPlaying((prev) => !prev);
  }

  function playPrevious() {
    if (currentIndex <= 0) return;
    setCurrentIndex((i) => i - 1);
    setIsPlaying(true);
  }

  function playNext() {
    if (currentIndex === -1 || currentIndex >= queue.length - 1) return;
    setCurrentIndex((i) => i + 1);
    setIsPlaying(true);
  }

  return { currentTrack, isPlaying, play, togglePlayPause, playPrevious, playNext };
}
