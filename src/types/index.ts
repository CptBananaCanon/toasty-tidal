export interface Artist {
  id: string;
  name: string;
}

export interface Track {
  id: string;
  title: string;
  artist: Artist;
  album: string;
  duration: number; // seconds
  coverUrl?: string;
}

export interface Album {
  id: string;
  title: string;
  artist: Artist;
  numberOfTracks: number;
  releaseDate?: string;
  coverUrl?: string;
}

export interface Playlist {
  id: string;
  title: string;
  numberOfTracks: number;
  description?: string;
  coverUrl?: string;
}

export type SearchResultItem =
  | { kind: 'track';    data: Track }
  | { kind: 'album';    data: Album }
  | { kind: 'playlist'; data: Playlist };
