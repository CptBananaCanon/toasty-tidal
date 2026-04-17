import { Track, Album, Playlist, SearchResultItem } from '../../types';

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function formatCount(n: number): string {
  return n === 1 ? '1 track' : `${n} tracks`;
}

function ArtThumbnail({ url, alt }: { url?: string; alt: string }) {
  return url
    ? <img className="result-item__art-img" src={url} alt={alt} />
    : <div className="result-item__art-placeholder" />;
}

interface Props {
  item: SearchResultItem;
  isSelected: boolean;
  onSelect: (track: Track) => void;
}

function TrackRow({ track, isSelected, onSelect }: {
  track: Track;
  isSelected: boolean;
  onSelect: (track: Track) => void;
}) {
  return (
    <li
      className={`result-item${isSelected ? ' result-item--selected' : ''}`}
      onClick={() => onSelect(track)}
    >
      <ArtThumbnail url={track.coverUrl} alt={track.album} />
      <div className="result-item__title">{track.title}</div>
      <div className="result-item__artist">{track.artist.name}</div>
      <div className="result-item__album">{track.album}</div>
      <div className="result-item__duration">{formatDuration(track.duration)}</div>
    </li>
  );
}

function AlbumRow({ album }: { album: Album }) {
  return (
    <li className="result-item result-item--display-only">
      <ArtThumbnail url={album.coverUrl} alt={album.title} />
      <div className="result-item__title">{album.title}</div>
      <div className="result-item__artist">{album.artist.name}</div>
      <div className="result-item__album">{album.releaseDate?.slice(0, 4) ?? ''}</div>
      <div className="result-item__duration">{formatCount(album.numberOfTracks)}</div>
    </li>
  );
}

function PlaylistRow({ playlist }: { playlist: Playlist }) {
  return (
    <li className="result-item result-item--display-only">
      <ArtThumbnail url={playlist.coverUrl} alt={playlist.title} />
      <div className="result-item__title">{playlist.title}</div>
      <div className="result-item__artist"></div>
      <div className="result-item__album"></div>
      <div className="result-item__duration">{formatCount(playlist.numberOfTracks)}</div>
    </li>
  );
}

export function ResultItem({ item, isSelected, onSelect }: Props) {
  if (item.kind === 'track')    return <TrackRow track={item.data} isSelected={isSelected} onSelect={onSelect} />;
  if (item.kind === 'album')    return <AlbumRow album={item.data} />;
  return <PlaylistRow playlist={item.data} />;
}
