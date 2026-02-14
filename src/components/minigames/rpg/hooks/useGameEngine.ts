import { useReducer, useCallback, useEffect, useRef, useMemo } from 'react';
import { GameData, Dialogue, Character, Tile, GameState, InventoryEntry, awardExp } from '../types/GameTypes';
import { EngineState } from '../types/GameActions';
import { gameReducer, getTileAtPure, getNpcAtPure } from './gameReducer';
import { useDialogueManager } from './useDialogueManager';
import { usePersistence } from './usePersistence';
import { defaultSprites, defaultTiles } from '../data/defaultSprites';
import { defaultDialogues, defaultCharacters, defaultItems } from '../data/defaultDialogues';
import { defaultMaps } from '../data/defaultMap';
import { imageTiles, isImageTile, ImageTile } from '../data/imageTiles';
import { SpatialHash, SpatialEntity } from '../systems/SpatialHash';

const initialGameData: GameData = {
  version: '1.0.0',
  title: 'Echoes of Memory',
  titleEs: 'Ecos de la Memoria',
  author: 'Maximo',
  sprites: defaultSprites,
  characters: defaultCharacters,
  dialogues: defaultDialogues,
  tiles: defaultTiles,
  maps: defaultMaps,
  items: defaultItems,
  config: {
    tileSize: 32,
    playerSpeed: 4,
    dialogueSpeed: 30,
    showFps: false,
    musicVolume: 0.5,
    sfxVolume: 0.7,
  },
};

function createInitialEngineState(gameData: GameData): EngineState {
  const startMap = gameData.maps['memory_garden'];
  return {
    currentMapId: 'memory_garden',
    playerPosition: { ...startMap.spawnPoint },
    playerDirection: 'down',
    flags: {},
    inventory: [],
    dialogueHistory: [],
    playtime: 0,
    savedAt: Date.now(),
    gold: 0,
    characterLevels: {},
    activeDialogueId: null,
    isWalking: false,
    dialogueIndex: 0,
    displayedText: '',
    isTyping: false,
    isPaused: false,
    showModMenu: false,
    language: 'es',
    gameData,
  };
}

