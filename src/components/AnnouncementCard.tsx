import React from 'react';
import { GameCard } from './GameCard';
import { RetroButton } from './RetroButton';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export const AnnouncementCard: React.FC = () => {
  const { playClick, playHover } = useSoundEffects();
  const today = new Date();

  const videoUrl = "https://www.youtube.com/watch?v=DHX0F4EtUg0";
  const videoId = "DHX0F4EtUg0";
  const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;

  const handleVideoClick = () => {
    playClick();
    window.open(videoUrl, '_blank');
  };

  return (
    <GameCard hoverable={false} glowing className="relative">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b-2 border-dashed border-border">
        <h2 className="font-pixel text-sm text-primary flex items-center gap-2">
          <span className="text-star-gold animate-sparkle">📢</span>
          ANUNCIOS
        </h2>
        <span className="font-retro text-xl text-muted-foreground">
          {format(today, 'dd/MM/yyyy', { locale: es })}
        </span>
      </div>

      {/* Featured Video Announcement */}
      <div className="relative bg-muted/50 rounded-sm p-4 mb-4 border-2 border-neon-pink">
        {/* YouTube Video Thumbnail */}
        <div 
          className="w-full aspect-video bg-card rounded-sm mb-4 overflow-hidden relative cursor-pointer group"
          onClick={handleVideoClick}
          onMouseEnter={playHover}
        >
          <img 
            src={thumbnailUrl}
            alt="Nuevo video de La Cueva de los Vírgenes"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              // Fallback to hqdefault if maxresdefault doesn't exist
              (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-night-deep/60 to-transparent" />
          
          {/* Play Button Overlay */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center 
              shadow-lg group-hover:scale-110 group-hover:bg-red-500 transition-all duration-300">
              <div className="w-0 h-0 border-t-[12px] border-t-transparent border-l-[20px] border-l-white border-b-[12px] border-b-transparent ml-1" />
            </div>
          </div>

          {/* Live Badge */}
          <div className="absolute top-2 left-2 px-2 py-1 bg-red-600 rounded-sm">
            <span className="font-pixel text-[8px] text-white">¡NUEVO VIDEO!</span>
          </div>
          
          {/* Decorative doodles */}
          <div className="absolute top-2 right-2 text-xl animate-sparkle">✨</div>
          <div className="absolute bottom-2 left-4 text-lg animate-float">🎮</div>
          <div className="absolute bottom-2 right-4 text-lg animate-float" style={{ animationDelay: '0.7s' }}>🎬</div>
        </div>

        <h3 className="font-pixel text-xs text-accent mb-2 text-center">
          ¡NUEVO VIDEO DISPONIBLE!
        </h3>
        <p className="font-cartoon text-lg text-foreground text-center mb-4">
          ¡DALE CLICK, ESTE VIDEO LO HICIMOS CON MUCHO AMOR! 💖
        </p>

        <div className="flex justify-center">
          <RetroButton variant="pink" onClick={handleVideoClick}>
            Ver Video 📺
          </RetroButton>
        </div>
      </div>

      {/* Decorative corner badges */}
      <div className="absolute -top-2 -right-2 w-8 h-8 bg-star-gold rounded-full flex items-center justify-center animate-sparkle shadow-pixel text-sm">
        ⭐
      </div>
    </GameCard>
  );
};
