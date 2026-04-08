import { Track } from '../types';
import { mockTracks } from './mockData';

// ---------------------------------------------------------------------------
// Config — only client ID is exposed to the browser; secret stays server-side
// ---------------------------------------------------------------------------
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
// TIDAL JSON:API response shapes
// ---------------------------------------------------------------------------

// Resource linkage used in relationship.data (single or array)
interface ResourceRef {
  type: string;
  id: string;
}

interface TidalRelationship {
  data?: ResourceRef | ResourceRef[];
  links?: { self: string };
}

// Track
interface TidalTrackAttributes {
  title: string;
  duration: number | string; // v2 returns ISO 8601 e.g. "PT3M50S"
}

interface TidalTrackResource {
  type: 'tracks';
  id: string;
  attributes: TidalTrackAttributes;
  relationships?: {
    artists?: TidalRelationship;
    albums?: TidalRelationship;
  };
}

// Artist (sideloaded via include=artists)
interface TidalArtistAttributes {
  name: string;
  imageLink?: Array<{ url: string; width: number; height: number }>;
}

interface TidalArtistResource {
  type: 'artists';
  id: string;
  attributes: TidalArtistAttributes;
}

// Album (sideloaded via include=tracks.albums)
interface TidalAlbumAttributes {
  title: string;
  imageCover?: Array<{ url: string; width: number; height: number }>;
}

interface TidalAlbumResource {
  type: 'albums';
  id: string;
  attributes: TidalAlbumAttributes;
  // tracks.albums.artists populates this when the nested include is used
  relationships?: {
    artists?: TidalRelationship;
  };
}

type TidalResource =
  | TidalTrackResource
  | TidalArtistResource
  | TidalAlbumResource
  | { type: string; id: string };

interface TidalSearchResponse {
  included?: TidalResource[];
}

// ---------------------------------------------------------------------------
// Duration parser
// Handles both a plain number (seconds) and ISO 8601 strings like
// "PT3M50S" or "P0Y0M0DT0H3M50.5S" that TIDAL v2 actually returns.
// ---------------------------------------------------------------------------
function parseDuration(raw: number | string): number {
  if (typeof raw === 'number') return Math.round(raw);
  const match = raw.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:([\d.]+)S)?/);
  if (!match) return 0;
  const h = parseInt(match[1] ?? '0', 10);
  const m = parseInt(match[2] ?? '0', 10);
  const s = parseFloat(match[3] ?? '0');
  return Math.round(h * 3600 + m * 60 + s);
}

// ---------------------------------------------------------------------------
// Relationship resolution helpers
// ---------------------------------------------------------------------------

// Build a map of "type:id" → resource from the included array
function buildIncludedMap(included: TidalResource[]): Map<string, TidalResource> {
  const map = new Map<string, TidalResource>();
  for (const r of included) {
    if ('id' in r) map.set(`${r.type}:${r.id}`, r);
  }
  return map;
}

// Return the first ID from a relationship's data field (single or array)
function firstRelId(rel: TidalRelationship | undefined): string | undefined {
  if (!rel?.data) return undefined;
  return Array.isArray(rel.data) ? rel.data[0]?.id : rel.data.id;
}

