import { Track, Album, Playlist, SearchResultItem } from '../types';
import { mockTracks } from './mockData';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const BASE_URL = 'https://openapi.tidal.com/v2';
const DEFAULT_COUNTRY = 'US';

// ---------------------------------------------------------------------------
// Token store
// ---------------------------------------------------------------------------
let _accessToken: string | null = null;

export function setAccessToken(token: string): void  { _accessToken = token; }
export function clearAccessToken(): void             { _accessToken = null;  }
export function hasAccessToken(): boolean            { return _accessToken !== null; }

// ---------------------------------------------------------------------------
// TIDAL JSON:API response shapes
// ---------------------------------------------------------------------------

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
  duration: number | string;
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

// Artist
interface TidalArtistAttributes {
  name: string;
}

interface TidalArtistResource {
  type: 'artists';
  id: string;
  attributes: TidalArtistAttributes;
}

// Album
interface TidalAlbumAttributes {
  title: string;
  numberOfTracks?: number;
  releaseDate?: string;
}

interface TidalAlbumResource {
  type: 'albums';
  id: string;
  attributes: TidalAlbumAttributes;
  relationships?: {
    artists?: TidalRelationship;
    coverArt?: TidalRelationship;
  };
}

// Artwork — the actual image resource sideloaded via albums.coverArt
interface TidalArtworkFile {
  href: string;
  meta: { width: number; height: number };
}

interface TidalArtworkResource {
  type: 'artworks';
  id: string;
  attributes: {
    mediaType: string;
    files: TidalArtworkFile[];
  };
}

// Playlist
interface TidalPlaylistAttributes {
  title: string;
  numberOfTracks?: number;
  numberOfItems?: number;
  description?: string;
}

interface TidalPlaylistResource {
  type: 'playlists';
  id: string;
  attributes: TidalPlaylistAttributes;
}

type TidalResource =
  | TidalTrackResource
  | TidalArtistResource
  | TidalAlbumResource
  | TidalArtworkResource
  | TidalPlaylistResource
  | { type: string; id: string };

// Top-level search result resource — relationships identify actual result IDs
interface TidalSearchResultData {
  type: string;
  id: string;
  relationships?: {
    tracks?:    TidalRelationship;
    albums?:    TidalRelationship;
    playlists?: TidalRelationship;
  };
}

interface TidalSearchResponse {
  data?:     TidalSearchResultData;
  included?: TidalResource[];
}

// ---------------------------------------------------------------------------
// Duration parser — handles plain seconds or ISO 8601 "PT3M50S"
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
// Relationship helpers
// ---------------------------------------------------------------------------
function buildIncludedMap(included: TidalResource[]): Map<string, TidalResource> {
  const map = new Map<string, TidalResource>();
  for (const r of included) {
    if ('id' in r) map.set(`${r.type}:${r.id}`, r);
  }
  return map;
}

function firstRelId(rel: TidalRelationship | undefined): string | undefined {
  if (!rel?.data) return undefined;
  return Array.isArray(rel.data) ? rel.data[0]?.id : rel.data.id;
}

function allRelIds(rel: TidalRelationship | undefined): string[] {
  if (!rel?.data) return [];
  if (Array.isArray(rel.data)) return rel.data.map((r) => r.id);
  return [rel.data.id];
}

// Pick the smallest artwork file at or above targetWidth
function artworkUrl(
  artwork: TidalArtworkResource | undefined,
  targetWidth = 320,
): string | undefined {
  if (!artwork) return undefined;
  return artwork.attributes.files
    .filter((f) => f.meta.width >= targetWidth)
    .sort((a, b) => a.meta.width - b.meta.width)[0]?.href;
}

// ---------------------------------------------------------------------------
// Mappers
// ---------------------------------------------------------------------------
function mapTrack(
  resource: TidalTrackResource,
  includedMap: Map<string, TidalResource>,
): Track {
  const { attributes: a, relationships: r } = resource;

  // Resolve album
  const albumId = firstRelId(r?.albums);
  const albumResource = albumId
    ? (includedMap.get(`albums:${albumId}`) as TidalAlbumResource | undefined)
    : undefined;

  // Resolve artwork via album → coverArt relationship
  const artworkId = firstRelId(albumResource?.relationships?.coverArt);
  const artwork = artworkId
    ? (includedMap.get(`artworks:${artworkId}`) as TidalArtworkResource | undefined)
    : undefined;

  // Artist: prefer track-level, fall back to album-level
  const trackArtistId = firstRelId(r?.artists);
  const trackArtist = trackArtistId
    ? (includedMap.get(`artists:${trackArtistId}`) as TidalArtistResource | undefined)
    : undefined;

  const albumArtistId = firstRelId(albumResource?.relationships?.artists);
  const albumArtist = albumArtistId
    ? (includedMap.get(`artists:${albumArtistId}`) as TidalArtistResource | undefined)
    : undefined;

  const artistResource = trackArtist ?? albumArtist;
  const resolvedArtistId = trackArtistId ?? albumArtistId;

  return {
    id: resource.id,
    title: a.title,
    artist: {
      id: resolvedArtistId ?? 'unknown',
      name: artistResource?.attributes?.name ?? 'Unknown Artist',
    },
    album: albumResource?.attributes?.title ?? '',
    duration: parseDuration(a.duration),
    coverUrl: artworkUrl(artwork),
  };
}

