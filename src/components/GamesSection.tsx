import React, { useState } from 'react';
import { GameCard } from './GameCard';
import { RetroButton } from './RetroButton';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { X, Download, Play, Info } from 'lucide-react';

// ============================================================
// INSTRUCCIONES PARA AGREGAR JUEGOS:
// 1. Agrega la información del juego al array 'games' abajo
// 2. Coloca las imágenes de portada en: public/games/covers/
// 3. Coloca los archivos del juego en: public/games/files/
// ============================================================

interface Game {
  id: number;
  title: string;
  description: string;
  cover: string; // Ruta a la imagen de portada
  downloadUrl?: string;
  playUrl?: string;
  tags: string[];
}

// LISTA DE JUEGOS - Agrega tus juegos aquí:
const games: Game[] = [
  {
    id: 1,
    title: "Juego de Prueba",
    description: "Este es un ejemplo de cómo se vería un juego en la página. Puedes agregar más juegos editando el archivo GamesSection.tsx",
    cover: "", // Agrega la ruta: "/games/covers/mi-juego.png"
    downloadUrl: "#",
    playUrl: "#",
    tags: ["Aventura", "Indie", "Pixel Art"]
  },
];

export const GamesSection: React.FC = () => {
  const { playClick, playHover, playMenuOpen } = useSoundEffects();
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [showModal, setShowModal] = useState(false);

  const openGameModal = (game: Game) => {
    playMenuOpen();
    setSelectedGame(game);
    setShowModal(true);
  };

  const closeModal = () => {
    playClick();
    setShowModal(false);
    setSelectedGame(null);
  };

  return (
    <>
      <GameCard hoverable={false} className="mb-4">
        <h2 className="font-pixel text-sm text-primary mb-4 flex items-center gap-2 pb-3 border-b-2 border-dashed border-border">
          <span className="text-neon-cyan animate-sparkle">🎮</span>
          VIDEOJUEGOS
        </h2>

        <div className="grid grid-cols-1 gap-4">
          {games.map((game) => (
            <div
              key={game.id}
              onClick={() => openGameModal(game)}
              onMouseEnter={playHover}
              className="group cursor-pointer bg-muted/30 rounded-sm border-2 border-border 
                hover:border-neon-cyan hover:shadow-neon transition-all duration-300"
            >
              {/* Game Cover */}
              <div className="relative h-32 bg-night-deep/50 overflow-hidden">
                {game.cover ? (
                  <img 
                    src={game.cover} 
                    alt={game.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-neon-cyan/20 to-neon-pink/20">
                    <span className="text-5xl animate-float">🎮</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-night-deep/80 to-transparent" />
                
                {/* Play Button Overlay */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-12 h-12 bg-neon-pink rounded-full flex items-center justify-center shadow-neon-pink animate-pulse">
                    <Play size={24} className="text-night-deep ml-1" />
                  </div>
                </div>
              </div>

              {/* Game Info */}
              <div className="p-3">
                <h3 className="font-pixel text-[10px] text-accent group-hover:text-primary transition-colors">
                  {game.title}
                </h3>
                <p className="font-retro text-sm text-muted-foreground mt-1 line-clamp-2">
                  {game.description}
                </p>
                
                {/* Tags */}
                <div className="flex flex-wrap gap-1 mt-2">
                  {game.tags.map((tag, i) => (
                    <span 
                      key={i}
                      className="font-retro text-xs px-2 py-0.5 bg-night-deep rounded-sm text-neon-cyan border border-neon-cyan/30"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        <p className="font-retro text-sm text-muted-foreground text-center mt-4">
          ¡Click en un juego para ver más detalles!
        </p>
      </GameCard>

      {/* Game Detail Modal */}
      {showModal && selectedGame && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-night-deep/90 backdrop-blur-sm"
          onClick={closeModal}
        >
          <div 
            className="w-full max-w-2xl max-h-[90vh] overflow-y-auto game-card relative animate-bounce-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={closeModal}
              onMouseEnter={playHover}
              className="absolute top-2 right-2 w-8 h-8 bg-muted rounded-sm border-2 border-border 
                flex items-center justify-center hover:border-neon-pink hover:shadow-neon-pink transition-all z-10"
            >
              <X size={16} className="text-foreground" />
            </button>

            {/* Game Cover Large */}
            <div className="relative h-48 md:h-64 bg-night-deep/50 overflow-hidden rounded-t-sm -m-4 mb-4">
              {selectedGame.cover ? (
                <img 
                  src={selectedGame.cover} 
                  alt={selectedGame.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-neon-cyan/30 to-neon-pink/30">
                  <span className="text-8xl animate-float">🎮</span>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-night-deep to-transparent" />
              
              {/* Title Overlay */}
              <div className="absolute bottom-4 left-4 right-4">
                <h2 className="font-pixel text-xl text-primary neon-text">
                  {selectedGame.title}
                </h2>
              </div>
            </div>

            {/* Content */}
            <div className="space-y-4">
              {/* Tags */}
              <div className="flex flex-wrap gap-2">
                {selectedGame.tags.map((tag, i) => (
                  <span 
                    key={i}
                    className="font-pixel text-[8px] px-3 py-1 bg-neon-cyan/20 rounded-sm text-neon-cyan border border-neon-cyan"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* Description */}
              <div className="bg-muted/30 rounded-sm p-4 border border-border">
                <h3 className="font-pixel text-[10px] text-star-gold mb-2 flex items-center gap-2">
                  <Info size={14} />
                  DESCRIPCIÓN
                </h3>
                <p className="font-cartoon text-sm text-foreground">
                  {selectedGame.description}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 justify-center pt-4 border-t border-border">
                {selectedGame.playUrl && (
                  <RetroButton 
                    variant="cyan"
                    onClick={() => window.open(selectedGame.playUrl, '_blank')}
                  >
                    <Play size={14} className="mr-1" />
                    Jugar Ahora
                  </RetroButton>
                )}
                {selectedGame.downloadUrl && (
                  <RetroButton 
                    variant="pink"
                    onClick={() => window.open(selectedGame.downloadUrl, '_blank')}
                  >
                    <Download size={14} className="mr-1" />
                    Descargar
                  </RetroButton>
                )}
              </div>

              {/* Example Interface Note */}
              <div className="bg-star-gold/10 border border-star-gold/50 rounded-sm p-3 text-center">
                <p className="font-retro text-sm text-star-gold">
                  ⭐ Este es un ejemplo de la interfaz para visualizar juegos ⭐
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
