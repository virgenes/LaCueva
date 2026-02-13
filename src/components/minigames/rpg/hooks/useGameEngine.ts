import { useReducer, useCallback, useEffect, useRef, useMemo } from 'react';
import { GameData, Dialogue, Character, Tile } from '../types/GameTypes';
import { EngineState } from '../types/GameActions';
import { gameReducer, getTileAtPure, getNpcAtPure } from './gameReducer';
import { useDialogueManager } from './useDialogueManager';
import { defaultSprites, defaultTiles } from '../data/defaultSprites';
import { defaultDialogues, defaultCharacters, defaultItems } from '../data/defaultDialogues';
import { defaultMaps } from '../data/defaultMap';
import { imageTiles, isImageTile, ImageTile } from '../data/imageTiles';
import { SpatialHash, SpatialEntity } from '../systems/SpatialHash';

const STORAGE_KEY = 'rpg_game_state';
const MODS_KEY = 'rpg_game_mods';

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
    activeDialogueId: null,
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

  // Dialogue typing effect — delegated to specialized hook
  useDialogueManager(state, dispatch);

  // Load saved state on mount
  useEffect(() => {
    try {
      let loadedData = initialGameData;
      const savedMods = localStorage.getItem(MODS_KEY);
      if (savedMods) {
        loadedData = { ...initialGameData, ...JSON.parse(savedMods) };
        dispatch({ type: 'UPDATE_GAME_DATA', data: loadedData });
      }
      const savedState = localStorage.getItem(STORAGE_KEY);
      if (savedState) {
        const parsed = JSON.parse(savedState);
        dispatch({
          type: 'LOAD_STATE',
          payload: {
            currentMapId: parsed.currentMapId,
            playerPosition: parsed.playerPosition,
            playerDirection: parsed.playerDirection,
            flags: parsed.flags,
            inventory: parsed.inventory,
            dialogueHistory: parsed.dialogueHistory,
            playtime: parsed.playtime,
            savedAt: parsed.savedAt,
          },
        });
      }
    } catch (e) {
      console.error('Failed to load game state:', e);
    }
  }, []);

  // Auto-save every 10s
  useEffect(() => {
    const interval = setInterval(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        currentMapId: state.currentMapId,
        playerPosition: state.playerPosition,
        playerDirection: state.playerDirection,
        flags: state.flags,
        inventory: state.inventory,
        dialogueHistory: state.dialogueHistory,
        playtime: state.playtime,
        savedAt: Date.now(),
      }));
    }, 10000);
    return () => clearInterval(interval);
  }, [state.currentMapId, state.playerPosition, state.playerDirection, state.flags, state.inventory, state.dialogueHistory, state.playtime]);

  const currentMap = state.gameData.maps[state.currentMapId];

  // ===== SPATIAL HASH =====
  // Rebuild when map or NPC positions change
  const spatialHash = useMemo(() => {
    const hash = new SpatialHash(16);
    if (!currentMap) return hash;

    // Insert NPCs
    for (const npcId of currentMap.npcs) {
      const npc = state.gameData.characters[npcId];
      if (npc) {
        hash.insert({ id: npcId, x: npc.position.x, y: npc.position.y, type: 'npc' });
      }
    }

    return hash;
  }, [currentMap?.id, currentMap?.npcs, state.gameData.characters]);

  // Method to insert monsters into spatialHash (called by RPGGame when monsters are generated)
  const insertMonstersIntoHash = useCallback((monsters: Array<{ id: string; position: { x: number; y: number } }>) => {
    // Remove old monsters
    // Note: spatialHash is recreated on map change, so old monsters are automatically cleaned
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
          localStorage.setItem(MODS_KEY, JSON.stringify(data.gameData));
        }
      } catch (err) {
        console.error('Failed to import mod:', err);
      }
    };
    reader.readAsText(file);
  }, [state.gameData]);

  const resetGame = useCallback(() => {
    dispatch({ type: 'RESET', initialState: createInitialEngineState(initialGameData) });
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(MODS_KEY);
  }, []);

  const saveGame = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      currentMapId: state.currentMapId,
      playerPosition: state.playerPosition,
      playerDirection: state.playerDirection,
      flags: state.flags,
      inventory: state.inventory,
      dialogueHistory: state.dialogueHistory,
      playtime: state.playtime,
      savedAt: Date.now(),
    }));
  }, [state]);

  const setGameData = useCallback((dataOrFn: GameData | ((prev: GameData) => GameData)) => {
    if (typeof dataOrFn === 'function') {
      dispatch({ type: 'UPDATE_GAME_DATA', data: dataOrFn(state.gameData) });
    } else {
      dispatch({ type: 'UPDATE_GAME_DATA', data: dataOrFn });
    }
  }, [state.gameData]);

  // Backwards-compatible dialogue object
  const activeDialogue: Dialogue | null = state.activeDialogueId
    ? state.gameData.dialogues[state.activeDialogueId] || null
    : null;

  const gameState = {
    currentMapId: state.currentMapId,
    playerPosition: state.playerPosition,
    playerDirection: state.playerDirection,
    flags: state.flags,
    inventory: state.inventory,
    dialogueHistory: state.dialogueHistory,
    playtime: state.playtime,
    savedAt: state.savedAt,
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
  };
};
