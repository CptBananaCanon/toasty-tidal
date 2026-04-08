import { useState, useEffect } from 'react';
import { searchTracks, SearchSource } from '../../lib/tidalApi';
import { Track } from '../../types';

const DEBOUNCE_MS = 300;

export interface SearchState {
  query: string;
  results: Track[];
  isLoading: boolean;
  error: string | null;
  source: SearchSource | null;
  setQuery: (q: string) => void;
}

/**
 * @param isAuthenticated - when this flips (sign-in / sign-out), the current
 *   query is automatically re-run so results upgrade from mock → real API
 *   (or back) without the user having to retype anything.
 */
export function useSearch(isAuthenticated: boolean): SearchState {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [results, setResults] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<SearchSource | null>(null);

  // Debounce raw input
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query]);

  // Fetch when debounced query or auth state changes
  useEffect(() => {
    const q = debouncedQuery.trim();

    if (!q) {
      setResults([]);
      setError(null);
      setSource(null);
      return;
    }

    let cancelled = false;

    setIsLoading(true);
    setError(null);

    searchTracks(q)
      .then((result) => {
        if (cancelled) return;
        setResults(result.tracks);
        setSource(result.source);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : 'Search failed.';
        setError(message);
        setResults([]);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedQuery, isAuthenticated]); // re-run when auth changes

  return { query, results, isLoading, error, source, setQuery };
}
