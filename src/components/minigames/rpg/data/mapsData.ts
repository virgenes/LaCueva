import { GameMap, Tile } from '../types/GameTypes';

// Additional tile definitions for new maps
const COLORS = {
  transparent: 'transparent',
  // Classroom tiles
  woodFloorDark: '#5c3d2e',
  woodFloorLight: '#7a5c47',
  desk: '#8b7355',
  deskTop: '#a0896b',
  chalkboard: '#2d4a3e',
  chalkboardFrame: '#5c3d2e',
  windowFrame: '#8b7355',
  windowGlass: '#87CEEB',
  wallBeige: '#d4c4a8',
  wallTrim: '#b8a88c',
  // Forest tiles
  grass: '#2d5a27',
  grassDark: '#1f4a1a',
  treeTrunk: '#5c3d2e',
  treeLeaves: '#2d7a27',
  treeLeavesLight: '#3d8a37',
  path: '#a08060',
  pathDark: '#8b7050',
  bushGreen: '#1d6a17',
  flower: '#ff6b9d',
  // Cave tiles
  caveDark: '#1a1a2e',
  caveWall: '#3a3a4e',
  caveFloor: '#2a2a3e',
  crystal: '#00fff5',
  crystalDark: '#00b3a8',
  lava: '#ff4500',
  lavaDark: '#cc3700',
  // House tiles
  carpet: '#8b2942',
  carpetPattern: '#6b1932',
  furniture: '#5c3d2e',
  bedsheet: '#87CEEB',
};

const C = COLORS;
const T = COLORS.transparent;

// Classroom floor tile
export const classroomFloorTile: Tile = {
  id: 'classroom_floor',
  solid: false,
  interactable: false,
  sprite: [
    [C.woodFloorDark, C.woodFloorLight, C.woodFloorDark, C.woodFloorLight, C.woodFloorDark, C.woodFloorLight, C.woodFloorDark, C.woodFloorLight],
    [C.woodFloorDark, C.woodFloorLight, C.woodFloorDark, C.woodFloorLight, C.woodFloorDark, C.woodFloorLight, C.woodFloorDark, C.woodFloorLight],
    [C.woodFloorLight, C.woodFloorDark, C.woodFloorLight, C.woodFloorDark, C.woodFloorLight, C.woodFloorDark, C.woodFloorLight, C.woodFloorDark],
    [C.woodFloorLight, C.woodFloorDark, C.woodFloorLight, C.woodFloorDark, C.woodFloorLight, C.woodFloorDark, C.woodFloorLight, C.woodFloorDark],
    [C.woodFloorDark, C.woodFloorLight, C.woodFloorDark, C.woodFloorLight, C.woodFloorDark, C.woodFloorLight, C.woodFloorDark, C.woodFloorLight],
    [C.woodFloorDark, C.woodFloorLight, C.woodFloorDark, C.woodFloorLight, C.woodFloorDark, C.woodFloorLight, C.woodFloorDark, C.woodFloorLight],
    [C.woodFloorLight, C.woodFloorDark, C.woodFloorLight, C.woodFloorDark, C.woodFloorLight, C.woodFloorDark, C.woodFloorLight, C.woodFloorDark],
    [C.woodFloorLight, C.woodFloorDark, C.woodFloorLight, C.woodFloorDark, C.woodFloorLight, C.woodFloorDark, C.woodFloorLight, C.woodFloorDark],
  ],
};

export const deskTile: Tile = {
  id: 'desk',
  solid: true,
  interactable: true,
  interactionType: 'dialogue',
  interactionData: 'desk_examine',
  sprite: [
    [C.deskTop, C.deskTop, C.deskTop, C.deskTop, C.deskTop, C.deskTop, C.deskTop, C.deskTop],
    [C.deskTop, C.deskTop, C.deskTop, C.deskTop, C.deskTop, C.deskTop, C.deskTop, C.deskTop],
    [C.desk, C.desk, C.desk, C.desk, C.desk, C.desk, C.desk, C.desk],
    [C.desk, T, T, T, T, T, T, C.desk],
    [C.desk, T, T, T, T, T, T, C.desk],
    [C.desk, T, T, T, T, T, T, C.desk],
    [C.desk, T, T, T, T, T, T, C.desk],
    [C.desk, C.desk, T, T, T, T, C.desk, C.desk],
  ],
};

