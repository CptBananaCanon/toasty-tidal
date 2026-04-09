import { Header } from '../components/Header';
import { SearchInput } from '../features/search/SearchInput';
import { SearchResults } from '../features/search/SearchResults';
import { PlayerBar } from '../features/player/PlayerBar';
import { useSearch } from '../features/search/useSearch';
import { usePlayer } from '../features/player/usePlayer';
import { useAuth } from '../features/auth/useAuth';
import { Track } from '../types';
import './App.css';

export function App() {
  const auth = useAuth();
  const { query, results, isLoading, error, source, setQuery } = useSearch(auth.isAuthenticated);
  const { currentTrack, isPlaying, play, togglePlayPause, playPrevious, playNext } =
    usePlayer();

  function handleSelect(track: Track) {
    play(track, results);
  }

  return (
    <div className="app">
      <Header auth={auth} />
      <main className="main-content">
        <SearchInput value={query} onChange={setQuery} />
        <SearchResults
          query={query}
          results={results}
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
        onPlayPause={togglePlayPause}
        onPrevious={playPrevious}
        onNext={playNext}
      />
    </div>
  );
}
