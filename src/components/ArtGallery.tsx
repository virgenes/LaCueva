import React, { useState } from 'react';
import { GameCard } from './GameCard';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { X, ZoomIn } from 'lucide-react';

// ============================================================
// INSTRUCCIONES PARA AGREGAR ARTE:
// 
// OPCIÓN FÁCIL (Recomendada):
// 1. Coloca tus imágenes en la carpeta: public/art/
// 2. Agrega la información al array 'artworks' abajo
// 3. Formato: { title: "Nombre", artist: "Artista", image: "/art/tu-imagen.png" }
//
// Las imágenes soportadas son: .png, .jpg, .jpeg, .gif, .webp
// ============================================================

interface Artwork {
  id: number;
  title: string;
  artist: string;
  image: string; // Ruta: "/art/nombre-imagen.png"
  description?: string;
}

// GALERÍA DE ARTE - Agrega tus obras aquí:
const artworks: Artwork[] = [
  // Ejemplo de cómo agregar arte:
  // { id: 1, title: "Mi Dibujo", artist: "Yo", image: "/art/mi-dibujo.png", description: "Descripción opcional" },
  // { id: 2, title: "Fanart Épico", artist: "Artista", image: "/art/fanart.jpg" },
];

export const ArtGallery: React.FC = () => {
  const { playClick, playHover, playMenuOpen } = useSoundEffects();
  const [selectedArt, setSelectedArt] = useState<Artwork | null>(null);

  const openArtModal = (art: Artwork) => {
    playMenuOpen();
    setSelectedArt(art);
  };

  const closeModal = () => {
    playClick();
    setSelectedArt(null);
  };

  const hasArt = artworks.length > 0;

  return (
    <>
      <GameCard hoverable={false} className="mb-4">
        <h2 className="font-pixel text-sm text-primary mb-4 flex items-center gap-2 pb-3 border-b-2 border-dashed border-border">
          <span className="text-star-gold animate-sparkle">🎨</span>
          GALERÍA DE ARTE
        </h2>

        {hasArt ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {artworks.map((art) => (
              <div
                key={art.id}
                onClick={() => openArtModal(art)}
                onMouseEnter={playHover}
                className="group cursor-pointer relative aspect-square bg-night-deep/50 rounded-sm 
                  border-2 border-border overflow-hidden
                  hover:border-neon-pink hover:shadow-neon-pink transition-all duration-300"
              >
                <img 
                  src={art.image} 
                  alt={art.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
                
                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-night-deep/90 via-transparent to-transparent 
                  opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="absolute bottom-2 left-2 right-2">
                    <p className="font-pixel text-[8px] text-accent truncate">{art.title}</p>
                    <p className="font-retro text-xs text-muted-foreground truncate">por {art.artist}</p>
                  </div>
                  <div className="absolute top-2 right-2">
                    <ZoomIn size={16} className="text-neon-cyan" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* No Art Available */
          <div className="text-center py-8">
            <span className="text-6xl mb-4 block animate-float">🖼️</span>
            <p className="font-pixel text-[10px] text-muted-foreground mb-2">
              GALERÍA VACÍA
            </p>
            <p className="font-retro text-lg text-muted-foreground">
              Próximamente se agregará arte increíble...
            </p>
            <p className="font-cartoon text-sm text-muted-foreground/60 mt-2">
              ¡Vuelve pronto para ver las novedades!
            </p>
            
            {/* Placeholder Grid */}
            <div className="grid grid-cols-3 gap-2 mt-4 max-w-xs mx-auto">
              {[...Array(6)].map((_, i) => (
                <div 
                  key={i}
                  className="aspect-square bg-muted/30 rounded-sm border border-dashed border-border 
                    flex items-center justify-center"
                >
                  <span className="text-xl opacity-30">🎨</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </GameCard>

      {/* Art Detail Modal */}
      {selectedArt && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-night-deep/95 backdrop-blur-sm"
          onClick={closeModal}
        >
          <div 
            className="relative max-w-4xl max-h-[90vh] animate-bounce-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={closeModal}
              onMouseEnter={playHover}
              className="absolute -top-4 -right-4 w-10 h-10 bg-muted rounded-full border-2 border-neon-pink 
                flex items-center justify-center hover:shadow-neon-pink transition-all z-10"
            >
              <X size={20} className="text-foreground" />
            </button>

            {/* Image */}
            <div className="relative border-4 border-neon-cyan shadow-neon rounded-sm overflow-hidden">
              <img 
                src={selectedArt.image} 
                alt={selectedArt.title}
                className="max-h-[70vh] w-auto object-contain"
              />
            </div>

            {/* Info */}
            <div className="mt-4 text-center">
              <h3 className="font-pixel text-lg text-primary neon-text">
                {selectedArt.title}
              </h3>
              <p className="font-retro text-xl text-neon-pink">
                por {selectedArt.artist}
              </p>
              {selectedArt.description && (
                <p className="font-cartoon text-sm text-muted-foreground mt-2">
                  {selectedArt.description}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
