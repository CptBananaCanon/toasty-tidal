import { Header } from '../components/Header';
import { SearchInput } from '../features/search/SearchInput';
import { SearchResults } from '../features/search/SearchResults';
import { PlayerBar } from '../features/player/PlayerBar';
import { useSearch } from '../features/search/useSearch';
import { usePlayer } from '../features/player/usePlayer';
import { Track } from '../types';
import './App.css';

export function App() {
  const { query, results, setQuery } = useSearch();
  const { currentTrack, isPlaying, play, togglePlayPause, playPrevious, playNext } =
    usePlayer(results);

  function handleSelect(track: Track) {
    play(track);
  }

  return (
    <div className="app">
      <Header />
      <main className="main-content">
        <SearchInput value={query} onChange={setQuery} />
        <SearchResults
          results={results}
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
