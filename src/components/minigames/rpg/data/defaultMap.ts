import { GameMap } from '../types/GameTypes';

// Helper to generate map grids
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
// MEMORY GARDEN - Dense enchanted forest (60x50)
// Inspired by pixel-art RPG forests with winding paths,
// dense tree canopy, clearings, streams, and mushrooms
// =====================================================
const createMemoryGardenGrid = (): string[][] => {
  const W = 60, H = 50;
  const grid: string[][] = [];

  // Fill with grass
  for (let y = 0; y < H; y++) {
    const row: string[] = [];
    for (let x = 0; x < W; x++) {
      // Dense border of trees (3 tiles thick)
      if (x <= 2 || x >= W - 3 || y <= 2 || y >= H - 3) {
        row.push('img_bush');
      } else {
        row.push('img_grass');
      }
    }
    grid.push(row);
  }

  // === MAIN WINDING PATH (dirt) ===
  // Entry from south, winds through the forest
  const mainPath: { x: number; y: number }[] = [];
  
  // South entrance upward
  for (let y = H - 4; y > 25; y--) { mainPath.push({ x: 30, y }); mainPath.push({ x: 31, y }); }
  // Curve west
  for (let x = 20; x <= 31; x++) { mainPath.push({ x, y: 25 }); mainPath.push({ x, y: 26 }); }
  // North from curve
  for (let y = 10; y <= 25; y++) { mainPath.push({ x: 20, y }); mainPath.push({ x: 21, y }); }
  // East branch at top
  for (let x = 21; x <= 45; x++) { mainPath.push({ x, y: 10 }); mainPath.push({ x, y: 11 }); }
  // Continue south from east branch
  for (let y = 11; y <= 40; y++) { mainPath.push({ x: 45, y }); mainPath.push({ x: 46, y }); }
  // West branch in middle
  for (let x = 5; x <= 20; x++) { mainPath.push({ x, y: 35 }); mainPath.push({ x, y: 36 }); }
  // Small path south from west branch
  for (let y = 36; y <= 45; y++) { mainPath.push({ x: 10, y }); mainPath.push({ x: 11, y }); }
  // Connect south to main path
  for (let x = 11; x <= 30; x++) { mainPath.push({ x, y: 42 }); mainPath.push({ x, y: 43 }); }

  mainPath.forEach(({ x, y }) => {
    if (y > 2 && y < H - 3 && x > 2 && x < W - 3) grid[y][x] = 'img_dirt';
  });

  // === CENTRAL PLAZA (wood floor clearing) ===
  for (let dy = 0; dy < 6; dy++) {
    for (let dx = 0; dx < 8; dx++) {
      const x = 26 + dx, y = 22 + dy;
      if (x < W - 3 && y < H - 3) grid[y][x] = 'img_wood_floor';
    }
  }

  // Central fountain
  grid[24][29] = 'img_water'; grid[24][30] = 'img_water';
  grid[25][29] = 'img_water'; grid[25][30] = 'img_water';

  // Welcome sign
  grid[22][30] = 'img_sign';

  // === LARGE LAKE (northwest) ===
  const lakeCx = 12, lakeCy = 15;
  for (let dy = -4; dy <= 4; dy++) {
    for (let dx = -5; dx <= 5; dx++) {
      if (dx * dx * 0.6 + dy * dy <= 16) {
        const x = lakeCx + dx, y = lakeCy + dy;
        if (y > 2 && y < H - 3 && x > 2 && x < W - 3) grid[y][x] = 'img_water';
      }
    }
  }

  // === STREAM flowing east from lake ===
  for (let i = 0; i < 20; i++) {
    const x = 18 + i;
    const y = 15 + Math.round(Math.sin(i * 0.4) * 1.5);
    if (y > 2 && y < H - 3 && x > 2 && x < W - 3) {
      grid[y][x] = 'img_water';
      if (y + 1 < H - 3) grid[y + 1][x] = 'img_water';
    }
  }

  // === SMALL POND (southeast) ===
  for (let dy = -2; dy <= 2; dy++) {
    for (let dx = -3; dx <= 3; dx++) {
      if (dx * dx + dy * dy <= 7) {
        const x = 50 + dx, y = 38 + dy;
        if (y > 2 && y < H - 3 && x > 2 && x < W - 3) grid[y][x] = 'img_water';
      }
    }
  }

  // === DENSE TREE CLUSTERS (bushes as canopy) ===
  // The reference image shows dense, round tree canopies
  const treeClusters = [
    // Northwest forest
    { cx: 8, cy: 8, count: 12, radius: 5 },
    // North central
    { cx: 25, cy: 6, count: 8, radius: 4 },
    { cx: 35, cy: 5, count: 10, radius: 5 },
    // Northeast
    { cx: 52, cy: 8, count: 10, radius: 5 },
    { cx: 55, cy: 15, count: 6, radius: 3 },
    // East forest wall
    { cx: 53, cy: 25, count: 8, radius: 4 },
    { cx: 55, cy: 32, count: 6, radius: 3 },
    // Southwest
    { cx: 6, cy: 28, count: 8, radius: 4 },
    { cx: 8, cy: 42, count: 6, radius: 3 },
    // South central
    { cx: 22, cy: 38, count: 6, radius: 3 },
    { cx: 38, cy: 45, count: 8, radius: 4 },
    // Central scattered trees
    { cx: 15, cy: 20, count: 4, radius: 2 },
    { cx: 40, cy: 18, count: 5, radius: 3 },
    { cx: 48, cy: 30, count: 4, radius: 2 },
    { cx: 18, cy: 45, count: 5, radius: 3 },
    // Along paths (decorative)
    { cx: 25, cy: 30, count: 3, radius: 2 },
    { cx: 35, cy: 20, count: 3, radius: 2 },
  ];

  // Use seeded-ish random for consistent placement
  let seed = 42;
  const seededRandom = () => { seed = (seed * 16807 + 0) % 2147483647; return seed / 2147483647; };

  treeClusters.forEach(cluster => {
    for (let i = 0; i < cluster.count; i++) {
      const angle = seededRandom() * Math.PI * 2;
      const dist = seededRandom() * cluster.radius;
      const x = Math.round(cluster.cx + Math.cos(angle) * dist);
      const y = Math.round(cluster.cy + Math.sin(angle) * dist);
      if (y > 2 && y < H - 3 && x > 2 && x < W - 3) {
        // Don't overwrite paths or water
        if (grid[y][x] === 'img_grass') {
          grid[y][x] = 'img_bush';
        }
      }
    }
  });

  // === INDIVIDUAL DECORATIVE TREES ===
  const scatteredTrees = [
    // Near paths
    { x: 18, y: 24 }, { x: 22, y: 28 }, { x: 34, y: 24 },
    { x: 43, y: 12 }, { x: 47, y: 14 }, { x: 44, y: 20 },
    { x: 16, y: 32 }, { x: 14, y: 38 }, { x: 35, y: 35 },
    { x: 42, y: 40 }, { x: 50, y: 20 }, { x: 52, y: 44 },
    // Fill gaps
    { x: 8, y: 22 }, { x: 5, y: 18 }, { x: 7, y: 35 },
    { x: 55, y: 40 }, { x: 40, y: 8 }, { x: 28, y: 15 },
    { x: 32, y: 32 }, { x: 48, y: 42 }, { x: 12, y: 30 },
    { x: 38, y: 28 }, { x: 22, y: 8 }, { x: 42, y: 35 },
    { x: 15, y: 43 }, { x: 50, y: 12 }, { x: 36, y: 40 },
  ];

  scatteredTrees.forEach(({ x, y }) => {
    if (y > 2 && y < H - 3 && x > 2 && x < W - 3 && grid[y][x] === 'img_grass') {
      grid[y][x] = 'img_bush';
    }
  });

  // === STONE FORMATIONS (large trees/rocks) ===
  const stoneFormations = [
    // Ancient stones near plaza
    { x: 24, y: 21 }, { x: 35, y: 21 },
    // Stone circle in northeast
    { x: 50, y: 10 }, { x: 52, y: 10 }, { x: 51, y: 9 }, { x: 51, y: 11 },
    // Random boulders
    { x: 8, y: 38 }, { x: 40, y: 32 }, { x: 15, y: 12 },
  ];

  stoneFormations.forEach(({ x, y }) => {
    if (y > 2 && y < H - 3 && x > 2 && x < W - 3 && grid[y][x] === 'img_grass') {
      grid[y][x] = 'img_stone';
    }
  });

  // === TELEPORTERS ===
  grid[25][57] = 'teleporter'; // East → forest
  grid[3][30]  = 'teleporter'; // North → classroom
  grid[25][3]  = 'teleporter'; // West → cave
  grid[47][30] = 'teleporter'; // South → house

  // === BEDS (resting spots) ===
  grid[24][27] = 'img_bed';

  return grid;
};