export const chalkboardTile: Tile = {
  id: 'chalkboard',
  solid: true,
  interactable: true,
  interactionType: 'dialogue',
  interactionData: 'chalkboard_read',
  sprite: [
    [C.chalkboardFrame, C.chalkboardFrame, C.chalkboardFrame, C.chalkboardFrame, C.chalkboardFrame, C.chalkboardFrame, C.chalkboardFrame, C.chalkboardFrame],
    [C.chalkboardFrame, C.chalkboard, C.chalkboard, C.chalkboard, C.chalkboard, C.chalkboard, C.chalkboard, C.chalkboardFrame],
    [C.chalkboardFrame, C.chalkboard, C.wallBeige, C.chalkboard, C.wallBeige, C.chalkboard, C.chalkboard, C.chalkboardFrame],
    [C.chalkboardFrame, C.chalkboard, C.chalkboard, C.chalkboard, C.chalkboard, C.wallBeige, C.chalkboard, C.chalkboardFrame],
    [C.chalkboardFrame, C.chalkboard, C.wallBeige, C.chalkboard, C.chalkboard, C.chalkboard, C.chalkboard, C.chalkboardFrame],
    [C.chalkboardFrame, C.chalkboard, C.chalkboard, C.chalkboard, C.wallBeige, C.chalkboard, C.chalkboard, C.chalkboardFrame],
    [C.chalkboardFrame, C.chalkboard, C.chalkboard, C.chalkboard, C.chalkboard, C.chalkboard, C.chalkboard, C.chalkboardFrame],
    [C.chalkboardFrame, C.chalkboardFrame, C.chalkboardFrame, C.chalkboardFrame, C.chalkboardFrame, C.chalkboardFrame, C.chalkboardFrame, C.chalkboardFrame],
  ],
};

export const windowTile: Tile = {
  id: 'window',
  solid: true,
  interactable: false,
  sprite: [
    [C.windowFrame, C.windowFrame, C.windowFrame, C.windowFrame, C.windowFrame, C.windowFrame, C.windowFrame, C.windowFrame],
    [C.windowFrame, C.windowGlass, C.windowGlass, C.windowFrame, C.windowGlass, C.windowGlass, C.windowGlass, C.windowFrame],
    [C.windowFrame, C.windowGlass, C.windowGlass, C.windowFrame, C.windowGlass, C.windowGlass, C.windowGlass, C.windowFrame],
    [C.windowFrame, C.windowFrame, C.windowFrame, C.windowFrame, C.windowFrame, C.windowFrame, C.windowFrame, C.windowFrame],
    [C.windowFrame, C.windowGlass, C.windowGlass, C.windowFrame, C.windowGlass, C.windowGlass, C.windowGlass, C.windowFrame],
    [C.windowFrame, C.windowGlass, C.windowGlass, C.windowFrame, C.windowGlass, C.windowGlass, C.windowGlass, C.windowFrame],
    [C.windowFrame, C.windowFrame, C.windowFrame, C.windowFrame, C.windowFrame, C.windowFrame, C.windowFrame, C.windowFrame],
    [C.wallBeige, C.wallBeige, C.wallBeige, C.wallBeige, C.wallBeige, C.wallBeige, C.wallBeige, C.wallBeige],
  ],
};

