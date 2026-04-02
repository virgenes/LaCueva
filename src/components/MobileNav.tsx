import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Gamepad2, Music, Palette, Settings, Menu, X, Joystick, Folder } from 'lucide-react';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { SettingsMenu } from './SettingsMenu';
import { ExternalLinkDialog } from './ExternalLinkDialog';
import { MiniGamesHub } from './minigames/MiniGamesHub';
import { cn } from '@/lib/utils';
import logoFurros from '@/assets/logo-furros.jpg';

const navItems = [
  { icon: Home, label: 'Inicio', path: '/' },
  { icon: Gamepad2, label: 'Juegos', path: '/juegos' },
  { icon: Folder, label: 'Proyectos', path: '/proyectos' },
  { icon: Music, label: 'Música', path: '/musica' },
  { icon: Palette, label: 'Arte', path: '/arte' },
];

const socialLinks = [
  { name: 'YouTube', emoji: '📺', url: 'https://www.youtube.com/@CuevadelosVirgenes' },
  { name: 'Discord', emoji: '💬', url: 'https://discord.gg/PFvsgRvfYd' },
  { name: 'TikTok', emoji: '🎵', url: 'https://www.tiktok.com/@cuevadelosvirgenes0' },
];

export const MobileNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { playClick, playHover, playMenuOpen } = useSoundEffects();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [miniGamesOpen, setMiniGamesOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [externalLink, setExternalLink] = useState<{ isOpen: boolean; url: string }>({ isOpen: false, url: '' });

  const handleNavigation = (path: string) => {
    playMenuOpen();
    navigate(path);
    setMenuOpen(false);
  };

  const handleExternalLink = (url: string) => {
    playClick();
    setExternalLink({ isOpen: true, url });
    setMenuOpen(false);
  };

  return (
    <>
      {/* Mobile Header */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b-2 border-neon-pink">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3" onClick={() => handleNavigation('/')}>
            <img 
              src={logoFurros} 
              alt="La Cueva"
              className="w-10 h-10 rounded-full border-2 border-neon-cyan shadow-neon"
            />
            <div>
              <h1 className="font-pixel text-[10px] text-primary leading-tight">LA CUEVA</h1>
              <p className="font-retro text-sm text-neon-pink">De los Vírgenes</p>
            </div>
          </div>
          
          <button 
            onClick={() => { playClick(); setMenuOpen(!menuOpen); }}
            className="p-2 rounded-sm bg-muted border-2 border-border hover:border-neon-cyan transition-colors"
          >
            {menuOpen ? <X size={24} className="text-primary" /> : <Menu size={24} className="text-primary" />}
          </button>
        </div>
      </header>

      {/* Slide-out Menu */}
      <div className={cn(
        "md:hidden fixed inset-0 z-40 transition-all duration-300",
        menuOpen ? "visible" : "invisible"
      )}>
        {/* Backdrop */}
        <div 
          className={cn(
            "absolute inset-0 bg-night-deep/80 backdrop-blur-sm transition-opacity duration-300",
            menuOpen ? "opacity-100" : "opacity-0"
          )}
          onClick={() => setMenuOpen(false)}
        />
        
        {/* Menu Panel */}
        <div className={cn(
          "absolute top-16 right-0 w-72 h-[calc(100vh-4rem)] bg-background border-l-2 border-neon-pink shadow-neon-pink transition-transform duration-300 overflow-y-auto",
          menuOpen ? "translate-x-0" : "translate-x-full"
        )}>
          <div className="p-4 space-y-4">
            {/* Profile */}
            <div className="text-center p-4 bg-muted/50 rounded-sm border border-border">
              <img 
                src={logoFurros} 
                alt="La Cueva"
                className="w-20 h-20 rounded-full border-4 border-neon-cyan shadow-neon mx-auto mb-3"
              />
              <h3 className="font-pixel text-xs text-primary">LA CUEVA DE LOS VÍRGENES</h3>
              <p className="font-retro text-sm text-muted-foreground">¡La Comunidad Más Friki!</p>
              <div className="flex items-center justify-center gap-2 mt-2">
                <span className="w-2 h-2 rounded-full bg-neon-cyan animate-sparkle" />
                <span className="font-retro text-sm text-neon-cyan">En línea</span>
              </div>
            </div>

            {/* Social Links */}
            <div className="space-y-2">
              <p className="font-pixel text-[10px] text-muted-foreground text-center">SÍGUENOS</p>
              {socialLinks.map((link) => (
                <button
                  key={link.name}
                  onClick={() => handleExternalLink(link.url)}
                  onMouseEnter={playHover}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-muted rounded-sm border-2 border-border
                    hover:border-neon-pink hover:shadow-neon-pink transition-all"
                >
                  <span className="text-xl">{link.emoji}</span>
                  <span className="font-retro text-lg text-foreground">{link.name}</span>
                </button>
              ))}
            </div>

            {/* Settings & Mini-Games Row */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => { playMenuOpen(); setMiniGamesOpen(true); setMenuOpen(false); }}
                className="flex flex-col items-center gap-2 px-3 py-3 bg-neon-pink/20 rounded-sm border-2 border-neon-pink
                  hover:bg-neon-pink/30 transition-all"
              >
                <Joystick size={24} className="text-neon-pink" />
                <span className="font-pixel text-[8px] text-neon-pink">MINI-JUEGOS</span>
              </button>
              <button
                onClick={() => { playMenuOpen(); setSettingsOpen(true); setMenuOpen(false); }}
                className="flex flex-col items-center gap-2 px-3 py-3 bg-star-gold/20 rounded-sm border-2 border-star-gold
                  hover:bg-star-gold/30 transition-all"
              >
                <Settings size={24} className="text-star-gold" />
                <span className="font-pixel text-[8px] text-star-gold">AJUSTES</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Navigation Bar (Instagram-style) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-t-2 border-neon-cyan">
        <div className="flex items-center justify-around py-2 px-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            
            return (
              <button
                key={item.path}
                onClick={() => handleNavigation(item.path)}
                onMouseEnter={playHover}
                className={cn(
                  "flex flex-col items-center gap-1 px-4 py-2 rounded-sm transition-all duration-200",
                  isActive 
                    ? "bg-neon-pink/20 text-neon-pink" 
                    : "text-muted-foreground hover:text-primary"
                )}
              >
                <Icon 
                  size={24} 
                  className={cn(
                    "transition-transform",
                    isActive && "animate-wiggle"
                  )} 
                />
                <span className={cn(
                  "font-pixel text-[8px]",
                  isActive && "text-neon-pink"
                )}>
                  {item.label}
                </span>
                {isActive && (
                  <span className="absolute -bottom-1 w-1 h-1 rounded-full bg-neon-pink animate-sparkle" />
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Spacers for fixed elements */}
      <div className="md:hidden h-16" /> {/* Top spacer */}

      <SettingsMenu isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <MiniGamesHub isOpen={miniGamesOpen} onClose={() => setMiniGamesOpen(false)} />
      
      <ExternalLinkDialog
        isOpen={externalLink.isOpen}
        url={externalLink.url}
        onConfirm={() => {
          window.open(externalLink.url, '_blank');
          setExternalLink({ isOpen: false, url: '' });
        }}
        onCancel={() => setExternalLink({ isOpen: false, url: '' })}
      />
    </>
  );
};
