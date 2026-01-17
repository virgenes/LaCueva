import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { GameCard } from '@/components/GameCard';
import { RetroButton } from '@/components/RetroButton';
import { StarBackground } from '@/components/StarBackground';
import { SearchBar } from '@/components/SearchBar';
import { MobileLayout } from '@/components/MobileLayout';
import { PageTransition } from '@/components/PageTransition';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { useYouTubeMusic } from '@/contexts/YouTubeMusicContext';
import { useSettings } from '@/contexts/SettingsContext';
import { Music, Play, Pause, ArrowLeft, Volume2 } from 'lucide-react';

const MusicPage = () => {
  const navigate = useNavigate();
  const { playClick, playHover } = useSoundEffects();
  const { t } = useSettings();
  const { 
    currentTrack, 
    isPlaying, 
    volume,
    playlist, 
    playTrack, 
    togglePlay,
    setVolume 
  } = useYouTubeMusic();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredPlaylist = useMemo(() => {
    if (!searchQuery) return playlist;
    return playlist.filter(track => 
      track.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      track.artist.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [playlist, searchQuery]);

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVolume(parseInt(e.target.value));
  };

  return (
    <PageTransition>
    <div className="min-h-screen relative">
      <StarBackground />
      
      {/* Mobile Layout */}
      <MobileLayout>
        <div className="px-4 py-4 space-y-4">
          <GameCard hoverable={false}>
            <h1 className="font-pixel text-base text-primary mb-4 text-center neon-text">
              🎵 {t('section.music')} 🎵
            </h1>

            {/* Mobile Now Playing */}
            {currentTrack && (
              <div className="p-3 bg-gradient-to-r from-neon-pink/20 to-neon-cyan/20 rounded-lg border-2 border-neon-pink mb-4">
                <div className="flex items-center gap-3">
                  <img 
                    src={currentTrack.thumbnail} 
                    alt={currentTrack.title}
                    className="w-14 h-14 rounded-lg object-cover border border-neon-cyan"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-pixel text-[9px] text-accent truncate">{currentTrack.title}</p>
                    <p className="font-retro text-sm text-muted-foreground truncate">{currentTrack.artist}</p>
                  </div>
                  <button
                    onClick={() => { playClick(); togglePlay(); }}
                    className="w-12 h-12 rounded-full bg-neon-pink flex items-center justify-center"
                  >
                    {isPlaying ? <Pause size={20} className="text-night-deep" /> : <Play size={20} className="text-night-deep ml-0.5" />}
                  </button>
                </div>
              </div>
            )}

            <SearchBar 
              placeholder="🔍 Buscar música..."
              value={searchQuery}
              onChange={setSearchQuery}
              className="mb-4"
            />

            {/* Mobile Track List */}
            <div className="space-y-2">
              {filteredPlaylist.map((track, index) => (
                <div
                  key={track.id}
                  onClick={() => { playClick(); playTrack(track); }}
                  className={`flex items-center gap-3 p-2 rounded-lg border-2 cursor-pointer transition-all
                    ${currentTrack?.id === track.id 
                      ? 'bg-neon-cyan/20 border-neon-cyan' 
                      : 'bg-muted/30 border-border'}`}
                >
                  <img src={track.thumbnail} alt={track.title} className="w-10 h-10 rounded object-cover" />
                  <div className="flex-1 min-w-0">
                    <p className="font-pixel text-[8px] text-accent truncate">{track.title}</p>
                    <p className="font-retro text-sm text-muted-foreground truncate">{track.artist}</p>
                  </div>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentTrack?.id === track.id ? 'bg-neon-cyan' : 'bg-muted'}`}>
                    {currentTrack?.id === track.id && isPlaying ? (
                      <Pause size={12} className="text-night-deep" />
                    ) : (
                      <Play size={12} className={currentTrack?.id === track.id ? 'text-night-deep ml-0.5' : 'text-foreground ml-0.5'} />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </GameCard>
        </div>
      </MobileLayout>

      {/* Desktop Layout */}
      <div className="hidden md:block relative z-10 max-w-4xl mx-auto px-4 py-6">
        <RetroButton 
          variant="pink"
          onClick={() => { playClick(); navigate('/'); }}
          className="mb-4"
        >
          <ArrowLeft size={14} className="mr-2" />
          {t('nav.back')}
        </RetroButton>

        <GameCard hoverable={false}>
          <h1 className="font-pixel text-xl text-primary mb-6 text-center neon-text">
            🎵 {t('section.music')} 🎵
          </h1>

          {/* Now Playing Section */}
          {currentTrack && (
            <div className="mb-6 p-4 bg-gradient-to-r from-neon-pink/20 to-neon-cyan/20 rounded-lg border-2 border-neon-pink relative overflow-hidden">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIyMCIgY3k9IjIwIiByPSIxIiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMSkiLz48L3N2Zz4=')] opacity-50" />
              
              <div className="relative flex items-center gap-4">
                <div className="w-20 h-20 rounded-lg overflow-hidden bg-night-deep flex items-center justify-center border-2 border-neon-cyan shadow-neon flex-shrink-0">
                  <img 
                    src={currentTrack.thumbnail} 
                    alt={currentTrack.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="font-retro text-xs text-neon-cyan mb-1">
                    {t('music.nowPlaying')}
                  </p>
                  <p className="font-pixel text-sm text-accent truncate">
                    {currentTrack.title}
                  </p>
                  <p className="font-retro text-base text-muted-foreground truncate">
                    {currentTrack.artist}
                  </p>
                </div>

                <button
                  onClick={() => { playClick(); togglePlay(); }}
                  onMouseEnter={playHover}
                  className="w-14 h-14 rounded-full bg-gradient-to-br from-neon-pink to-neon-cyan 
                    flex items-center justify-center shadow-neon hover:scale-110 transition-transform flex-shrink-0"
                >
                  {isPlaying ? (
                    <Pause size={24} className="text-night-deep" />
                  ) : (
                    <Play size={24} className="text-night-deep ml-1" />
                  )}
                </button>
              </div>

              {/* Volume Control */}
              <div className="relative mt-4 pt-4 border-t border-border/50 flex items-center gap-3">
                <Volume2 size={16} className="text-neon-cyan flex-shrink-0" />
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={volume}
                  onChange={handleVolumeChange}
                  className="flex-1 h-2 bg-muted rounded-full appearance-none cursor-pointer
                    [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 
                    [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full 
                    [&::-webkit-slider-thumb]:bg-neon-cyan [&::-webkit-slider-thumb]:shadow-neon
                    [&::-webkit-slider-thumb]:cursor-pointer"
                />
                <span className="font-retro text-sm text-muted-foreground w-10 text-right">
                  {volume}%
                </span>
              </div>
            </div>
          )}

          {/* Buscador */}
          <SearchBar 
            placeholder="🔍 Buscar canciones o artistas..."
            value={searchQuery}
            onChange={setSearchQuery}
            className="mb-4"
          />

          {/* Playlist Header */}
          <div className="flex items-center gap-2 mb-4 pb-2 border-b-2 border-dashed border-border">
            <Music size={18} className="text-star-gold" />
            <h2 className="font-pixel text-[10px] text-accent">
              {t('music.playlist')}
            </h2>
            <span className="ml-auto font-retro text-sm text-muted-foreground">
              {filteredPlaylist.length} tracks
            </span>
          </div>

          {/* Track List */}
          <div className="space-y-2">
            {filteredPlaylist.map((track, index) => (
              <div
                key={track.id}
                onClick={() => { playClick(); playTrack(track); }}
                onMouseEnter={playHover}
                className={`group flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all
                  ${currentTrack?.id === track.id 
                    ? 'bg-neon-cyan/20 border-neon-cyan shadow-neon' 
                    : 'bg-muted/30 border-border hover:border-neon-pink hover:bg-muted/50'}`}
              >
                {/* Track Number */}
                <div className="w-8 h-8 rounded bg-night-deep border border-border flex items-center justify-center flex-shrink-0">
                  {currentTrack?.id === track.id && isPlaying ? (
                    <div className="flex gap-0.5">
                      {[1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className="w-1 bg-neon-cyan animate-pulse"
                          style={{
                            height: `${6 + Math.random() * 6}px`,
                            animationDelay: `${i * 0.15}s`,
                          }}
                        />
                      ))}
                    </div>
                  ) : (
                    <span className="font-pixel text-[9px] text-muted-foreground">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                  )}
                </div>

                {/* Thumbnail */}
                <div className="w-12 h-12 rounded overflow-hidden bg-night-deep flex items-center justify-center border border-border flex-shrink-0">
                  <img 
                    src={track.thumbnail} 
                    alt={track.title}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-pixel text-[10px] text-accent truncate group-hover:text-primary transition-colors">
                    {track.title}
                  </p>
                  <p className="font-retro text-sm text-muted-foreground truncate">
                    {track.artist}
                  </p>
                </div>

                {/* Play Button */}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all flex-shrink-0
                  ${currentTrack?.id === track.id 
                    ? 'bg-neon-cyan shadow-neon' 
                    : 'bg-neon-cyan/20 group-hover:bg-neon-cyan group-hover:shadow-neon'}`}
                >
                  {currentTrack?.id === track.id && isPlaying ? (
                    <Pause size={16} className="text-night-deep" />
                  ) : (
                    <Play size={16} className={`ml-0.5 ${currentTrack?.id === track.id ? 'text-night-deep' : 'text-neon-cyan group-hover:text-night-deep'}`} />
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Info Footer */}
          <div className="mt-6 pt-4 border-t-2 border-dashed border-border text-center">
            <p className="font-retro text-sm text-muted-foreground">
              🎧 Powered by YouTube • {playlist.length} canciones disponibles
            </p>
            <p className="font-retro text-xs text-muted-foreground/60 mt-1">
              La música seguirá reproduciéndose mientras navegas por el sitio
            </p>
          </div>
        </GameCard>
      </div>
    </div>
    </PageTransition>
  );
};

export default MusicPage;