export const memoryGardenMap: GameMap = {
  id: 'memory_garden',
  name: 'Memory Garden',
  nameEs: 'Jardín de la Memoria',
  width: 60,
  height: 50,
  spawnPoint: { x: 30, y: 40 },
  npcs: ['mysterious'],
  layers: [{ name: 'ground', tiles: createMemoryGardenGrid() }],
  encounterRate: 0.03,
  possibleEncounters: ['slime', 'rabbit', 'bird'],
  events: [],
};

// =====================================================
// ENCHANTED FOREST (70x55) — Very dense
// =====================================================
const createForestGrid = (): string[][] => {
  const W = 70, H = 55;
  const grid: string[][] = [];

  for (let y = 0; y < H; y++) {
    const row: string[] = [];
    for (let x = 0; x < W; x++) {
      if (x <= 2 || x >= W - 3 || y <= 2 || y >= H - 3) {
        row.push('img_bush');
      } else {
        row.push('forest_grass');
      }
    }
    grid.push(row);
  }

  // Winding paths
  const paths: { x: number; y: number }[] = [];
  // Main east-west
  for (let x = 3; x < W - 3; x++) { paths.push({ x, y: 27 }); paths.push({ x, y: 28 }); }
  // North branch
  for (let y = 8; y <= 27; y++) { paths.push({ x: 25, y }); paths.push({ x: 26, y }); }
  // South branch
  for (let y = 28; y <= 48; y++) { paths.push({ x: 45, y }); paths.push({ x: 46, y }); }
  // Diagonal path
  for (let i = 0; i < 20; i++) {
    const x = 10 + i; const y = 40 - i;
    if (y > 2 && y < H - 3) { paths.push({ x, y }); paths.push({ x: x + 1, y }); }
  }

  paths.forEach(({ x, y }) => {
    if (y > 2 && y < H - 3 && x > 2 && x < W - 3) grid[y][x] = 'img_dirt';
  });

  // Dense tree cover (80% of open forest_grass gets bushes)
  let s = 7;
  const r = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
  for (let y = 3; y < H - 3; y++) {
    for (let x = 3; x < W - 3; x++) {
      if (grid[y][x] === 'forest_grass' && r() < 0.35) {
        grid[y][x] = 'img_bush';
      }
    }
  }

  // Clearings
  [{ cx: 15, cy: 15, r: 5 }, { cx: 50, cy: 40, r: 6 }, { cx: 35, cy: 12, r: 4 }, { cx: 55, cy: 20, r: 4 }].forEach(c => {
    for (let dy = -c.r; dy <= c.r; dy++) for (let dx = -c.r; dx <= c.r; dx++) {
      if (dx * dx + dy * dy <= c.r * c.r) {
        const x = c.cx + dx, y = c.cy + dy;
        if (y > 2 && y < H - 3 && x > 2 && x < W - 3) grid[y][x] = 'img_grass';
      }
    }
  });

  // Water stream
  for (let i = 0; i < 30; i++) {
    const x = 5 + i;
    const y = 42 + Math.round(Math.sin(i * 0.4) * 2);
    if (y > 2 && y < H - 3 && x > 2 && x < W - 3) {
      grid[y][x] = 'img_water';
      if (y + 1 < H - 3) grid[y + 1][x] = 'img_water';
    }
  }

  // Teleporters
  grid[27][3] = 'teleporter';   // West → garden
  grid[27][66] = 'teleporter';  // East → cave
  grid[3][35] = 'teleporter';   // North → secret

  return grid;
};

