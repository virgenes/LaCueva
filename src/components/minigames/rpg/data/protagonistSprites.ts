import { Sprite, Character } from '../types/GameTypes';

// Color palette for protagonists
const COLORS = {
  transparent: 'transparent',
  black: '#1a1a2e',
  white: '#e8e8e8',
  // Skin tones
  skinLight: '#ffd5b8',
  skinMedium: '#d4a574',
  skinTan: '#c4956a',  // Piel trigo
  skinBrown: '#8b6f47',
  skinDark: '#5c4033',
  // Hair colors
  hairBlack: '#1a1a1a',
  hairDarkBrown: '#2a1f1a',
  hairBrown: '#4a3728',
  hairLightBrown: '#6b5344',
  // Clothing
  shirtBlue: '#3498db',
  shirtWhite: '#f0f0f0',
  shirtGreen: '#2ecc71',
  shirtRed: '#e74c3c',
  shirtPurple: '#9b59b6',
  shirtBlack: '#2c2c2c',
  pantsBlue: '#2a4858',
  pantsBlack: '#1a1a1a',
  pantsGray: '#4a4a4a',
  // Accessories
  glasses: '#333333',
  glassesLens: '#87CEEB',
};

const C = COLORS;
const T = COLORS.transparent;

// Matías - Nerd con lentes, cabello negro corto, camisa azul, flaco
export const matiasSprite: Sprite = {
  id: 'matias',
  name: 'Matías',
  width: 32,
  height: 32,
  animationSpeed: 200,
  frames: [
    // Idle frame
    [
      [T, T, C.hairBlack, C.hairBlack, C.hairBlack, C.hairBlack, T, T],
      [T, C.hairBlack, C.hairBlack, C.hairBlack, C.hairBlack, C.hairBlack, C.hairBlack, T],
      [T, C.skinLight, C.skinLight, C.skinLight, C.skinLight, C.skinLight, C.skinLight, T],
      [T, C.glasses, C.glassesLens, C.skinLight, C.skinLight, C.glassesLens, C.glasses, T],
      [T, T, C.skinLight, C.skinLight, C.skinLight, C.skinLight, T, T],
      [T, C.shirtBlue, C.shirtBlue, C.shirtBlue, C.shirtBlue, C.shirtBlue, C.shirtBlue, T],
      [T, C.shirtBlue, C.shirtBlue, C.shirtBlue, C.shirtBlue, C.shirtBlue, C.shirtBlue, T],
      [T, T, C.pantsBlue, C.pantsBlue, C.pantsBlue, C.pantsBlue, T, T],
    ],
    // Walk frame
    [
      [T, T, C.hairBlack, C.hairBlack, C.hairBlack, C.hairBlack, T, T],
      [T, C.hairBlack, C.hairBlack, C.hairBlack, C.hairBlack, C.hairBlack, C.hairBlack, T],
      [T, C.skinLight, C.skinLight, C.skinLight, C.skinLight, C.skinLight, C.skinLight, T],
      [T, C.glasses, C.glassesLens, C.skinLight, C.skinLight, C.glassesLens, C.glasses, T],
      [T, T, C.skinLight, C.skinLight, C.skinLight, C.skinLight, T, T],
      [T, C.shirtBlue, C.shirtBlue, C.shirtBlue, C.shirtBlue, C.shirtBlue, C.shirtBlue, T],
      [C.skinLight, C.shirtBlue, C.shirtBlue, C.shirtBlue, C.shirtBlue, C.shirtBlue, T, C.skinLight],
      [T, C.pantsBlue, T, C.pantsBlue, C.pantsBlue, T, C.pantsBlue, T],
    ],
  ],
};

