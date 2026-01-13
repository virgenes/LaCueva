import { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';

export interface YouTubeTrack {
  id: string;
  videoId: string;
  title: string;
  artist: string;
  thumbnail: string;
}

interface YouTubeMusicContextType {
  currentTrack: YouTubeTrack | null;
  isPlaying: boolean;
  volume: number;
  playlist: YouTubeTrack[];
  setCurrentTrack: (track: YouTubeTrack | null) => void;
  setIsPlaying: (playing: boolean) => void;
  setVolume: (volume: number) => void;
  playTrack: (track: YouTubeTrack) => void;
  nextTrack: () => void;
  prevTrack: () => void;
  togglePlay: () => void;
}

const YouTubeMusicContext = createContext<YouTubeMusicContextType | null>(null);

// Playlist de YouTube con los videos proporcionados
const defaultPlaylist: YouTubeTrack[] = [
  {
    id: '1',
    videoId: 'PydqkG0xRZo',
    title: 'Chill Beats',
    artist: 'Lo-Fi Music',
    thumbnail: 'https://img.youtube.com/vi/PydqkG0xRZo/mqdefault.jpg',
  },
  {
    id: '2',
    videoId: 'SMgqzgRqH7w',
    title: 'Relaxing Vibes',
    artist: 'Ambient Sounds',
    thumbnail: 'https://img.youtube.com/vi/SMgqzgRqH7w/mqdefault.jpg',
  },
  {
    id: '3',
    videoId: '-B65n78YLtA',
    title: 'Night Drive',
    artist: 'Synthwave Mix',
    thumbnail: 'https://img.youtube.com/vi/-B65n78YLtA/mqdefault.jpg',
  },
  {
    id: '4',
    videoId: 'VDI2S-acTiA',
    title: 'Dreamy Melodies',
    artist: 'Chill Music',
    thumbnail: 'https://img.youtube.com/vi/VDI2S-acTiA/mqdefault.jpg',
  },
];

export function YouTubeMusicProvider({ children }: { children: ReactNode }) {
  const [currentTrack, setCurrentTrack] = useState<YouTubeTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(50);
  const playlist = defaultPlaylist;

  const playTrack = useCallback((track: YouTubeTrack) => {
    setCurrentTrack(track);
    setIsPlaying(true);
  }, []);

  const nextTrack = useCallback(() => {
    if (!currentTrack) {
      if (playlist.length > 0) playTrack(playlist[0]);
      return;
    }
    const currentIndex = playlist.findIndex(t => t.id === currentTrack.id);
    const nextIndex = (currentIndex + 1) % playlist.length;
    playTrack(playlist[nextIndex]);
  }, [currentTrack, playlist, playTrack]);

  const prevTrack = useCallback(() => {
    if (!currentTrack) {
      if (playlist.length > 0) playTrack(playlist[playlist.length - 1]);
      return;
    }
    const currentIndex = playlist.findIndex(t => t.id === currentTrack.id);
    const prevIndex = (currentIndex - 1 + playlist.length) % playlist.length;
    playTrack(playlist[prevIndex]);
  }, [currentTrack, playlist, playTrack]);

  const togglePlay = useCallback(() => {
    if (!currentTrack && playlist.length > 0) {
      playTrack(playlist[0]);
      return;
    }
    setIsPlaying(prev => !prev);
  }, [currentTrack, playlist, playTrack]);

  return (
    <YouTubeMusicContext.Provider value={{
      currentTrack,
      isPlaying,
      volume,
      playlist,
      setCurrentTrack,
      setIsPlaying,
      setVolume,
      playTrack,
      nextTrack,
      prevTrack,
      togglePlay,
    }}>
      {children}
    </YouTubeMusicContext.Provider>
  );
}

export function useYouTubeMusic() {
  const context = useContext(YouTubeMusicContext);
  if (!context) {
    throw new Error('useYouTubeMusic must be used within a YouTubeMusicProvider');
  }
  return context;
}