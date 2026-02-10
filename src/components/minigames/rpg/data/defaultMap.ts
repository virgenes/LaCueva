import { GameMap } from '../types/GameTypes';

// Helper to generate large map grids with layered tiles
const createDetailedGrid = (
  width: number, 
  height: number, 
  defaultTile: string,
  borderTile: string,
  features: { x: number; y: number; tile: string }[]
): string[][] => {
  const grid: string[][] = [];
  for (let y = 0; y < height; y++) {
    const row: string[] = [];
    for (let x = 0; x < width; x++) {
      if (x === 0 || x === width - 1 || y === 0 || y === height - 1) {
        row.push(borderTile);
      } else {
        row.push(defaultTile);
      }
    }
    grid.push(row);
  }
  
  features.forEach(({ x, y, tile }) => {
    if (y >= 0 && y < height && x >= 0 && x < width) {
      grid[y][x] = tile;
    }
  });
  
  return grid;
};

// =====================================================
// MEMORY GARDEN - Expanded beautiful starting area (50x40)
// =====================================================
const memoryGardenFeatures: { x: number; y: number; tile: string }[] = [
  // === MAIN CENTRAL PLAZA ===
  ...Array.from({ length: 8 }, (_, i) => 
    Array.from({ length: 8 }, (_, j) => ({ x: 21 + j, y: 16 + i, tile: 'img_wood_floor' }))
  ).flat(),
  
  // Central fountain area (decorative)
  { x: 24, y: 19, tile: 'img_water' },
  { x: 25, y: 19, tile: 'img_water' },
  { x: 24, y: 20, tile: 'img_water' },
  { x: 25, y: 20, tile: 'img_water' },
  
  // Welcome sign at plaza
  { x: 25, y: 15, tile: 'img_sign' },
  
  // === MAIN PATHS (dirt roads) ===
  // North-south main road
  ...Array.from({ length: 35 }, (_, i) => ({ x: 25, y: 2 + i, tile: 'img_dirt' })),
  ...Array.from({ length: 35 }, (_, i) => ({ x: 24, y: 2 + i, tile: 'img_dirt' })),
  
  // East-west main road
  ...Array.from({ length: 45 }, (_, i) => ({ x: 2 + i, y: 20, tile: 'img_dirt' })),
  ...Array.from({ length: 45 }, (_, i) => ({ x: 2 + i, y: 19, tile: 'img_dirt' })),
  
  // === SECONDARY PATHS ===
  // Path to northwest garden
  ...Array.from({ length: 15 }, (_, i) => ({ x: 10, y: 5 + i, tile: 'img_dirt' })),
  ...Array.from({ length: 8 }, (_, i) => ({ x: 10 + i, y: 19, tile: 'img_dirt' })),
  
  // Path to southeast area
  ...Array.from({ length: 15 }, (_, i) => ({ x: 38, y: 20 + i, tile: 'img_dirt' })),
  
  // === TELEPORTERS ===
  { x: 48, y: 20, tile: 'teleporter' },  // East - to forest
  { x: 25, y: 1, tile: 'teleporter' },   // North - to classroom
  { x: 1, y: 20, tile: 'teleporter' },   // West - to cave
  { x: 25, y: 38, tile: 'teleporter' },  // South - to house
  
  // === LARGE POND AREA (northwest) ===
  ...Array.from({ length: 6 }, (_, i) => 
    Array.from({ length: 8 }, (_, j) => ({ x: 5 + j, y: 5 + i, tile: 'img_water' }))
  ).flat(),
  
  // === DECORATIVE BUSHES (scattered throughout) ===
  // Northern garden bushes
  { x: 15, y: 5, tile: 'img_bush' },
  { x: 17, y: 6, tile: 'img_bush' },
  { x: 16, y: 8, tile: 'img_bush' },
  { x: 18, y: 4, tile: 'img_bush' },
  { x: 14, y: 7, tile: 'img_bush' },
  
  // Eastern garden bushes
  { x: 35, y: 8, tile: 'img_bush' },
  { x: 37, y: 10, tile: 'img_bush' },
  { x: 40, y: 7, tile: 'img_bush' },
  { x: 42, y: 12, tile: 'img_bush' },
  { x: 38, y: 5, tile: 'img_bush' },
  { x: 44, y: 8, tile: 'img_bush' },
  
  // Southern garden bushes
  { x: 8, y: 30, tile: 'img_bush' },
  { x: 12, y: 32, tile: 'img_bush' },
  { x: 6, y: 34, tile: 'img_bush' },
  { x: 15, y: 35, tile: 'img_bush' },
  { x: 10, y: 28, tile: 'img_bush' },
  
  // Southeast bushes
  { x: 40, y: 28, tile: 'img_bush' },
  { x: 43, y: 30, tile: 'img_bush' },
  { x: 45, y: 32, tile: 'img_bush' },
  { x: 42, y: 35, tile: 'img_bush' },
  
  // Plaza surrounding bushes
  { x: 19, y: 15, tile: 'img_bush' },
  { x: 30, y: 15, tile: 'img_bush' },
  { x: 19, y: 24, tile: 'img_bush' },
  { x: 30, y: 24, tile: 'img_bush' },
  
  // === SECONDARY WATER FEATURES ===
  // Small pond southeast
  { x: 42, y: 25, tile: 'img_water' },
  { x: 43, y: 25, tile: 'img_water' },
  { x: 42, y: 26, tile: 'img_water' },
  { x: 43, y: 26, tile: 'img_water' },
  
  // Stream in south
  ...Array.from({ length: 10 }, (_, i) => ({ x: 15 + i, y: 32, tile: 'img_water' })),
  ...Array.from({ length: 8 }, (_, i) => ({ x: 17 + i, y: 33, tile: 'img_water' })),
];