// ---------------------------------------------------------------------------
// Mapper
// ---------------------------------------------------------------------------
function mapTrack(
  resource: TidalTrackResource,
  includedMap: Map<string, TidalResource>,
): Track {
  const { attributes: a, relationships: r } = resource;

  // Resolve album first — needed for both cover art and album-artist fallback
  const albumId = firstRelId(r?.albums);
  const albumResource =
    albumId ? (includedMap.get(`albums:${albumId}`) as TidalAlbumResource | undefined)
            : undefined;

  // ── Artist resolution (two paths) ───────────────────────────────────────
  // Path 1: track.relationships.artists.data → included artist (requires
  //   tracks.artists in the include param to populate .data on the track)
  const trackArtistId = firstRelId(r?.artists);
  const trackArtistResource = trackArtistId
    ? (includedMap.get(`artists:${trackArtistId}`) as TidalArtistResource | undefined)
    : undefined;

  // Path 2: album.relationships.artists.data → included artist (fallback;
  //   requires tracks.albums.artists in the include param)
  const albumArtistId = firstRelId(albumResource?.relationships?.artists);
  const albumArtistResource = albumArtistId
    ? (includedMap.get(`artists:${albumArtistId}`) as TidalArtistResource | undefined)
    : undefined;

  const artistResource = trackArtistResource ?? albumArtistResource;
  const resolvedArtistId = trackArtistId ?? albumArtistId;

  const cover = albumResource?.attributes?.imageCover
    ?.filter((l) => l.width >= 160)
    .sort((a, b) => a.width - b.width)[0]?.url;

  return {
    id: resource.id,
    title: a.title,
    artist: {
      id: resolvedArtistId ?? 'unknown',
      name: artistResource?.attributes?.name ?? 'Unknown Artist',
    },
    album: albumResource?.attributes?.title ?? '',
    duration: parseDuration(a.duration),
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

  // No token → fall back to mock immediately
  if (!_accessToken) {
    return { tracks: searchMock(q), source: 'mock' };
  }

  const url = new URL(`${BASE_URL}/searchResults/${encodeURIComponent(q)}`);
  url.searchParams.set('countryCode', countryCode);
  // Nested JSON:API include paths so TIDAL populates .data on each relationship
  // and sideloads the referenced resources into the top-level included array:
  //   tracks           — track resources for this search
  //   tracks.artists   — artist resources linked from each track
  //   tracks.albums    — album resources linked from each track
  //   tracks.albums.artists — artist resources linked from each track's album
  //                           (fallback if track-level artist linkage is absent)
  url.searchParams.set('include', 'tracks,tracks.artists,tracks.albums,tracks.albums.artists');
  url.searchParams.set('limit', '20');

  console.log('[SEARCH] request URL:', url.toString());

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${_accessToken}`,
      Accept: 'application/vnd.api+json',
    },
  });

  console.log('[SEARCH] response status:', response.status);

  if (!response.ok) {
    const body = await response.text().catch(() => '<unreadable>');
    console.error('[SEARCH] error body:', body);
    throw new Error(`TIDAL API responded with ${response.status}: ${body}`);
  }

  const data: TidalSearchResponse = await response.json();
  const included = data.included ?? [];

  // ── Debug: count resources by type ──────────────────────────────────────
  const typeCounts: Record<string, number> = {};
  for (const r of included) typeCounts[r.type] = (typeCounts[r.type] ?? 0) + 1;
  console.log('[SEARCH] included types:', typeCounts);

  // Is any artist resource present at all?
  const firstArtist = included.find((r) => r.type === 'artists') as TidalArtistResource | undefined;
  console.log('[SEARCH] any artists in included:', !!firstArtist);
  if (firstArtist) {
    console.log('[SEARCH] first artist resource:', JSON.stringify(firstArtist, null, 2));
  }

  // First track's relationships (compact — shows whether .data is populated)
  const firstTrack = included.find((r) => r.type === 'tracks') as TidalTrackResource | undefined;
  if (firstTrack) {
    console.log('[SEARCH] first track.relationships:', JSON.stringify(firstTrack.relationships));
  }

  // First album's relationships (compact — shows whether album→artist .data is populated)
  const firstAlbum = included.find((r) => r.type === 'albums') as
    | (TidalAlbumResource & { relationships?: unknown })
    | undefined;
  if (firstAlbum) {
    console.log('[SEARCH] first album.relationships:', JSON.stringify(firstAlbum.relationships));
  }
  // ── End debug ────────────────────────────────────────────────────────────

  const includedMap = buildIncludedMap(included);

  const tracks = included
    .filter((r): r is TidalTrackResource => r.type === 'tracks')
    .map((track) => mapTrack(track, includedMap));

  if (tracks.length > 0) {
    console.log('[SEARCH] first track artist resolved:', tracks[0].artist.name);
  }
  console.log('[SEARCH] mapped tracks:', tracks.length);

  return { tracks, source: 'api' };
}
