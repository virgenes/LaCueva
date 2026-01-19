import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { GameCard } from '@/components/GameCard';
import { RetroButton } from '@/components/RetroButton';
import { StarBackground } from '@/components/StarBackground';
import { ExternalLinkDialog } from '@/components/ExternalLinkDialog';
import { SearchBar } from '@/components/SearchBar';
import { MobileLayout } from '@/components/MobileLayout';
import { PageTransition } from '@/components/PageTransition';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { useSettings } from '@/contexts/SettingsContext';
import { useFavorites } from '@/contexts/FavoritesContext';
import { games, AVAILABLE_GENRES, AVAILABLE_PLATFORMS, Game } from '@/data/gamesData';
import { X, Download, Play, Info, ArrowLeft, Filter, Monitor, Smartphone, Gamepad2, ChevronLeft, ChevronRight, Heart } from 'lucide-react';

const GAMES_PER_PAGE = 12;

const GamesPage = () => {
  const navigate = useNavigate();
  const { playClick, playHover, playMenuOpen } = useSoundEffects();
  const { t } = useSettings();
  const { isGameFavorite, toggleFavoriteGame, getFavoriteGamesCount } = useFavorites();
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [selectedGenre, setSelectedGenre] = useState<string>('all');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [externalLink, setExternalLink] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredGames = useMemo(() => {
    return games.filter(game => {
      const matchesGenre = selectedGenre === 'all' || game.genres.includes(selectedGenre);
      const matchesPlatform = selectedPlatform === 'all' || game.platforms.includes(selectedPlatform);
      const matchesSearch = searchQuery === '' || 
        game.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        game.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        game.genres.some(g => g.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesFavorite = !showFavoritesOnly || isGameFavorite(game.id);
      return matchesGenre && matchesPlatform && matchesSearch && matchesFavorite;
    });
  }, [selectedGenre, selectedPlatform, searchQuery, showFavoritesOnly, isGameFavorite]);

  const totalPages = Math.ceil(filteredGames.length / GAMES_PER_PAGE);
  const paginatedGames = filteredGames.slice((currentPage - 1) * GAMES_PER_PAGE, currentPage * GAMES_PER_PAGE);

  const goToPage = (page: number) => {
    playClick();
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openGameModal = (game: Game) => { playMenuOpen(); setSelectedGame(game); };
  const closeModal = () => { playClick(); setSelectedGame(null); };
  const handleExternalLink = (url: string) => { playClick(); setExternalLink(url); };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'PC': return <Monitor size={12} />;
      case 'ANDROID': return <Smartphone size={12} />;
      default: return <Gamepad2 size={12} />;
    }
  };

  return (
    <PageTransition>
    <div className="min-h-screen relative">
      <StarBackground />
      
      {/* Mobile Layout */}
      <MobileLayout>
        <div className="px-4 py-4 pb-24">
          <GameCard hoverable={false}>
            <h1 className="font-pixel text-base text-primary mb-4 text-center neon-text">
              🎮 {t('section.games')} 🎮
            </h1>
            
            <SearchBar 
              placeholder="🔍 Buscar juegos..."
              value={searchQuery}
              onChange={(value) => { setSearchQuery(value); setCurrentPage(1); }}
              className="mb-3"
            />

            {/* Mobile Filters */}
            <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
              <select 
                value={selectedGenre}
                onChange={(e) => { playClick(); setSelectedGenre(e.target.value); setCurrentPage(1); }}
                className="flex-1 bg-night-deep text-foreground font-retro text-sm px-3 py-2 rounded-sm border-2 border-neon-cyan focus:outline-none"
              >
                <option value="all">{t('games.genre')}: {t('games.all')}</option>
                {AVAILABLE_GENRES.map(genre => <option key={genre} value={genre}>{genre}</option>)}
              </select>
              
              <select 
                value={selectedPlatform}
                onChange={(e) => { playClick(); setSelectedPlatform(e.target.value); setCurrentPage(1); }}
                className="flex-1 bg-night-deep text-foreground font-retro text-sm px-3 py-2 rounded-sm border-2 border-neon-pink focus:outline-none"
              >
                <option value="all">{t('games.platform')}: {t('games.all')}</option>
                {AVAILABLE_PLATFORMS.map(platform => <option key={platform} value={platform}>{platform}</option>)}
              </select>
            </div>

            {/* Favorites filter */}
            <div className="flex items-center justify-between mb-3">
              <button
                onClick={() => { playClick(); setShowFavoritesOnly(!showFavoritesOnly); setCurrentPage(1); }}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-sm border-2 font-retro text-sm transition-all ${
                  showFavoritesOnly 
                    ? 'bg-neon-pink/20 border-neon-pink text-neon-pink' 
                    : 'border-border text-muted-foreground'
                }`}
              >
                <Heart size={14} className={showFavoritesOnly ? 'fill-neon-pink' : ''} />
                {getFavoriteGamesCount()}
              </button>
              <span className="font-retro text-sm text-star-gold">
                ⭐ {filteredGames.length} {t('games.found')}
              </span>
            </div>

            {/* Games Grid */}
            <div className="grid grid-cols-2 gap-3">
              {paginatedGames.map((game) => (
                <div
                  key={game.id}
                  className="group cursor-pointer bg-muted/30 rounded-sm border-2 border-border 
                    hover:border-neon-cyan active:scale-95 transition-all duration-200
                    hover:shadow-[0_0_15px_rgba(0,255,255,0.3)] relative"
                >
                  {/* Favorite button */}
                  <button
                    onClick={(e) => { e.stopPropagation(); playClick(); toggleFavoriteGame(game.id); }}
                    className="absolute top-1 left-1 z-10 p-1 bg-night-deep/80 rounded-sm border border-neon-pink/50"
                  >
                    <Heart size={12} className={`transition-all ${isGameFavorite(game.id) ? 'fill-neon-pink text-neon-pink' : 'text-muted-foreground'}`} />
                  </button>
                  
                  <div onClick={() => openGameModal(game)}>
                    <div className="relative h-24 bg-night-deep/50 overflow-hidden rounded-t-sm">
                      {game.cover && !game.cover.includes('placeholder') ? (
                        <img 
                          src={game.cover} 
                          alt={game.title} 
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" 
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-neon-cyan/20 to-neon-pink/20">
                          <span className="text-3xl">🎮</span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-night-deep via-transparent to-transparent" />
                      
                      {/* Platform badges */}
                      <div className="absolute top-1 right-1 flex gap-0.5">
                        {game.platforms.slice(0, 2).map((platform, i) => (
                          <span key={i} className="bg-night-deep/90 p-0.5 rounded-sm text-neon-cyan border border-neon-cyan/30 text-[10px]">
                            {getPlatformIcon(platform)}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="p-2">
                      <h3 className="font-pixel text-[7px] text-accent line-clamp-2 group-hover:text-primary transition-colors">
                        {game.title}
                      </h3>
                      <span className="font-retro text-[10px] text-neon-cyan">{game.genres[0]}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filteredGames.length === 0 && (
              <div className="text-center py-8">
                <span className="text-5xl block animate-bounce">🎮</span>
                <p className="font-pixel text-xs text-muted-foreground mt-2">No hay juegos</p>
              </div>
            )}

            {/* Mobile Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6 pt-4 border-t border-border">
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`p-2 rounded-sm border-2 transition-all ${
                    currentPage === 1 
                      ? 'border-border text-muted-foreground opacity-50' 
                      : 'border-neon-cyan text-neon-cyan active:bg-neon-cyan active:text-night-deep'
                  }`}
                >
                  <ChevronLeft size={18} />
                </button>

                <div className="flex gap-1 overflow-x-auto max-w-[200px] px-2">
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(page => page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1)
                    .map((page, idx, arr) => (
                      <React.Fragment key={page}>
                        {idx > 0 && arr[idx - 1] !== page - 1 && (
                          <span className="text-muted-foreground px-1">...</span>
                        )}
                        <button
                          onClick={() => goToPage(page)}
                          className={`w-8 h-8 rounded-sm border-2 font-pixel text-[10px] transition-all ${
                            page === currentPage
                              ? 'bg-neon-pink text-night-deep border-neon-pink shadow-neon-pink'
                              : 'border-border text-foreground'
                          }`}
                        >
                          {page}
                        </button>
                      </React.Fragment>
                    ))}
                </div>

                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`p-2 rounded-sm border-2 transition-all ${
                    currentPage === totalPages 
                      ? 'border-border text-muted-foreground opacity-50' 
                      : 'border-neon-cyan text-neon-cyan active:bg-neon-cyan active:text-night-deep'
                  }`}
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            )}

            {totalPages > 1 && (
              <p className="text-center font-retro text-sm text-muted-foreground mt-2">
                {t('games.page')} {currentPage} {t('games.of')} {totalPages}
              </p>
            )}
          </GameCard>
        </div>
      </MobileLayout>

      {/* Desktop Layout */}
      <div className="hidden md:block relative z-10 max-w-6xl mx-auto px-4 py-6">
        <RetroButton variant="cyan" onClick={() => navigate('/')} className="mb-4">
          <ArrowLeft size={14} className="mr-2" />{t('nav.back')}
        </RetroButton>

        <GameCard hoverable={false}>
          <h1 className="font-pixel text-lg md:text-xl text-primary mb-6 text-center neon-text">
            🎮 {t('section.games')} 🎮
          </h1>

          {/* Buscador y Filtros */}
          <div className="space-y-3 mb-6">
            <SearchBar 
              placeholder="🔍 Buscar juegos por nombre, género..."
              value={searchQuery}
              onChange={(value) => { setSearchQuery(value); setCurrentPage(1); }}
            />

            <div className="flex flex-wrap gap-3 p-4 bg-gradient-to-r from-muted/40 to-muted/20 rounded-sm border-2 border-neon-cyan/30">
              <div className="flex items-center gap-2">
                <Filter size={16} className="text-neon-cyan" />
                <span className="font-pixel text-[7px] text-accent">{t('games.genre')}:</span>
                <select 
                  value={selectedGenre}
                  onChange={(e) => { playClick(); setSelectedGenre(e.target.value); setCurrentPage(1); }}
                  className="bg-night-deep text-foreground font-retro text-sm px-2 py-1 rounded-sm border-2 border-neon-cyan focus:outline-none focus:border-neon-pink cursor-pointer"
                >
                  <option value="all">{t('games.all')}</option>
                  {AVAILABLE_GENRES.map(genre => <option key={genre} value={genre}>{genre}</option>)}
                </select>
              </div>
              
              <div className="flex items-center gap-2">
                <Gamepad2 size={16} className="text-neon-pink" />
                <span className="font-pixel text-[7px] text-accent">{t('games.platform')}:</span>
                <select 
                  value={selectedPlatform}
                  onChange={(e) => { playClick(); setSelectedPlatform(e.target.value); setCurrentPage(1); }}
                  className="bg-night-deep text-foreground font-retro text-sm px-2 py-1 rounded-sm border-2 border-neon-pink focus:outline-none focus:border-neon-cyan cursor-pointer"
                >
                  <option value="all">{t('games.all')}</option>
                  {AVAILABLE_PLATFORMS.map(platform => <option key={platform} value={platform}>{platform}</option>)}
                </select>
              </div>

              <div className="font-retro text-sm text-star-gold ml-auto flex items-center gap-2">
                <span className="animate-pulse">⭐</span>
                {filteredGames.length} {t('games.found')}
              </div>
            </div>
          </div>

          {/* Grid de juegos */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {paginatedGames.map((game) => (
              <div
                key={game.id}
                onClick={() => openGameModal(game)}
                onMouseEnter={playHover}
                className="group cursor-pointer bg-gradient-to-br from-muted/40 to-night-deep/60 rounded-sm border-2 border-border 
                  hover:border-neon-cyan hover:shadow-[0_0_20px_rgba(0,255,255,0.3)] transition-all duration-300 transform hover:scale-[1.02]"
              >
                <div className="relative h-28 sm:h-32 lg:h-36 bg-night-deep/50 overflow-hidden rounded-t-sm">
                  {game.cover && !game.cover.includes('placeholder') ? (
                    <img src={game.cover} alt={game.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-neon-cyan/20 to-neon-pink/20">
                      <span className="text-4xl animate-float">🎮</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-night-deep via-transparent to-transparent" />
                  
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                    <div className="w-10 h-10 bg-neon-pink rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(255,0,128,0.6)] animate-pulse">
                      <Play size={20} className="text-night-deep ml-0.5" />
                    </div>
                  </div>

                  <div className="absolute top-1 right-1 flex gap-0.5">
                    {game.platforms.slice(0, 2).map((platform, i) => (
                      <span key={i} className="bg-night-deep/90 p-1 rounded-sm text-neon-cyan border border-neon-cyan/30">
                        {getPlatformIcon(platform)}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="p-2 md:p-3">
                  <h3 className="font-pixel text-[6px] md:text-[7px] text-accent group-hover:text-primary transition-colors line-clamp-2 leading-relaxed">
                    {game.title}
                  </h3>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {game.genres.slice(0, 1).map((genre, i) => (
                      <span key={i} className="font-retro text-[10px] px-1.5 py-0.5 bg-neon-cyan/20 rounded-sm text-neon-cyan border border-neon-cyan/40">
                        {genre}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredGames.length === 0 && (
            <div className="text-center py-12">
              <span className="text-6xl mb-4 block animate-bounce">🎮</span>
              <p className="font-pixel text-sm text-muted-foreground">No se encontraron juegos</p>
            </div>
          )}

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8 pt-6 border-t-2 border-dashed border-border">
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                onMouseEnter={playHover}
                className={`p-2 rounded-sm border-2 transition-all ${
                  currentPage === 1 
                    ? 'border-border text-muted-foreground opacity-50 cursor-not-allowed' 
                    : 'border-neon-cyan text-neon-cyan hover:bg-neon-cyan hover:text-night-deep'
                }`}
              >
                <ChevronLeft size={20} />
              </button>

              <div className="flex gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => goToPage(page)}
                    onMouseEnter={playHover}
                    className={`w-8 h-8 rounded-sm border-2 font-pixel text-[10px] transition-all ${
                      page === currentPage
                        ? 'bg-neon-pink text-night-deep border-neon-pink shadow-[0_0_15px_rgba(255,0,128,0.5)]'
                        : 'border-border text-foreground hover:border-neon-cyan hover:text-neon-cyan'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>

              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                onMouseEnter={playHover}
                className={`p-2 rounded-sm border-2 transition-all ${
                  currentPage === totalPages 
                    ? 'border-border text-muted-foreground opacity-50 cursor-not-allowed' 
                    : 'border-neon-cyan text-neon-cyan hover:bg-neon-cyan hover:text-night-deep'
                }`}
              >
                <ChevronRight size={20} />
              </button>

              <span className="font-retro text-sm text-muted-foreground ml-4">
                {t('games.page')} {currentPage} {t('games.of')} {totalPages}
              </span>
            </div>
          )}
        </GameCard>
      </div>

      {/* Modal de detalle */}
      {selectedGame && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-night-deep/95 backdrop-blur-sm" onClick={closeModal}>
          <div className="w-full max-w-2xl max-h-[85vh] overflow-y-auto game-card relative animate-bounce-in" onClick={(e) => e.stopPropagation()}>
            <button onClick={closeModal} onMouseEnter={playHover}
              className="absolute top-2 right-2 w-8 h-8 bg-night-deep rounded-sm border-2 border-neon-pink flex items-center justify-center hover:bg-neon-pink hover:text-night-deep transition-all z-10">
              <X size={16} />
            </button>

            <div className="relative h-40 md:h-52 bg-night-deep/50 overflow-hidden rounded-t-sm -m-4 mb-4">
              {selectedGame.cover && !selectedGame.cover.includes('placeholder') ? (
                <img src={selectedGame.cover} alt={selectedGame.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-neon-cyan/30 to-neon-pink/30">
                  <span className="text-7xl animate-float">🎮</span>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-night-deep via-night-deep/50 to-transparent" />
              <div className="absolute bottom-3 left-4 right-4">
                <h2 className="font-pixel text-sm md:text-base text-primary neon-text">{selectedGame.title}</h2>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex flex-wrap gap-1.5">
                {selectedGame.genres.map((genre, i) => (
                  <span key={i} className="font-pixel text-[7px] px-2 py-1 bg-neon-cyan/20 rounded-sm text-neon-cyan border border-neon-cyan">{genre}</span>
                ))}
                {selectedGame.platforms.map((platform, i) => (
                  <span key={`p-${i}`} className="font-pixel text-[7px] px-2 py-1 bg-neon-pink/20 rounded-sm text-neon-pink border border-neon-pink flex items-center gap-1">
                    {getPlatformIcon(platform)}{platform}
                  </span>
                ))}
              </div>

              {selectedGame.description && (
                <div className="bg-gradient-to-r from-muted/40 to-muted/20 rounded-sm p-3 border border-star-gold/30">
                  <h3 className="font-pixel text-[8px] text-star-gold mb-2 flex items-center gap-2"><Info size={12} />{t('games.description')}</h3>
                  <p className="font-cartoon text-sm text-foreground">{selectedGame.description}</p>
                </div>
              )}

              <div className="bg-gradient-to-r from-muted/40 to-muted/20 rounded-sm p-3 border border-neon-cyan/30">
                <h3 className="font-pixel text-[8px] text-neon-cyan mb-3 flex items-center gap-2"><Download size={12} />{t('games.downloads')}</h3>
                <div className="space-y-3">
                  {Object.entries(selectedGame.downloads).map(([platform, links]) => (
                    <div key={platform} className="border-l-2 border-neon-pink pl-3">
                      <h4 className="font-pixel text-[7px] text-neon-pink mb-2 flex items-center gap-1">{getPlatformIcon(platform)}{platform}</h4>
                      <div className="flex flex-wrap gap-1.5">
                        {(links as any[]).map((link, i) => (
                          <button key={i} onClick={() => handleExternalLink(link.url)} onMouseEnter={playHover}
                            className="font-retro text-xs px-2 py-1 bg-night-deep rounded-sm border border-star-gold text-star-gold hover:bg-star-gold hover:text-night-deep transition-all">
                            {link.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <ExternalLinkDialog url={externalLink || ''} isOpen={!!externalLink} 
        onConfirm={() => { window.open(externalLink || '', '_blank'); setExternalLink(null); }}
        onCancel={() => setExternalLink(null)} />
    </div>
    </PageTransition>
  );
};

export default GamesPage;
