import { useState, useEffect } from 'react';
import { useSettings, BackgroundMusicType } from '@/contexts/SettingsContext';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { Music, X, Volume2, Sparkles } from 'lucide-react';

const musicOptions: { id: BackgroundMusicType; name: string; icon: string }[] = [
  { id: 'lofi', name: 'Lo-Fi Relajante', icon: '🎧' },
  { id: 'vib-ribbon', name: 'Vib-Ribbon', icon: '🎮' },
  { id: 'zelda', name: 'Zelda Theme', icon: '🗡️' },
];

export const MusicNotification = () => {
  const { playClick, playHover, playSuccess } = useSoundEffects();
  const { backgroundMusic, setBackgroundMusic, toggleBgMusic, isBgMusicPlaying } = useSettings();
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    // Check if user has already dismissed or enabled music
    const dismissed = sessionStorage.getItem('music-notification-dismissed');
    if (!dismissed && backgroundMusic === 'none') {
      // Show after a small delay for better UX
      const timer = setTimeout(() => setIsVisible(true), 2000);
      return () => clearTimeout(timer);
    }
  }, [backgroundMusic]);

  const handleClose = () => {
    playClick();
    setIsClosing(true);
    setTimeout(() => {
      setIsVisible(false);
      sessionStorage.setItem('music-notification-dismissed', 'true');
    }, 300);
  };

  const handleSelectMusic = (musicId: BackgroundMusicType) => {
    playSuccess();
    setBackgroundMusic(musicId);
    // Small delay to let the music type be set, then toggle it on
    setTimeout(() => {
      toggleBgMusic();
    }, 100);
    setIsClosing(true);
    setTimeout(() => {
      setIsVisible(false);
      sessionStorage.setItem('music-notification-dismissed', 'true');
    }, 300);
  };

  if (!isVisible) return null;

  return (
    <div 
      className={`fixed bottom-4 left-4 z-[140] max-w-sm transition-all duration-300 ${
        isClosing ? 'opacity-0 translate-y-4 scale-95' : 'opacity-100 translate-y-0 scale-100'
      }`}
    >
      <div className="relative bg-night-deep/95 backdrop-blur-md border-2 border-star-gold rounded-lg shadow-[0_0_30px_rgba(255,215,0,0.3)] overflow-hidden">
        {/* Animated background effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-neon-pink/10 via-transparent to-neon-cyan/10 animate-pulse" />
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-neon-pink via-star-gold to-neon-cyan" />
        
        {/* Close button */}
        <button
          onClick={handleClose}
          onMouseEnter={playHover}
          className="absolute top-2 right-2 p-1.5 rounded-full bg-muted/50 border border-border 
            hover:border-neon-pink hover:bg-neon-pink/20 transition-all z-10"
        >
          <X size={12} className="text-muted-foreground hover:text-neon-pink" />
        </button>

        <div className="relative p-4">
          {/* Header with icon */}
          <div className="flex items-start gap-3 mb-3">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-star-gold/30 to-neon-pink/30 
              border-2 border-star-gold flex items-center justify-center flex-shrink-0 animate-pulse">
              <Music size={24} className="text-star-gold" />
            </div>
            <div className="flex-1 pr-6">
              <div className="flex items-center gap-1.5 mb-1">
                <Sparkles size={12} className="text-star-gold animate-pulse" />
                <h3 className="font-pixel text-[10px] text-star-gold">
                  ¡MÚSICA DISPONIBLE!
                </h3>
                <Sparkles size={12} className="text-star-gold animate-pulse" />
              </div>
              <p className="font-retro text-sm text-foreground leading-tight">
                Esta página tiene música de fondo para una mejor experiencia
              </p>
            </div>
          </div>

          {/* Music options */}
          <div className="space-y-2 mb-3">
            <p className="font-retro text-xs text-muted-foreground">
              ¿Quieres escuchar? Elige un tema:
            </p>
            <div className="grid gap-2">
              {musicOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => handleSelectMusic(option.id)}
                  onMouseEnter={playHover}
                  className="flex items-center gap-2 p-2 rounded-lg border-2 border-border bg-muted/30
                    hover:border-star-gold hover:bg-star-gold/10 hover:shadow-[0_0_15px_rgba(255,215,0,0.2)]
                    transition-all group"
                >
                  <span className="text-lg group-hover:scale-110 transition-transform">
                    {option.icon}
                  </span>
                  <span className="font-retro text-sm text-foreground group-hover:text-star-gold transition-colors">
                    {option.name}
                  </span>
                  <Volume2 size={14} className="ml-auto text-muted-foreground group-hover:text-star-gold transition-colors" />
                </button>
              ))}
            </div>
          </div>

          {/* Skip button */}
          <button
            onClick={handleClose}
            onMouseEnter={playHover}
            className="w-full py-1.5 font-retro text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            No gracias, quizás después
          </button>

          {/* Decorative corners */}
          <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-star-gold/50" />
          <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-star-gold/50" />
        </div>

        {/* Animated music bars at the bottom */}
        <div className="flex justify-center gap-1 pb-2">
          {[3, 5, 4, 6, 3, 5, 4].map((h, i) => (
            <div
              key={i}
              className="w-1 bg-gradient-to-t from-neon-pink to-star-gold rounded-full"
              style={{
                height: `${h * 2}px`,
                animation: `pulse 0.5s ease-in-out ${i * 0.1}s infinite alternate`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};