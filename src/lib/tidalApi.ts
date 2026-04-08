import { Track } from '../types';
import { mockTracks } from './mockData';

// ---------------------------------------------------------------------------
// Config — only client ID is exposed to the browser; secret stays server-side
// ---------------------------------------------------------------------------
const CLIENT_ID = import.meta.env.VITE_TIDAL_CLIENT_ID as string | undefined;
const BASE_URL = 'https://openapi.tidal.com/v2';
const DEFAULT_COUNTRY = 'US';

// ---------------------------------------------------------------------------
// Token store — populated by auth feature (Milestone 2, PKCE flow)
// ---------------------------------------------------------------------------
let _accessToken: string | null = null;

export function setAccessToken(token: string): void {
  _accessToken = token;
}

export function clearAccessToken(): void {
  _accessToken = null;
}

export function hasAccessToken(): boolean {
  return _accessToken !== null;
}

// ---------------------------------------------------------------------------
// TIDAL JSON:API response shapes (v2 OpenAPI)
// ---------------------------------------------------------------------------
interface TidalArtistRef {
  id: string;
  name: string;
}

interface TidalAlbumRef {
  id: string;
  title: string;
}

interface TidalImageLink {
  href: string;
  meta: { width: number; height: number };
}

interface TidalTrackAttributes {
  title: string;
  duration: number; // seconds (float)
  artists: TidalArtistRef[];
  album: TidalAlbumRef;
  imageLinks?: TidalImageLink[];
}

interface TidalTrackResource {
  type: 'tracks';
  id: string;
  attributes: TidalTrackAttributes;
}

interface TidalSearchResponse {
  included?: Array<TidalTrackResource | { type: string }>;
}

// ---------------------------------------------------------------------------
// Mapper
// ---------------------------------------------------------------------------
function mapTrack(resource: TidalTrackResource): Track {
  const { attributes: a } = resource;
  const primaryArtist = a.artists?.[0];

  // Pick the smallest image that is still at least 160 px wide for covers
  const cover = a.imageLinks
    ?.filter((l) => l.meta.width >= 160)
    .sort((a, b) => a.meta.width - b.meta.width)[0]?.href;

  return {
    id: resource.id,
    title: a.title,
    artist: {
      id: primaryArtist?.id ?? 'unknown',
      name: primaryArtist?.name ?? 'Unknown Artist',
    },
    album: a.album?.title ?? '',
    duration: Math.round(a.duration),
    coverUrl: cover,
  };
}

// ---------------------------------------------------------------------------
// Mock fallback (used when no access token is available)
// ---------------------------------------------------------------------------
function searchMock(query: string): Track[] {
  const q = query.trim().toLowerCase();
  return mockTracks.filter(
    (t) =>
      t.title.toLowerCase().includes(q) ||
      t.artist.name.toLowerCase().includes(q) ||
      t.album.toLowerCase().includes(q),
  );
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------
export type SearchSource = 'api' | 'mock';

export interface SearchResult {
  tracks: Track[];
  source: SearchSource;
}

export async function searchTracks(
  query: string,
  countryCode = DEFAULT_COUNTRY,
): Promise<SearchResult> {
  const q = query.trim();
  if (!q) return { tracks: [], source: 'mock' };

  // No token or no client ID → fall back to mock immediately
  if (!_accessToken || !CLIENT_ID) {
    return { tracks: searchMock(q), source: 'mock' };
  }

  const url = new URL(
    `${BASE_URL}/searchresults/${encodeURIComponent(q)}/relationships/tracks`,
  );
  url.searchParams.set('countryCode', countryCode);
  url.searchParams.set('include', 'tracks');
  url.searchParams.set('limit', '20');

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${_accessToken}`,
      'X-Tidal-Token': CLIENT_ID,
    },
  });

  if (!response.ok) {
    throw new Error(`TIDAL API responded with ${response.status}`);
  }

  const data: TidalSearchResponse = await response.json();

  const tracks = (data.included ?? [])
    .filter((r): r is TidalTrackResource => r.type === 'tracks')
    .map(mapTrack);

  return { tracks, source: 'api' };
}
