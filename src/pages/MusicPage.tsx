import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { GameCard } from '@/components/GameCard';
import { RetroButton } from '@/components/RetroButton';
import { StarBackground } from '@/components/StarBackground';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { Music, Play, Pause, ArrowLeft, SkipBack, SkipForward } from 'lucide-react';

// ============================================================
// INSTRUCCIONES PARA AGREGAR MÚSICA:
// 
// 1. Coloca tus archivos MP3 en: public/music/
// 2. Coloca las portadas en: public/music/covers/
// 3. Agrega la información al array 'tracks' abajo
// ============================================================

interface Track {
  id: number;
  title: string;
  artist: string;
  file: string;
  cover?: string;
  duration?: string;
}

const tracks: Track[] = [
  // Ejemplo:
  // { id: 1, title: "Mi Canción", artist: "Artista", file: "/music/mi-cancion.mp3", cover: "/music/covers/cover.png", duration: "3:45" },
];

const MusicPage: React.FC = () => {
  const navigate = useNavigate();
  const { playClick, playHover } = useSoundEffects();
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const hasMusic = tracks.length > 0;

  const playTrack = (track: Track) => {
    playClick();
    setCurrentTrack(track);
    setIsPlaying(true);
    if (audioRef.current) {
      audioRef.current.src = track.file;
      audioRef.current.play();
    }
  };

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <div className="min-h-screen relative">
      <StarBackground />
      <audio ref={audioRef} />
      
      <div className="relative z-10 max-w-4xl mx-auto px-4 py-6">
        <RetroButton 
          variant="pink"
          onClick={() => navigate('/')}
          className="mb-4"
        >
          <ArrowLeft size={14} className="mr-2" />
          Volver al Inicio
        </RetroButton>

        <GameCard hoverable={false}>
          <h1 className="font-pixel text-xl text-primary mb-6 text-center neon-text">
            🎵 MÚSICA 🎵
          </h1>

          {hasMusic ? (
            <>
              {/* Now Playing */}
              {currentTrack && (
                <div className="mb-6 p-4 bg-gradient-to-r from-neon-pink/20 to-neon-cyan/20 rounded-sm border-2 border-neon-pink">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-sm overflow-hidden bg-night-deep flex items-center justify-center border border-border">
                      {currentTrack.cover ? (
                        <img src={currentTrack.cover} alt={currentTrack.title} className="w-full h-full object-cover" />
                      ) : (
                        <Music size={24} className="text-neon-pink animate-pulse" />
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <p className="font-pixel text-sm text-accent">{currentTrack.title}</p>
                      <p className="font-retro text-base text-muted-foreground">{currentTrack.artist}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={togglePlay}
                        onMouseEnter={playHover}
                        className="w-12 h-12 rounded-full bg-neon-pink flex items-center justify-center
                          hover:shadow-neon-pink transition-all"
                      >
                        {isPlaying ? (
                          <Pause size={20} className="text-night-deep" />
                        ) : (
                          <Play size={20} className="text-night-deep ml-1" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Track List */}
              <div className="space-y-2">
                {tracks.map((track) => (
                  <div
                    key={track.id}
                    onClick={() => playTrack(track)}
                    onMouseEnter={playHover}
                    className={`group flex items-center gap-3 p-3 rounded-sm border-2 cursor-pointer transition-all
                      ${currentTrack?.id === track.id 
                        ? 'bg-neon-cyan/20 border-neon-cyan shadow-neon' 
                        : 'bg-muted/30 border-border hover:border-neon-pink'}`}
                  >
                    <div className="w-12 h-12 rounded-sm overflow-hidden bg-night-deep flex items-center justify-center border border-border">
                      {track.cover ? (
                        <img src={track.cover} alt={track.title} className="w-full h-full object-cover" />
                      ) : (
                        <Music size={20} className="text-neon-pink" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-pixel text-[10px] text-accent truncate group-hover:text-primary transition-colors">
                        {track.title}
                      </p>
                      <p className="font-retro text-sm text-muted-foreground truncate">
                        {track.artist}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {track.duration && (
                        <span className="font-retro text-sm text-muted-foreground">
                          {track.duration}
                        </span>
                      )}
                      <div className="w-8 h-8 rounded-full bg-neon-cyan/20 flex items-center justify-center
                        group-hover:bg-neon-cyan group-hover:shadow-neon transition-all">
                        <Play size={14} className="text-neon-cyan group-hover:text-night-deep ml-0.5" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <span className="text-8xl mb-6 block animate-float">🎶</span>
              <p className="font-pixel text-sm text-muted-foreground mb-2">
                NO DISPONIBLE
              </p>
              <p className="font-retro text-xl text-muted-foreground">
                Sección de música próximamente...
              </p>
              <p className="font-cartoon text-base text-muted-foreground/60 mt-2">
                ¡Estamos preparando algo especial!
              </p>
              
              <div className="flex justify-center items-end gap-1 mt-6 h-16">
                {[3, 5, 7, 4, 6, 8, 5, 3, 6, 4, 7, 5].map((h, i) => (
                  <div 
                    key={i}
                    className="w-3 bg-neon-pink/40 rounded-t-sm animate-pulse"
                    style={{ 
                      height: `${h * 6}px`,
                      animationDelay: `${i * 0.1}s`
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </GameCard>
      </div>
    </div>
  );
};

export default MusicPage;
