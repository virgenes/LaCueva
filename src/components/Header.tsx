import React from 'react';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import bannerHeader from '@/assets/banner-header.png';
import logoFurros from '@/assets/logo-furros.jpg';

export const Header: React.FC = () => {
  const { playClick, playHover } = useSoundEffects();

  return (
    <header className="relative w-full mb-6">
      {/* Banner Container */}
      <div className="relative overflow-hidden rounded-sm border-4 border-neon-pink shadow-pixel">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img 
            src={bannerHeader}
            alt="Banner"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-night-deep/80 via-transparent to-night-deep/80" />
        </div>
        
        {/* Content */}
        <div className="relative z-10 flex items-center justify-center py-8 px-6">
          {/* Logo */}
          <div 
            className="flex items-center gap-6 cursor-pointer group"
            onClick={playClick}
            onMouseEnter={playHover}
          >
            <div className="relative">
              <img 
                src={logoFurros}
                alt="La Cueva de los Vírgenes"
                className="w-24 h-24 rounded-full border-4 border-neon-cyan shadow-neon group-hover:scale-110 transition-transform duration-300"
              />
              {/* Decorative stars */}
              <span className="absolute -top-2 -left-2 text-star-gold animate-sparkle text-2xl">✦</span>
              <span className="absolute -bottom-1 -right-2 text-neon-pink animate-sparkle text-xl" style={{ animationDelay: '0.5s' }}>✧</span>
            </div>
            
            <div className="text-center">
              <h1 className="font-pixel text-xl md:text-2xl neon-text text-primary tracking-wider mb-2">
                LA CUEVA DE LOS VÍRGENES
              </h1>
              <p className="font-retro text-2xl text-neon-pink neon-text-pink">
                ★ La Comunidad Más Friki ★
              </p>
            </div>
          </div>
        </div>

        {/* Decorative corners */}
        <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-star-gold" />
        <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-star-gold" />
        <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-star-gold" />
        <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-star-gold" />

        {/* Floating decorations */}
        <div className="absolute top-4 right-8 text-3xl animate-float">🎮</div>
        <div className="absolute bottom-4 left-8 text-2xl animate-float" style={{ animationDelay: '1s' }}>👾</div>
        <div className="absolute top-6 left-1/4 text-xl animate-sparkle" style={{ animationDelay: '0.3s' }}>⭐</div>
      </div>

      {/* Marquee Banner */}
      <div className="mt-3 bg-muted border-2 border-border py-2 overflow-hidden relative">
        <div className="animate-marquee whitespace-nowrap">
          <span className="font-retro text-lg text-primary mx-8">
            🎉 ¡BIENVENIDOS A LA CUEVA DE LOS VÍRGENES! 
          </span>
          <span className="font-retro text-lg text-neon-pink mx-8">
            ★ El lugar más épico del internet ★
          </span>
          <span className="font-retro text-lg text-star-gold mx-8">
            🌟 ¡Nuevas actualizaciones cada semana! 
          </span>
          <span className="font-retro text-lg text-neon-cyan mx-8">
            🎮 ¡Únete a nuestra comunidad gamer! 🎮
          </span>
        </div>
      </div>

      <style>{`
        @keyframes marquee {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        .animate-marquee {
          animation: marquee 20s linear infinite;
        }
      `}</style>
    </header>
  );
};
