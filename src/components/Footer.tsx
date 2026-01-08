import React from 'react';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import logoFurros from '@/assets/logo-furros.jpg';

export const Footer: React.FC = () => {
  const { playClick, playHover } = useSoundEffects();
  const currentYear = new Date().getFullYear();

  const socialLinks = [
    { name: 'YouTube', emoji: '📺', url: 'https://www.youtube.com/@CuevadelosVirgenes' },
    { name: 'Discord', emoji: '💬', url: 'https://discord.gg/PFvsgRvfYd' },
    { name: 'TikTok', emoji: '🎵', url: 'https://www.tiktok.com/@cuevadelosvirgenes0?is_from_webapp=1&sender_device=pc' },
  ];

  return (
    <footer className="mt-8 relative">
      {/* Visitor counter */}
      <div className="flex justify-center mb-4">
        <div className="game-card px-4 py-2 flex items-center gap-2">
          <span className="font-retro text-lg text-muted-foreground">visitantes únicos:</span>
          <div className="flex gap-1">
            {['0', '0', '0', '0', '0'].map((digit, i) => (
              <span 
                key={i}
                className="w-6 h-8 bg-night-deep border border-neon-cyan flex items-center justify-center font-pixel text-sm text-neon-cyan"
              >
                {digit}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Social Links Banner */}
      <div className="game-card p-4 text-center mb-4">
        <div className="flex items-center justify-center gap-2 mb-3">
          <span className="text-xl">🌐</span>
          <h3 className="font-pixel text-xs text-primary">SÍGUENOS EN REDES</h3>
          <span className="text-xl">🌐</span>
        </div>
        
        <div className="flex justify-center flex-wrap gap-3">
          {socialLinks.map((link) => (
            <a
              key={link.name}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={playClick}
              onMouseEnter={playHover}
              className="flex items-center gap-1 px-3 py-2 bg-muted rounded-sm border-2 border-border
                hover:border-neon-pink hover:shadow-neon-pink hover:-translate-y-1
                transition-all duration-200"
            >
              <span className="text-lg">{link.emoji}</span>
              <span className="font-retro text-lg text-foreground">{link.name}</span>
            </a>
          ))}
        </div>
      </div>

      {/* Badges Section */}
      <div className="flex justify-center gap-4 mb-4 flex-wrap">
        <div 
          className="game-card px-3 py-2 cursor-pointer hover:animate-wiggle"
          onClick={playClick}
          onMouseEnter={playHover}
        >
          <span className="font-pixel text-[8px] text-neon-cyan">¿TU PROPIA WEB?</span>
          <div className="font-retro text-sm text-secondary">neocities | cohost</div>
        </div>
        
        <div 
          className="game-card px-3 py-2 cursor-pointer hover:animate-wiggle"
          onClick={playClick}
          onMouseEnter={playHover}
        >
          <span className="font-pixel text-[8px] text-star-gold">COLECCIÓN ÉPICA</span>
          <div className="font-retro text-sm text-muted-foreground">insignias afiliadas</div>
        </div>
      </div>

      {/* Copyright */}
      <div className="text-center py-4 border-t-2 border-dashed border-border">
        <div className="flex items-center justify-center gap-3 mb-2">
          <img 
            src={logoFurros}
            alt="Logo"
            className="w-8 h-8 rounded-full border-2 border-neon-cyan"
          />
          <span className="font-pixel text-[10px] text-primary">LA CUEVA DE LOS VÍRGENES</span>
        </div>
        <p className="font-retro text-lg text-muted-foreground">
          © {currentYear} Todos los derechos reservados
        </p>
        <p className="font-retro text-sm text-muted-foreground/60 mt-1">
          Hecho con 💜 y mucho café ☕
        </p>
        
        {/* Retro web badges */}
        <div className="flex justify-center gap-2 mt-3">
          <span className="text-2xl animate-float">🎮</span>
          <span className="text-2xl animate-float" style={{ animationDelay: '0.3s' }}>✨</span>
          <span className="text-2xl animate-float" style={{ animationDelay: '0.6s' }}>👾</span>
          <span className="text-2xl animate-float" style={{ animationDelay: '0.9s' }}>🌟</span>
        </div>
      </div>
    </footer>
  );
};
