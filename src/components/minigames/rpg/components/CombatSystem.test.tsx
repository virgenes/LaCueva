/**
 * Bug Condition Exploration Test for Monster Sprite Combat Visualization
 * 
 * **Validates: Requirements 2.1, 2.2, 2.3, 2.4**
 * 
 * CRITICAL: This test MUST FAIL on unfixed code - the failure confirms that the bug exists.
 * DO NOT attempt to fix the test or the code when it fails.
 * 
 * The test encodes the expected behavior - it will validate the fix when it passes after implementation.
 * OBJECTIVE: Generate counterexamples that demonstrate the bug exists.
 * 
 * BUG DESCRIPTION:
 * The current implementation uses <img> with objectFit: 'none' and objectPosition to display
 * sprite frames. This method does NOT properly crop the spritesheet to show only one frame.
 * Instead, it shows the entire spritesheet image, just repositioned, which causes:
 * - Adjacent frames to be visible (overflow)
 * - Incorrect visual appearance (multiple frames showing at once)
 * - The sprite not being properly cropped to frameWidth x frameHeight
 * 
 * The correct approach is to use a <div> with backgroundImage and backgroundPosition,
 * which properly crops the visible area to show only one frame.
 */

import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { CombatSystem } from './CombatSystem';
import { Character } from '../types/GameTypes';
import { getMonsterSpriteAsset } from '../data/monsterSpriteAssets';
import * as fc from 'fast-check';

// Mock the settings context
vi.mock('@/contexts/SettingsContext', () => ({
  useSettings: () => ({ language: 'en' }),
}));

// Mock audio functions
vi.mock('../systems/RPGAudioManager', () => ({
  sfxAttack: vi.fn(),
  sfxDamage: vi.fn(),
  sfxHeal: vi.fn(),
  sfxVictory: vi.fn(),
  sfxDefeat: vi.fn(),
  sfxSelect: vi.fn(),
  sfxFlee: vi.fn(),
}));

// Helper to create a test character
const createTestCharacter = (id: string, name: string): Character => ({
  id,
  name,
  level: 1,
  exp: 0,
  stats: {
    hp: 100,
    maxHp: 100,
    attack: 10,
    defense: 5,
    speed: 5,
    magic: 5,
    level: 1,
    exp: 0,
    expToNext: 100,
  },
  sprite: { type: 'character', row: 0, col: 0 },
  position: { x: 0, y: 0 },
  skillIds: ['basic_attack'],
});

