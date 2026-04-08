import { Track } from '../../types';

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

interface Props {
  track: Track;
  isSelected: boolean;
  onSelect: (track: Track) => void;
}

export function ResultItem({ track, isSelected, onSelect }: Props) {
  return (
    <li
      className={`result-item${isSelected ? ' result-item--selected' : ''}`}
      onClick={() => onSelect(track)}
    >
      <div className="result-item__title">{track.title}</div>
      <div className="result-item__artist">{track.artist.name}</div>
      <div className="result-item__album">{track.album}</div>
      <div className="result-item__duration">{formatDuration(track.duration)}</div>
    </li>
  );
}
