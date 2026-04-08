import { Track } from '../types';

export const mockTracks: Track[] = [
  {
    id: '1',
    title: 'Ocean',
    artist: { id: 'a1', name: 'Bicep' },
    album: 'Isles',
    duration: 344,
  },
  {
    id: '2',
    title: 'Glue',
    artist: { id: 'a1', name: 'Bicep' },
    album: 'Bicep',
    duration: 397,
  },
  {
    id: '3',
    title: 'Atlas',
    artist: { id: 'a2', name: 'Bonobo' },
    album: 'The North Borders',
    duration: 282,
  },
  {
    id: '4',
    title: 'Kiara',
    artist: { id: 'a2', name: 'Bonobo' },
    album: 'Black Sands',
    duration: 376,
  },
  {
    id: '5',
    title: 'Nightcall',
    artist: { id: 'a3', name: 'Kavinsky' },
    album: 'Outrun',
    duration: 254,
  },
  {
    id: '6',
    title: 'Turbo Killer',
    artist: { id: 'a4', name: 'Carpenter Brut' },
    album: 'Trilogy',
    duration: 307,
  },
  {
    id: '7',
    title: 'Resonance',
    artist: { id: 'a5', name: 'HOME' },
    album: 'Odyssey',
    duration: 214,
  },
  {
    id: '8',
    title: 'Outro',
    artist: { id: 'a6', name: 'M83' },
    album: 'Hurry Up, We\'re Dreaming',
    duration: 509,
  },
];