export const wallTile: Tile = {
  id: 'wall',
  solid: true,
  interactable: false,
  sprite: [
    [C.wallBeige, C.wallBeige, C.wallBeige, C.wallBeige, C.wallBeige, C.wallBeige, C.wallBeige, C.wallBeige],
    [C.wallBeige, C.wallBeige, C.wallBeige, C.wallBeige, C.wallBeige, C.wallBeige, C.wallBeige, C.wallBeige],
    [C.wallBeige, C.wallBeige, C.wallBeige, C.wallBeige, C.wallBeige, C.wallBeige, C.wallBeige, C.wallBeige],
    [C.wallBeige, C.wallBeige, C.wallBeige, C.wallBeige, C.wallBeige, C.wallBeige, C.wallBeige, C.wallBeige],
    [C.wallBeige, C.wallBeige, C.wallBeige, C.wallBeige, C.wallBeige, C.wallBeige, C.wallBeige, C.wallBeige],
    [C.wallBeige, C.wallBeige, C.wallBeige, C.wallBeige, C.wallBeige, C.wallBeige, C.wallBeige, C.wallBeige],
    [C.wallTrim, C.wallTrim, C.wallTrim, C.wallTrim, C.wallTrim, C.wallTrim, C.wallTrim, C.wallTrim],
    [C.wallTrim, C.wallTrim, C.wallTrim, C.wallTrim, C.wallTrim, C.wallTrim, C.wallTrim, C.wallTrim],
  ],
};

// Forest tiles
export const forestPathTile: Tile = {
  id: 'forest_path',
  solid: false,
  interactable: false,
  sprite: [
    [C.path, C.pathDark, C.path, C.path, C.pathDark, C.path, C.path, C.pathDark],
    [C.pathDark, C.path, C.path, C.pathDark, C.path, C.path, C.pathDark, C.path],
    [C.path, C.path, C.pathDark, C.path, C.path, C.pathDark, C.path, C.path],
    [C.path, C.pathDark, C.path, C.path, C.pathDark, C.path, C.path, C.pathDark],
    [C.pathDark, C.path, C.path, C.pathDark, C.path, C.path, C.pathDark, C.path],
    [C.path, C.path, C.pathDark, C.path, C.path, C.pathDark, C.path, C.path],
    [C.path, C.pathDark, C.path, C.path, C.pathDark, C.path, C.path, C.pathDark],
    [C.pathDark, C.path, C.path, C.pathDark, C.path, C.path, C.pathDark, C.path],
  ],
};

export const forestGrassTile: Tile = {
  id: 'forest_grass',
  solid: false,
  interactable: false,
  sprite: [
    [C.grass, C.grassDark, C.grass, C.grass, C.grassDark, C.grass, C.grass, C.grassDark],
    [C.grassDark, C.grass, C.grass, C.grassDark, C.grass, C.grass, C.grassDark, C.grass],
    [C.grass, C.grass, C.grassDark, C.grass, C.grass, C.grassDark, C.grass, C.grass],
    [C.grass, C.grassDark, C.grass, C.grass, C.grassDark, C.grass, C.grass, C.grassDark],
    [C.grassDark, C.grass, C.grass, C.grassDark, C.grass, C.grass, C.grassDark, C.grass],
    [C.grass, C.grass, C.grassDark, C.grass, C.grass, C.grassDark, C.grass, C.grass],
    [C.grass, C.grassDark, C.grass, C.grass, C.grassDark, C.grass, C.grass, C.grassDark],
    [C.grassDark, C.grass, C.grass, C.grassDark, C.grass, C.grass, C.grassDark, C.grass],
  ],
};

export const treeTile: Tile = {
  id: 'tree',
  solid: true,
  interactable: false,
  sprite: [
    [T, C.treeLeaves, C.treeLeavesLight, C.treeLeaves, C.treeLeavesLight, C.treeLeaves, C.treeLeavesLight, T],
    [C.treeLeaves, C.treeLeavesLight, C.treeLeaves, C.treeLeavesLight, C.treeLeaves, C.treeLeavesLight, C.treeLeaves, C.treeLeavesLight],
    [C.treeLeavesLight, C.treeLeaves, C.treeLeavesLight, C.treeLeaves, C.treeLeavesLight, C.treeLeaves, C.treeLeavesLight, C.treeLeaves],
    [C.treeLeaves, C.treeLeavesLight, C.treeLeaves, C.treeLeavesLight, C.treeLeaves, C.treeLeavesLight, C.treeLeaves, C.treeLeavesLight],
    [T, C.treeLeaves, C.treeLeavesLight, C.treeLeaves, C.treeLeavesLight, C.treeLeaves, C.treeLeavesLight, T],
    [T, T, T, C.treeTrunk, C.treeTrunk, T, T, T],
    [T, T, T, C.treeTrunk, C.treeTrunk, T, T, T],
    [T, T, T, C.treeTrunk, C.treeTrunk, T, T, T],
  ],
};