// Angel - Tímido, cabello marrón corto, piel blanca, camisa sencilla
export const angelSprite: Sprite = {
  id: 'angel',
  name: 'Ángel',
  width: 32,
  height: 32,
  animationSpeed: 200,
  frames: [
    [
      [T, T, C.hairLightBrown, C.hairLightBrown, C.hairLightBrown, C.hairLightBrown, T, T],
      [T, C.hairLightBrown, C.hairLightBrown, C.hairLightBrown, C.hairLightBrown, C.hairLightBrown, C.hairLightBrown, T],
      [T, C.skinLight, C.skinLight, C.skinLight, C.skinLight, C.skinLight, C.skinLight, T],
      [T, C.skinLight, C.black, C.skinLight, C.skinLight, C.black, C.skinLight, T],
      [T, T, C.skinLight, C.skinLight, C.skinLight, C.skinLight, T, T],
      [T, C.shirtWhite, C.shirtWhite, C.shirtWhite, C.shirtWhite, C.shirtWhite, C.shirtWhite, T],
      [T, C.shirtWhite, C.shirtWhite, C.shirtWhite, C.shirtWhite, C.shirtWhite, C.shirtWhite, T],
      [T, T, C.pantsGray, C.pantsGray, C.pantsGray, C.pantsGray, T, T],
    ],
    [
      [T, T, C.hairLightBrown, C.hairLightBrown, C.hairLightBrown, C.hairLightBrown, T, T],
      [T, C.hairLightBrown, C.hairLightBrown, C.hairLightBrown, C.hairLightBrown, C.hairLightBrown, C.hairLightBrown, T],
      [T, C.skinLight, C.skinLight, C.skinLight, C.skinLight, C.skinLight, C.skinLight, T],
      [T, C.skinLight, C.black, C.skinLight, C.skinLight, C.black, C.skinLight, T],
      [T, T, C.skinLight, C.skinLight, C.skinLight, C.skinLight, T, T],
      [T, C.shirtWhite, C.shirtWhite, C.shirtWhite, C.shirtWhite, C.shirtWhite, C.shirtWhite, T],
      [C.skinLight, C.shirtWhite, C.shirtWhite, C.shirtWhite, C.shirtWhite, C.shirtWhite, T, C.skinLight],
      [T, C.pantsGray, T, C.pantsGray, C.pantsGray, T, C.pantsGray, T],
    ],
  ],
};

// Alejandro - Alto, piel marrón, cabello negro, tímido
export const alejandroSprite: Sprite = {
  id: 'alejandro',
  name: 'Alejandro',
  width: 32,
  height: 32,
  animationSpeed: 200,
  frames: [
    [
      [T, T, C.hairBlack, C.hairBlack, C.hairBlack, C.hairBlack, T, T],
      [T, C.hairBlack, C.hairBlack, C.hairBlack, C.hairBlack, C.hairBlack, C.hairBlack, T],
      [T, C.skinBrown, C.skinBrown, C.skinBrown, C.skinBrown, C.skinBrown, C.skinBrown, T],
      [T, C.skinBrown, C.black, C.skinBrown, C.skinBrown, C.black, C.skinBrown, T],
      [T, T, C.skinBrown, C.skinBrown, C.skinBrown, C.skinBrown, T, T],
      [T, C.shirtGreen, C.shirtGreen, C.shirtGreen, C.shirtGreen, C.shirtGreen, C.shirtGreen, T],
      [T, C.shirtGreen, C.shirtGreen, C.shirtGreen, C.shirtGreen, C.shirtGreen, C.shirtGreen, T],
      [T, T, C.pantsBlue, C.pantsBlue, C.pantsBlue, C.pantsBlue, T, T],
    ],
    [
      [T, T, C.hairBlack, C.hairBlack, C.hairBlack, C.hairBlack, T, T],
      [T, C.hairBlack, C.hairBlack, C.hairBlack, C.hairBlack, C.hairBlack, C.hairBlack, T],
      [T, C.skinBrown, C.skinBrown, C.skinBrown, C.skinBrown, C.skinBrown, C.skinBrown, T],
      [T, C.skinBrown, C.black, C.skinBrown, C.skinBrown, C.black, C.skinBrown, T],
      [T, T, C.skinBrown, C.skinBrown, C.skinBrown, C.skinBrown, T, T],
      [T, C.shirtGreen, C.shirtGreen, C.shirtGreen, C.shirtGreen, C.shirtGreen, C.shirtGreen, T],
      [C.skinBrown, C.shirtGreen, C.shirtGreen, C.shirtGreen, C.shirtGreen, C.shirtGreen, T, C.skinBrown],
      [T, C.pantsBlue, T, C.pantsBlue, C.pantsBlue, T, C.pantsBlue, T],
    ],
  ],
};

