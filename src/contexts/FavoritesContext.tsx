import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { Game } from '@/data/gamesData';
import type { YouTubeTrack } from './YouTubeMusicContext';

interface FavoritesContextType {
  favoriteGames: number[];
  favoriteTracks: string[];
  toggleFavoriteGame: (gameId: number) => void;
  toggleFavoriteTrack: (trackId: string) => void;
  isGameFavorite: (gameId: number) => boolean;
  isTrackFavorite: (trackId: string) => boolean;
  getFavoriteGamesCount: () => number;
  getFavoriteTracksCount: () => number;
}

const FavoritesContext = createContext<FavoritesContextType | null>(null);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favoriteGames, setFavoriteGames] = useState<number[]>([]);
  const [favoriteTracks, setFavoriteTracks] = useState<string[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const savedGames = localStorage.getItem('cave-favorite-games');
      const savedTracks = localStorage.getItem('cave-favorite-tracks');
      if (savedGames) setFavoriteGames(JSON.parse(savedGames));
      if (savedTracks) setFavoriteTracks(JSON.parse(savedTracks));
    } catch (error) {
      console.error('Error loading favorites:', error);
    }
  }, []);

  // Save to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem('cave-favorite-games', JSON.stringify(favoriteGames));
    } catch (error) {
      console.error('Error saving favorite games:', error);
    }
  }, [favoriteGames]);

  useEffect(() => {
    try {
      localStorage.setItem('cave-favorite-tracks', JSON.stringify(favoriteTracks));
    } catch (error) {
      console.error('Error saving favorite tracks:', error);
    }
  }, [favoriteTracks]);

  const toggleFavoriteGame = useCallback((gameId: number) => {
    setFavoriteGames(prev => 
      prev.includes(gameId) 
        ? prev.filter(id => id !== gameId)
        : [...prev, gameId]
    );
  }, []);

  const toggleFavoriteTrack = useCallback((trackId: string) => {
    setFavoriteTracks(prev => 
      prev.includes(trackId) 
        ? prev.filter(id => id !== trackId)
        : [...prev, trackId]
    );
  }, []);

  const isGameFavorite = useCallback((gameId: number) => {
    return favoriteGames.includes(gameId);
  }, [favoriteGames]);

  const isTrackFavorite = useCallback((trackId: string) => {
    return favoriteTracks.includes(trackId);
  }, [favoriteTracks]);

  const getFavoriteGamesCount = useCallback(() => favoriteGames.length, [favoriteGames]);
  const getFavoriteTracksCount = useCallback(() => favoriteTracks.length, [favoriteTracks]);

  return (
    <FavoritesContext.Provider value={{
      favoriteGames,
      favoriteTracks,
      toggleFavoriteGame,
      toggleFavoriteTrack,
      isGameFavorite,
      isTrackFavorite,
      getFavoriteGamesCount,
      getFavoriteTracksCount,
    }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (!context) {
    return {
      favoriteGames: [],
      favoriteTracks: [],
      toggleFavoriteGame: () => {},
      toggleFavoriteTrack: () => {},
      isGameFavorite: () => false,
      isTrackFavorite: () => false,
      getFavoriteGamesCount: () => 0,
      getFavoriteTracksCount: () => 0,
    };
  }
  return context;
}