export const bushTile: Tile = {
  id: 'bush',
  solid: true,
  interactable: false,
  sprite: [
    [T, T, C.bushGreen, C.bushGreen, C.bushGreen, C.bushGreen, T, T],
    [T, C.bushGreen, C.bushGreen, C.bushGreen, C.bushGreen, C.bushGreen, C.bushGreen, T],
    [C.bushGreen, C.bushGreen, C.bushGreen, C.flower, C.bushGreen, C.bushGreen, C.bushGreen, C.bushGreen],
    [C.bushGreen, C.bushGreen, C.bushGreen, C.bushGreen, C.bushGreen, C.flower, C.bushGreen, C.bushGreen],
    [C.bushGreen, C.flower, C.bushGreen, C.bushGreen, C.bushGreen, C.bushGreen, C.bushGreen, C.bushGreen],
    [C.bushGreen, C.bushGreen, C.bushGreen, C.bushGreen, C.bushGreen, C.bushGreen, C.bushGreen, C.bushGreen],
    [T, C.bushGreen, C.bushGreen, C.bushGreen, C.bushGreen, C.bushGreen, C.bushGreen, T],
    [T, T, C.bushGreen, C.bushGreen, C.bushGreen, C.bushGreen, T, T],
  ],
};

// Cave tiles
export const caveFloorTile: Tile = {
  id: 'cave_floor',
  solid: false,
  interactable: false,
  sprite: [
    [C.caveFloor, C.caveDark, C.caveFloor, C.caveFloor, C.caveDark, C.caveFloor, C.caveFloor, C.caveDark],
    [C.caveDark, C.caveFloor, C.caveFloor, C.caveDark, C.caveFloor, C.caveFloor, C.caveDark, C.caveFloor],
    [C.caveFloor, C.caveFloor, C.caveDark, C.caveFloor, C.caveFloor, C.caveDark, C.caveFloor, C.caveFloor],
    [C.caveFloor, C.caveDark, C.caveFloor, C.caveFloor, C.caveDark, C.caveFloor, C.caveFloor, C.caveDark],
    [C.caveDark, C.caveFloor, C.caveFloor, C.caveDark, C.caveFloor, C.caveFloor, C.caveDark, C.caveFloor],
    [C.caveFloor, C.caveFloor, C.caveDark, C.caveFloor, C.caveFloor, C.caveDark, C.caveFloor, C.caveFloor],
    [C.caveFloor, C.caveDark, C.caveFloor, C.caveFloor, C.caveDark, C.caveFloor, C.caveFloor, C.caveDark],
    [C.caveDark, C.caveFloor, C.caveFloor, C.caveDark, C.caveFloor, C.caveFloor, C.caveDark, C.caveFloor],
  ],
};

export const caveWallTile: Tile = {
  id: 'cave_wall',
  solid: true,
  interactable: false,
  sprite: [
    [C.caveWall, C.caveDark, C.caveWall, C.caveWall, C.caveDark, C.caveWall, C.caveWall, C.caveDark],
    [C.caveWall, C.caveWall, C.caveDark, C.caveWall, C.caveWall, C.caveWall, C.caveDark, C.caveWall],
    [C.caveDark, C.caveWall, C.caveWall, C.caveDark, C.caveWall, C.caveDark, C.caveWall, C.caveWall],
    [C.caveWall, C.caveWall, C.caveWall, C.caveWall, C.caveWall, C.caveWall, C.caveWall, C.caveWall],
    [C.caveWall, C.caveDark, C.caveWall, C.caveWall, C.caveDark, C.caveWall, C.caveWall, C.caveDark],
    [C.caveDark, C.caveWall, C.caveWall, C.caveWall, C.caveWall, C.caveDark, C.caveWall, C.caveWall],
    [C.caveWall, C.caveWall, C.caveDark, C.caveWall, C.caveWall, C.caveWall, C.caveWall, C.caveDark],
    [C.caveWall, C.caveWall, C.caveWall, C.caveDark, C.caveWall, C.caveWall, C.caveDark, C.caveWall],
  ],
};

