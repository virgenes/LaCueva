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
import { CharacterSelect } from './components/CharacterSelect';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { useSettings } from '@/contexts/SettingsContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { teleporterConnections } from './data/defaultMap';
import { generateMapMonsters, monsterRegistry } from './data/monsters';

interface RPGGameProps {
  onClose: () => void;
}

type GameMode = 'menu' | 'character_select' | 'prologue' | 'playing' | 'combat';

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
  const [selectedCharacterId, setSelectedCharacterId] = useState<string>('matias');

  const {
    gameData, gameState, currentMap, activeDialogue, dialogueIndex, displayedText,
    isTyping, isPaused, isWalking, showModMenu, setShowModMenu,
    movePlayer, interact, selectChoice, setIsPaused,
    exportGameData, importGameData, resetGame, saveGame, setGameData,
    spatialHash, insertMonstersIntoHash, awardCombatRewards, useItem,
  } = useGameEngine();

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
      const monsters = generateMapMonsters(currentMap.id, currentMap.width, currentMap.height, possibleMonsters, monsterCount, occupiedTiles);
      setMapMonsters(monsters);
      insertMonstersIntoHash(monsters);
    } else {
      setMapMonsters([]);
    }
  }, [currentMap?.id, gameMode, insertMonstersIntoHash]);

  const handleMonsterEncounter = useCallback((monster: MapMonster) => {
    const def = monsterRegistry[monster.monsterId];
    if (!def) return;
    if (def.hostile) {
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
        const hostileMonsters = possibleEncounters.filter(id => monsterRegistry[id]?.hostile);
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
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (gameMode === 'menu' || gameMode === 'character_select') return;
      if (e.key === 'Escape' && !activeDialogue && !showModMenu && !showGameMenu) {
        if (gameMode === 'playing') setShowGameMenu(true);
      }
      if (e.key === 'Tab') {
        e.preventDefault();
        setShowGameMenu(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [activeDialogue, showModMenu, showGameMenu, gameMode]);

  // Only use selected character in party for combat
  const partyCharacters = useMemo(() => {
    const allChars = Object.values(gameData.characters).filter(c =>
      ['matias', 'angel', 'alejandro', 'miguel', 'elias', 'maximo'].includes(c.id)
    );
    // Put selected character first
    const selected = allChars.find(c => c.id === selectedCharacterId);
    const rest = allChars.filter(c => c.id !== selectedCharacterId);
    return selected ? [selected, ...rest] : allChars;
  }, [gameData.characters, selectedCharacterId]);

  const handleCharacterSelect = useCallback((charId: string) => {
    setSelectedCharacterId(charId);
    playClick();
    setGameMode('playing');
  }, [playClick]);

  if (!currentMap && gameMode === 'playing') {
    return (
      <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black">
        <p className="font-pixel text-red-400">Error: Map not found</p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black">
      <div className="flex flex-col max-w-3xl w-full max-h-[95vh] mx-2" onClick={(e) => e.stopPropagation()}>
        
        {/* Main Menu */}
        {gameMode === 'menu' && (
          <div className="relative border-4 border-white/20 bg-black rounded-sm overflow-hidden shadow-2xl" style={{ height: '450px' }}>
            <MainMenu
              hasSaveData={hasSaveData}
              onStartStory={() => setGameMode('character_select')}
              onStartFree={() => setGameMode('character_select')}
              onContinue={() => setGameMode('playing')}
              onSettings={() => setShowModMenu(true)}
            />
            <button
              onClick={() => { playClick(); onClose(); }}
              className="absolute top-3 left-3 p-2 rounded-sm border-2 border-red-500/50 hover:bg-red-500/20 transition-colors z-50 bg-black/80"
            >
              <X size={16} className="text-red-400" />
            </button>
          </div>
        )}

        {/* Character Selection */}
        {gameMode === 'character_select' && (
          <div className="relative border-4 border-white/20 bg-black rounded-sm overflow-hidden shadow-2xl" style={{ height: '500px' }}>
            <CharacterSelect
              onSelect={handleCharacterSelect}
              onBack={() => setGameMode('menu')}
            />
          </div>
        )}

        {/* Prologue Scene */}
        {gameMode === 'prologue' && (
          <div className="relative border-4 border-white/20 bg-black rounded-sm overflow-hidden shadow-2xl" style={{ height: '450px' }}>
            <PrologueScene onComplete={() => setGameMode('playing')} onSkip={() => setGameMode('playing')} />
          </div>
        )}

        {/* Main Gameplay */}
        {gameMode === 'playing' && (
          <>
            {/* Header */}
            <div className="flex items-center justify-between p-2 bg-black border-2 border-b-0 border-white/20 rounded-t-sm">
              <div className="flex items-center gap-3">
                <h2 className="font-pixel text-xs text-white truncate">
                  {isSpanish ? gameData.titleEs : gameData.title}
                </h2>
                {mapMonsters.length > 0 && (
                  <div className="flex items-center gap-1 px-1.5 py-0.5 border border-red-500/50 rounded-sm">
                    <Swords size={10} className="text-red-400" />
                    <span className="font-pixel text-[7px] text-red-400">
                      {mapMonsters.filter(m => monsterRegistry[m.monsterId]?.hostile).length}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => { playClick(); saveGame(); }} onMouseEnter={playHover}
                  className="p-1.5 border border-white/20 hover:bg-white/10 transition-colors rounded-sm">
                  <Save size={12} className="text-white/60" />
                </button>
                <button onClick={() => { playClick(); setShowModMenu(true); }} onMouseEnter={playHover}
                  className="p-1.5 border border-white/20 hover:bg-white/10 transition-colors rounded-sm">
                  <Settings size={12} className="text-white/60" />
                </button>
                <button onClick={toggleFullscreen}
                  className="p-1.5 border border-white/20 hover:bg-white/10 transition-colors rounded-sm">
                  <Maximize size={12} className="text-white/60" />
                </button>
                <button onClick={() => { playClick(); onClose(); }} onMouseEnter={playHover}
                  className="p-1.5 border border-red-500/30 hover:bg-red-500/10 transition-colors rounded-sm">
                  <X size={12} className="text-red-400" />
                </button>
              </div>
            </div>

            {/* Game Screen */}
            <div className="relative border-2 border-white/20 bg-black overflow-hidden flex items-center justify-center py-2">
              <GameCanvas
                gameData={gameData} gameState={gameState} currentMap={currentMap!}
                pixelSize={isMobile ? 5 : 6}
                mapMonsters={mapMonsters} onMonsterEncounter={handleMonsterEncounter}
                spatialHash={spatialHash} isMobile={isMobile} isWalking={isWalking}
                selectedCharacterId={selectedCharacterId}
              />
              {activeDialogue && (
                <DialogueBox dialogue={activeDialogue} dialogueIndex={dialogueIndex}
                  displayedText={displayedText} isTyping={isTyping} gameData={gameData}
                  onAdvance={interact} onSelectChoice={selectChoice} />
              )}
              {isMobile && (
                <TouchControls onMove={movePlayer} onInteract={interact}
                  onMenu={() => setShowGameMenu(true)} onFullscreen={toggleFullscreen}
                  disabled={!!showModMenu || isPaused || showGameMenu} />
              )}
              {showGameMenu && (
                <GameMenu gameState={gameState} gameData={gameData} party={partyCharacters}
                  onClose={() => setShowGameMenu(false)} onUseItem={useItem} />
              )}
              {isPaused && !showModMenu && !showGameMenu && (
                <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center z-40">
                  <p className="font-pixel text-xl text-white mb-6">{isSpanish ? 'PAUSA' : 'PAUSED'}</p>
                  <button onClick={() => setIsPaused(false)}
                    className="px-6 py-3 font-pixel text-sm border-2 border-white rounded-sm text-white hover:bg-white/10 transition-colors">
                    {isSpanish ? 'CONTINUAR' : 'CONTINUE'}
                  </button>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-2 bg-black border-2 border-t-0 border-white/20 rounded-b-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <HelpCircle size={12} className="text-white/30" />
                  <span className="font-pixel text-[8px] text-white/40 hidden sm:inline">
                    {isSpanish ? 'WASD: Mover | ESPACIO: Interactuar | TAB: Menú' : 'WASD: Move | SPACE: Interact | TAB: Menu'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-pixel text-[8px] text-yellow-400/70">{isSpanish ? currentMap?.nameEs : currentMap?.name}</span>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Combat Mode */}
        {gameMode === 'combat' && (
          <div className="relative border-4 border-white/20 bg-black rounded-sm overflow-hidden shadow-2xl" style={{ height: '500px' }}>
            <CombatSystem
              playerParty={partyCharacters}
              enemies={combatEnemies}
              onVictory={(exp, gold, items) => { awardCombatRewards(exp, gold, items); setGameMode('playing'); }}
              onDefeat={() => { setGameMode('menu'); }}
              onFlee={() => { setGameMode('playing'); }}
            />
          </div>
        )}
      </div>

      {showModMenu && (
        <ModMenu gameData={gameData} onClose={() => setShowModMenu(false)}
          onExport={exportGameData} onImport={importGameData}
          onReset={resetGame} onUpdateGameData={setGameData} />
      )}
    </div>
  );
};
