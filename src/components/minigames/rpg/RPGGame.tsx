import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { X, Settings, Save, HelpCircle, Maximize, Swords, Minimize } from 'lucide-react';
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
import { generateMapMonsters, monsterDefinitions } from './data/mapMonsters';

interface RPGGameProps {
  onClose: () => void;
  isFullPage?: boolean;
}

type GameMode = 'menu' | 'prologue' | 'playing' | 'combat';

export const RPGGame: React.FC<RPGGameProps> = ({ onClose, isFullPage = false }) => {
  const { playClick, playHover } = useSoundEffects();
  const { language } = useSettings();
  const isMobile = useIsMobile();
  const isSpanish = language === 'es';
  
  const gameContainerRef = useRef<HTMLDivElement>(null);
  
  const [gameMode, setGameMode] = useState<GameMode>('menu');
  const [showGameMenu, setShowGameMenu] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hasSaveData, setHasSaveData] = useState(false);
  const [mapMonsters, setMapMonsters] = useState<MapMonster[]>([]);
  const [combatEnemies, setCombatEnemies] = useState<string[]>([]);
  
  // Estado inicial del zoom: 4 para PC, 3 para móvil (valor seguro por defecto)
  const [dynamicPixelSize, setDynamicPixelSize] = useState(isMobile ? 3 : 4);

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

  // --- LÓGICA DE ESCALADO ESTABILIZADA ---
  // Ya no depende del mapa actual (currentMap), sino solo del tamaño de la ventana.
  // Esto evita que la pantalla se encoja al cambiar de mapa.
  useEffect(() => {
    const calculateStableScale = () => {
      if (!gameContainerRef.current) return;

      const { clientWidth, clientHeight } = gameContainerRef.current;
      const BASE_TILE_SIZE = 16; 

      // Configuración de "Cámara": Cuántos tiles verticales queremos ver como mínimo.
      // En PC queremos ver menos tiles pero más grandes para detalle.
      // En móvil necesitamos ver suficiente contexto.
      const targetVisibleTilesY = isMobile ? 13 : 11; 

      // Calculamos el zoom basándonos puramente en la altura disponible
      let optimalScale = Math.floor(clientHeight / (targetVisibleTilesY * BASE_TILE_SIZE));

      // --- LÍMITES DE SEGURIDAD ---
      // PC: Mínimo zoom x3 (para que no se vea hormiga), Máximo x6
      // Móvil: Mínimo x2, Máximo x5
      const minScale = isMobile ? 2 : 3; 
      const maxScale = isMobile ? 5 : 6;

      optimalScale = Math.max(minScale, Math.min(optimalScale, maxScale));

      setDynamicPixelSize(optimalScale);
    };

    // Ejecutar al inicio y al redimensionar ventana
    calculateStableScale();
    
    // Observer para detectar cambios en el contenedor div específicamente
    const resizeObserver = new ResizeObserver(() => {
      calculateStableScale();
    });

    if (gameContainerRef.current) {
      resizeObserver.observe(gameContainerRef.current);
    }

    return () => resizeObserver.disconnect();
  }, [isMobile]); // Solo recalcular si cambia el modo móvil/pc, no el mapa.

  // Check for save data
  useEffect(() => {
    const saved = localStorage.getItem('rpg_game_state');
    setHasSaveData(!!saved);
  }, []);

  // Generate monsters when map changes
  useEffect(() => {
    if (!currentMap || gameMode !== 'playing') return;
    
    const occupiedTiles = new Set<string>();
    occupiedTiles.add(`${gameState.playerPosition.x},${gameState.playerPosition.y}`);
    
    currentMap.npcs.forEach(npcId => {
      const npc = gameData.characters[npcId];
      if (npc) occupiedTiles.add(`${npc.position.x},${npc.position.y}`);
    });
    
    const possibleMonsters = currentMap.possibleEncounters || [];
    if (possibleMonsters.length > 0) {
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

  const handleMonsterEncounter = useCallback((monster: MapMonster) => {
    const definition = monsterDefinitions[monster.monsterId];
    if (!definition) return;
    
    if (definition.hostile) {
      playClick();
      setCombatEnemies([monster.monsterId]);
      setMapMonsters(prev => prev.filter(m => m.id !== monster.id));
      setGameMode('combat');
    }
  }, [playClick]);

  useEffect(() => {
    if (gameMode !== 'playing' || !currentMap) return;
    
    const encounterRate = currentMap.encounterRate || 0;
    const possibleEncounters = currentMap.possibleEncounters || [];
    
    if (encounterRate > 0 && possibleEncounters.length > 0) {
      if (Math.random() < encounterRate * 0.5) {
        const hostileMonsters = possibleEncounters.filter(
          id => monsterDefinitions[id]?.hostile
        );
        
        if (hostileMonsters.length > 0) {
          const randomMonster = hostileMonsters[Math.floor(Math.random() * hostileMonsters.length)];
          const enemies = Math.random() < 0.3 
            ? [randomMonster, hostileMonsters[Math.floor(Math.random() * hostileMonsters.length)]]
            : [randomMonster];
          
          setCombatEnemies(enemies);
          setGameMode('combat');
        }
      }
    }
  }, [gameState.playerPosition, currentMap, gameMode]);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(e => console.error(e));
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(e => console.error(e));
      setIsFullscreen(false);
    }
  }, []);

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

  const partyCharacters = useMemo(() => 
    Object.values(gameData.characters).filter(c => 
      ['matias', 'angel', 'alejandro', 'miguel', 'elias', 'maximo'].includes(c.id)
    ),
    [gameData.characters]
  );

  if (!currentMap && gameMode === 'playing') {
    return (
      <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-900 cursor-default">
        <p className="font-pixel text-pink-400 animate-pulse">Cargando mapa...</p>
      </div>
    );
  }

  // Clases CSS base: cursor-default forzado aquí también
  const containerClass = `relative flex flex-col w-full bg-slate-900 shadow-2xl overflow-hidden cursor-default
    ${isFullPage ? 'h-full max-w-none rounded-none' : 'max-w-4xl max-h-[90vh] h-[600px] rounded-xl border-4 border-slate-700'}`;

  return (
    <div className={`fixed inset-0 z-[300] flex items-center justify-center ${isFullPage ? 'bg-black' : 'bg-slate-900/90 backdrop-blur-sm'}`}>
      <div 
        className={containerClass}
        onClick={(e) => e.stopPropagation()}
      >
        {/* === MENU PRINCIPAL === */}
        {gameMode === 'menu' && (
          <div className="w-full h-full relative">
             <MainMenu
              hasSaveData={hasSaveData}
              onStartStory={() => setGameMode('prologue')}
              onStartFree={() => setGameMode('playing')}
              onContinue={() => setGameMode('playing')}
              onSettings={() => setShowModMenu(true)}
            />
            {!isFullPage && (
              <button
                onClick={() => { playClick(); onClose(); }}
                className="absolute top-4 left-4 p-2 rounded-lg border-2 border-pink-500/50 
                  hover:bg-pink-500/20 transition-colors z-50 bg-slate-900/80 text-pink-400 hover:text-pink-300 cursor-pointer"
              >
                <X size={20} />
              </button>
            )}
          </div>
        )}

        {/* === PROLOGO === */}
        {gameMode === 'prologue' && (
          <div className="w-full h-full relative">
            <PrologueScene
              onComplete={() => setGameMode('playing')}
              onSkip={() => setGameMode('playing')}
            />
          </div>
        )}

        {/* === MODO JUEGO === */}
        {gameMode === 'playing' && (
          <div className="flex flex-col h-full w-full">
            {/* Header / HUD */}
            <div className="shrink-0 flex items-center justify-between p-2 md:p-3 bg-slate-800 border-b-4 border-slate-700 z-10">
              <div className="flex items-center gap-3">
                <h2 className="font-pixel text-xs md:text-sm text-cyan-400 truncate max-w-[150px] md:max-w-none select-none">
                  {isSpanish ? gameData.titleEs : gameData.title}
                </h2>
                {mapMonsters.length > 0 && (
                  <div className="flex items-center gap-1 px-2 py-0.5 bg-red-900/30 rounded border border-red-500/40 select-none">
                    <Swords size={12} className="text-red-400" />
                    <span className="font-pixel text-[10px] text-red-400">
                      {mapMonsters.filter(m => monsterDefinitions[m.monsterId]?.hostile).length}
                    </span>
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-1 md:gap-2">
                <button
                  onClick={() => { playClick(); saveGame(); }}
                  onMouseEnter={playHover}
                  className="p-1.5 md:p-2 rounded-md border border-cyan-500/30 hover:bg-cyan-500/20 text-cyan-400 transition-all cursor-pointer"
                  title={isSpanish ? 'Guardar' : 'Save'}
                >
                  <Save size={16} />
                </button>
                <button
                  onClick={() => { playClick(); setShowModMenu(true); }}
                  onMouseEnter={playHover}
                  className="p-1.5 md:p-2 rounded-md border border-purple-500/30 hover:bg-purple-500/20 text-purple-400 transition-all cursor-pointer"
                >
                  <Settings size={16} />
                </button>
                <button
                  onClick={toggleFullscreen}
                  className="p-1.5 md:p-2 rounded-md border border-yellow-500/30 hover:bg-yellow-500/20 text-yellow-400 transition-all hidden md:block cursor-pointer"
                >
                  {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
                </button>
                <button
                  onClick={() => { playClick(); onClose(); }}
                  onMouseEnter={playHover}
                  className="p-1.5 md:p-2 rounded-md border border-pink-500/30 hover:bg-pink-500/20 text-pink-400 transition-all cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Game Canvas Container */}
            <div 
              ref={gameContainerRef}
              className="relative flex-1 bg-slate-950 overflow-hidden flex items-center justify-center min-h-0 w-full"
            >
              <GameCanvas
                gameData={gameData}
                gameState={gameState}
                currentMap={currentMap!}
                pixelSize={dynamicPixelSize}
                mapMonsters={mapMonsters}
                onMonsterEncounter={handleMonsterEncounter}
                fillContainer={false} 
              />

              {/* Overlays */}
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

              {showGameMenu && (
                <GameMenu
                  gameState={gameState}
                  gameData={gameData}
                  party={partyCharacters}
                  onClose={() => setShowGameMenu(false)}
                />
              )}

              {isPaused && !showModMenu && !showGameMenu && (
                <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm flex flex-col items-center justify-center z-40">
                  <p className="font-pixel text-2xl text-cyan-400 mb-6 drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]">
                    {isSpanish ? 'PAUSA' : 'PAUSED'}
                  </p>
                  <button
                    onClick={() => setIsPaused(false)}
                    className="px-8 py-3 font-pixel text-sm bg-cyan-950/50 border-2 border-cyan-500 
                      rounded-lg text-cyan-400 hover:bg-cyan-500/20 hover:scale-105 transition-all cursor-pointer"
                  >
                    {isSpanish ? 'CONTINUAR' : 'CONTINUE'}
                  </button>
                </div>
              )}
              
              {isMobile && (
                <TouchControls
                  onMove={movePlayer}
                  onInteract={interact}
                  onMenu={() => setShowGameMenu(true)}
                  onFullscreen={toggleFullscreen}
                  disabled={!!showModMenu || isPaused || showGameMenu || !!activeDialogue}
                />
              )}
            </div>

            {/* Footer Status Bar */}
            <div className="shrink-0 p-2 bg-slate-800 border-t-4 border-slate-700 text-[10px] md:text-xs select-none">
              <div className="flex items-center justify-between font-pixel">
                <div className="flex items-center gap-2 text-slate-400">
                  <HelpCircle size={12} />
                  <span className="hidden sm:inline">
                    {isSpanish 
                      ? 'WASD: Mover | ESPACIO: Interactuar' 
                      : 'WASD: Move | SPACE: Interact'}
                  </span>
                  <span className="sm:hidden">
                    {isSpanish ? 'Toca para jugar' : 'Touch to play'}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-yellow-400">
                    {isSpanish ? currentMap?.nameEs : currentMap?.name}
                  </span>
                  <span className="text-slate-500 font-mono">
                    [{gameState.playerPosition.x}, {gameState.playerPosition.y}]
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* === MODO COMBATE === */}
        {gameMode === 'combat' && (
          <div className="w-full h-full relative bg-slate-900 flex flex-col">
            <div className="shrink-0 p-2 bg-slate-800 border-b-4 border-slate-700 flex justify-end">
               <button onClick={() => setGameMode('playing')} className="text-slate-500 hover:text-white text-xs font-pixel cursor-pointer">
                  DEBUG: EXIT
               </button>
            </div>
            <div className="flex-1 relative overflow-hidden">
                <CombatSystem
                  playerParty={partyCharacters}
                  enemies={combatEnemies}
                  onVictory={(exp, gold) => {
                    setGameMode('playing');
                  }}
                  onDefeat={() => {
                    setGameMode('menu');
                  }}
                  onFlee={() => {
                    setGameMode('playing');
                  }}
                />
            </div>
          </div>
        )}
      </div>

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