export const memoryGardenMap: GameMap = {
  id: 'memory_garden',
  name: 'Memory Garden',
  nameEs: 'Jardín de la Memoria',
  width: 50,
  height: 40,
  spawnPoint: { x: 25, y: 25 },
  npcs: ['mysterious'],
  layers: [
    {
      name: 'ground',
      tiles: createDetailedGrid(50, 40, 'img_grass', 'img_stone', memoryGardenFeatures),
    },
  ],
  encounterRate: 0.03,
  possibleEncounters: ['slime', 'rabbit', 'bird'],
  events: [],
};

// =====================================================
// ENCHANTED FOREST - Dense mystical forest (60x50)
// =====================================================
const createForestGrid = (): string[][] => {
  const grid: string[][] = [];
  const width = 60;
  const height = 50;
  
  for (let y = 0; y < height; y++) {
    const row: string[] = [];
    for (let x = 0; x < width; x++) {
      // Thick forest border
      if (x <= 2 || x >= width - 3 || y <= 2 || y >= height - 3) {
        row.push('img_bush');
      } else {
        row.push('forest_grass');
      }
    }
    grid.push(row);
  }
  
  // Main winding path through forest
  const pathPoints = [
    // Entrance from west
    ...Array.from({ length: 20 }, (_, i) => ({ x: 3 + i, y: 25 })),
    ...Array.from({ length: 20 }, (_, i) => ({ x: 3 + i, y: 26 })),
    // Curve north
    ...Array.from({ length: 15 }, (_, i) => ({ x: 23, y: 11 + i })),
    ...Array.from({ length: 15 }, (_, i) => ({ x: 24, y: 11 + i })),
    // Continue east
    ...Array.from({ length: 30 }, (_, i) => ({ x: 25 + i, y: 25 })),
    ...Array.from({ length: 30 }, (_, i) => ({ x: 25 + i, y: 26 })),
    // Branch path south
    ...Array.from({ length: 18 }, (_, i) => ({ x: 40, y: 27 + i })),
    ...Array.from({ length: 18 }, (_, i) => ({ x: 41, y: 27 + i })),
  ];
  
  pathPoints.forEach(({ x, y }) => {
    if (y >= 0 && y < height && x >= 0 && x < width) {
      grid[y][x] = 'img_dirt';
    }
  });
  
  // Clearings (grass areas in forest)
  const clearings = [
    { cx: 15, cy: 15, r: 4 },
    { cx: 45, cy: 35, r: 5 },
    { cx: 35, cy: 12, r: 3 },
    { cx: 50, cy: 20, r: 4 },
  ];
  
  clearings.forEach(({ cx, cy, r }) => {
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (dx * dx + dy * dy <= r * r) {
          const x = cx + dx;
          const y = cy + dy;
          if (y > 2 && y < height - 3 && x > 2 && x < width - 3) {
            grid[y][x] = 'img_grass';
          }
        }
      }
    }
  });
  
  // Scattered bushes in forest
  const bushPositions = [
    { x: 10, y: 10 }, { x: 12, y: 8 }, { x: 8, y: 12 },
    { x: 18, y: 35 }, { x: 20, y: 38 }, { x: 15, y: 40 },
    { x: 50, y: 10 }, { x: 52, y: 8 }, { x: 48, y: 12 },
    { x: 30, y: 40 }, { x: 32, y: 42 }, { x: 28, y: 38 },
    { x: 10, y: 30 }, { x: 7, y: 35 }, { x: 12, y: 42 },
    { x: 45, y: 8 }, { x: 47, y: 6 }, { x: 43, y: 10 },
  ];
  
  bushPositions.forEach(({ x, y }) => {
    if (y > 2 && y < height - 3 && x > 2 && x < width - 3) {
      grid[y][x] = 'img_bush';
    }
  });
  
  // Water stream
  for (let i = 0; i < 25; i++) {
    const x = 5 + i;
    const y = 35 + Math.floor(Math.sin(i * 0.5) * 2);
    if (y > 2 && y < height - 3 && x > 2 && x < width - 3) {
      grid[y][x] = 'img_water';
      if (y + 1 < height - 3) grid[y + 1][x] = 'img_water';
    }
  }
  
  // Teleporters
  grid[25][3] = 'teleporter';  // West - back to garden
  grid[25][56] = 'teleporter'; // East - to cave
  grid[5][30] = 'teleporter';  // North - to secret area
  
  return grid;
};