export const crystalTile: Tile = {
  id: 'crystal',
  solid: true,
  interactable: true,
  interactionType: 'dialogue',
  interactionData: 'crystal_examine',
  sprite: [
    [T, T, T, C.crystal, C.crystal, T, T, T],
    [T, T, C.crystal, C.crystalDark, C.crystalDark, C.crystal, T, T],
    [T, C.crystal, C.crystalDark, C.crystal, C.crystal, C.crystalDark, C.crystal, T],
    [T, C.crystal, C.crystal, C.crystalDark, C.crystalDark, C.crystal, C.crystal, T],
    [C.crystal, C.crystalDark, C.crystal, C.crystal, C.crystal, C.crystalDark, C.crystalDark, C.crystal],
    [C.crystal, C.crystal, C.crystalDark, C.crystalDark, C.crystalDark, C.crystal, C.crystal, C.crystal],
    [T, C.crystal, C.crystal, C.crystalDark, C.crystalDark, C.crystal, C.crystal, T],
    [T, T, C.crystalDark, C.crystalDark, C.crystalDark, C.crystalDark, T, T],
  ],
};

// House tiles
export const carpetTile: Tile = {
  id: 'carpet',
  solid: false,
  interactable: false,
  sprite: [
    [C.carpet, C.carpetPattern, C.carpet, C.carpetPattern, C.carpet, C.carpetPattern, C.carpet, C.carpetPattern],
    [C.carpetPattern, C.carpet, C.carpetPattern, C.carpet, C.carpetPattern, C.carpet, C.carpetPattern, C.carpet],
    [C.carpet, C.carpetPattern, C.carpet, C.carpetPattern, C.carpet, C.carpetPattern, C.carpet, C.carpetPattern],
    [C.carpetPattern, C.carpet, C.carpetPattern, C.carpet, C.carpetPattern, C.carpet, C.carpetPattern, C.carpet],
    [C.carpet, C.carpetPattern, C.carpet, C.carpetPattern, C.carpet, C.carpetPattern, C.carpet, C.carpetPattern],
    [C.carpetPattern, C.carpet, C.carpetPattern, C.carpet, C.carpetPattern, C.carpet, C.carpetPattern, C.carpet],
    [C.carpet, C.carpetPattern, C.carpet, C.carpetPattern, C.carpet, C.carpetPattern, C.carpet, C.carpetPattern],
    [C.carpetPattern, C.carpet, C.carpetPattern, C.carpet, C.carpetPattern, C.carpet, C.carpetPattern, C.carpet],
  ],
};

export const bedTile: Tile = {
  id: 'bed',
  solid: true,
  interactable: true,
  interactionType: 'dialogue',
  interactionData: 'bed_rest',
  sprite: [
    [C.furniture, C.furniture, C.furniture, C.furniture, C.furniture, C.furniture, C.furniture, C.furniture],
    [C.furniture, C.bedsheet, C.bedsheet, C.bedsheet, C.bedsheet, C.bedsheet, C.bedsheet, C.furniture],
    [C.furniture, C.bedsheet, C.bedsheet, C.bedsheet, C.bedsheet, C.bedsheet, C.bedsheet, C.furniture],
    [C.furniture, C.bedsheet, C.bedsheet, C.bedsheet, C.bedsheet, C.bedsheet, C.bedsheet, C.furniture],
    [C.furniture, C.bedsheet, C.bedsheet, C.bedsheet, C.bedsheet, C.bedsheet, C.bedsheet, C.furniture],
    [C.furniture, C.bedsheet, C.bedsheet, C.bedsheet, C.bedsheet, C.bedsheet, C.bedsheet, C.furniture],
    [C.furniture, C.bedsheet, C.bedsheet, C.bedsheet, C.bedsheet, C.bedsheet, C.bedsheet, C.furniture],
    [C.furniture, C.furniture, C.furniture, C.furniture, C.furniture, C.furniture, C.furniture, C.furniture],
  ],
};

