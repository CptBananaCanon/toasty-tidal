import { useState, useEffect, useRef } from 'react';
import { Header } from '../components/Header';
import { SearchResults } from '../features/search/SearchResults';
import { PlayerBar } from '../features/player/PlayerBar';
import { QueuePanel } from '../features/queue/QueuePanel';
import { SettingsPage } from '../features/settings/SettingsPage';
import { HomeView } from '../features/home/HomeView';
import { useSearch } from '../features/search/useSearch';
import { usePlayer } from '../features/player/usePlayer';
import { useQueue } from '../features/queue/useQueue';
import { useAuth } from '../features/auth/useAuth';
import { useLocalFiles } from '../features/localFiles/useLocalFiles';
import { Track } from '../types';
import './App.css';

// 'home' is the default. Search is not a view — it's driven by query content.
type View = 'home' | 'settings';

export function App() {
  const auth = useAuth();
  const [history, setHistory] = useState<View[]>(['home']);

  const view = history[history.length - 1];

  function navigate(next: View) {
    setHistory((h) => [...h, next]);
  }

  function goBack() {
    setHistory((h) => (h.length > 1 ? h.slice(0, -1) : h));
  }

  const { query, items, tracks, isLoading, error, source, setQuery } = useSearch(auth.isAuthenticated);
  const { localTracks } = useLocalFiles();

  function handleQueryChange(value: string) {
    // Close settings when the user starts typing so they see results immediately.
    if (view === 'settings') goBack();
    setQuery(value);
  }

  const player = usePlayer();
  const queue = useQueue();

  const prevTrackIdRef = useRef<string | null>(null);
  useEffect(() => {
    const id = player.currentTrack?.id ?? null;
    if (id && id !== prevTrackIdRef.current) {
      queue.shiftManualIfCurrent(id);
    }
    prevTrackIdRef.current = id;
  }, [player.currentTrack?.id]);

  // ── Handlers ───────────────────────────────────────────────────────────────

  function handleSelect(track: Track) {
    const label = `Search: "${query}"`;
    queue.startContext(track, tracks, label);
    player.play(track, tracks);
  }

  function handleLocalSelect(track: Track) {
    player.play(track, localTracks);
  }

  function handleAddToQueue(track: Track) {
    queue.addToQueue(track);
    player.injectAfterCurrent(track);
  }

  function handleRemoveFromContext(entryId: string) {
    const newContextEntries = (queue.contextSnapshot?.entries ?? []).filter(e => e.id !== entryId);
    const upcoming = [
      ...queue.manualHead.map(e => e.track),
      ...newContextEntries.map(e => e.track),
    ];
    queue.removeFromContext(entryId);
    player.replaceUpcoming(upcoming);
  }

  function handleClearContext() {
    queue.clearContext();
    player.replaceUpcoming(queue.manualHead.map(e => e.track));
  }

  // ── View resolution (priority: settings > search > home) ──────────────────
  const showSettings = view === 'settings';
  const showSearch   = !showSettings && query.trim() !== '';
  const showHome     = !showSettings && !showSearch;

  return (
    <div className="app">
      <Header
        auth={auth}
        query={query}
        onQueryChange={handleQueryChange}
        onOpenSettings={() => navigate('settings')}
      />
      <main className={`main-content${queue.queueOpen ? ' main-content--queue-open' : ''}`}>
        <div className="main-content__search-area">
          {showSettings && (
            <SettingsPage auth={auth} onBack={goBack} />
          )}
          {showSearch && (
            <SearchResults
              query={query}
              items={items}
              isLoading={isLoading}
              error={error}
              source={source}
              selectedId={player.currentTrack?.id ?? null}
              playingId={player.isPlaying ? (player.currentTrack?.id ?? null) : null}
              onSelect={handleSelect}
              onAddToQueue={auth.isAuthenticated ? handleAddToQueue : undefined}
            />
          )}
          {showHome && (
            <HomeView
              localTracks={localTracks}
              currentTrack={player.currentTrack}
              isPlaying={player.isPlaying}
              onSelect={handleLocalSelect}
              onAddToQueue={handleAddToQueue}
            />
          )}
        </div>
        {queue.queueOpen && (
          <QueuePanel
            currentTrack={player.currentTrack}
            manualHead={queue.manualHead}
            contextSnapshot={queue.contextSnapshot}
            onClose={queue.toggleQueue}
            onRemoveFromContext={handleRemoveFromContext}
            onClearContext={handleClearContext}
          />
        )}
      </main>
      <PlayerBar
        track={player.currentTrack}
        isPlaying={player.isPlaying}
        shuffle={player.shuffle}
        repeat={player.repeat}
        position={player.position}
        queueOpen={queue.queueOpen}
        onPlayPause={player.togglePlayPause}
        onPrevious={player.playPrevious}
        onNext={player.playNext}
        onSeek={player.seek}
        onShuffle={player.toggleShuffle}
        onRepeat={player.cycleRepeat}
        onToggleQueue={queue.toggleQueue}
      />
    </div>
  );
}
