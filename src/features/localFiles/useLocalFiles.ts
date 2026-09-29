import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Track } from '../../types';

// Hardcoded dev folder — Phase 1 only.
// Change this path to wherever test audio files live on the dev machine.
const DEV_LOCAL_FOLDER = '/home/skipper/Music';

interface LocalFileInfo {
  name: string;
  path: string;
}

export interface LocalFilesState {
  localTracks: Track[];
  isLoading: boolean;
  error: string | null;
}

export function useLocalFiles(): LocalFilesState {
  const [localTracks, setLocalTracks] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    invoke<LocalFileInfo[]>('scan_local_folder', { path: DEV_LOCAL_FOLDER })
      .then((files) => {
        const tracks: Track[] = files.map((f) => ({
          id: `local:${f.path}`,
          title: f.name,
          artist: { id: 'local', name: 'Local File' },
          album: '',
          duration: 0,
          source: 'local',
          localPath: f.path,
        }));
        setLocalTracks(tracks);
      })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : String(err);
        console.warn('[LOCAL] scan_local_folder failed:', msg);
        setError(msg);
      })
      .finally(() => setIsLoading(false));
  }, []);

  return { localTracks, isLoading, error };
}