// Teleporter tile
export const teleporterTile: Tile = {
  id: 'teleporter',
  solid: false,
  interactable: true,
  interactionType: 'teleport',
  sprite: [
    [T, T, '#ff00ff', '#00ffff', '#00ffff', '#ff00ff', T, T],
    [T, '#ff00ff', '#00ffff', '#00ffff', '#00ffff', '#00ffff', '#ff00ff', T],
    ['#ff00ff', '#00ffff', '#00ffff', '#ff00ff', '#ff00ff', '#00ffff', '#00ffff', '#ff00ff'],
    ['#00ffff', '#00ffff', '#ff00ff', '#00ffff', '#00ffff', '#ff00ff', '#00ffff', '#00ffff'],
    ['#00ffff', '#00ffff', '#ff00ff', '#00ffff', '#00ffff', '#ff00ff', '#00ffff', '#00ffff'],
    ['#ff00ff', '#00ffff', '#00ffff', '#ff00ff', '#ff00ff', '#00ffff', '#00ffff', '#ff00ff'],
    [T, '#ff00ff', '#00ffff', '#00ffff', '#00ffff', '#00ffff', '#ff00ff', T],
    [T, T, '#ff00ff', '#00ffff', '#00ffff', '#ff00ff', T, T],
  ],
};

// Export all new tiles
export const additionalTiles = {
  classroom_floor: classroomFloorTile,
  desk: deskTile,
  chalkboard: chalkboardTile,
  window: windowTile,
  wall: wallTile,
  forest_path: forestPathTile,
  forest_grass: forestGrassTile,
  tree: treeTile,
  bush: bushTile,
  cave_floor: caveFloorTile,
  cave_wall: caveWallTile,
  crystal: crystalTile,
  carpet: carpetTile,
  bed: bedTile,
  teleporter: teleporterTile,
};

// Classroom Map (Japanese style)
export const classroomMap: GameMap = {
  id: 'classroom',
  name: 'School Classroom',
  nameEs: 'Aula Escolar',
  width: 12,
  height: 10,
  spawnPoint: { x: 5, y: 8 },
  npcs: ['matias', 'angel', 'alejandro', 'miguel', 'elias', 'maximo'],
  layers: [
    {
      name: 'ground',
      tiles: [
        ['wall', 'wall', 'chalkboard', 'chalkboard', 'chalkboard', 'chalkboard', 'chalkboard', 'chalkboard', 'wall', 'window', 'window', 'wall'],
        ['wall', 'classroom_floor', 'classroom_floor', 'classroom_floor', 'classroom_floor', 'classroom_floor', 'classroom_floor', 'classroom_floor', 'classroom_floor', 'classroom_floor', 'classroom_floor', 'wall'],
        ['wall', 'classroom_floor', 'desk', 'classroom_floor', 'desk', 'classroom_floor', 'desk', 'classroom_floor', 'desk', 'classroom_floor', 'classroom_floor', 'wall'],
        ['wall', 'classroom_floor', 'classroom_floor', 'classroom_floor', 'classroom_floor', 'classroom_floor', 'classroom_floor', 'classroom_floor', 'classroom_floor', 'classroom_floor', 'classroom_floor', 'wall'],
        ['wall', 'classroom_floor', 'desk', 'classroom_floor', 'desk', 'classroom_floor', 'desk', 'classroom_floor', 'desk', 'classroom_floor', 'classroom_floor', 'wall'],
        ['wall', 'classroom_floor', 'classroom_floor', 'classroom_floor', 'classroom_floor', 'classroom_floor', 'classroom_floor', 'classroom_floor', 'classroom_floor', 'classroom_floor', 'classroom_floor', 'wall'],
        ['wall', 'classroom_floor', 'desk', 'classroom_floor', 'desk', 'classroom_floor', 'desk', 'classroom_floor', 'desk', 'classroom_floor', 'classroom_floor', 'wall'],
        ['wall', 'classroom_floor', 'classroom_floor', 'classroom_floor', 'classroom_floor', 'classroom_floor', 'classroom_floor', 'classroom_floor', 'classroom_floor', 'classroom_floor', 'classroom_floor', 'wall'],
        ['wall', 'classroom_floor', 'classroom_floor', 'classroom_floor', 'classroom_floor', 'teleporter', 'classroom_floor', 'classroom_floor', 'classroom_floor', 'classroom_floor', 'classroom_floor', 'wall'],
        ['wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall'],
      ],
    },
  ],
};

