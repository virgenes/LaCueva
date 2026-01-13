import { useEffect } from 'react';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { useSettings, ThemeColor, BackgroundMusicType, Language } from '@/contexts/SettingsContext';
import { X, Settings, Palette, Globe, Music, Volume2, VolumeX, AlertCircle } from 'lucide-react';

interface SettingsMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

// Solo una declaración de themes
const themes: { id: ThemeColor; name: string; nameEn: string; colors: string }[] = [
  { id: 'default', name: 'Neón Oscuro', nameEn: 'Dark Neon', colors: 'from-neon-pink via-neon-cyan to-neon-purple' },
  { id: 'ocean', name: 'Océano Profundo', nameEn: 'Deep Ocean', colors: 'from-blue-500 via-cyan-500 to-teal-500' },
  { id: 'forest', name: 'Bosque Mágico', nameEn: 'Magic Forest', colors: 'from-green-500 via-emerald-500 to-lime-500' },
  { id: 'sunset', name: 'Atardecer', nameEn: 'Sunset', colors: 'from-orange-500 via-red-500 to-pink-500' },
  { id: 'galaxy', name: 'Galaxia', nameEn: 'Galaxy', colors: 'from-purple-500 via-indigo-500 to-blue-500' },
];

// Solo una declaración de bgMusicOptions
const bgMusicOptions: { id: BackgroundMusicType; nameEs: string; nameEn: string; icon: string }[] = [
  { id: 'none', nameEs: 'Sin música', nameEn: 'No music', icon: '🔇' },
  { id: 'lofi', nameEs: 'Lo-Fi Relajante', nameEn: 'Lo-Fi Relaxing', icon: '🎧' },
  { id: 'vib-ribbon', nameEs: 'Vib-Ribbon', nameEn: 'Vib-Ribbon', icon: '🎮' },
  { id: 'zelda', nameEs: 'Zelda Theme', nameEn: 'Zelda Theme', icon: '🗡️' },
];

