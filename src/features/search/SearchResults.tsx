import { Track } from '../../types';
import { ResultItem } from './ResultItem';

interface Props {
  results: Track[];
  selectedId: string | null;
  onSelect: (track: Track) => void;
}

export function SearchResults({ results, selectedId, onSelect }: Props) {
  if (results.length === 0) return null;

  return (
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
  );
}