// Forest Map
export const forestMap: GameMap = {
  id: 'forest',
  name: 'Mysterious Forest',
  nameEs: 'Bosque Misterioso',
  width: 14,
  height: 12,
  spawnPoint: { x: 7, y: 10 },
  npcs: [],
  layers: [
    {
      name: 'ground',
      tiles: [
        ['tree', 'tree', 'tree', 'tree', 'tree', 'tree', 'tree', 'tree', 'tree', 'tree', 'tree', 'tree', 'tree', 'tree'],
        ['tree', 'forest_grass', 'forest_grass', 'bush', 'forest_grass', 'forest_grass', 'forest_grass', 'forest_grass', 'forest_grass', 'bush', 'forest_grass', 'forest_grass', 'forest_grass', 'tree'],
        ['tree', 'forest_grass', 'forest_grass', 'forest_grass', 'forest_path', 'forest_path', 'forest_path', 'forest_path', 'forest_path', 'forest_grass', 'forest_grass', 'forest_grass', 'forest_grass', 'tree'],
        ['tree', 'bush', 'forest_grass', 'forest_path', 'forest_path', 'forest_grass', 'forest_grass', 'forest_grass', 'forest_path', 'forest_path', 'forest_grass', 'bush', 'forest_grass', 'tree'],
        ['tree', 'forest_grass', 'forest_grass', 'forest_path', 'forest_grass', 'forest_grass', 'tree', 'tree', 'forest_grass', 'forest_path', 'forest_grass', 'forest_grass', 'forest_grass', 'tree'],
        ['tree', 'forest_grass', 'forest_path', 'forest_path', 'forest_grass', 'tree', 'teleporter', 'forest_grass', 'forest_grass', 'forest_path', 'forest_path', 'forest_grass', 'forest_grass', 'tree'],
        ['tree', 'forest_grass', 'forest_path', 'forest_grass', 'forest_grass', 'forest_grass', 'forest_grass', 'forest_grass', 'forest_grass', 'forest_grass', 'forest_path', 'forest_grass', 'bush', 'tree'],
        ['tree', 'bush', 'forest_path', 'forest_grass', 'bush', 'forest_grass', 'forest_grass', 'forest_grass', 'bush', 'forest_grass', 'forest_path', 'forest_grass', 'forest_grass', 'tree'],
        ['tree', 'forest_grass', 'forest_path', 'forest_path', 'forest_grass', 'forest_grass', 'forest_grass', 'forest_grass', 'forest_grass', 'forest_path', 'forest_path', 'forest_grass', 'forest_grass', 'tree'],
        ['tree', 'forest_grass', 'forest_grass', 'forest_path', 'forest_path', 'forest_path', 'forest_path', 'forest_path', 'forest_path', 'forest_path', 'forest_grass', 'forest_grass', 'forest_grass', 'tree'],
        ['tree', 'forest_grass', 'forest_grass', 'forest_grass', 'forest_grass', 'forest_grass', 'teleporter', 'forest_grass', 'forest_grass', 'forest_grass', 'forest_grass', 'forest_grass', 'forest_grass', 'tree'],
        ['tree', 'tree', 'tree', 'tree', 'tree', 'tree', 'tree', 'tree', 'tree', 'tree', 'tree', 'tree', 'tree', 'tree'],
      ],
    },
  ],
};