export const forestMap: GameMap = {
  id: 'forest',
  name: 'Enchanted Forest',
  nameEs: 'Bosque Encantado',
  width: 70,
  height: 55,
  spawnPoint: { x: 5, y: 27 },
  npcs: ['forest_spirit'],
  layers: [{ name: 'ground', tiles: createForestGrid() }],
  encounterRate: 0.08,
  possibleEncounters: ['wolf', 'sprite', 'mushroom', 'deer', 'rabbit'],
  events: [],
};

// =====================================================
// CRYSTAL CAVE (55x45)
// =====================================================
const createCaveGrid = (): string[][] => {
  const W = 55, H = 45;
  const grid: string[][] = [];

  for (let y = 0; y < H; y++) {
    const row: string[] = [];
    for (let x = 0; x < W; x++) {
      if (x <= 2 || x >= W - 3 || y <= 2 || y >= H - 3) row.push('cave_wall');
      else row.push('cave_floor');
    }
    grid.push(row);
  }

  // Cavern walls scattered
  let s = 13;
  const r = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
  for (let y = 3; y < H - 3; y++) {
    for (let x = 3; x < W - 3; x++) {
      if (r() < 0.12) grid[y][x] = 'cave_wall';
    }
  }

  // Clear paths
  for (let x = 3; x < W - 3; x++) { grid[22][x] = 'cave_floor'; grid[23][x] = 'cave_floor'; }
  for (let y = 7; y < H - 3; y++) { grid[y][30] = 'cave_floor'; grid[y][31] = 'cave_floor'; }

  // Crystal formations
  [{ x: 10, y: 10 }, { x: 45, y: 10 }, { x: 15, y: 35 }, { x: 42, y: 35 }, { x: 25, y: 15 }, { x: 35, y: 30 }].forEach(p => {
    if (p.y > 2 && p.y < H - 3 && p.x > 2 && p.x < W - 3) grid[p.y][p.x] = 'crystal';
  });

  // Underground lakes
  [{ cx: 15, cy: 15, r: 4 }, { cx: 40, cy: 38, r: 5 }].forEach(c => {
    for (let dy = -c.r; dy <= c.r; dy++) for (let dx = -c.r; dx <= c.r; dx++) {
      if (dx * dx + dy * dy <= c.r * c.r) {
        const x = c.cx + dx, y = c.cy + dy;
        if (y > 2 && y < H - 3 && x > 2 && x < W - 3) grid[y][x] = 'img_water';
      }
    }
  });

  grid[22][3] = 'teleporter';
  grid[22][51] = 'teleporter';

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
  layers: [{ name: 'ground', tiles: createCaveGrid() }],
  encounterRate: 0.1,
  possibleEncounters: ['bat', 'golem', 'ghost', 'slime'],
  events: [],
};

