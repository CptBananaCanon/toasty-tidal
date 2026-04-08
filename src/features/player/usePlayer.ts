import { useState } from 'react';
import { Track } from '../../types';

export interface PlayerState {
  currentTrack: Track | null;
  isPlaying: boolean;
  play: (track: Track) => void;
  togglePlayPause: () => void;
  playPrevious: () => void;
  playNext: () => void;
}

export function usePlayer(queue: Track[] = []): PlayerState {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  function play(track: Track) {
    setCurrentTrack(track);
    setIsPlaying(true);
  }

  function togglePlayPause() {
    if (!currentTrack) return;
    setIsPlaying((prev) => !prev);
  }

  function playPrevious() {
    if (!currentTrack || queue.length === 0) return;
    const idx = queue.findIndex((t) => t.id === currentTrack.id);
    if (idx > 0) play(queue[idx - 1]);
  }

  function playNext() {
    if (!currentTrack || queue.length === 0) return;
    const idx = queue.findIndex((t) => t.id === currentTrack.id);
    if (idx !== -1 && idx < queue.length - 1) play(queue[idx + 1]);
  }

  return { currentTrack, isPlaying, play, togglePlayPause, playPrevious, playNext };
}