// Cave Map
export const caveMap: GameMap = {
  id: 'cave',
  name: 'Crystal Cave',
  nameEs: 'Cueva de Cristales',
  width: 12,
  height: 10,
  spawnPoint: { x: 6, y: 8 },
  npcs: [],
  layers: [
    {
      name: 'ground',
      tiles: [
        ['cave_wall', 'cave_wall', 'cave_wall', 'cave_wall', 'cave_wall', 'cave_wall', 'cave_wall', 'cave_wall', 'cave_wall', 'cave_wall', 'cave_wall', 'cave_wall'],
        ['cave_wall', 'cave_floor', 'cave_floor', 'cave_floor', 'crystal', 'cave_floor', 'cave_floor', 'crystal', 'cave_floor', 'cave_floor', 'cave_floor', 'cave_wall'],
        ['cave_wall', 'cave_floor', 'cave_wall', 'cave_floor', 'cave_floor', 'cave_floor', 'cave_floor', 'cave_floor', 'cave_floor', 'cave_wall', 'cave_floor', 'cave_wall'],
        ['cave_wall', 'cave_floor', 'cave_floor', 'cave_floor', 'cave_wall', 'cave_floor', 'cave_floor', 'cave_wall', 'cave_floor', 'cave_floor', 'cave_floor', 'cave_wall'],
        ['cave_wall', 'crystal', 'cave_floor', 'cave_floor', 'cave_floor', 'cave_floor', 'cave_floor', 'cave_floor', 'cave_floor', 'cave_floor', 'crystal', 'cave_wall'],
        ['cave_wall', 'cave_floor', 'cave_floor', 'cave_wall', 'cave_floor', 'teleporter', 'cave_floor', 'cave_wall', 'cave_floor', 'cave_floor', 'cave_floor', 'cave_wall'],
        ['cave_wall', 'cave_floor', 'cave_floor', 'cave_floor', 'cave_floor', 'cave_floor', 'cave_floor', 'cave_floor', 'cave_floor', 'cave_floor', 'cave_floor', 'cave_wall'],
        ['cave_wall', 'cave_wall', 'cave_floor', 'cave_floor', 'cave_floor', 'cave_floor', 'cave_floor', 'cave_floor', 'cave_floor', 'cave_floor', 'cave_wall', 'cave_wall'],
        ['cave_wall', 'cave_floor', 'cave_floor', 'cave_floor', 'cave_floor', 'teleporter', 'cave_floor', 'cave_floor', 'cave_floor', 'cave_floor', 'cave_floor', 'cave_wall'],
        ['cave_wall', 'cave_wall', 'cave_wall', 'cave_wall', 'cave_wall', 'cave_wall', 'cave_wall', 'cave_wall', 'cave_wall', 'cave_wall', 'cave_wall', 'cave_wall'],
      ],
    },
  ],
};

// House Map
export const houseMap: GameMap = {
  id: 'house',
  name: 'Abandoned House',
  nameEs: 'Casa Abandonada',
  width: 10,
  height: 8,
  spawnPoint: { x: 5, y: 6 },
  npcs: [],
  layers: [
    {
      name: 'ground',
      tiles: [
        ['wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall'],
        ['wall', 'carpet', 'carpet', 'carpet', 'wall', 'carpet', 'carpet', 'bed', 'carpet', 'wall'],
        ['wall', 'carpet', 'desk', 'carpet', 'wall', 'carpet', 'carpet', 'carpet', 'carpet', 'wall'],
        ['wall', 'carpet', 'carpet', 'carpet', 'carpet', 'carpet', 'carpet', 'carpet', 'carpet', 'wall'],
        ['wall', 'carpet', 'carpet', 'carpet', 'carpet', 'carpet', 'desk', 'carpet', 'carpet', 'wall'],
        ['wall', 'carpet', 'carpet', 'carpet', 'carpet', 'carpet', 'carpet', 'carpet', 'carpet', 'wall'],
        ['wall', 'carpet', 'carpet', 'carpet', 'teleporter', 'carpet', 'carpet', 'carpet', 'carpet', 'wall'],
        ['wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall'],
      ],
    },
  ],
};

export const allMaps = {
  classroom: classroomMap,
  forest: forestMap,
  cave: caveMap,
  house: houseMap,
};