// Miguel - Piel trigo, cabello marrón, flaco, extrovertido
export const miguelSprite: Sprite = {
  id: 'miguel',
  name: 'Miguel',
  width: 32,
  height: 32,
  animationSpeed: 200,
  frames: [
    [
      [T, T, C.hairBrown, C.hairBrown, C.hairBrown, C.hairBrown, T, T],
      [T, C.hairBrown, C.hairBrown, C.hairBrown, C.hairBrown, C.hairBrown, C.hairBrown, T],
      [T, C.skinTan, C.skinTan, C.skinTan, C.skinTan, C.skinTan, C.skinTan, T],
      [T, C.skinTan, C.black, C.skinTan, C.skinTan, C.black, C.skinTan, T],
      [T, T, C.skinTan, C.skinTan, C.skinTan, C.skinTan, T, T],
      [T, C.shirtRed, C.shirtRed, C.shirtRed, C.shirtRed, C.shirtRed, C.shirtRed, T],
      [T, C.shirtRed, C.shirtRed, C.shirtRed, C.shirtRed, C.shirtRed, C.shirtRed, T],
      [T, T, C.pantsBlack, C.pantsBlack, C.pantsBlack, C.pantsBlack, T, T],
    ],
    [
      [T, T, C.hairBrown, C.hairBrown, C.hairBrown, C.hairBrown, T, T],
      [T, C.hairBrown, C.hairBrown, C.hairBrown, C.hairBrown, C.hairBrown, C.hairBrown, T],
      [T, C.skinTan, C.skinTan, C.skinTan, C.skinTan, C.skinTan, C.skinTan, T],
      [T, C.skinTan, C.black, C.skinTan, C.skinTan, C.black, C.skinTan, T],
      [T, T, C.skinTan, C.skinTan, C.skinTan, C.skinTan, T, T],
      [T, C.shirtRed, C.shirtRed, C.shirtRed, C.shirtRed, C.shirtRed, C.shirtRed, T],
      [C.skinTan, C.shirtRed, C.shirtRed, C.shirtRed, C.shirtRed, C.shirtRed, T, C.skinTan],
      [T, C.pantsBlack, T, C.pantsBlack, C.pantsBlack, T, C.pantsBlack, T],
    ],
  ],
};

// Elías - Alto, piel morena, extrovertido, con lentes, cabello negro oscuro
export const eliasSprite: Sprite = {
  id: 'elias',
  name: 'Elías',
  width: 32,
  height: 32,
  animationSpeed: 200,
  frames: [
    [
      [T, T, C.hairDarkBrown, C.hairDarkBrown, C.hairDarkBrown, C.hairDarkBrown, T, T],
      [T, C.hairDarkBrown, C.hairDarkBrown, C.hairDarkBrown, C.hairDarkBrown, C.hairDarkBrown, C.hairDarkBrown, T],
      [T, C.skinDark, C.skinDark, C.skinDark, C.skinDark, C.skinDark, C.skinDark, T],
      [T, C.glasses, C.glassesLens, C.skinDark, C.skinDark, C.glassesLens, C.glasses, T],
      [T, T, C.skinDark, C.skinDark, C.skinDark, C.skinDark, T, T],
      [T, C.shirtPurple, C.shirtPurple, C.shirtPurple, C.shirtPurple, C.shirtPurple, C.shirtPurple, T],
      [T, C.shirtPurple, C.shirtPurple, C.shirtPurple, C.shirtPurple, C.shirtPurple, C.shirtPurple, T],
      [T, T, C.pantsBlue, C.pantsBlue, C.pantsBlue, C.pantsBlue, T, T],
    ],
    [
      [T, T, C.hairDarkBrown, C.hairDarkBrown, C.hairDarkBrown, C.hairDarkBrown, T, T],
      [T, C.hairDarkBrown, C.hairDarkBrown, C.hairDarkBrown, C.hairDarkBrown, C.hairDarkBrown, C.hairDarkBrown, T],
      [T, C.skinDark, C.skinDark, C.skinDark, C.skinDark, C.skinDark, C.skinDark, T],
      [T, C.glasses, C.glassesLens, C.skinDark, C.skinDark, C.glassesLens, C.glasses, T],
      [T, T, C.skinDark, C.skinDark, C.skinDark, C.skinDark, T, T],
      [T, C.shirtPurple, C.shirtPurple, C.shirtPurple, C.shirtPurple, C.shirtPurple, C.shirtPurple, T],
      [C.skinDark, C.shirtPurple, C.shirtPurple, C.shirtPurple, C.shirtPurple, C.shirtPurple, T, C.skinDark],
      [T, C.pantsBlue, T, C.pantsBlue, C.pantsBlue, T, C.pantsBlue, T],
    ],
  ],
};

