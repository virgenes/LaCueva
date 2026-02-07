import React, { useEffect, useState } from 'react';
import { X, Settings, Save, HelpCircle, Menu, Maximize } from 'lucide-react';
import { useGameEngine } from './hooks/useGameEngine';
import { GameCanvas } from './components/GameCanvas';
import { DialogueBox } from './components/DialogueBox';
import { TouchControls } from './components/TouchControls';
import { ModMenu } from './components/ModMenu';
import { MainMenu } from './components/MainMenu';
import { PrologueScene } from './components/PrologueScene';
import { GameMenu } from './components/GameMenu';
import { CombatSystem } from './components/CombatSystem';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { useSettings } from '@/contexts/SettingsContext';
import { useIsMobile } from '@/hooks/use-mobile';

interface RPGGameProps {
  onClose: () => void;
}

type GameMode = 'menu' | 'prologue' | 'playing' | 'combat';

export const RPGGame: React.FC<RPGGameProps> = ({ onClose }) => {
  const { playClick, playHover } = useSoundEffects();
  const { language } = useSettings();
  const isMobile = useIsMobile();
  const isSpanish = language === 'es';
  
  const [gameMode, setGameMode] = useState<GameMode>('menu');
  const [showGameMenu, setShowGameMenu] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hasSaveData, setHasSaveData] = useState(false);

  const {
    gameData,
    gameState,
    currentMap,
    activeDialogue,
    dialogueIndex,
    displayedText,
    isTyping,
    isPaused,
    showModMenu,
    setShowModMenu,
    movePlayer,
    interact,
    selectChoice,
    setIsPaused,
    exportGameData,
    importGameData,
    resetGame,
    saveGame,
    setGameData,
  } = useGameEngine();

  // Check for save data
  useEffect(() => {
    const saved = localStorage.getItem('rpg_game_state');
    setHasSaveData(!!saved);
  }, []);

  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Handle escape to close
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (gameMode === 'menu') return;
      
      if (e.key === 'Escape' && !activeDialogue && !showModMenu && !showGameMenu) {
        if (gameMode === 'playing') {
          setShowGameMenu(true);
        }
      }
      if (e.key === 'Tab') {
        e.preventDefault();
        setShowGameMenu(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [activeDialogue, showModMenu, showGameMenu, gameMode]);

  // Get party characters for menu/combat
  const partyCharacters = Object.values(gameData.characters).filter(c => 
    ['matias', 'angel', 'alejandro', 'miguel', 'elias', 'maximo'].includes(c.id)
  );

  if (!currentMap && gameMode === 'playing') {
    return (
      <div className="fixed inset-0 z-[300] flex items-center justify-center bg-night-deep">
        <p className="font-pixel text-neon-pink">Error: Map not found</p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-night-deep/98">
      <div 
        className="flex flex-col max-w-md w-full max-h-[95vh] mx-2"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Main Menu */}
        {gameMode === 'menu' && (
          <div className="relative border-2 border-pixel-border bg-night-deep overflow-hidden" style={{ height: '400px' }}>
            <MainMenu
              hasSaveData={hasSaveData}
              onStartStory={() => {
                setGameMode('prologue');
              }}
              onStartFree={() => {
                setGameMode('playing');
              }}
              onContinue={() => {
                setGameMode('playing');
              }}
              onSettings={() => setShowModMenu(true)}
            />
            <button
              onClick={() => { playClick(); onClose(); }}
              className="absolute top-2 left-2 p-1.5 rounded-sm border border-neon-pink/50 
                hover:bg-neon-pink/20 transition-colors z-50"
            >
              <X size={12} className="text-neon-pink" />
            </button>
          </div>
        )}

        {/* Prologue Scene */}
        {gameMode === 'prologue' && (
          <div className="relative border-2 border-pixel-border bg-night-deep overflow-hidden" style={{ height: '400px' }}>
            <PrologueScene
              onComplete={() => setGameMode('playing')}
              onSkip={() => setGameMode('playing')}
            />
          </div>
        )}

        {/* Main Gameplay */}
        {gameMode === 'playing' && (
          <>
            {/* Header */}
            <div className="flex items-center justify-between p-2 bg-card border-2 border-b-0 border-pixel-border rounded-t-sm">
              <h2 className="font-pixel text-[9px] sm:text-xs text-neon-cyan truncate">
                {isSpanish ? gameData.titleEs : gameData.title}
              </h2>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => { playClick(); saveGame(); }}
                  onMouseEnter={playHover}
                  className="p-1.5 rounded-sm border border-neon-cyan/50 hover:bg-neon-cyan/20 transition-colors"
                  title={isSpanish ? 'Guardar' : 'Save'}
                >
                  <Save size={12} className="text-neon-cyan" />
                </button>
                <button
                  onClick={() => { playClick(); setShowModMenu(true); }}
                  onMouseEnter={playHover}
                  className="p-1.5 rounded-sm border border-neon-purple/50 hover:bg-neon-purple/20 transition-colors"
                  title={isSpanish ? 'Mods' : 'Mods'}
                >
                  <Settings size={12} className="text-neon-purple" />
                </button>
                <button
                  onClick={toggleFullscreen}
                  className="p-1.5 rounded-sm border border-star-gold/50 hover:bg-star-gold/20 transition-colors"
                >
                  <Maximize size={12} className="text-star-gold" />
                </button>
                <button
                  onClick={() => { playClick(); onClose(); }}
                  onMouseEnter={playHover}
                  className="p-1.5 rounded-sm border border-neon-pink/50 hover:bg-neon-pink/20 transition-colors"
                >
                  <X size={12} className="text-neon-pink" />
                </button>
              </div>
            </div>

            {/* Game Screen */}
            <div className="relative border-2 border-pixel-border bg-night-deep overflow-hidden">
              <GameCanvas
                gameData={gameData}
                gameState={gameState}
                currentMap={currentMap!}
                pixelSize={isMobile ? 4 : 5}
              />

              {/* Dialogue overlay */}
              {activeDialogue && (
                <DialogueBox
                  dialogue={activeDialogue}
                  dialogueIndex={dialogueIndex}
                  displayedText={displayedText}
                  isTyping={isTyping}
                  gameData={gameData}
                  onAdvance={interact}
                  onSelectChoice={selectChoice}
                />
              )}

              {/* Touch controls for mobile */}
              {isMobile && (
                <TouchControls
                  onMove={movePlayer}
                  onInteract={interact}
                  onMenu={() => setShowGameMenu(true)}
                  onFullscreen={toggleFullscreen}
                  disabled={!!showModMenu || isPaused || showGameMenu}
                />
              )}

              {/* Game Menu overlay */}
              {showGameMenu && (
                <GameMenu
                  gameState={gameState}
                  gameData={gameData}
                  party={partyCharacters}
                  onClose={() => setShowGameMenu(false)}
                />
              )}

              {/* Pause overlay */}
              {isPaused && !showModMenu && !showGameMenu && (
                <div className="absolute inset-0 bg-night-deep/90 flex flex-col items-center justify-center z-40">
                  <p className="font-pixel text-lg text-neon-cyan mb-4">
                    {isSpanish ? 'PAUSA' : 'PAUSED'}
                  </p>
                  <button
                    onClick={() => setIsPaused(false)}
                    className="retro-btn text-[8px]"
                  >
                    {isSpanish ? 'CONTINUAR' : 'CONTINUE'}
                  </button>
                </div>
              )}
            </div>

            {/* Footer / Controls help */}
            <div className="p-2 bg-card border-2 border-t-0 border-pixel-border rounded-b-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <HelpCircle size={12} className="text-muted-foreground" />
                  <span className="font-retro text-[8px] text-muted-foreground hidden sm:inline">
                    {isSpanish 
                      ? 'WASD: Mover | ESPACIO: Interactuar | TAB: Menú | M: Mods'
                      : 'WASD: Move | SPACE: Interact | TAB: Menu | M: Mods'}
                  </span>
                  <span className="font-retro text-[8px] text-muted-foreground sm:hidden">
                    {isSpanish ? 'Controles táctiles activos' : 'Touch controls active'}
                  </span>
                </div>
                <span className="font-pixel text-[7px] text-star-gold">
                  {isSpanish ? currentMap?.nameEs : currentMap?.name}
                </span>
              </div>
            </div>
          </>
        )}

        {/* Combat Mode */}
        {gameMode === 'combat' && (
          <div className="relative border-2 border-pixel-border bg-night-deep overflow-hidden" style={{ height: '400px' }}>
            <CombatSystem
              playerParty={partyCharacters}
              enemies={['shadow_slime', 'shadow_slime']}
              onVictory={(exp, gold) => {
                console.log('Victory!', exp, gold);
                setGameMode('playing');
              }}
              onDefeat={() => {
                console.log('Defeat...');
                setGameMode('menu');
              }}
              onFlee={() => {
                setGameMode('playing');
              }}
            />
          </div>
        )}
      </div>

      {/* Mod Menu Modal */}
      {showModMenu && (
        <ModMenu
          gameData={gameData}
          onClose={() => setShowModMenu(false)}
          onExport={exportGameData}
          onImport={importGameData}
          onReset={resetGame}
          onUpdateGameData={setGameData}
        />
      )}
    </div>
  );
};