function mapAlbum(
  resource: TidalAlbumResource,
  includedMap: Map<string, TidalResource>,
): Album {
  const { attributes: a, relationships: r } = resource;

  const artistId = firstRelId(r?.artists);
  const artistResource = artistId
    ? (includedMap.get(`artists:${artistId}`) as TidalArtistResource | undefined)
    : undefined;

  const artworkId = firstRelId(r?.coverArt);
  const artwork = artworkId
    ? (includedMap.get(`artworks:${artworkId}`) as TidalArtworkResource | undefined)
    : undefined;

  return {
    id: resource.id,
    title: a.title,
    artist: {
      id: artistId ?? 'unknown',
      name: artistResource?.attributes?.name ?? 'Unknown Artist',
    },
    numberOfTracks: a.numberOfTracks ?? 0,
    releaseDate: a.releaseDate,
    coverUrl: artworkUrl(artwork),
  };
}

function mapPlaylist(resource: TidalPlaylistResource): Playlist {
  return {
    id: resource.id,
    title: resource.attributes.title,
    numberOfTracks: resource.attributes.numberOfTracks ?? resource.attributes.numberOfItems ?? 0,
    description: resource.attributes.description,
  };
}

// ---------------------------------------------------------------------------
// Mock fallback
// ---------------------------------------------------------------------------
function searchMock(query: string): SearchResultItem[] {
  const q = query.trim().toLowerCase();
  return mockTracks
    .filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.artist.name.toLowerCase().includes(q) ||
        t.album.toLowerCase().includes(q),
    )
    .map((data) => ({ kind: 'track' as const, data }));
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------
export type SearchSource = 'api' | 'mock';

export interface SearchResult {
  items: SearchResultItem[];
  source: SearchSource;
}

export async function searchTracks(
  query: string,
  countryCode = DEFAULT_COUNTRY,
): Promise<SearchResult> {
  const q = query.trim();
  if (!q) return { items: [], source: 'mock' };

  if (!_accessToken) {
    return { items: searchMock(q), source: 'mock' };
  }

  const url = new URL(`${BASE_URL}/searchResults/${encodeURIComponent(q)}`);
  url.searchParams.set('countryCode', countryCode);
  url.searchParams.set(
    'include',
    [
      'tracks', 'tracks.artists', 'tracks.albums', 'tracks.albums.artists', 'tracks.albums.coverArt',
      'albums', 'albums.artists', 'albums.coverArt',
      'playlists',
    ].join(','),
  );
  url.searchParams.set('limit', '20');

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${_accessToken}`,
      Accept: 'application/vnd.api+json',
    },
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '<unreadable>');
    throw new Error(`TIDAL API responded with ${response.status}: ${body}`);
  }

  const data: TidalSearchResponse = await response.json();
  const included = data.included ?? [];
  const includedMap = buildIncludedMap(included);

  const primaryRels = data.data?.relationships;

  const trackResultIds = primaryRels?.tracks
    ? new Set(allRelIds(primaryRels.tracks))
    : null;

  const albumResultIds   = new Set(allRelIds(primaryRels?.albums));
  const playlistResultIds = new Set(allRelIds(primaryRels?.playlists));

  const tracks = included
    .filter((r): r is TidalTrackResource =>
      r.type === 'tracks' && (trackResultIds === null || trackResultIds.has(r.id)))
    .map((r) => mapTrack(r, includedMap));

  const albums = included
    .filter((r): r is TidalAlbumResource =>
      r.type === 'albums' && albumResultIds.has(r.id))
    .map((r) => mapAlbum(r, includedMap));

  const playlists = included
    .filter((r): r is TidalPlaylistResource =>
      r.type === 'playlists' && playlistResultIds.has(r.id))
    .map(mapPlaylist);

  const items: SearchResultItem[] = [
    ...tracks.map((data) => ({ kind: 'track' as const, data })),
    ...albums.map((data) => ({ kind: 'album' as const, data })),
    ...playlists.map((data) => ({ kind: 'playlist' as const, data })),
  ];

  return { items, source: 'api' };
}