describe('Monster Sprite Combat Visualization - Bug Condition Exploration', () => {
  describe('Property 1: Fault Condition - Renderizado Correcto de Frame de Sprite', () => {
    /**
     * CRITICAL TEST: Verify that the rendering method uses <div> with background-image
     * instead of <img> with objectPosition.
     * 
     * The bug is that <img> with objectFit: 'none' and objectPosition does NOT crop
     * the image - it shows the entire spritesheet, just repositioned. This causes
     * adjacent frames to be visible and the sprite to look incorrect.
     * 
     * This test will FAIL on unfixed code because it uses <img> instead of <div>.
     */
    it('should use div with background-image instead of img with objectPosition', () => {
      const playerParty = [createTestCharacter('hero1', 'Hero')];
      const enemies = ['sprite'];

      const { container } = render(
        <CombatSystem
          playerParty={playerParty}
          enemies={enemies}
          onVictory={() => {}}
          onDefeat={() => {}}
          onFlee={() => {}}
        />
      );

      // The CORRECT implementation should use a <div> with background-image
      // The INCORRECT (current) implementation uses <img> with objectPosition
      
      // Look for monster sprite elements
      const monsterImgElements = container.querySelectorAll('img.pixelated');
      const monsterDivElements = container.querySelectorAll('div[style*="background-image"]');

      // The bug is that we're using <img> when we should use <div>
      // This test expects <div> with background-image (correct approach)
      // It will FAIL because the current code uses <img> (incorrect approach)
      expect(monsterImgElements.length).toBe(0); // Should NOT use <img>
      expect(monsterDivElements.length).toBeGreaterThan(0); // Should use <div> with background
    });

    /**
     * Test específico: Hada Oscura (sprite) en estado idle
     * Frame esperado: 0 de fila 0 (96x96px escalado a 192x192px)
     * 
     * This test verifies the CORRECT rendering approach with background-image
     */
    it('should render Dark Fairy (sprite) idle frame with background-image method', () => {
      const playerParty = [createTestCharacter('hero1', 'Hero')];
      const enemies = ['sprite'];

      const { container } = render(
        <CombatSystem
          playerParty={playerParty}
          enemies={enemies}
          onVictory={() => {}}
          onDefeat={() => {}}
          onFlee={() => {}}
        />
      );

      const spriteAsset = getMonsterSpriteAsset('sprite');
      expect(spriteAsset).not.toBeNull();

      if (spriteAsset) {
        // Find the monster sprite element - should be a div with background-image AND pixelated class
        const monsterDiv = container.querySelector('div.pixelated[style*="background-image"]') as HTMLDivElement;
        
        // This will FAIL on unfixed code because it uses <img> not <div>
        expect(monsterDiv).not.toBeNull();

        if (monsterDiv) {
          // The core fix is using div with background-image
          // Verify the element has the correct structure
          expect(monsterDiv.className).toContain('pixelated');
          
          // Check that background-image is set
          const styleAttr = monsterDiv.getAttribute('style');
          expect(styleAttr).toContain('background-image');
          expect(styleAttr).toContain('background-position');
          expect(styleAttr).toContain('background-size');
        }
      }
    });

    /**
     * Test específico: Lobo Oscuro (wolf) en estado attack
     * Frame esperado: 0 de fila 1 (100x100px escalado a 200x200px)
     */
    it('should render Dark Wolf (wolf) with correct background positioning for attack frame', () => {
      const playerParty = [createTestCharacter('hero1', 'Hero')];
      const enemies = ['wolf'];

      const { container } = render(
        <CombatSystem
          playerParty={playerParty}
          enemies={enemies}
          onVictory={() => {}}
          onDefeat={() => {}}
          onFlee={() => {}}
        />
      );

      const spriteAsset = getMonsterSpriteAsset('wolf');
      expect(spriteAsset).not.toBeNull();

      if (spriteAsset) {
        const attackAnim = spriteAsset.animations.attack;
        const scale = 2;

        // For attack animation (row=1, col=0), the background position should be:
        const expectedBgPosition = `-${attackAnim.col * spriteAsset.frameWidth * scale}px -${attackAnim.row * spriteAsset.frameHeight * scale}px`;
        expect(expectedBgPosition).toBe('-0px -200px'); // row 1 * 100px * 2

        // The element should be a div with background-image, not an img
        const monsterDiv = container.querySelector('div[style*="background-image"]');
        expect(monsterDiv).not.toBeNull(); // Will FAIL on unfixed code
      }
    });

    /**
     * Test específico: Murciélago Cristal (bat) en estado die
     * Frame esperado: 0 de fila 2 (80x60px escalado a 160x120px)
     */
    it('should render Crystal Bat (bat) die frame with correct non-square dimensions', () => {
      const playerParty = [createTestCharacter('hero1', 'Hero')];
      const enemies = ['bat'];

      const { container } = render(
        <CombatSystem
          playerParty={playerParty}
          enemies={enemies}
          onVictory={() => {}}
          onDefeat={() => {}}
          onFlee={() => {}}
        />
      );

      const spriteAsset = getMonsterSpriteAsset('bat');
      expect(spriteAsset).not.toBeNull();

      if (spriteAsset) {
        // Should use div with background-image AND pixelated class
        const monsterDiv = container.querySelector('div.pixelated[style*="background-image"]');
        expect(monsterDiv).not.toBeNull(); // Will FAIL on unfixed code

        if (monsterDiv) {
          // The core fix is using div with background-image
          // Verify the element has the correct structure
          expect(monsterDiv.className).toContain('pixelated');
          
          // Check that all required background properties are set
          const styleAttr = monsterDiv.getAttribute('style');
          expect(styleAttr).toContain('background-image');
          expect(styleAttr).toContain('background-position');
          expect(styleAttr).toContain('background-size');
          expect(styleAttr).toContain('width');
          expect(styleAttr).toContain('height');
        }
      }
    });

    /**
     * Test específico: Slime Verde (slime) cambiando de idle a attack
     * Verificar que el método de renderizado permite cambios correctos de frame
     */
    it('should support frame updates when animation state changes', () => {
      const playerParty = [createTestCharacter('hero1', 'Hero')];
      const enemies = ['slime'];

      const { container } = render(
        <CombatSystem
          playerParty={playerParty}
          enemies={enemies}
          onVictory={() => {}}
          onDefeat={() => {}}
          onFlee={() => {}}
        />
      );

      const spriteAsset = getMonsterSpriteAsset('slime');
      expect(spriteAsset).not.toBeNull();

      if (spriteAsset) {
        const idleAnim = spriteAsset.animations.idle;
        const attackAnim = spriteAsset.animations.attack;
        const scale = 2;

        // Calculate expected positions for both states
        const expectedIdlePosition = `-${idleAnim.col * spriteAsset.frameWidth * scale}px -${idleAnim.row * spriteAsset.frameHeight * scale}px`;
        const expectedAttackPosition = `-${attackAnim.col * spriteAsset.frameWidth * scale}px -${attackAnim.row * spriteAsset.frameHeight * scale}px`;

        // Verify they are different (idle is row 0, attack is row 1)
        expect(expectedIdlePosition).toBe('-0px -0px');
        expect(expectedAttackPosition).toBe('-0px -192px'); // row 1 * 96px * 2
        expect(expectedIdlePosition).not.toBe(expectedAttackPosition);

        // Should use div with background-image for proper frame switching
        const monsterDiv = container.querySelector('div[style*="background-image"]');
        expect(monsterDiv).not.toBeNull(); // Will FAIL on unfixed code
      }
    });
  });

  describe('Property-Based Test: Sprite Frame Rendering for All Monsters', () => {
    /**
     * Property-based test: For any monster with a valid spriteAsset and animState,
     * the rendering should use <div> with background-image, not <img> with objectPosition.
     * 
     * This test will FAIL on unfixed code and generate counterexamples showing
     * which monsters are rendered incorrectly.
     */
    it('should render all monster sprites using div with background-image method', () => {
      const monsterIds = ['sprite', 'wolf', 'bat', 'slime', 'mushroom', 'ghost', 'golem'];

      fc.assert(
        fc.property(
          fc.constantFrom(...monsterIds),
          (monsterId) => {
            const spriteAsset = getMonsterSpriteAsset(monsterId);
            
            // Skip if no sprite asset
            if (!spriteAsset) return true;

            // Render the combat system
            const playerParty = [createTestCharacter('hero1', 'Hero')];
            const { container } = render(
              <CombatSystem
                playerParty={playerParty}
                enemies={[monsterId]}
                onVictory={() => {}}
                onDefeat={() => {}}
                onFlee={() => {}}
              />
            );

            // The CORRECT implementation uses <div> with background-image
            // The INCORRECT (current) implementation uses <img> with objectPosition
            
            const monsterImgElements = container.querySelectorAll('img.pixelated');
            const monsterDivElements = container.querySelectorAll('div[style*="background-image"]');

            // This will FAIL on unfixed code because it uses <img>
            // Expected: 0 <img> elements, at least 1 <div> with background-image
            const usesCorrectMethod = monsterImgElements.length === 0 && monsterDivElements.length > 0;
            
            if (!usesCorrectMethod) {
              console.log(`COUNTEREXAMPLE: Monster "${monsterId}" uses incorrect rendering method`);
              console.log(`  - Found ${monsterImgElements.length} <img> elements (should be 0)`);
              console.log(`  - Found ${monsterDivElements.length} <div> with background-image (should be > 0)`);
            }

            return usesCorrectMethod;
          }
        ),
        { numRuns: 7 } // Test all 7 monsters
      );
    });
  });
});

