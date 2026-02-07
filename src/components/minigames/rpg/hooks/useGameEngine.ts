import { useState, useCallback, useEffect, useRef } from 'react';
import { GameState, GameData, Position, Dialogue, Character, Tile } from '../types/GameTypes';
import { defaultSprites, defaultTiles } from '../data/defaultSprites';
import { defaultDialogues, defaultCharacters, defaultItems } from '../data/defaultDialogues';
import { defaultMaps } from '../data/defaultMap';

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

const createInitialState = (gameData: GameData): GameState => {
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
  };
};

export const useGameEngine = () => {
  const [gameData, setGameData] = useState<GameData>(initialGameData);
  const [gameState, setGameState] = useState<GameState>(() => createInitialState(initialGameData));
  const [activeDialogue, setActiveDialogue] = useState<Dialogue | null>(null);
  const [dialogueIndex, setDialogueIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [displayedText, setDisplayedText] = useState('');
  const [isPaused, setIsPaused] = useState(false);
  const [showModMenu, setShowModMenu] = useState(false);
  
  const keysPressed = useRef<Set<string>>(new Set());
  const lastMoveTime = useRef(0);
  const animationFrame = useRef(0);

  // Load saved state
  useEffect(() => {
    try {
      const savedState = localStorage.getItem(STORAGE_KEY);
      if (savedState) {
        setGameState(JSON.parse(savedState));
      }
      
      const savedMods = localStorage.getItem(MODS_KEY);
      if (savedMods) {
        const moddedData = JSON.parse(savedMods);
        setGameData(prev => ({ ...prev, ...moddedData }));
      }
    } catch (e) {
      console.error('Failed to load game state:', e);
    }
  }, []);

  // Auto-save
  useEffect(() => {
    const saveInterval = setInterval(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        ...gameState,
        savedAt: Date.now(),
      }));
    }, 10000);

    return () => clearInterval(saveInterval);
  }, [gameState]);

  // Get current map
  const currentMap = gameData.maps[gameState.currentMapId];
  
  // Get tile at position
  const getTileAt = useCallback((x: number, y: number): Tile | null => {
    if (!currentMap) return null;
    const groundLayer = currentMap.layers.find(l => l.name === 'ground');
    if (!groundLayer || y < 0 || y >= groundLayer.tiles.length || x < 0 || x >= groundLayer.tiles[0].length) {
      return null;
    }
    const tileId = groundLayer.tiles[y][x];
    return tileId ? gameData.tiles[tileId] : null;
  }, [currentMap, gameData.tiles]);

  // Check NPC at position
  const getNpcAt = useCallback((x: number, y: number): Character | null => {
    if (!currentMap) return null;
    for (const npcId of currentMap.npcs) {
      const npc = gameData.characters[npcId];
      if (npc && npc.position.x === x && npc.position.y === y) {
        return npc;
      }
    }
    return null;
  }, [currentMap, gameData.characters]);

  // Check if position is walkable
  const canMoveTo = useCallback((x: number, y: number): boolean => {
    const tile = getTileAt(x, y);
    if (!tile || tile.solid) return false;
    
    // Check for NPCs
    const npc = getNpcAt(x, y);
    if (npc) return false;
    
    return true;
  }, [getTileAt, getNpcAt]);

  // Move player
  const movePlayer = useCallback((direction: 'up' | 'down' | 'left' | 'right') => {
    if (activeDialogue || isPaused) return;

    const now = Date.now();
    if (now - lastMoveTime.current < 150) return;
    lastMoveTime.current = now;

    setGameState(prev => {
      const newPos = { ...prev.playerPosition };
      
      switch (direction) {
        case 'up': newPos.y -= 1; break;
        case 'down': newPos.y += 1; break;
        case 'left': newPos.x -= 1; break;
        case 'right': newPos.x += 1; break;
      }

      if (canMoveTo(newPos.x, newPos.y)) {
        return {
          ...prev,
          playerPosition: newPos,
          playerDirection: direction,
        };
      }
      
      return { ...prev, playerDirection: direction };
    });
  }, [activeDialogue, isPaused, canMoveTo]);

  // Interact with what's in front of player
  const interact = useCallback(() => {
    if (activeDialogue) {
      // Advance dialogue
      if (isTyping) {
        setIsTyping(false);
        const currentLine = activeDialogue.lines[dialogueIndex];
        setDisplayedText(currentLine.text);
      } else if (dialogueIndex < activeDialogue.lines.length - 1) {
        setDialogueIndex(prev => prev + 1);
        setIsTyping(true);
        setDisplayedText('');
      } else if (activeDialogue.choices && activeDialogue.choices.length > 0) {
        // Show choices - handled in UI
      } else {
        // End dialogue
        if (activeDialogue.setFlag) {
          setGameState(prev => ({
            ...prev,
            flags: { ...prev.flags, [activeDialogue.setFlag!]: true },
            dialogueHistory: [...prev.dialogueHistory, activeDialogue.id],
          }));
        }
        if (activeDialogue.nextDialogueId) {
          const nextDialogue = gameData.dialogues[activeDialogue.nextDialogueId];
          if (nextDialogue) {
            setActiveDialogue(nextDialogue);
            setDialogueIndex(0);
            setIsTyping(true);
            setDisplayedText('');
            return;
          }
        }
        setActiveDialogue(null);
        setDialogueIndex(0);
      }
      return;
    }

    // Check what's in front of player
    const facingPos = { ...gameState.playerPosition };
    switch (gameState.playerDirection) {
      case 'up': facingPos.y -= 1; break;
      case 'down': facingPos.y += 1; break;
      case 'left': facingPos.x -= 1; break;
      case 'right': facingPos.x += 1; break;
    }

    // Check for NPC
    const npc = getNpcAt(facingPos.x, facingPos.y);
    if (npc && npc.dialogueIds.length > 0) {
      const dialogueId = npc.dialogueIds[0];
      const dialogue = gameData.dialogues[dialogueId];
      if (dialogue) {
        setActiveDialogue(dialogue);
        setDialogueIndex(0);
        setIsTyping(true);
        setDisplayedText('');
        return;
      }
    }

    // Check for interactive tile
    const tile = getTileAt(facingPos.x, facingPos.y);
    if (tile && tile.interactable && tile.interactionType === 'dialogue' && tile.interactionData) {
      const dialogue = gameData.dialogues[tile.interactionData];
      if (dialogue) {
        setActiveDialogue(dialogue);
        setDialogueIndex(0);
        setIsTyping(true);
        setDisplayedText('');
      }
    }
  }, [activeDialogue, dialogueIndex, isTyping, gameState, gameData.dialogues, getNpcAt, getTileAt]);

  // Select dialogue choice
  const selectChoice = useCallback((choiceIndex: number) => {
    if (!activeDialogue || !activeDialogue.choices) return;
    
    const choice = activeDialogue.choices[choiceIndex];
    if (choice.setFlag) {
      setGameState(prev => ({
        ...prev,
        flags: { ...prev.flags, [choice.setFlag!]: true },
      }));
    }
    
    const nextDialogue = gameData.dialogues[choice.nextDialogueId];
    if (nextDialogue) {
      setActiveDialogue(nextDialogue);
      setDialogueIndex(0);
      setIsTyping(true);
      setDisplayedText('');
    } else {
      setActiveDialogue(null);
      setDialogueIndex(0);
    }
  }, [activeDialogue, gameData.dialogues]);

  // Typing effect for dialogue
  useEffect(() => {
    if (!activeDialogue || !isTyping) return;
    
    const currentLine = activeDialogue.lines[dialogueIndex];
    if (!currentLine) return;
    
    const fullText = currentLine.text;
    let charIndex = displayedText.length;
    
    if (charIndex >= fullText.length) {
      setIsTyping(false);
      return;
    }

    const timer = setTimeout(() => {
      setDisplayedText(fullText.substring(0, charIndex + 1));
    }, gameData.config.dialogueSpeed);

    return () => clearTimeout(timer);
  }, [activeDialogue, dialogueIndex, displayedText, isTyping, gameData.config.dialogueSpeed]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current.add(e.key.toLowerCase());
      
      if (e.key === ' ' || e.key === 'Enter' || e.key === 'z') {
        e.preventDefault();
        interact();
      }
      if (e.key === 'Escape') {
        if (activeDialogue) {
          setActiveDialogue(null);
          setDialogueIndex(0);
        } else {
          setIsPaused(prev => !prev);
        }
      }
      if (e.key === 'm' || e.key === 'M') {
        if (!activeDialogue) {
          setShowModMenu(prev => !prev);
        }
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
  }, [interact, activeDialogue]);

  // Movement loop
  useEffect(() => {
    const gameLoop = () => {
      if (!isPaused && !activeDialogue) {
        if (keysPressed.current.has('arrowup') || keysPressed.current.has('w')) {
          movePlayer('up');
        } else if (keysPressed.current.has('arrowdown') || keysPressed.current.has('s')) {
          movePlayer('down');
        } else if (keysPressed.current.has('arrowleft') || keysPressed.current.has('a')) {
          movePlayer('left');
        } else if (keysPressed.current.has('arrowright') || keysPressed.current.has('d')) {
          movePlayer('right');
        }
      }
      animationFrame.current = requestAnimationFrame(gameLoop);
    };

    animationFrame.current = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animationFrame.current);
  }, [movePlayer, isPaused, activeDialogue]);

  // Export game data
  const exportGameData = useCallback(() => {
    const exportData = {
      gameData,
      gameState,
      exportedAt: Date.now(),
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'rpg_mod_data.json';
    a.click();
    URL.revokeObjectURL(url);
  }, [gameData, gameState]);

  // Import game data
  const importGameData = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (data.gameData) {
          setGameData(prev => ({ ...prev, ...data.gameData }));
          localStorage.setItem(MODS_KEY, JSON.stringify(data.gameData));
        }
        if (data.gameState) {
          setGameState(data.gameState);
        }
      } catch (err) {
        console.error('Failed to import mod:', err);
      }
    };
    reader.readAsText(file);
  }, []);

  // Reset to defaults
  const resetGame = useCallback(() => {
    setGameData(initialGameData);
    setGameState(createInitialState(initialGameData));
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(MODS_KEY);
  }, []);

  // Save current state
  const saveGame = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      ...gameState,
      savedAt: Date.now(),
    }));
  }, [gameState]);

  return {
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
    getTileAt,
    getNpcAt,
    exportGameData,
    importGameData,
    resetGame,
    saveGame,
    setGameData,
  };
};
