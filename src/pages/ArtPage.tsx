import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { GameCard } from '@/components/GameCard';
import { RetroButton } from '@/components/RetroButton';
import { StarBackground } from '@/components/StarBackground';
import { SearchBar } from '@/components/SearchBar';
import { MobileLayout } from '@/components/MobileLayout';
import { PageTransition } from '@/components/PageTransition';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { X, ZoomIn, ArrowLeft } from 'lucide-react';

// ============================================================
// INSTRUCCIONES PARA AGREGAR ARTE:
// 
// 1. Coloca tus imágenes en la carpeta: public/art/
// 2. Agrega la información al array 'artworks' abajo
// 3. Formato: { id: 1, title: "Nombre", artist: "Artista", image: "/art/tu-imagen.png" }
// ============================================================

interface Artwork {
  id: number;
  title: string;
  artist: string;
  image: string;
  description?: string;
  tags?: string[];
}

const artworks: Artwork[] = [
  // Ejemplo:
  // { id: 1, title: "Mi Dibujo", artist: "Maximo", image: "/art/mi-dibujo.png", description: "Arte épico", tags: ["digital", "furry"] },
];

const ArtPage: React.FC = () => {
  const navigate = useNavigate();
  const { playClick, playHover, playMenuOpen } = useSoundEffects();
  const [selectedArt, setSelectedArt] = useState<Artwork | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredArtworks = useMemo(() => {
    if (!searchQuery) return artworks;
    return artworks.filter(art => 
      art.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      art.artist.toLowerCase().includes(searchQuery.toLowerCase()) ||
      art.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      art.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [searchQuery]);

  const hasArt = artworks.length > 0;

  return (
    <PageTransition>
    <div className="min-h-screen relative">
      <StarBackground />
      
      {/* Mobile Layout */}
      <MobileLayout>
        <div className="px-4 py-4">
          <GameCard hoverable={false}>
            <h1 className="font-pixel text-base text-primary mb-4 text-center neon-text">
              🎨 GALERÍA DE ARTE 🎨
            </h1>

            <SearchBar 
              placeholder="🔍 Buscar arte..."
              value={searchQuery}
              onChange={setSearchQuery}
              className="mb-4"
            />

            {hasArt ? (
              <div className="grid grid-cols-2 gap-3">
                {filteredArtworks.map((art) => (
                  <div
                    key={art.id}
                    onClick={() => { playMenuOpen(); setSelectedArt(art); }}
                    className="cursor-pointer relative aspect-square bg-night-deep/50 rounded-sm border-2 border-border overflow-hidden hover:border-neon-pink transition-all"
                  >
                    <img src={art.image} alt={art.title} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <span className="text-6xl block animate-float mb-4">🖼️</span>
                <p className="font-pixel text-xs text-muted-foreground">GALERÍA VACÍA</p>
                <p className="font-retro text-sm text-muted-foreground mt-1">Próximamente...</p>
              </div>
            )}
          </GameCard>
        </div>
      </MobileLayout>

      {/* Desktop Layout */}
      <div className="hidden md:block relative z-10 max-w-5xl mx-auto px-4 py-6">
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
            🎨 GALERÍA DE ARTE 🎨
          </h1>

          {/* Buscador */}
          <SearchBar 
            placeholder="🔍 Buscar arte por título, artista, tags..."
            value={searchQuery}
            onChange={setSearchQuery}
            className="mb-6"
          />

          {hasArt ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredArtworks.map((art) => (
                <div
                  key={art.id}
                  onClick={() => { playMenuOpen(); setSelectedArt(art); }}
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
            <div className="text-center py-12">
              <span className="text-8xl mb-6 block animate-float">🖼️</span>
              <p className="font-pixel text-sm text-muted-foreground mb-2">
                GALERÍA VACÍA
              </p>
              <p className="font-retro text-xl text-muted-foreground">
                Próximamente se agregará arte increíble...
              </p>
              <p className="font-cartoon text-base text-muted-foreground/60 mt-2">
                ¡Vuelve pronto para ver las novedades!
              </p>
              
              <div className="grid grid-cols-4 gap-3 mt-6 max-w-md mx-auto">
                {[...Array(8)].map((_, i) => (
                  <div 
                    key={i}
                    className="aspect-square bg-muted/30 rounded-sm border border-dashed border-border 
                      flex items-center justify-center"
                  >
                    <span className="text-2xl opacity-30">🎨</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </GameCard>
      </div>

      {/* Art Detail Modal */}
      {selectedArt && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-night-deep/95 backdrop-blur-sm"
          onClick={() => { playClick(); setSelectedArt(null); }}
        >
          <div 
            className="relative max-w-4xl max-h-[90vh] animate-bounce-in"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => { playClick(); setSelectedArt(null); }}
              onMouseEnter={playHover}
              className="absolute -top-4 -right-4 w-10 h-10 bg-muted rounded-full border-2 border-neon-pink 
                flex items-center justify-center hover:shadow-neon-pink transition-all z-10"
            >
              <X size={20} className="text-foreground" />
            </button>

            <div className="relative border-4 border-neon-cyan shadow-neon rounded-sm overflow-hidden">
              <img 
                src={selectedArt.image} 
                alt={selectedArt.title}
                className="max-h-[70vh] w-auto object-contain"
              />
            </div>

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
    </div>
    </PageTransition>
  );
};

export default ArtPage;
