import React, { useEffect } from 'react';
import { X, Settings, Save, HelpCircle } from 'lucide-react';
import { useGameEngine } from './hooks/useGameEngine';
import { GameCanvas } from './components/GameCanvas';
import { DialogueBox } from './components/DialogueBox';
import { TouchControls } from './components/TouchControls';
import { ModMenu } from './components/ModMenu';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { useSettings } from '@/contexts/SettingsContext';
import { useIsMobile } from '@/hooks/use-mobile';

interface RPGGameProps {
  onClose: () => void;
}

export const RPGGame: React.FC<RPGGameProps> = ({ onClose }) => {
  const { playClick, playHover } = useSoundEffects();
  const { language } = useSettings();
  const isMobile = useIsMobile();
  const isSpanish = language === 'es';
  
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

  // Handle escape to close
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !activeDialogue && !showModMenu) {
        playClick();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [activeDialogue, showModMenu, onClose, playClick]);

  if (!currentMap) {
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
            currentMap={currentMap}
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
              disabled={!!showModMenu || isPaused}
            />
          )}

          {/* Pause overlay */}
          {isPaused && !showModMenu && (
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
              <span className="font-retro text-[9px] text-muted-foreground hidden sm:inline">
                {isSpanish 
                  ? 'WASD/Flechas: Mover | ESPACIO: Interactuar | M: Mods | ESC: Salir'
                  : 'WASD/Arrows: Move | SPACE: Interact | M: Mods | ESC: Exit'}
              </span>
              <span className="font-retro text-[9px] text-muted-foreground sm:hidden">
                {isSpanish ? 'Usa los controles táctiles' : 'Use touch controls'}
              </span>
            </div>
            <span className="font-pixel text-[7px] text-star-gold">
              {isSpanish ? currentMap.nameEs : currentMap.name}
            </span>
          </div>
        </div>
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
