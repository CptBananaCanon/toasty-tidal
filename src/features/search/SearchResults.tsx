import { useState } from 'react';
import { Track, SearchResultItem } from '../../types';
import { SearchSource } from '../../lib/tidalApi';
import { Button } from '../../components/ui/button';
import { cn } from '../../lib/utils';
import { ResultItem } from './ResultItem';

type SearchFilter = 'all' | 'tracks' | 'albums' | 'playlists';

const FILTER_LABELS: Record<SearchFilter, string> = {
  all:       'All',
  tracks:    'Tracks',
  albums:    'Albums',
  playlists: 'Playlists',
};

interface Props {
  query: string;
  items: SearchResultItem[];
  isLoading: boolean;
  error: string | null;
  source: SearchSource | null;
  selectedId: string | null;
  onSelect: (track: Track) => void;
}

export function SearchResults({
  query,
  items,
  isLoading,
  error,
  source,
  selectedId,
  onSelect,
}: Props) {
  const [filter, setFilter] = useState<SearchFilter>('all');

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

  if (items.length === 0) {
    return (
      <p className="search-status search-status--empty">
        No results for &ldquo;{query}&rdquo;
      </p>
    );
  }

  const filteredItems: SearchResultItem[] = filter === 'all'
    ? items
    : items.filter((i) => {
        if (filter === 'tracks')    return i.kind === 'track';
        if (filter === 'albums')    return i.kind === 'album';
        return i.kind === 'playlist';
      });

  return (
    <div>
      {source === 'mock' && (
        <p className="search-status search-status--mock">
          Showing mock results — sign in to search TIDAL
        </p>
      )}

      {/* Filter buttons */}
      <div className="flex gap-2 mb-3">
        {(Object.keys(FILTER_LABELS) as SearchFilter[]).map((f) => (
          <Button
            key={f}
            variant="ghost"
            size="sm"
            style={{ paddingLeft: '16px', paddingRight: '16px' }}
            className={cn(filter === f && 'bg-zinc-800 text-zinc-100')}
            onClick={() => setFilter(f)}
          >
            {FILTER_LABELS[f]}
          </Button>
        ))}
      </div>

      {filteredItems.length === 0 ? (
        <p className="search-status search-status--empty">
          No {FILTER_LABELS[filter].toLowerCase()} found for &ldquo;{query}&rdquo;
        </p>
      ) : (
        <ul className="search-results">
          {filteredItems.map((item) => (
            <ResultItem
              key={`${item.kind}:${item.data.id}`}
              item={item}
              isSelected={item.kind === 'track' && item.data.id === selectedId}
              onSelect={onSelect}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