// =====================================================
// SCHOOL CLASSROOM (30x25)
// =====================================================
const classroomFeatures: { x: number; y: number; tile: string }[] = [
  ...Array.from({ length: 5 }, (_, row) =>
    Array.from({ length: 5 }, (_, col) => ({ x: 5 + col * 4, y: 6 + row * 3, tile: 'desk' }))
  ).flat(),
  ...Array.from({ length: 20 }, (_, i) => ({ x: 5 + i, y: 2, tile: 'chalkboard' })),
  { x: 14, y: 4, tile: 'desk' }, { x: 15, y: 4, tile: 'desk' },
  ...Array.from({ length: 6 }, (_, i) => ({ x: 28, y: 4 + i * 3, tile: 'img_window' })),
  { x: 14, y: 23, tile: 'teleporter' }, { x: 15, y: 23, tile: 'teleporter' },
];

export const classroomMap: GameMap = {
  id: 'classroom',
  name: 'School Classroom',
  nameEs: 'Aula Escolar',
  width: 30,
  height: 25,
  spawnPoint: { x: 14, y: 20 },
  npcs: [],
  layers: [{ name: 'ground', tiles: createDetailedGrid(30, 25, 'img_wood_floor', 'img_wall', classroomFeatures) }],
};

// =====================================================
// MYSTERIOUS HOUSE (25x20)
// =====================================================
const houseFeatures: { x: number; y: number; tile: string }[] = [
  { x: 12, y: 1, tile: 'teleporter' },
  { x: 3, y: 4, tile: 'img_bed' }, { x: 3, y: 5, tile: 'img_bed' },
  { x: 5, y: 3, tile: 'img_window' },
  { x: 15, y: 8, tile: 'desk' }, { x: 18, y: 5, tile: 'img_window' },
  { x: 20, y: 12, tile: 'desk' }, { x: 21, y: 12, tile: 'desk' },
  { x: 1, y: 10, tile: 'img_window' }, { x: 23, y: 10, tile: 'img_window' },
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
  layers: [{ name: 'ground', tiles: createDetailedGrid(25, 20, 'img_wood_floor', 'img_wall', houseFeatures) }],
};

// =====================================================
// TELEPORTER CONNECTIONS
// =====================================================
export const teleporterConnections: Record<string, { mapId: string; x: number; y: number }> = {
  // Memory Garden exits
  'memory_garden_57_25': { mapId: 'forest', x: 5, y: 27 },
  'memory_garden_30_3':  { mapId: 'classroom', x: 14, y: 22 },
  'memory_garden_3_25':  { mapId: 'cave', x: 50, y: 22 },
  'memory_garden_30_47': { mapId: 'house', x: 12, y: 17 },
  // Forest exits
  'forest_3_27':  { mapId: 'memory_garden', x: 55, y: 25 },
  'forest_66_27': { mapId: 'cave', x: 5, y: 22 },
  'forest_35_3':  { mapId: 'memory_garden', x: 30, y: 5 },
  // Cave exits
  'cave_3_22':  { mapId: 'forest', x: 64, y: 27 },
  'cave_51_22': { mapId: 'memory_garden', x: 5, y: 25 },
  // Classroom exit
  'classroom_14_23': { mapId: 'memory_garden', x: 30, y: 5 },
  'classroom_15_23': { mapId: 'memory_garden', x: 30, y: 5 },
  // House exit
  'house_12_1': { mapId: 'memory_garden', x: 30, y: 45 },
};

export const defaultMaps: Record<string, GameMap> = {
  memory_garden: memoryGardenMap,
  classroom: classroomMap,
  forest: forestMap,
  cave: caveMap,
  house: houseMap,
};
