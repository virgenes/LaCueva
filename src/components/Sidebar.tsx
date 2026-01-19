import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { useSettings } from '@/contexts/SettingsContext';
import { GameCard } from './GameCard';
import { PixelIcon } from './PixelIcon';
import { PixelEmoji } from './PixelEmoji';
import { SettingsMenu } from './SettingsMenu';
import { ExternalLinkDialog } from './ExternalLinkDialog';
import { MiniGamesHub } from './minigames/MiniGamesHub';
import { cn } from '@/lib/utils';
import logoFurros from '@/assets/logo-furros.jpg';
import { Settings, Gamepad2 } from 'lucide-react';

interface SidebarProps {
  className?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ className }) => {
  const navigate = useNavigate();
  const { playClick, playHover, playMenuOpen } = useSoundEffects();
  const { t } = useSettings();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [miniGamesOpen, setMiniGamesOpen] = useState(false);
  const [externalLink, setExternalLink] = useState<{ isOpen: boolean; url: string }>({ isOpen: false, url: '' });

  const menuItems = [
    { icon: 'games' as const, label: t('nav.games'), path: '/juegos' },
    { icon: 'music' as const, label: t('nav.music'), path: '/musica' },
    { icon: 'art' as const, label: t('nav.art'), path: '/arte' },
  ];

  const handleNavigation = (path: string) => {
    playMenuOpen();
    navigate(path);
  };

  const handleExternalLink = (url: string) => {
    playClick();
    setExternalLink({ isOpen: true, url });
  };

  return (
    <>
      <aside className={cn('w-56 flex-shrink-0', className)}>
        {/* Profile Section */}
        <GameCard className="mb-4 text-center" hoverable={false}>
          <div className="flex flex-col items-center">
            <div className="relative mb-3">
              <img 
                src={logoFurros} 
                alt="La Cueva de los Vírgenes"
                className="w-20 h-20 rounded-full border-4 border-neon-cyan shadow-neon animate-float"
              />
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-neon-pink rounded-full flex items-center justify-center animate-sparkle">
                <PixelEmoji type="star" size="sm" />
              </div>
            </div>
            <h3 className="font-pixel text-[10px] text-primary mb-1">{t('sidebar.theCave')}</h3>
            <p className="font-retro text-lg text-muted-foreground">{t('sidebar.ofVirgins')}</p>
          </div>
          
          <div className="mt-3 pt-3 border-t border-border">
            <div className="flex items-center justify-center gap-2">
              <span className="w-2 h-2 rounded-full bg-neon-cyan animate-sparkle" />
              <span className="font-retro text-sm text-primary">{t('sidebar.online')}</span>
            </div>
          </div>
        </GameCard>

        {/* Navigation */}
        <GameCard hoverable={false} className="mb-4">
          <h4 className="font-pixel text-[10px] text-primary mb-3 text-center tracking-widest flex items-center justify-center gap-2">
            <PixelEmoji type="star" size="sm" /> {t('nav.explore').toUpperCase()} <PixelEmoji type="star" size="sm" />
          </h4>
          <nav className="space-y-2">
            {menuItems.map((item) => (
              <button
                key={item.label}
                onClick={() => handleNavigation(item.path)}
                onMouseEnter={playHover}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-sm
                  transition-all duration-150 group border-2 border-transparent
                  hover:bg-muted/50 hover:border-neon-pink hover:-translate-x-1"
              >
                <span className="w-8 h-8 rounded-sm flex items-center justify-center bg-neon-cyan shadow-pixel group-hover:animate-wiggle">
                  <PixelIcon name={item.icon} size="sm" className="text-night-deep" />
                </span>
                <span className="font-pixel text-[9px] text-foreground group-hover:text-primary transition-colors">
                  {item.label}
                </span>
              </button>
            ))}
            
            {/* Settings Button - Ahora usa t() correctamente */}
            <button
              onClick={() => { playMenuOpen(); setSettingsOpen(true); }}
              onMouseEnter={playHover}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-sm
                transition-all duration-150 group border-2 border-transparent
                hover:bg-muted/50 hover:border-star-gold hover:-translate-x-1"
            >
              <span className="w-8 h-8 rounded-sm flex items-center justify-center bg-star-gold shadow-pixel group-hover:animate-wiggle">
                <Settings size={14} className="text-night-deep" />
              </span>
              <span className="font-pixel text-[9px] text-foreground group-hover:text-primary transition-colors">
                {t('nav.settings')}
              </span>
            </button>

            {/* Mini-Games Button - Adaptado para Inglés/Español */}
            <button
              onClick={() => { playMenuOpen(); setMiniGamesOpen(true); }}
              onMouseEnter={playHover}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-sm
                transition-all duration-150 group border-2 border-transparent
                hover:bg-muted/50 hover:border-neon-pink hover:-translate-x-1"
            >
              <span className="w-8 h-8 rounded-sm flex items-center justify-center bg-neon-pink shadow-pixel group-hover:animate-wiggle">
                <Gamepad2 size={14} className="text-night-deep" />
              </span>
              <span className="font-pixel text-[9px] text-foreground group-hover:text-primary transition-colors">
                {t('nav.minigames')}
              </span>
            </button>
          </nav>
        </GameCard>

        {/* Social Links */}
        <GameCard className="text-center">
          <p className="font-pixel text-[8px] text-muted-foreground mb-3">{t('footer.followUs')}</p>
          <div className="flex flex-col gap-2">
            <button 
              onClick={() => handleExternalLink('https://www.youtube.com/@CuevadelosVirgenes')}
              onMouseEnter={playHover}
              className="flex items-center gap-2 px-3 py-2 bg-muted rounded-sm border-2 border-border
                hover:border-red-500 hover:shadow-[0_0_10px_rgba(255,0,0,0.5)] hover:-translate-y-0.5
                transition-all duration-200"
            >
              <PixelEmoji type="tv" size="sm" />
              <span className="font-retro text-sm text-foreground">YouTube</span>
            </button>
            <button 
              onClick={() => handleExternalLink('https://discord.gg/PFvsgRvfYd')}
              onMouseEnter={playHover}
              className="flex items-center gap-2 px-3 py-2 bg-muted rounded-sm border-2 border-border
                hover:border-indigo-500 hover:shadow-[0_0_10px_rgba(99,102,241,0.5)] hover:-translate-y-0.5
                transition-all duration-200"
            >
              <PixelEmoji type="chat" size="sm" />
              <span className="font-retro text-sm text-foreground">Discord</span>
            </button>
            <button 
              onClick={() => handleExternalLink('https://www.tiktok.com/@cuevadelosvirgenes0')}
              onMouseEnter={playHover}
              className="flex items-center gap-2 px-3 py-2 bg-muted rounded-sm border-2 border-border
                hover:border-pink-500 hover:shadow-[0_0_10px_rgba(236,72,153,0.5)] hover:-translate-y-0.5
                transition-all duration-200"
            >
              <PixelEmoji type="music" size="sm" />
              <span className="font-retro text-sm text-foreground">TikTok</span>
            </button>
          </div>
        </GameCard>
      </aside>

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