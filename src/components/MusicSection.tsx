import React from 'react';
import { GameCard } from './GameCard';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { Music, Play } from 'lucide-react';

// ============================================================
// INSTRUCCIONES PARA AGREGAR MÚSICA A ESTA SECCIÓN:
// 
// 1. Coloca tus archivos de música en: public/music/
// 2. Agrega la información al array 'tracks' abajo
// 3. Formato: { title: "Canción", artist: "Artista", file: "/music/cancion.mp3", cover: "/music/covers/cover.png" }
//
// Para las portadas de los álbumes, crea una carpeta: public/music/covers/
// ============================================================

interface Track {
  id: number;
  title: string;
  artist: string;
  file: string;
  cover?: string;
  duration?: string;
}

// LISTA DE MÚSICA - Agrega tus canciones aquí:
const tracks: Track[] = [
  // Ejemplo:
  // { id: 1, title: "Mi Canción", artist: "Artista", file: "/music/mi-cancion.mp3", duration: "3:45" },
];

export const MusicSection: React.FC = () => {
  const { playClick, playHover } = useSoundEffects();

  const hasMusic = tracks.length > 0;

  return (
    <GameCard hoverable={false} className="mb-4">
      <h2 className="font-pixel text-sm text-primary mb-4 flex items-center gap-2 pb-3 border-b-2 border-dashed border-border">
        <span className="text-neon-pink animate-sparkle">🎵</span>
        MÚSICA
      </h2>

      {hasMusic ? (
        <div className="space-y-2">
          {tracks.map((track) => (
            <div
              key={track.id}
              onClick={playClick}
              onMouseEnter={playHover}
              className="group flex items-center gap-3 p-2 rounded-sm bg-muted/30 border border-border
                hover:border-neon-cyan hover:shadow-neon cursor-pointer transition-all"
            >
              {/* Cover */}
              <div className="w-12 h-12 rounded-sm overflow-hidden bg-night-deep flex items-center justify-center border border-border">
                {track.cover ? (
                  <img src={track.cover} alt={track.title} className="w-full h-full object-cover" />
                ) : (
                  <Music size={20} className="text-neon-pink" />
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-pixel text-[9px] text-accent truncate group-hover:text-primary transition-colors">
                  {track.title}
                </p>
                <p className="font-retro text-sm text-muted-foreground truncate">
                  {track.artist}
                </p>
              </div>

              {/* Duration & Play */}
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
      ) : (
        /* No Music Available */
        <div className="text-center py-8">
          <span className="text-6xl mb-4 block animate-float">🎶</span>
          <p className="font-pixel text-[10px] text-muted-foreground mb-2">
            NO DISPONIBLE
          </p>
          <p className="font-retro text-lg text-muted-foreground">
            Sección de música próximamente...
          </p>
          <p className="font-cartoon text-sm text-muted-foreground/60 mt-2">
            ¡Estamos preparando algo especial!
          </p>
          
          {/* Placeholder */}
          <div className="flex justify-center items-end gap-1 mt-4 h-12">
            {[3, 5, 7, 4, 6, 8, 5, 3, 6, 4].map((h, i) => (
              <div 
                key={i}
                className="w-2 bg-muted-foreground/20 rounded-t-sm animate-pulse"
                style={{ 
                  height: `${h * 4}px`,
                  animationDelay: `${i * 0.1}s`
                }}
              />
            ))}
          </div>
        </div>
      )}
    </GameCard>
  );
};