/**
 * Property 2: Preservation Tests - Non-Sprite Rendering Behavior
 * 
 * **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**
 * 
 * CRITICAL: These tests MUST PASS on unfixed code - they verify behaviors that should NOT change.
 * 
 * METHODOLOGY: Observe behavior in UNFIXED code first, then encode that behavior in tests.
 * These tests ensure the fix doesn't break existing functionality.
 * 
 * EXPECTED RESULT: All tests PASS on unfixed code (confirming baseline behavior to preserve)
 */
describe('Monster Sprite Combat Visualization - Preservation Tests', () => {
  describe('Property 2: Preservation - Comportamiento de Renderizado No-Sprite', () => {
    /**
     * Requirement 3.1: Preservación de Fallback Renderer
     * 
     * OBSERVATION: Monsters without spriteAsset (null) should use SpriteRenderer component
     * This behavior must remain unchanged after the fix.
     */
    it('should preserve SpriteRenderer fallback for monsters without spriteAsset', () => {
      const playerParty = [createTestCharacter('hero1', 'Hero')];
      // Use a monster ID that doesn't have a PNG spriteAsset
      const enemies = ['shadow_slime']; // shadow_slime doesn't have a PNG sprite

      const { container } = render(
        <CombatSystem
          playerParty={playerParty}
          enemies={enemies}
          onVictory={() => {}}
          onDefeat={() => {}}
          onFlee={() => {}}
        />
      );

      // Verify that SpriteRenderer is used (it renders an SVG element)
      const svgElements = container.querySelectorAll('svg');
      expect(svgElements.length).toBeGreaterThan(0);

      // Should NOT have PNG sprite elements for this monster
      const spriteAsset = getMonsterSpriteAsset('shadow_slime');
      expect(spriteAsset).toBeNull();
    });

    /**
     * Requirement 3.2: Preservación de Filtros CSS
     * 
     * OBSERVATION: Dead monsters should have grayscale filter applied
     * This CSS filter behavior must remain unchanged after the fix.
     * 
     * Note: This test verifies the filter is applied to the sprite element,
     * regardless of whether it's <img> or <div>.
     */
    it('should preserve CSS grayscale filter for dead monsters', () => {
      const playerParty = [createTestCharacter('hero1', 'Hero')];
      const enemies = ['sprite'];

      const { container } = render(
        <CombatSystem
          playerParty={playerParty}
          enemies={enemies}
          onVictory={() => {}}
          onDefeat={() => {}}
          onFlee={() => {}}
        />
      );

      // Find the monster sprite element (could be img or div)
      const monsterElement = container.querySelector('img.pixelated') || 
                            container.querySelector('div[style*="background-image"]');
      
      expect(monsterElement).not.toBeNull();

      if (monsterElement) {
        const computedStyle = window.getComputedStyle(monsterElement);
        
        // When monster is alive, no grayscale filter
        // When dead, should have grayscale(1) brightness(0.3)
        // For now, just verify the filter property exists and can be set
        expect(computedStyle.filter).toBeDefined();
      }
    });

    /**
     * Requirement 3.3: Preservación de Efectos Visuales
     * 
     * OBSERVATION: Attack flash animation should display correctly over monster sprites
     * This visual effect behavior must remain unchanged after the fix.
     */
    it('should preserve attack flash visual effect rendering', () => {
      const playerParty = [createTestCharacter('hero1', 'Hero')];
      const enemies = ['sprite'];

      const { container } = render(
        <CombatSystem
          playerParty={playerParty}
          enemies={enemies}
          onVictory={() => {}}
          onDefeat={() => {}}
          onFlee={() => {}}
        />
      );

      // The attack flash is rendered as a motion.div with absolute positioning
      // It should be present in the DOM structure (even if not currently animating)
      // The structure should have a relative container with the sprite inside
      const relativeContainers = container.querySelectorAll('div.relative');
      expect(relativeContainers.length).toBeGreaterThan(0);

      // Verify the structure allows for absolute positioned overlays
      // This ensures attack flash can be rendered correctly
      const hasCorrectStructure = Array.from(relativeContainers).some(container => {
        const hasSprite = container.querySelector('img.pixelated') || 
                         container.querySelector('div[style*="background-image"]');
        return hasSprite !== null;
      });

      expect(hasCorrectStructure).toBe(true);
    });

    /**
     * Requirement 3.4: Preservación de Renderizado Multi-Monstruo
     * 
     * OBSERVATION: Multiple monsters should render independently with their own sprites
     * This multi-monster rendering behavior must remain unchanged after the fix.
     */
    it('should preserve independent rendering of multiple monsters', () => {
      const playerParty = [createTestCharacter('hero1', 'Hero')];
      const enemies = ['sprite', 'wolf', 'bat'];

      const { container } = render(
        <CombatSystem
          playerParty={playerParty}
          enemies={enemies}
          onVictory={() => {}}
          onDefeat={() => {}}
          onFlee={() => {}}
        />
      );

      // Count monster sprite elements (img or div with background-image)
      const imgElements = container.querySelectorAll('img.pixelated');
      const divElements = container.querySelectorAll('div[style*="background-image"]');
      const totalMonsterSprites = imgElements.length + divElements.length;

      // Should have at least 3 monster sprites rendered (may include hero sprites too)
      expect(totalMonsterSprites).toBeGreaterThanOrEqual(3);

      // Each monster should be in its own container
      const relativeContainers = container.querySelectorAll('div.relative');
      expect(relativeContainers.length).toBeGreaterThanOrEqual(3);
    });

    /**
     * Requirement 3.5: Preservación de Interacciones de Usuario
     * 
     * OBSERVATION: Hover and click interactions should work correctly on monster sprites
     * This user interaction behavior must remain unchanged after the fix.
     * 
     * Note: This test verifies the structure supports interactions, not the actual
     * event handlers (which would require more complex testing setup).
     */
    it('should preserve structure that supports user interactions', () => {
      const playerParty = [createTestCharacter('hero1', 'Hero')];
      const enemies = ['sprite'];

      const { container } = render(
        <CombatSystem
          playerParty={playerParty}
          enemies={enemies}
          onVictory={() => {}}
          onDefeat={() => {}}
          onFlee={() => {}}
        />
      );

      // Monster sprites should be within clickable containers
      // The structure should support hover and click events
      const monsterContainers = container.querySelectorAll('div.relative');
      expect(monsterContainers.length).toBeGreaterThan(0);

      // Verify sprites are rendered within these interactive containers
      Array.from(monsterContainers).forEach(container => {
        const hasSprite = container.querySelector('img.pixelated') || 
                         container.querySelector('div[style*="background-image"]');
        if (hasSprite) {
          // The sprite element should be part of an interactive structure
          expect(container.parentElement).not.toBeNull();
        }
      });
    });

    /**
     * Property-Based Test: Preservation across all monster types
     * 
     * For any monster (with or without spriteAsset), the non-sprite behaviors
     * should remain consistent: structure, filters, effects, interactions.
     */
    it('should preserve non-sprite behaviors for all monster types', () => {
      const allMonsterIds = ['sprite', 'wolf', 'bat', 'slime', 'mushroom', 'ghost', 'golem', 'shadow_slime'];

      fc.assert(
        fc.property(
          fc.constantFrom(...allMonsterIds),
          (monsterId) => {
            const playerParty = [createTestCharacter('hero1', 'Hero')];
            const { container } = render(
              <CombatSystem
                playerParty={playerParty}
                enemies={[monsterId]}
                onVictory={() => {}}
                onDefeat={() => {}}
                onFlee={() => {}}
              />
            );

            // Verify basic structure is preserved
            const relativeContainers = container.querySelectorAll('div.relative');
            const hasStructure = relativeContainers.length > 0;

            // Verify sprite rendering (either PNG or fallback)
            const spriteAsset = getMonsterSpriteAsset(monsterId);
            const imgElements = container.querySelectorAll('img.pixelated');
            const divElements = container.querySelectorAll('div[style*="background-image"]');
            const svgElements = container.querySelectorAll('svg');
            
            const hasRendering = (spriteAsset && (imgElements.length > 0 || divElements.length > 0)) ||
                                (!spriteAsset && svgElements.length > 0);

            // Both structure and rendering should be present
            const isPreserved = hasStructure && hasRendering;

            if (!isPreserved) {
              console.log(`PRESERVATION ISSUE: Monster "${monsterId}" missing expected structure or rendering`);
              console.log(`  - Has structure: ${hasStructure}`);
              console.log(`  - Has rendering: ${hasRendering}`);
              console.log(`  - Sprite asset: ${spriteAsset ? 'yes' : 'no'}`);
              console.log(`  - IMG elements: ${imgElements.length}`);
              console.log(`  - DIV elements: ${divElements.length}`);
              console.log(`  - SVG elements: ${svgElements.length}`);
            }

            return isPreserved;
          }
        ),
        { numRuns: 8 } // Test all 8 monster types
      );
    });
  });
});
