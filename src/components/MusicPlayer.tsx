import React, { useState, useRef, useEffect } from 'react';
import { GameCard } from './GameCard';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { Play, Pause, SkipForward, SkipBack, Volume2, VolumeX } from 'lucide-react';

// ============================================================
// INSTRUCCIONES PARA AGREGAR MÚSICA:
// 1. Coloca tus archivos de música en la carpeta: public/music/
// 2. Agrega las canciones al array 'playlist' abajo
// 3. Formato: { title: "Nombre de la canción", artist: "Artista", file: "/music/tu-cancion.mp3" }
// ============================================================

interface Track {
  title: string;
  artist: string;
  file: string;
}

// PLAYLIST - Agrega tus canciones aquí:
const playlist: Track[] = [
  // Ejemplo de cómo agregar canciones:
  // { title: "Mi Canción Favorita", artist: "Artista Genial", file: "/music/mi-cancion.mp3" },
  // { title: "Otra Canción", artist: "Otro Artista", file: "/music/otra-cancion.mp3" },
];

export const MusicPlayer: React.FC = () => {
  const { playClick, playHover } = useSoundEffects();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);

  const hasMusic = playlist.length > 0;
  const currentSong = playlist[currentTrack];

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateProgress = () => {
      if (audio.duration) {
        setProgress((audio.currentTime / audio.duration) * 100);
      }
    };

    audio.addEventListener('timeupdate', updateProgress);
    return () => audio.removeEventListener('timeupdate', updateProgress);
  }, []);

  const togglePlay = () => {
    playClick();
    if (!hasMusic) return;
    
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const nextTrack = () => {
    playClick();
    if (!hasMusic) return;
    setCurrentTrack((prev) => (prev + 1) % playlist.length);
    setIsPlaying(false);
  };

  const prevTrack = () => {
    playClick();
    if (!hasMusic) return;
    setCurrentTrack((prev) => (prev - 1 + playlist.length) % playlist.length);
    setIsPlaying(false);
  };

  const toggleMute = () => {
    playClick();
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  return (
    <GameCard hoverable={false} className="mb-4">
      <h2 className="font-pixel text-[10px] text-primary mb-3 flex items-center gap-2 pb-2 border-b-2 border-dashed border-border">
        <span className="text-neon-pink animate-sparkle">🎵</span>
        REPRODUCTOR RETRO
      </h2>

      {hasMusic ? (
        <>
          <audio
            ref={audioRef}
            src={currentSong?.file}
            onEnded={nextTrack}
          />

          {/* Track Info */}
          <div className="text-center mb-3">
            <p className="font-pixel text-[8px] text-accent truncate">
              {currentSong?.title}
            </p>
            <p className="font-retro text-sm text-muted-foreground truncate">
              {currentSong?.artist}
            </p>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-2 bg-night-deep rounded-sm mb-3 overflow-hidden border border-border">
            <div 
              className="h-full bg-gradient-to-r from-neon-cyan to-neon-pink transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={prevTrack}
              onMouseEnter={playHover}
              className="w-8 h-8 bg-muted rounded-sm border-2 border-border flex items-center justify-center
                hover:border-neon-cyan hover:shadow-neon transition-all"
            >
              <SkipBack size={14} className="text-primary" />
            </button>

            <button
              onClick={togglePlay}
              onMouseEnter={playHover}
              className="w-10 h-10 bg-gradient-to-br from-neon-pink to-neon-cyan rounded-sm border-2 border-night-deep 
                flex items-center justify-center shadow-pixel hover:scale-105 transition-transform"
            >
              {isPlaying ? (
                <Pause size={18} className="text-night-deep" />
              ) : (
                <Play size={18} className="text-night-deep ml-0.5" />
              )}
            </button>

            <button
              onClick={nextTrack}
              onMouseEnter={playHover}
              className="w-8 h-8 bg-muted rounded-sm border-2 border-border flex items-center justify-center
                hover:border-neon-cyan hover:shadow-neon transition-all"
            >
              <SkipForward size={14} className="text-primary" />
            </button>

            <button
              onClick={toggleMute}
              onMouseEnter={playHover}
              className="w-8 h-8 bg-muted rounded-sm border-2 border-border flex items-center justify-center
                hover:border-neon-pink hover:shadow-neon-pink transition-all ml-2"
            >
              {isMuted ? (
                <VolumeX size={14} className="text-muted-foreground" />
              ) : (
                <Volume2 size={14} className="text-primary" />
              )}
            </button>
          </div>

          {/* Track List */}
          <div className="mt-3 pt-2 border-t border-border">
            <p className="font-retro text-sm text-muted-foreground text-center">
              Pista {currentTrack + 1} de {playlist.length}
            </p>
          </div>
        </>
      ) : (
        /* No Music Available */
        <div className="text-center py-4">
          <span className="text-4xl mb-2 block animate-float">🎶</span>
          <p className="font-pixel text-[8px] text-muted-foreground mb-1">
            NO DISPONIBLE
          </p>
          <p className="font-retro text-sm text-muted-foreground">
            Música próximamente...
          </p>
          <div className="flex justify-center gap-1 mt-3">
            {[...Array(5)].map((_, i) => (
              <div 
                key={i}
                className="w-2 bg-muted-foreground/30 rounded-sm"
                style={{ height: `${Math.random() * 20 + 10}px` }}
              />
            ))}
          </div>
        </div>
      )}
    </GameCard>
  );
};
