import { Track } from '../../types';
import { SearchSource } from '../../lib/tidalApi';
import { ResultItem } from './ResultItem';

interface Props {
  query: string;
  results: Track[];
  isLoading: boolean;
  error: string | null;
  source: SearchSource | null;
  selectedId: string | null;
  onSelect: (track: Track) => void;
}

export function SearchResults({
  query,
  results,
  isLoading,
  error,
  source,
  selectedId,
  onSelect,
}: Props) {
  if (!query.trim()) return null;

  if (isLoading) {
    return <p className="search-status search-status--loading">Searching…</p>;
  }

  if (error) {
    return (
      <p className="search-status search-status--error">
        Search failed: {error}
      </p>
    );
  }

  if (results.length === 0) {
    return (
      <p className="search-status search-status--empty">
        No results for &ldquo;{query}&rdquo;
      </p>
    );
  }

  return (
    <div>
      {source === 'mock' && (
        <p className="search-status search-status--mock">
          Showing mock results — sign in to search TIDAL
        </p>
      )}
      <ul className="search-results">
        {results.map((track) => (
          <ResultItem
            key={track.id}
            track={track}
            isSelected={track.id === selectedId}
            onSelect={onSelect}
          />
        ))}
      </ul>
    </div>
  );
}