// Máximo - Piel morena, pelo negro, ojos chinos, ropa de moda
export const maximoSprite: Sprite = {
  id: 'maximo',
  name: 'Máximo',
  width: 32,
  height: 32,
  animationSpeed: 200,
  frames: [
    [
      [T, T, C.hairBlack, C.hairBlack, C.hairBlack, C.hairBlack, T, T],
      [T, C.hairBlack, C.hairBlack, C.hairBlack, C.hairBlack, C.hairBlack, C.hairBlack, T],
      [T, C.skinMedium, C.skinMedium, C.skinMedium, C.skinMedium, C.skinMedium, C.skinMedium, T],
      [T, C.skinMedium, C.black, C.skinMedium, C.skinMedium, C.black, C.skinMedium, T], // Ojos más cerrados
      [T, T, C.skinMedium, C.skinMedium, C.skinMedium, C.skinMedium, T, T],
      [T, C.shirtBlack, C.shirtBlack, C.shirtBlack, C.shirtBlack, C.shirtBlack, C.shirtBlack, T],
      [T, C.shirtBlack, C.shirtBlack, C.white, C.white, C.shirtBlack, C.shirtBlack, T], // Logo en camisa
      [T, T, C.pantsBlack, C.pantsBlack, C.pantsBlack, C.pantsBlack, T, T],
    ],
    [
      [T, T, C.hairBlack, C.hairBlack, C.hairBlack, C.hairBlack, T, T],
      [T, C.hairBlack, C.hairBlack, C.hairBlack, C.hairBlack, C.hairBlack, C.hairBlack, T],
      [T, C.skinMedium, C.skinMedium, C.skinMedium, C.skinMedium, C.skinMedium, C.skinMedium, T],
      [T, C.skinMedium, C.black, C.skinMedium, C.skinMedium, C.black, C.skinMedium, T],
      [T, T, C.skinMedium, C.skinMedium, C.skinMedium, C.skinMedium, T, T],
      [T, C.shirtBlack, C.shirtBlack, C.shirtBlack, C.shirtBlack, C.shirtBlack, C.shirtBlack, T],
      [C.skinMedium, C.shirtBlack, C.shirtBlack, C.white, C.white, C.shirtBlack, T, C.skinMedium],
      [T, C.pantsBlack, T, C.pantsBlack, C.pantsBlack, T, C.pantsBlack, T],
    ],
  ],
};

// Characters data
export const protagonistCharacters: Record<string, Character> = {
  matias: {
    id: 'matias',
    name: 'Matías',
    nameEs: 'Matías',
    spriteId: 'matias',
    position: { x: 3, y: 3 },
    direction: 'down',
    isPlayer: false,
    dialogueIds: ['matias_intro'],
    stats: { hp: 100, maxHp: 100, speed: 3 },
  },
  angel: {
    id: 'angel',
    name: 'Ángel',
    nameEs: 'Ángel',
    spriteId: 'angel',
    position: { x: 5, y: 3 },
    direction: 'down',
    isPlayer: false,
    dialogueIds: ['angel_intro'],
    stats: { hp: 85, maxHp: 85, speed: 4 },
  },
  alejandro: {
    id: 'alejandro',
    name: 'Alejandro',
    nameEs: 'Alejandro',
    spriteId: 'alejandro',
    position: { x: 7, y: 3 },
    direction: 'down',
    isPlayer: false,
    dialogueIds: ['alejandro_intro'],
    stats: { hp: 120, maxHp: 120, speed: 2 },
  },
  miguel: {
    id: 'miguel',
    name: 'Miguel',
    nameEs: 'Miguel',
    spriteId: 'miguel',
    position: { x: 4, y: 5 },
    direction: 'down',
    isPlayer: false,
    dialogueIds: ['miguel_intro'],
    stats: { hp: 90, maxHp: 90, speed: 5 },
  },
  elias: {
    id: 'elias',
    name: 'Elías',
    nameEs: 'Elías',
    spriteId: 'elias',
    position: { x: 6, y: 5 },
    direction: 'down',
    isPlayer: false,
    dialogueIds: ['elias_intro'],
    stats: { hp: 110, maxHp: 110, speed: 3 },
  },
  maximo: {
    id: 'maximo',
    name: 'Máximo',
    nameEs: 'Máximo',
    spriteId: 'maximo',
    position: { x: 5, y: 4 },
    direction: 'down',
    isPlayer: false,
    dialogueIds: ['maximo_intro'],
    stats: { hp: 95, maxHp: 95, speed: 4 },
  },
};

export const protagonistSprites = {
  matias: matiasSprite,
  angel: angelSprite,
  alejandro: alejandroSprite,
  miguel: miguelSprite,
  elias: eliasSprite,
  maximo: maximoSprite,
};
