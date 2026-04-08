import { useState, useMemo } from 'react';
import { mockTracks } from '../../lib/mockData';
import { Track } from '../../types';

export interface SearchState {
  query: string;
  results: Track[];
  setQuery: (q: string) => void;
}

export function useSearch(): SearchState {
  const [query, setQuery] = useState('');

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return mockTracks.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.artist.name.toLowerCase().includes(q) ||
        t.album.toLowerCase().includes(q),
    );
  }, [query]);

  return { query, results, setQuery };
}