export const forestMap: GameMap = {
  id: 'forest',
  name: 'Enchanted Forest',
  nameEs: 'Bosque Encantado',
  width: 60,
  height: 50,
  spawnPoint: { x: 5, y: 25 },
  npcs: ['forest_spirit'],
  layers: [
    {
      name: 'ground',
      tiles: createForestGrid(),
    },
  ],
  encounterRate: 0.08,
  possibleEncounters: ['wolf', 'sprite', 'mushroom', 'deer', 'rabbit', 'void_guardian'],
  events: [],
};

// =====================================================
// CRYSTAL CAVE - Deep underground cavern (55x45)
// =====================================================
const createCaveGrid = (): string[][] => {
  const grid: string[][] = [];
  const width = 55;
  const height = 45;
  
  for (let y = 0; y < height; y++) {
    const row: string[] = [];
    for (let x = 0; x < width; x++) {
      // Thick cave wall border
      if (x <= 2 || x >= width - 3 || y <= 2 || y >= height - 3) {
        row.push('cave_wall');
      } else {
        row.push('cave_floor');
      }
    }
    grid.push(row);
  }
  
  // Main cavern paths
  const pathPoints = [
    // Entrance corridor
    ...Array.from({ length: 20 }, (_, i) => ({ x: 3 + i, y: 22 })),
    ...Array.from({ length: 20 }, (_, i) => ({ x: 3 + i, y: 23 })),
    // Central chamber
    ...Array.from({ length: 25 }, (_, i) => ({ x: 25 + i, y: 22 })),
    ...Array.from({ length: 25 }, (_, i) => ({ x: 25 + i, y: 23 })),
    // North branch
    ...Array.from({ length: 15 }, (_, i) => ({ x: 30, y: 7 + i })),
    ...Array.from({ length: 15 }, (_, i) => ({ x: 31, y: 7 + i })),
    // South branch
    ...Array.from({ length: 15 }, (_, i) => ({ x: 30, y: 24 + i })),
    ...Array.from({ length: 15 }, (_, i) => ({ x: 31, y: 24 + i })),
  ];
  
  pathPoints.forEach(({ x, y }) => {
    if (y >= 0 && y < height && x >= 0 && x < width) {
      // Keep as cave_floor, already set
    }
  });
  
  // Crystal formations (clusters)
  const crystalClusters = [
    { x: 10, y: 10 }, { x: 12, y: 8 },
    { x: 45, y: 10 }, { x: 47, y: 12 },
    { x: 15, y: 35 }, { x: 13, y: 37 },
    { x: 42, y: 35 }, { x: 44, y: 33 },
    { x: 25, y: 15 }, { x: 35, y: 30 },
  ];
  
  crystalClusters.forEach(({ x, y }) => {
    if (y > 2 && y < height - 3 && x > 2 && x < width - 3) {
      grid[y][x] = 'crystal';
    }
  });
  
  // Underground lakes
  const lakes = [
    { cx: 15, cy: 15, r: 4 },
    { cx: 40, cy: 38, r: 5 },
  ];
  
  lakes.forEach(({ cx, cy, r }) => {
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (dx * dx + dy * dy <= r * r) {
          const x = cx + dx;
          const y = cy + dy;
          if (y > 2 && y < height - 3 && x > 2 && x < width - 3) {
            grid[y][x] = 'img_water';
          }
        }
      }
    }
  });
  
  // Cave wall formations
  const wallFormations = [
    { x: 20, y: 10 }, { x: 22, y: 12 }, { x: 18, y: 8 },
    { x: 38, y: 15 }, { x: 40, y: 17 },
    { x: 8, y: 28 }, { x: 10, y: 30 },
    { x: 45, y: 25 }, { x: 47, y: 27 },
  ];
  
  wallFormations.forEach(({ x, y }) => {
    if (y > 2 && y < height - 3 && x > 2 && x < width - 3) {
      grid[y][x] = 'cave_wall';
    }
  });
  
  // Teleporters
  grid[22][3] = 'teleporter';  // West - back to forest
  grid[22][51] = 'teleporter'; // East - to memory garden
  
  return grid;
};

