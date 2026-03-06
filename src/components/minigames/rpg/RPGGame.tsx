import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
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
import { BattleTransition } from './components/BattleTransition';
import { LandscapeExploration } from './components/LandscapeExploration';
import { LandscapeCombat } from './components/LandscapeCombat';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { useSettings } from '@/contexts/SettingsContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { useLandscapeMobile, useIsTouchDevice } from './hooks/useLandscapeMobile';
import { teleporterConnections } from './data/defaultMap';
import { generateMapMonsters, monsterRegistry } from './data/monsters';
import { playBGM, stopBGM, sfxEncounter, sfxSelect, sfxStep } from './systems/RPGAudioManager';

interface RPGGameProps {
  onClose: () => void;
}

type GameMode = 'menu' | 'character_select' | 'prologue' | 'playing' | 'combat';

const DAY_CYCLE_MS = 5 * 60 * 1000;

export const RPGGame: React.FC<RPGGameProps> = ({ onClose }) => {
  const { playClick, playHover } = useSoundEffects();
  const { language } = useSettings();
  const isMobile = useIsMobile();
  const isTouchDevice = useIsTouchDevice();
  const isLandscape = useLandscapeMobile();
  const isSpanish = language === 'es';

  const [gameMode, setGameMode] = useState<GameMode>('menu');
  const [showGameMenu, setShowGameMenu] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hasSaveData, setHasSaveData] = useState(false);
  const [mapMonsters, setMapMonsters] = useState<MapMonster[]>([]);
  const [combatEnemies, setCombatEnemies] = useState<string[]>([]);
  const [selectedCharacterId, setSelectedCharacterId] = useState<string>('matias');
  const [battleTransitionActive, setBattleTransitionActive] = useState(false);
  const pendingCombatRef = useRef<string[]>([]);

  // Day/night cycle
  const [timeOfDay, setTimeOfDay] = useState(0.35);
  const timeOfDayRef = useRef(0.35);
  useEffect(() => {
    if (gameMode !== 'playing') return;
    const startTime = Date.now() - timeOfDayRef.current * DAY_CYCLE_MS;
    const interval = setInterval(() => {
      const elapsed = (Date.now() - startTime) % DAY_CYCLE_MS;
      const t = elapsed / DAY_CYCLE_MS;
      timeOfDayRef.current = t;
      setTimeOfDay(t);
    }, 2000); // Update every 2s instead of 1s for performance
    return () => clearInterval(interval);
  }, [gameMode]);

  // Sleep toggle: toggle day/night instantly
  const handleSleep = useCallback(() => {
    const isNight = timeOfDayRef.current < 0.2 || timeOfDayRef.current > 0.8;
    const newTime = isNight ? 0.35 : 0.9; // If night → morning, if day → night
    timeOfDayRef.current = newTime;
    setTimeOfDay(newTime);
  }, []);

  // BGM management
  useEffect(() => {
    if (gameMode === 'playing') {
      const mapId = gameState?.currentMapId;
      if (mapId === 'cave') playBGM('cave', 0.04);
      else playBGM('overworld', 0.04);
    } else if (gameMode === 'combat') {
      playBGM('battle', 0.05);
    } else if (gameMode === 'menu' || gameMode === 'character_select') {
      playBGM('menu', 0.03);
    } else {
      stopBGM();
    }
  }, [gameMode]);

  useEffect(() => () => stopBGM(), []);

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

  // Check if player interacts with bed → trigger sleep
  useEffect(() => {
    if (activeDialogue?.id === 'bed_rest_sleep') {
      handleSleep();
    }
  }, [activeDialogue?.id, handleSleep]);

  // Generate monsters when map changes — adjusted by time of day
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
      const isNight = timeOfDay < 0.2 || timeOfDay > 0.8;
      const isCave = currentMap.id === 'cave';
      // Night: more monsters. Day: fewer. Caves: always more.
      const baseCount = Math.floor(Math.min(15, (currentMap.width * currentMap.height) / 100));
      const monsterCount = isCave ? baseCount + 5 : isNight ? baseCount + 8 : Math.max(3, baseCount - 3);
      const monsters = generateMapMonsters(currentMap.id, currentMap.width, currentMap.height, possibleMonsters, monsterCount, occupiedTiles);
      setMapMonsters(monsters);
      insertMonstersIntoHash(monsters);
    } else {
      setMapMonsters([]);
    }
  }, [currentMap?.id, gameMode, insertMonstersIntoHash]);

  const startBattleWithTransition = useCallback((enemyIds: string[]) => {
    pendingCombatRef.current = enemyIds;
    sfxEncounter();
    setBattleTransitionActive(true);
  }, []);

  const handleTransitionComplete = useCallback(() => {
    setBattleTransitionActive(false);
    setCombatEnemies(pendingCombatRef.current);
    setGameMode('combat');
  }, []);

  const handleMonsterEncounter = useCallback((monster: MapMonster) => {
    const def = monsterRegistry[monster.monsterId];
    if (!def) return;
    if (def.hostile) {
      setMapMonsters(prev => prev.filter(m => m.id !== monster.id));
      startBattleWithTransition([monster.monsterId]);
    }
  }, [startBattleWithTransition]);

  // Random encounters — more at night
  const lastEncounterPos = useRef('');
  useEffect(() => {
    if (gameMode !== 'playing' || !currentMap) return;
    const posKey = `${gameState.playerPosition.x},${gameState.playerPosition.y}`;
    if (posKey === lastEncounterPos.current) return;
    lastEncounterPos.current = posKey;

    const isNight = timeOfDay < 0.2 || timeOfDay > 0.8;
    const encounterRate = currentMap.encounterRate || 0;
    const rateMultiplier = isNight ? 1.5 : 0.4; // Night = way more encounters
    const possibleEncounters = currentMap.possibleEncounters || [];
    if (encounterRate > 0 && possibleEncounters.length > 0 && Math.random() < encounterRate * rateMultiplier) {
      const hostileMonsters = possibleEncounters.filter(id => monsterRegistry[id]?.hostile);
      if (hostileMonsters.length > 0) {
        const randomMonster = hostileMonsters[Math.floor(Math.random() * hostileMonsters.length)];
        const enemies = Math.random() < 0.3
          ? [randomMonster, hostileMonsters[Math.floor(Math.random() * hostileMonsters.length)]]
          : [randomMonster];
        startBattleWithTransition(enemies);
      }
    }
  }, [gameState.playerPosition, currentMap, gameMode, startBattleWithTransition, timeOfDay]);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) { document.documentElement.requestFullscreen(); setIsFullscreen(true); }
    else { document.exitFullscreen(); setIsFullscreen(false); }
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (gameMode === 'menu' || gameMode === 'character_select') return;
      if (e.key === 'Escape' && !activeDialogue && !showModMenu && !showGameMenu) {
        if (gameMode === 'playing') setShowGameMenu(true);
      }
      if (e.key === 'Tab') { e.preventDefault(); setShowGameMenu(prev => !prev); }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [activeDialogue, showModMenu, showGameMenu, gameMode]);

  const partyCharacters = useMemo(() => {
    const allChars = Object.values(gameData.characters).filter(c =>
      ['matias', 'angel', 'alejandro', 'miguel', 'elias', 'maximo'].includes(c.id)
    );
    const selected = allChars.find(c => c.id === selectedCharacterId);
    const rest = allChars.filter(c => c.id !== selectedCharacterId);
    return selected ? [selected, ...rest] : allChars;
  }, [gameData.characters, selectedCharacterId]);

  const handleCharacterSelect = useCallback((charId: string) => {
    setSelectedCharacterId(charId);
    sfxSelect();
    setGameMode('playing');
  }, []);

  if (!currentMap && gameMode === 'playing') {
    return (
      <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black">
        <p className="font-pixel text-red-400">Error: Map not found</p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black">
      <BattleTransition active={battleTransitionActive} onComplete={handleTransitionComplete} />

      <div className="flex flex-col max-w-3xl w-full max-h-[95vh] mx-2" onClick={(e) => e.stopPropagation()}>

        {gameMode === 'menu' && (
          <div className="relative border-4 border-white/20 bg-black rounded-sm overflow-hidden shadow-2xl" style={{ height: '450px' }}>
            <MainMenu hasSaveData={hasSaveData}
              onStartStory={() => setGameMode('character_select')}
              onStartFree={() => setGameMode('character_select')}
              onContinue={() => setGameMode('playing')}
              onSettings={() => setShowModMenu(true)} />
            <button onClick={() => { playClick(); onClose(); }}
              className="absolute top-3 left-3 p-2 rounded-sm border-2 border-red-500/50 hover:bg-red-500/20 transition-colors z-50 bg-black/80">
              <X size={16} className="text-red-400" />
            </button>
          </div>
        )}

        {gameMode === 'character_select' && (
          <div className="relative border-4 border-white/20 bg-black rounded-sm overflow-hidden shadow-2xl" style={{ height: '500px' }}>
            <CharacterSelect onSelect={handleCharacterSelect} onBack={() => setGameMode('menu')} />
          </div>
        )}

        {gameMode === 'prologue' && (
          <div className="relative border-4 border-white/20 bg-black rounded-sm overflow-hidden shadow-2xl" style={{ height: '450px' }}>
            <PrologueScene onComplete={() => setGameMode('playing')} onSkip={() => setGameMode('playing')} />
          </div>
        )}

        {gameMode === 'playing' && isLandscape && currentMap && (
          <LandscapeExploration
            gameData={gameData} gameState={gameState} currentMap={currentMap}
            mapMonsters={mapMonsters} onMonsterEncounter={handleMonsterEncounter}
            spatialHash={spatialHash} isWalking={isWalking}
            selectedCharacterId={selectedCharacterId} timeOfDay={timeOfDay}
            activeDialogue={activeDialogue} dialogueIndex={dialogueIndex}
            displayedText={displayedText} isTyping={isTyping}
            showGameMenu={showGameMenu} isPaused={isPaused} showModMenu={showModMenu}
            partyCharacters={partyCharacters} isSpanish={isSpanish}
            onMove={movePlayer} onInteract={interact} onSelectChoice={selectChoice}
            onToggleMenu={() => setShowGameMenu(true)} onFullscreen={toggleFullscreen}
            onSave={() => { playClick(); saveGame(); }}
            onSettings={() => { playClick(); setShowModMenu(true); }}
            onClose={() => { playClick(); stopBGM(); onClose(); }}
            onCloseMenu={() => setShowGameMenu(false)}
            onUseItem={useItem} onResume={() => setIsPaused(false)}
          />
        )}

        {gameMode === 'playing' && !isLandscape && (
          <>
            <div className="flex items-center justify-between p-2 bg-black border-2 border-b-0 border-white/20 rounded-t-sm">
              <div className="flex items-center gap-3">
                <h2 className="font-pixel text-xs text-white truncate">{isSpanish ? gameData.titleEs : gameData.title}</h2>
                {mapMonsters.length > 0 && (
                  <div className="flex items-center gap-1 px-1.5 py-0.5 border border-red-500/50 rounded-sm">
                    <Swords size={10} className="text-red-400" />
                    <span className="font-pixel text-[7px] text-red-400">{mapMonsters.filter(m => monsterRegistry[m.monsterId]?.hostile).length}</span>
                  </div>
                )}
                <span className="font-pixel text-[7px] text-yellow-400/60">
                  {timeOfDay < 0.2 || timeOfDay > 0.8 ? '🌙' : timeOfDay < 0.3 || timeOfDay > 0.7 ? '🌅' : '☀️'}
                </span>
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
                <button onClick={() => { playClick(); stopBGM(); onClose(); }} onMouseEnter={playHover}
                  className="p-1.5 border border-red-500/30 hover:bg-red-500/10 transition-colors rounded-sm">
                  <X size={12} className="text-red-400" />
                </button>
              </div>
            </div>

            <div className="relative border-2 border-white/20 bg-black overflow-hidden flex items-center justify-center py-2">
              <GameCanvas
                gameData={gameData} gameState={gameState} currentMap={currentMap!}
                pixelSize={isMobile ? 5 : 6}
                mapMonsters={mapMonsters} onMonsterEncounter={handleMonsterEncounter}
                spatialHash={spatialHash} isMobile={isMobile} isWalking={isWalking}
                selectedCharacterId={selectedCharacterId}
                timeOfDay={timeOfDay}
                suppressOverlay={showGameMenu || isPaused}
              />
              {activeDialogue && (
                <DialogueBox dialogue={activeDialogue} dialogueIndex={dialogueIndex}
                  displayedText={displayedText} isTyping={isTyping} gameData={gameData}
                  onAdvance={interact} onSelectChoice={selectChoice} />
              )}
              {(isMobile || isTouchDevice) && (
                <TouchControls onMove={movePlayer} onInteract={interact}
                  onMenu={() => setShowGameMenu(true)} onFullscreen={toggleFullscreen}
                  disabled={!!showModMenu || isPaused || showGameMenu} />
              )}
              {showGameMenu && (
                <GameMenu gameState={gameState} gameData={gameData} party={partyCharacters}
                  onClose={() => setShowGameMenu(false)} onUseItem={useItem} />
              )}
              {isPaused && !showModMenu && !showGameMenu && (
                <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center z-[70]">
                  <p className="font-pixel text-xl text-white mb-6">{isSpanish ? 'PAUSA' : 'PAUSED'}</p>
                  <button onClick={() => setIsPaused(false)}
                    className="px-6 py-3 font-pixel text-sm border-2 border-white rounded-sm text-white hover:bg-white/10 transition-colors">
                    {isSpanish ? 'CONTINUAR' : 'CONTINUE'}
                  </button>
                </div>
              )}
            </div>

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

        {gameMode === 'combat' && isLandscape && (
          <LandscapeCombat
            playerParty={partyCharacters}
            enemies={combatEnemies}
            onVictory={(exp, gold, items) => { awardCombatRewards(exp, gold, items); setGameMode('playing'); }}
            onDefeat={() => { setGameMode('menu'); }}
            onFlee={() => { setGameMode('playing'); }}
          />
        )}

        {gameMode === 'combat' && !isLandscape && (
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
