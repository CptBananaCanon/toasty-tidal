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
