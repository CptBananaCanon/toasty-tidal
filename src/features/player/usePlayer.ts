import { useState, useEffect, useRef, useCallback } from 'react';
import * as Player from '@tidal-music/player';
import { readFile } from '@tauri-apps/plugin-fs';
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
  injectAfterCurrent: (track: Track) => void;
  replaceUpcoming: (tracks: Track[]) => void;
}

// Phase 1: readFile → Blob URL is a temporary approach for a small dev folder.
// Not suitable for large libraries — a streaming approach (asset:// or a local
// HTTP server) is the right long-term path.
function getMimeType(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'mp3':  return 'audio/mpeg';
    case 'flac': return 'audio/flac';
    case 'wav':  return 'audio/wav';
    case 'ogg':  return 'audio/ogg';
    case 'm4a':  return 'audio/mp4';
    default:     return 'audio/mpeg';
  }
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

  // Single persistent Audio element for local file playback.
  // Created once here; never re-created. loadAndPlayLocal only sets .src.
  const localAudioRef = useRef<HTMLAudioElement>(new Audio());
  const localBlobUrlRef = useRef<string | null>(null);

  // Sync refs every render (before effects run)
  queueRef.current = queue;
  currentIndexRef.current = currentIndex;
  repeatRef.current = repeat;

  const currentTrack = queue[currentIndex] ?? null;

  // ---------------------------------------------------------------------------
  // Polling — TIDAL only; local position is tracked via timeupdate events
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
  // Shared: advance to the next track respecting repeat mode
  // Called by both the TIDAL 'ended' event and the local audio 'ended' event.
  // ---------------------------------------------------------------------------
  const advanceQueue = useCallback(() => {
    stopPolling();
    setIsPlaying(false);

    const idx = currentIndexRef.current;
    const q   = queueRef.current;
    const rep = repeatRef.current;

    if (rep === 'one') {
      const track = q[idx];
      if (track) loadAndPlay(track, 'queue');
      return;
    }

    const isLast = idx >= q.length - 1;
    if (rep === 'off' && isLast) return;

    const nextIdx = rep === 'all' && isLast ? 0 : idx + 1;
    setCurrentIndex(nextIdx);
    const next = q[nextIdx];
    if (next) loadAndPlay(next, 'queue');
  }, [stopPolling]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---------------------------------------------------------------------------
  // stopCurrentPlayback — always call before loading a new track so neither
  // backend keeps playing in the background.
  // ---------------------------------------------------------------------------
  function stopCurrentPlayback() {
    localAudioRef.current.pause();
    try { Player.pause(); } catch { /* nothing loaded yet */ }
  }

  // ---------------------------------------------------------------------------
  // Local file playback — load bytes, create Blob URL, set src, call play.
  // Listeners live in the useEffect below; this function only sets the source.
  // ---------------------------------------------------------------------------
  async function loadAndPlayLocal(track: Track) {
    const bytes    = await readFile(track.localPath!);
    const mimeType = getMimeType(track.localPath!);
    const blob     = new Blob([bytes], { type: mimeType });

    if (localBlobUrlRef.current) {
      URL.revokeObjectURL(localBlobUrlRef.current);
    }
    const url = URL.createObjectURL(blob);
    localBlobUrlRef.current = url;

    localAudioRef.current.src = url;
    localAudioRef.current.play().catch(console.error);
  }

  // ---------------------------------------------------------------------------
  // Unified load-and-play dispatcher — branches on track.source.
  // 'search' / 'SEARCH' and 'queue' / 'QUEUE' are the two sourceId/sourceType
  // pairs that already exist in this codebase; no new values introduced.
  // ---------------------------------------------------------------------------
  function loadAndPlay(track: Track, context: 'search' | 'queue') {
    if (track.source === 'local') {
      loadAndPlayLocal(track).catch(console.error);
    } else {
      Player.load({
        productType: 'track',
        productId:   track.id,
        sourceId:    context,
        sourceType:  context === 'search' ? 'SEARCH' : 'QUEUE',
      })
        .then(() => Player.play())
        .catch(console.error);
    }
  }

  // ---------------------------------------------------------------------------
  // TIDAL SDK event listeners — attached once, cleaned up on unmount
  // ---------------------------------------------------------------------------
  useEffect(() => {
    function onStateChange(e: Event) {
      const { state } = (e as CustomEvent<{ state: string }>).detail;
      if (state === 'PLAYING') {
        setIsPlaying(true);
        startPolling();
      } else {
        setIsPlaying(false);
        stopPolling();
      }
    }

    function onEnded() {
      advanceQueue();
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
  }, [startPolling, stopPolling, advanceQueue]);

  // ---------------------------------------------------------------------------
  // Local audio event listeners — attached once to the persistent Audio element
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const audio = localAudioRef.current;

    function onLoadedMetadata() {
      // Update the track in our internal queue so PlayerBar shows real duration.
      setQueue((q) =>
        q.map((t) =>
          t.source === 'local' && t.localPath === audio.src.replace(/^blob:.*/, '')
            ? t
            : t,
        ),
      );
      // We need the current track's id to update duration; read from ref.
      const idx   = currentIndexRef.current;
      const track = queueRef.current[idx];
      if (track?.source === 'local') {
        setQueue((q) =>
          q.map((t) => (t.id === track.id ? { ...t, duration: audio.duration } : t)),
        );
      }
    }

    function onTimeUpdate()  { setPosition(audio.currentTime); }
    function onPlay()        { setIsPlaying(true); }
    function onPause()       { setIsPlaying(false); }
    function onEnded()       { advanceQueue(); }
    function onError()       { setIsPlaying(false); console.error('[LOCAL] audio error'); }

    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('timeupdate',     onTimeUpdate);
    audio.addEventListener('play',           onPlay);
    audio.addEventListener('pause',          onPause);
    audio.addEventListener('ended',          onEnded);
    audio.addEventListener('error',          onError);

    return () => {
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('timeupdate',     onTimeUpdate);
      audio.removeEventListener('play',           onPlay);
      audio.removeEventListener('pause',          onPause);
      audio.removeEventListener('ended',          onEnded);
      audio.removeEventListener('error',          onError);
      audio.pause();
      if (localBlobUrlRef.current) {
        URL.revokeObjectURL(localBlobUrlRef.current);
      }
    };
  }, [advanceQueue]);

  // ---------------------------------------------------------------------------
  // Public actions
  // ---------------------------------------------------------------------------
  function play(track: Track, incomingQueue: Track[]) {
    const idx = incomingQueue.findIndex(t => t.id === track.id);
    const newQueue = idx !== -1 ? incomingQueue : [track];
    const newIdx   = idx !== -1 ? idx : 0;
    setQueue(newQueue);
    setCurrentIndex(newIdx);
    setPosition(0);

    stopCurrentPlayback();
    loadAndPlay(track, 'search');
  }

  function togglePlayPause() {
    if (currentIndex === -1) return;
    if (currentTrack?.source === 'local') {
      if (isPlaying) localAudioRef.current.pause();
      else localAudioRef.current.play().catch(console.error);
    } else {
      if (isPlaying) Player.pause();
      else Player.play().catch(console.error);
    }
  }

  function toggleShuffle() {
    setShuffle(prev => !prev);
  }

  function cycleRepeat() {
    setRepeat(prev => {
      if (prev === 'off') return 'all';
      if (prev === 'all') return 'one';
      return 'off';
    });
  }

  function seek(seconds: number) {
    const clamped = Math.max(0, Math.min(seconds, currentTrack?.duration ?? 0));
    setPosition(clamped);
    if (currentTrack?.source === 'local') {
      localAudioRef.current.currentTime = clamped;
    } else {
      Player.seek(clamped)?.catch(console.error);
    }
  }

  function playPrevious() {
    if (currentIndex <= 0) return;
    const newIdx = currentIndex - 1;
    const track  = queue[newIdx];
    if (!track) return;
    setCurrentIndex(newIdx);
    setPosition(0);
    stopCurrentPlayback();
    loadAndPlay(track, 'queue');
  }

  function playNext() {
    if (currentIndex === -1 || currentIndex >= queue.length - 1) return;
    const newIdx = currentIndex + 1;
    const track  = queue[newIdx];
    if (!track) return;
    setCurrentIndex(newIdx);
    setPosition(0);
    stopCurrentPlayback();
    loadAndPlay(track, 'queue');
  }

  function injectAfterCurrent(track: Track) {
    setQueue(prev => {
      const idx = currentIndexRef.current;
      return [...prev.slice(0, idx + 1), track, ...prev.slice(idx + 1)];
    });
  }

  function replaceUpcoming(tracks: Track[]) {
    setQueue(prev => {
      const idx = currentIndexRef.current;
      return [...prev.slice(0, idx + 1), ...tracks];
    });
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
    injectAfterCurrent,
    replaceUpcoming,
  };
}