export const useGameEngine = () => {
  const [state, dispatch] = useReducer(gameReducer, initialGameData, createInitialEngineState);

  const keysPressed = useRef<Set<string>>(new Set());
  const lastMoveTime = useRef(0);
  const animationFrame = useRef(0);

  // Dialogue typing effect
  useDialogueManager(state, dispatch);

  // Persistence
  const { saveGame: persistSave, loadGame: persistLoad, hasSaveData: checkSaveData, getSaveSlots } = usePersistence();

  // Load saved state on mount
  useEffect(() => {
    const saved = persistLoad(0);
    if (saved) {
      dispatch({
        type: 'LOAD_STATE',
        payload: {
          currentMapId: saved.gameState.currentMapId,
          playerPosition: saved.gameState.playerPosition,
          playerDirection: saved.gameState.playerDirection,
          flags: saved.gameState.flags,
          inventory: saved.gameState.inventory,
          dialogueHistory: saved.gameState.dialogueHistory,
          playtime: saved.gameState.playtime,
          savedAt: saved.gameState.savedAt,
          gold: saved.gameState.gold || 0,
          characterLevels: saved.gameState.characterLevels || {},
        },
      });
    }
  }, [persistLoad]);

  // Auto-save every 10s to slot 0
  useEffect(() => {
    const interval = setInterval(() => {
      const gs: GameState = {
        currentMapId: state.currentMapId,
        playerPosition: state.playerPosition,
        playerDirection: state.playerDirection,
        flags: state.flags,
        inventory: state.inventory,
        dialogueHistory: state.dialogueHistory,
        playtime: state.playtime,
        savedAt: Date.now(),
        characterLevels: state.characterLevels,
        gold: state.gold,
      };
      persistSave(0, gs);
    }, 10000);
    return () => clearInterval(interval);
  }, [state.currentMapId, state.playerPosition, state.playerDirection, state.flags, state.inventory, state.dialogueHistory, state.playtime, state.gold, state.characterLevels, persistSave]);

  const currentMap = state.gameData.maps[state.currentMapId];

  // ===== SPATIAL HASH =====
  const spatialHash = useMemo(() => {
    const hash = new SpatialHash(16);
    if (!currentMap) return hash;
    for (const npcId of currentMap.npcs) {
      const npc = state.gameData.characters[npcId];
      if (npc) {
        hash.insert({ id: npcId, x: npc.position.x, y: npc.position.y, type: 'npc' });
      }
    }
    return hash;
  }, [currentMap?.id, currentMap?.npcs, state.gameData.characters]);

  const insertMonstersIntoHash = useCallback((monsters: Array<{ id: string; position: { x: number; y: number } }>) => {
    for (const monster of monsters) {
      spatialHash.insert({ id: monster.id, x: monster.position.x, y: monster.position.y, type: 'monster' });
    }
  }, [spatialHash]);

  // Movement with throttle
  const movePlayer = useCallback((direction: 'up' | 'down' | 'left' | 'right') => {
    const now = Date.now();
    if (now - lastMoveTime.current < 150) return;
    lastMoveTime.current = now;
    dispatch({ type: 'MOVE_PLAYER', direction });
  }, []);

  const interact = useCallback(() => {
    dispatch({ type: 'ADVANCE_DIALOGUE' });
  }, []);

  const selectChoice = useCallback((choiceIndex: number) => {
    dispatch({ type: 'SELECT_DIALOGUE_CHOICE', choiceIndex });
  }, []);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current.add(e.key.toLowerCase());
      if (e.key === ' ' || e.key === 'Enter' || e.key === 'z') {
        e.preventDefault();
        dispatch({ type: 'ADVANCE_DIALOGUE' });
      }
      if (e.key === 'Escape') {
        if (state.activeDialogueId) {
          dispatch({ type: 'CLOSE_DIALOGUE' });
        } else {
          dispatch({ type: 'SET_PAUSED', paused: !state.isPaused });
        }
      }
      if ((e.key === 'm' || e.key === 'M') && !state.activeDialogueId) {
        dispatch({ type: 'TOGGLE_MOD_MENU' });
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current.delete(e.key.toLowerCase());
      const movementKeys = ['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd'];
      const stillMoving = movementKeys.some(k => keysPressed.current.has(k));
      if (!stillMoving) {
        dispatch({ type: 'STOP_WALKING' });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [state.activeDialogueId, state.isPaused]);

  // Movement loop
  useEffect(() => {
    const gameLoop = () => {
      if (!state.isPaused && !state.activeDialogueId) {
        if (keysPressed.current.has('arrowup') || keysPressed.current.has('w')) movePlayer('up');
        else if (keysPressed.current.has('arrowdown') || keysPressed.current.has('s')) movePlayer('down');
        else if (keysPressed.current.has('arrowleft') || keysPressed.current.has('a')) movePlayer('left');
        else if (keysPressed.current.has('arrowright') || keysPressed.current.has('d')) movePlayer('right');
      }
      animationFrame.current = requestAnimationFrame(gameLoop);
    };
    animationFrame.current = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animationFrame.current);
  }, [movePlayer, state.isPaused, state.activeDialogueId]);

  // Tile/NPC helpers
  const getTileAt = useCallback((x: number, y: number): Tile | ImageTile | null => {
    return getTileAtPure(state, x, y);
  }, [state.currentMapId, state.gameData.tiles]);

  const getNpcAt = useCallback((x: number, y: number): Character | null => {
    return getNpcAtPure(state, x, y);
  }, [state.currentMapId, state.gameData.characters]);

  // Export/import/reset
  const exportGameData = useCallback(() => {
    const exportData = { gameData: state.gameData, gameState: state, exportedAt: Date.now() };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'rpg_mod_data.json';
    a.click();
    URL.revokeObjectURL(url);
  }, [state]);

  const importGameData = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (data.gameData) {
          dispatch({ type: 'UPDATE_GAME_DATA', data: { ...state.gameData, ...data.gameData } });
        }
      } catch (err) {
        console.error('Failed to import mod:', err);
      }
    };
    reader.readAsText(file);
  }, [state.gameData]);

  const resetGame = useCallback(() => {
    dispatch({ type: 'RESET', initialState: createInitialEngineState(initialGameData) });
  }, []);

  const saveGame = useCallback((slotId = 0) => {
    const gs: GameState = {
      currentMapId: state.currentMapId,
      playerPosition: state.playerPosition,
      playerDirection: state.playerDirection,
      flags: state.flags,
      inventory: state.inventory,
      dialogueHistory: state.dialogueHistory,
      playtime: state.playtime,
      savedAt: Date.now(),
      characterLevels: state.characterLevels,
      gold: state.gold,
    };
    persistSave(slotId, gs);
  }, [state, persistSave]);

  const setGameData = useCallback((dataOrFn: GameData | ((prev: GameData) => GameData)) => {
    if (typeof dataOrFn === 'function') {
      dispatch({ type: 'UPDATE_GAME_DATA', data: dataOrFn(state.gameData) });
    } else {
      dispatch({ type: 'UPDATE_GAME_DATA', data: dataOrFn });
    }
  }, [state.gameData]);

  // Award exp to party after combat victory
  const awardCombatRewards = useCallback((exp: number, gold: number, drops: string[]) => {
    dispatch({ type: 'ADD_GOLD', amount: gold });
    // Add drops to inventory
    for (const itemId of drops) {
      dispatch({ type: 'ADD_INVENTORY_ITEM', itemId });
    }
    // Award exp to all party members
    const partyIds = ['matias', 'angel', 'alejandro', 'miguel', 'elias', 'maximo'];
    for (const charId of partyIds) {
      const char = state.gameData.characters[charId];
      if (char) {
        const newStats = awardExp(char.stats, Math.floor(exp / partyIds.length));
        dispatch({ type: 'UPDATE_CHARACTER_STATS', characterId: charId, stats: newStats });
      }
    }
  }, [state.gameData.characters]);

  // Use item
  const useItem = useCallback((itemId: string, targetId: string) => {
    const item = state.gameData.items[itemId];
    if (!item || !item.usable) return;
    
    const entry = state.inventory.find(e => e.itemId === itemId);
    if (!entry || entry.quantity <= 0) return;

    dispatch({ type: 'REMOVE_INVENTORY_ITEM', itemId });

    // Apply item effects
    if (item.useEffect === 'heal_50') {
      const char = state.gameData.characters[targetId];
      if (char) {
        const newStats = { ...char.stats, hp: Math.min(char.stats.maxHp, char.stats.hp + 50) };
        dispatch({ type: 'UPDATE_CHARACTER_STATS', characterId: targetId, stats: newStats });
      }
    }
  }, [state.gameData.items, state.gameData.characters, state.inventory]);

  // Backwards-compatible dialogue object
  const activeDialogue: Dialogue | null = state.activeDialogueId
    ? state.gameData.dialogues[state.activeDialogueId] || null
    : null;

  const gameState: GameState = {
    currentMapId: state.currentMapId,
    playerPosition: state.playerPosition,
    playerDirection: state.playerDirection,
    flags: state.flags,
    inventory: state.inventory,
    dialogueHistory: state.dialogueHistory,
    playtime: state.playtime,
    savedAt: state.savedAt,
    characterLevels: state.characterLevels,
    gold: state.gold,
  };

  return {
    gameData: state.gameData,
    gameState,
    currentMap,
    activeDialogue,
    dialogueIndex: state.dialogueIndex,
    displayedText: state.displayedText,
    isTyping: state.isTyping,
    isPaused: state.isPaused,
    isWalking: state.isWalking,
    showModMenu: state.showModMenu,
    setShowModMenu: (show: boolean) => dispatch({ type: 'SET_MOD_MENU', show }),
    movePlayer,
    interact,
    selectChoice,
    setIsPaused: (paused: boolean) => dispatch({ type: 'SET_PAUSED', paused }),
    getTileAt,
    getNpcAt,
    exportGameData,
    importGameData,
    resetGame,
    saveGame,
    setGameData,
    spatialHash,
    insertMonstersIntoHash,
    awardCombatRewards,
    useItem,
    dispatch,
  };
};