export const caveMap: GameMap = {
  id: 'cave',
  name: 'Crystal Caverns',
  nameEs: 'Cavernas de Cristal',
  width: 55,
  height: 45,
  spawnPoint: { x: 5, y: 22 },
  npcs: ['cave_hermit'],
  layers: [
    {
      name: 'ground',
      tiles: createCaveGrid(),
    },
  ],
  encounterRate: 0.1,
  possibleEncounters: ['bat', 'golem', 'ghost', 'slime', 'memory_wraith'],
  events: [],
};

// =====================================================
// SCHOOL CLASSROOM - Prologue location (30x25)
// =====================================================
const classroomFeatures: { x: number; y: number; tile: string }[] = [
  // Rows of desks (5 rows, 5 columns)
  ...Array.from({ length: 5 }, (_, row) => 
    Array.from({ length: 5 }, (_, col) => ({
      x: 5 + col * 4,
      y: 6 + row * 3,
      tile: 'desk'
    }))
  ).flat(),
  
  // Chalkboard at front
  ...Array.from({ length: 20 }, (_, i) => ({ x: 5 + i, y: 2, tile: 'chalkboard' })),
  
  // Teacher's desk
  { x: 14, y: 4, tile: 'desk' },
  { x: 15, y: 4, tile: 'desk' },
  
  // Windows along right wall
  ...Array.from({ length: 6 }, (_, i) => ({ x: 28, y: 4 + i * 3, tile: 'img_window' })),
  
  // Door/teleporter at bottom
  { x: 14, y: 23, tile: 'teleporter' },
  { x: 15, y: 23, tile: 'teleporter' },
];

export const classroomMap: GameMap = {
  id: 'classroom',
  name: 'School Classroom',
  nameEs: 'Aula Escolar',
  width: 30,
  height: 25,
  spawnPoint: { x: 14, y: 20 },
  npcs: [],
  layers: [
    {
      name: 'ground',
      tiles: createDetailedGrid(30, 25, 'img_wood_floor', 'img_wall', classroomFeatures),
    },
  ],
};

// =====================================================
// MYSTERIOUS HOUSE - Safe haven (25x20)
// =====================================================
const houseFeatures: { x: number; y: number; tile: string }[] = [
  // Exit door
  { x: 12, y: 1, tile: 'teleporter' },
  
  // Bedroom area (left side)
  { x: 3, y: 4, tile: 'img_bed' },
  { x: 3, y: 5, tile: 'img_bed' },
  { x: 5, y: 3, tile: 'img_window' },
  
  // Living area furniture
  { x: 15, y: 8, tile: 'desk' },
  { x: 18, y: 5, tile: 'img_window' },
  
  // Kitchen area (right side)
  { x: 20, y: 12, tile: 'desk' },
  { x: 21, y: 12, tile: 'desk' },
  
  // Windows
  { x: 1, y: 10, tile: 'img_window' },
  { x: 23, y: 10, tile: 'img_window' },
  
  // Decorative signs
  { x: 12, y: 5, tile: 'img_sign' },
];

export const houseMap: GameMap = {
  id: 'house',
  name: 'Mysterious House',
  nameEs: 'Casa Misteriosa',
  width: 25,
  height: 20,
  spawnPoint: { x: 12, y: 15 },
  npcs: [],
  layers: [
    {
      name: 'ground',
      tiles: createDetailedGrid(25, 20, 'img_wood_floor', 'img_wall', houseFeatures),
    },
  ],
};

// =====================================================
// TELEPORTER CONNECTIONS
// =====================================================
export const teleporterConnections: Record<string, { mapId: string; x: number; y: number }> = {
  // Memory Garden exits
  'memory_garden_48_20': { mapId: 'forest', x: 5, y: 25 },
  'memory_garden_25_1': { mapId: 'classroom', x: 14, y: 22 },
  'memory_garden_1_20': { mapId: 'cave', x: 50, y: 22 },
  'memory_garden_25_38': { mapId: 'house', x: 12, y: 17 },
  
  // Forest exits
  'forest_3_25': { mapId: 'memory_garden', x: 46, y: 20 },
  'forest_56_25': { mapId: 'cave', x: 5, y: 22 },
  'forest_30_5': { mapId: 'memory_garden', x: 25, y: 3 },
  
  // Cave exits
  'cave_3_22': { mapId: 'forest', x: 54, y: 25 },
  'cave_51_22': { mapId: 'memory_garden', x: 3, y: 20 },
  
  // Classroom exit
  'classroom_14_23': { mapId: 'memory_garden', x: 25, y: 3 },
  'classroom_15_23': { mapId: 'memory_garden', x: 25, y: 3 },
  
  // House exit
  'house_12_1': { mapId: 'memory_garden', x: 25, y: 36 },
};

export const defaultMaps: Record<string, GameMap> = {
  memory_garden: memoryGardenMap,
  classroom: classroomMap,
  forest: forestMap,
  cave: caveMap,
  house: houseMap,
};
