import { useEffect } from 'react';
import { Header } from '../components/Header';
import { SearchResults } from '../features/search/SearchResults';
import { PlayerBar } from '../features/player/PlayerBar';
import { useSearch } from '../features/search/useSearch';
import { usePlayer } from '../features/player/usePlayer';
import { useAuth } from '../features/auth/useAuth';
import { initTidalPlayer } from '../lib/tidalPlayer';
import { Track } from '../types';
import './App.css';

export function App() {
  const auth = useAuth();

  // Seed the SDK init promise as early as possible so it is ready
  // by the time the first auth token is available.
  useEffect(() => {
    initTidalPlayer().catch(console.error);
  }, []);

  const { query, items, tracks, isLoading, error, source, setQuery } = useSearch(auth.isAuthenticated);
  const {
    currentTrack, isPlaying, shuffle, repeat, position,
    play, togglePlayPause, toggleShuffle, cycleRepeat, seek, playPrevious, playNext,
  } = usePlayer();

  function handleSelect(track: Track) {
    play(track, tracks);
  }

  return (
    <div className="app">
      <Header
        auth={auth}
        query={query}
        onQueryChange={setQuery}
      />
      <main className="main-content">
        <SearchResults
          query={query}
          items={items}
          isLoading={isLoading}
          error={error}
          source={source}
          selectedId={currentTrack?.id ?? null}
          onSelect={handleSelect}
        />
      </main>
      <PlayerBar
        track={currentTrack}
        isPlaying={isPlaying}
        shuffle={shuffle}
        repeat={repeat}
        position={position}
        onPlayPause={togglePlayPause}
        onPrevious={playPrevious}
        onNext={playNext}
        onSeek={seek}
        onShuffle={toggleShuffle}
        onRepeat={cycleRepeat}
      />
    </div>
  );
}
