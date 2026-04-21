import { useState } from 'react';
import { Track, QueueEntry, ContextSnapshot } from '../../types';

export interface QueueState {
  manualHead: QueueEntry[];
  contextSnapshot: ContextSnapshot | null;
  queueOpen: boolean;
  toggleQueue(): void;
  startContext(track: Track, allTracks: Track[], label: string): void;
  addToQueue(track: Track): void;
  removeFromContext(entryId: string): void;
  clearContext(): void;
  shiftManualIfCurrent(trackId: string): void;
}

export function useQueue(): QueueState {
  const [manualHead, setManualHead] = useState<QueueEntry[]>([]);
  const [contextSnapshot, setContextSnapshot] = useState<ContextSnapshot | null>(null);
  const [queueOpen, setQueueOpen] = useState(false);

  function toggleQueue() {
    setQueueOpen(v => !v);
  }

  function startContext(track: Track, allTracks: Track[], label: string) {
    const entries: QueueEntry[] = allTracks
      .filter(t => t.id !== track.id)
      .map(t => ({ id: crypto.randomUUID(), track: t, origin: 'context' as const }));
    setContextSnapshot(entries.length > 0 ? { label, entries } : null);
    setManualHead([]);
  }

  function addToQueue(track: Track) {
    setManualHead(prev => [
      ...prev,
      { id: crypto.randomUUID(), track, origin: 'manual' },
    ]);
  }

  function removeFromContext(entryId: string) {
    setContextSnapshot(prev => {
      if (!prev) return null;
      const entries = prev.entries.filter(e => e.id !== entryId);
      return entries.length > 0 ? { ...prev, entries } : null;
    });
  }

  function clearContext() {
    setContextSnapshot(null);
  }

  // Called when a new track starts playing — removes it from the front of manualHead
  // if it was the next manual entry.
  function shiftManualIfCurrent(trackId: string) {
    setManualHead(prev =>
      prev[0]?.track.id === trackId ? prev.slice(1) : prev,
    );
  }

  return {
    manualHead,
    contextSnapshot,
    queueOpen,
    toggleQueue,
    startContext,
    addToQueue,
    removeFromContext,
    clearContext,
    shiftManualIfCurrent,
  };
}
