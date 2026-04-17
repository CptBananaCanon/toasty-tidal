import {
  Shuffle, SkipBack, Play, Pause, SkipForward, Repeat, Repeat2,
} from 'lucide-react';
import { RepeatMode } from './usePlayer';
import { Button } from '../../components/ui/button';
import { cn } from '../../lib/utils';

interface Props {
  isPlaying: boolean;
  hasTrack: boolean;
  shuffle: boolean;
  repeat: RepeatMode;
  onPlayPause: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onShuffle: () => void;
  onRepeat: () => void;
}

export function PlayerControls({
  isPlaying, hasTrack, shuffle, repeat,
  onPlayPause, onPrevious, onNext, onShuffle, onRepeat,
}: Props) {
  return (
    <div className="flex items-center gap-0.5" role="group" aria-label="Transport controls">

      {/* Shuffle */}
      <Button
        variant="ghost"
        size="icon"
        className={cn(shuffle && 'text-zinc-100 bg-zinc-700')}
        onClick={onShuffle}
        aria-label="Shuffle"
        aria-pressed={shuffle}
      >
        <Shuffle className="h-4 w-4" />
      </Button>

      {/* Previous */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onPrevious}
        disabled={!hasTrack}
        aria-label="Previous"
      >
        <SkipBack className="h-4 w-4" />
      </Button>

      {/* Play / Pause toggle */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onPlayPause}
        aria-label={isPlaying ? 'Pause' : 'Play'}
      >
        {isPlaying
          ? <Pause className="h-4 w-4" />
          : <Play className="h-4 w-4" />
        }
      </Button>

      {/* Next */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onNext}
        disabled={!hasTrack}
        aria-label="Next"
      >
        <SkipForward className="h-4 w-4" />
      </Button>

      {/* Repeat — Repeat2 (two arrows) for all/off, Repeat for one */}
      <Button
        variant="ghost"
        size="icon"
        className={cn(repeat !== 'off' && 'text-zinc-100 bg-zinc-700')}
        onClick={onRepeat}
        aria-label={`Repeat: ${repeat}`}
        aria-pressed={repeat !== 'off'}
      >
        {repeat === 'one'
          ? <Repeat className="h-4 w-4" />
          : <Repeat2 className="h-4 w-4" />
        }
      </Button>

    </div>
  );
}
