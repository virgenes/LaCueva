import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { X, Settings, Save, HelpCircle, Maximize, Swords } from 'lucide-react';
import { useGameEngine } from './hooks/useGameEngine';
import { GameCanvas, MapMonster } from './components/GameCanvas';
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
import { teleporterConnections } from './data/defaultMap';
import { generateMapMonsters, monsterDefinitions, overworldMonsterSprites } from './data/mapMonsters';

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
  const [mapMonsters, setMapMonsters] = useState<MapMonster[]>([]);
  const [combatEnemies, setCombatEnemies] = useState<string[]>([]);

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

  // Generate monsters when map changes
  useEffect(() => {
    if (!currentMap || gameMode !== 'playing') return;
    
    const occupiedTiles = new Set<string>();
    
    // Mark player position as occupied
    occupiedTiles.add(`${gameState.playerPosition.x},${gameState.playerPosition.y}`);
    
    // Mark NPCs as occupied
    currentMap.npcs.forEach(npcId => {
      const npc = gameData.characters[npcId];
      if (npc) {
        occupiedTiles.add(`${npc.position.x},${npc.position.y}`);
      }
    });
    
    // Generate monsters based on map's possible encounters
    const possibleMonsters = currentMap.possibleEncounters || [];
    if (possibleMonsters.length > 0) {
      // More monsters in larger maps
      const monsterCount = Math.floor(Math.min(15, (currentMap.width * currentMap.height) / 100));
      
      const monsters = generateMapMonsters(
        currentMap.id,
        currentMap.width,
        currentMap.height,
        possibleMonsters,
        monsterCount,
        occupiedTiles
      );
      
      setMapMonsters(monsters);
    } else {
      setMapMonsters([]);
    }
  }, [currentMap?.id, gameMode]);

  // Handle monster encounter
  const handleMonsterEncounter = useCallback((monster: MapMonster) => {
    const definition = monsterDefinitions[monster.monsterId];
    if (!definition) return;
    
    if (definition.hostile) {
      // Start combat with this monster
      playClick();
      setCombatEnemies([monster.monsterId]);
      
      // Remove the encountered monster from the map
      setMapMonsters(prev => prev.filter(m => m.id !== monster.id));
      
      setGameMode('combat');
    } else {
      // Friendly animal - could show a cute interaction
      console.log('Friendly animal:', definition.name);
    }
  }, [playClick]);

  // Check for random encounters while walking
  useEffect(() => {
    if (gameMode !== 'playing' || !currentMap) return;
    
    const encounterRate = currentMap.encounterRate || 0;
    const possibleEncounters = currentMap.possibleEncounters || [];
    
    if (encounterRate > 0 && possibleEncounters.length > 0) {
      // Random chance for encounter on each move
      if (Math.random() < encounterRate * 0.5) { // Lower rate for random
        const hostileMonsters = possibleEncounters.filter(
          id => monsterDefinitions[id]?.hostile
        );
        
        if (hostileMonsters.length > 0) {
          const randomMonster = hostileMonsters[Math.floor(Math.random() * hostileMonsters.length)];
          // Small chance for double encounter
          const enemies = Math.random() < 0.3 
            ? [randomMonster, hostileMonsters[Math.floor(Math.random() * hostileMonsters.length)]]
            : [randomMonster];
          
          setCombatEnemies(enemies);
          setGameMode('combat');
        }
      }
    }
  }, [gameState.playerPosition, currentMap, gameMode]);

  // Toggle fullscreen
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

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
  const partyCharacters = useMemo(() => 
    Object.values(gameData.characters).filter(c => 
      ['matias', 'angel', 'alejandro', 'miguel', 'elias', 'maximo'].includes(c.id)
    ),
    [gameData.characters]
  );

  if (!currentMap && gameMode === 'playing') {
    return (
      <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-900">
        <p className="font-pixel text-pink-400">Error: Map not found</p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-900/98">
      <div 
        className="flex flex-col max-w-3xl w-full max-h-[95vh] mx-2"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Main Menu */}
        {gameMode === 'menu' && (
          <div className="relative border-4 border-slate-700 bg-slate-900 rounded-lg overflow-hidden shadow-2xl" style={{ height: '450px' }}>
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
              className="absolute top-3 left-3 p-2 rounded-lg border-2 border-pink-500/50 
                hover:bg-pink-500/20 transition-colors z-50 bg-slate-900/80"
            >
              <X size={16} className="text-pink-400" />
            </button>
          </div>
        )}

        {/* Prologue Scene */}
        {gameMode === 'prologue' && (
          <div className="relative border-4 border-slate-700 bg-slate-900 rounded-lg overflow-hidden shadow-2xl" style={{ height: '450px' }}>
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
            <div className="flex items-center justify-between p-3 bg-slate-800 border-4 border-b-0 border-slate-700 rounded-t-lg">
              <div className="flex items-center gap-3">
                <h2 className="font-pixel text-sm text-cyan-400 truncate">
                  {isSpanish ? gameData.titleEs : gameData.title}
                </h2>
                {mapMonsters.length > 0 && (
                  <div className="flex items-center gap-1 px-2 py-1 bg-red-500/20 rounded border border-red-500/50">
                    <Swords size={12} className="text-red-400" />
                    <span className="font-pixel text-[8px] text-red-400">
                      {mapMonsters.filter(m => monsterDefinitions[m.monsterId]?.hostile).length}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { playClick(); saveGame(); }}
                  onMouseEnter={playHover}
                  className="p-2 rounded-lg border-2 border-cyan-500/50 hover:bg-cyan-500/20 transition-colors"
                  title={isSpanish ? 'Guardar' : 'Save'}
                >
                  <Save size={14} className="text-cyan-400" />
                </button>
                <button
                  onClick={() => { playClick(); setShowModMenu(true); }}
                  onMouseEnter={playHover}
                  className="p-2 rounded-lg border-2 border-purple-500/50 hover:bg-purple-500/20 transition-colors"
                  title={isSpanish ? 'Mods' : 'Mods'}
                >
                  <Settings size={14} className="text-purple-400" />
                </button>
                <button
                  onClick={toggleFullscreen}
                  className="p-2 rounded-lg border-2 border-yellow-500/50 hover:bg-yellow-500/20 transition-colors"
                >
                  <Maximize size={14} className="text-yellow-400" />
                </button>
                <button
                  onClick={() => { playClick(); onClose(); }}
                  onMouseEnter={playHover}
                  className="p-2 rounded-lg border-2 border-pink-500/50 hover:bg-pink-500/20 transition-colors"
                >
                  <X size={14} className="text-pink-400" />
                </button>
              </div>
            </div>

            {/* Game Screen */}
            <div className="relative border-4 border-slate-700 bg-slate-900 overflow-hidden flex items-center justify-center py-4">
              <GameCanvas
                gameData={gameData}
                gameState={gameState}
                currentMap={currentMap!}
                pixelSize={isMobile ? 5 : 6}
                mapMonsters={mapMonsters}
                onMonsterEncounter={handleMonsterEncounter}
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
                <div className="absolute inset-0 bg-slate-900/90 flex flex-col items-center justify-center z-40">
                  <p className="font-pixel text-xl text-cyan-400 mb-6">
                    {isSpanish ? 'PAUSA' : 'PAUSED'}
                  </p>
                  <button
                    onClick={() => setIsPaused(false)}
                    className="px-6 py-3 font-pixel text-sm bg-cyan-500/20 border-2 border-cyan-500 
                      rounded-lg text-cyan-400 hover:bg-cyan-500/30 transition-colors"
                  >
                    {isSpanish ? 'CONTINUAR' : 'CONTINUE'}
                  </button>
                </div>
              )}
            </div>

            {/* Footer / Controls help */}
            <div className="p-3 bg-slate-800 border-4 border-t-0 border-slate-700 rounded-b-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <HelpCircle size={14} className="text-slate-500" />
                  <span className="font-retro text-[10px] text-slate-400 hidden sm:inline">
                    {isSpanish 
                      ? 'WASD: Mover | ESPACIO: Interactuar | TAB: Menú | Click: Combatir'
                      : 'WASD: Move | SPACE: Interact | TAB: Menu | Click: Fight'}
                  </span>
                  <span className="font-retro text-[10px] text-slate-400 sm:hidden">
                    {isSpanish ? 'Controles táctiles activos' : 'Touch controls active'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-pixel text-[10px] text-yellow-400">
                    {isSpanish ? currentMap?.nameEs : currentMap?.name}
                  </span>
                  <span className="font-pixel text-[8px] text-slate-500">
                    ({gameState.playerPosition.x}, {gameState.playerPosition.y})
                  </span>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Combat Mode */}
        {gameMode === 'combat' && (
          <div className="relative border-4 border-slate-700 bg-slate-900 rounded-lg overflow-hidden shadow-2xl" style={{ height: '500px' }}>
            <CombatSystem
              playerParty={partyCharacters}
              enemies={combatEnemies}
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