export const SettingsMenu: React.FC<SettingsMenuProps> = ({ isOpen, onClose }) => {
  const { playClick, playHover, playMenuOpen } = useSoundEffects();
  const { 
    theme, setTheme, 
    backgroundMusic, setBackgroundMusic, 
    language, setLanguage,
    isBgMusicPlaying, toggleBgMusic,
    bgMusicVolume, setBgMusicVolume,
    t 
  } = useSettings();

  const isSpanish = language === 'es';

  useEffect(() => {
    if (isOpen) {
      playMenuOpen();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  const handleThemeChange = (newTheme: ThemeColor) => {
    playClick();
    setTheme(newTheme);
  };

  const handleMusicChange = (newMusic: BackgroundMusicType) => {
    playClick();
    setBackgroundMusic(newMusic);
  };

  const handleLanguageChange = (lang: Language) => {
    playClick();
    setLanguage(lang);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value) / 100;
    setBgMusicVolume(value);
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-night-deep/95 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-lg game-card relative animate-bounce-in overflow-hidden max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundImage: 'linear-gradient(135deg, hsl(var(--night-deep)) 0%, hsl(var(--muted)) 100%)',
          border: '4px solid hsl(var(--neon-cyan))',
          boxShadow: '0 0 30px hsl(var(--neon-cyan) / 0.3), inset 0 0 60px hsl(var(--neon-purple) / 0.1)'
        }}
      >
        {/* Cabecera del menú */}
        <div className="relative -m-4 mb-4 p-4 bg-gradient-to-r from-neon-pink/30 via-neon-cyan/30 to-neon-purple/30 border-b-4 border-neon-cyan">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Settings className="text-star-gold animate-spin-slow" size={24} />
              <h2 className="font-pixel text-lg text-star-gold">
                {t('settings.title')}
              </h2>
            </div>
            <button
              onClick={onClose}
              onMouseEnter={playHover}
              className="w-10 h-10 bg-night-deep rounded-sm border-2 border-neon-pink 
                flex items-center justify-center hover:shadow-neon-pink transition-all"
            >
              <X size={20} className="text-neon-pink" />
            </button>
          </div>
          
          {/* Esquinas decorativas */}
          <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-star-gold" />
          <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-star-gold" />
          <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-star-gold" />
          <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-star-gold" />
        </div>

        <div className="space-y-6">
          {/* Sección de idioma */}
          <div className="bg-muted/30 rounded-sm p-4 border-2 border-border hover:border-neon-cyan transition-colors">
            <div className="flex items-center gap-2 mb-3">
              <Globe size={18} className="text-neon-cyan" />
              <h3 className="font-pixel text-[10px] text-accent">
                {t('settings.language')}
              </h3>
            </div>
            <div className="flex gap-2">
              {(['es', 'en'] as Language[]).map((lang) => (
                <button
                  key={lang}
                  onClick={() => handleLanguageChange(lang)}
                  onMouseEnter={playHover}
                  className={`flex-1 px-4 py-2 rounded-sm border-2 font-pixel text-[9px] transition-all
                    ${language === lang 
                      ? 'bg-neon-cyan text-night-deep border-neon-cyan shadow-neon' 
                      : 'bg-muted/50 border-border hover:border-neon-pink text-foreground'}`}
                >
                  {lang === 'es' ? '🇪🇸 Español' : '🇬🇧 English'}
                </button>
              ))}
            </div>
          </div>

          {/* Sección de tema */}
          <div className="bg-muted/30 rounded-sm p-4 border-2 border-border hover:border-neon-pink transition-colors">
            <div className="flex items-center gap-2 mb-3">
              <Palette size={18} className="text-neon-pink" />
              <h3 className="font-pixel text-[10px] text-accent">
                {t('settings.theme')}
              </h3>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {themes.map((themeOption) => (
                <button
                  key={themeOption.id}
                  onClick={() => handleThemeChange(themeOption.id)}
                  onMouseEnter={playHover}
                  className={`p-3 rounded-sm border-2 transition-all flex items-center gap-2
                    ${theme === themeOption.id 
                      ? 'border-star-gold shadow-[0_0_10px_rgba(255,215,0,0.5)]' 
                      : 'border-border hover:border-neon-cyan'}`}
                >
                  <div className={`w-6 h-6 rounded-full bg-gradient-to-r ${themeOption.colors}`} />
                  <span className="font-retro text-sm text-foreground">
                    {isSpanish ? themeOption.name : themeOption.nameEn}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Sección de música de fondo */}
          <div className="bg-muted/30 rounded-sm p-4 border-2 border-border hover:border-star-gold transition-colors">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Music size={18} className="text-star-gold" />
                <h3 className="font-pixel text-[10px] text-accent">
                  {t('settings.bgMusic')}
                </h3>
              </div>
              
              {backgroundMusic !== 'none' && (
                <button
                  onClick={() => { playClick(); toggleBgMusic(); }}
                  onMouseEnter={playHover}
                  className={`p-2 rounded-sm border-2 transition-all ${
                    isBgMusicPlaying 
                      ? 'bg-star-gold/30 border-star-gold text-star-gold' 
                      : 'border-border text-muted-foreground hover:border-neon-pink'
                  }`}
                >
                  {isBgMusicPlaying ? <Volume2 size={16} /> : <VolumeX size={16} />}
                </button>
              )}
            </div>

            {/* Info de música apagada por defecto */}
            <div className="flex items-center gap-2 mb-3 p-2 bg-night-deep/50 rounded border border-star-gold/30">
              <AlertCircle size={14} className="text-star-gold flex-shrink-0" />
              <span className="font-retro text-xs text-muted-foreground">
                {t('settings.musicOff')}
              </span>
            </div>

            {/* Opciones de música */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              {bgMusicOptions.map((musicOption) => (
                <button
                  key={musicOption.id}
                  onClick={() => handleMusicChange(musicOption.id)}
                  onMouseEnter={playHover}
                  className={`p-2 rounded-sm border-2 transition-all flex items-center gap-2
                    ${backgroundMusic === musicOption.id 
                      ? 'bg-star-gold/20 border-star-gold shadow-[0_0_10px_rgba(255,215,0,0.3)]' 
                      : 'border-border hover:border-neon-pink'}`}
                >
                  <span className="text-lg">{musicOption.icon}</span>
                  <span className="font-retro text-sm text-foreground">
                    {isSpanish ? musicOption.nameEs : musicOption.nameEn}
                  </span>
                </button>
              ))}
            </div>

            {/* Slider de volumen */}
            {backgroundMusic !== 'none' && (
              <div className="pt-3 border-t border-border">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-retro text-sm text-muted-foreground">
                    {t('settings.volume')}
                  </span>
                  <span className="font-pixel text-[9px] text-star-gold">
                    {Math.round(bgMusicVolume * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="20"
                  value={Math.round(bgMusicVolume * 100)}
                  onChange={handleVolumeChange}
                  className="w-full h-2 bg-muted rounded-full appearance-none cursor-pointer
                    [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 
                    [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full 
                    [&::-webkit-slider-thumb]:bg-star-gold [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(255,215,0,0.5)]
                    [&::-webkit-slider-thumb]:cursor-pointer"
                />
                <div className="flex justify-between mt-1">
                  <span className="font-retro text-xs text-muted-foreground/50">0%</span>
                  <span className="font-retro text-xs text-muted-foreground/50">20% máx</span>
                </div>
              </div>
            )}
          </div>

          {/* Pie de página */}
          <div className="flex items-center justify-center gap-4 pt-4 border-t-2 border-dashed border-border">
            <div className="font-retro text-sm text-muted-foreground flex items-center gap-1">
              <span className="text-neon-cyan">♦</span>
              {t('settings.level')}
              <span className="text-neon-cyan">♦</span>
            </div>
          </div>
        </div>

        {/* Pie de página inferior */}
        <div className="absolute bottom-2 left-2 text-muted-foreground/30 font-pixel text-[8px]">
          {t('settings.exit')}
        </div>
      </div>
    </div>
  );
};