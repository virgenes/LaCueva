import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { imageTiles } from './imageTiles';

/**
 * Bug Condition Exploration Property Test
 * 
 * **Validates: Requirements 1.1, 1.2, 1.3**
 * 
 * This test explores the fault condition where the bed (img_bed) renders
 * with an inadequately small visual size (displayWidth: 1.6, displayHeight: 1.6)
 * compared to the player (scale 1.5).
 * 
 * CRITICAL: This test MUST FAIL on unfixed code - the failure confirms the bug exists.
 * 
 * The test encodes the EXPECTED behavior:
 * - displayWidth should be in range 2.0-2.5
 * - displayHeight should be in range 2.0-2.5
 * - Visual size should be greater than playerScale * tileSize
 * 
 * When this test passes after the fix, it confirms the bug is corrected.
 */
describe('Bug Condition Exploration: Bed Visual Size Too Small', () => {
  const TILE_SIZE = 8; // Base tile size in pixels
  const PIXEL_SIZE = 4; // Pixel scaling factor
  const PLAYER_SCALE = 1.5; // Player rendering scale from GameCanvas.tsx
  
  it('Property 1: Fault Condition - Bed Visual Size and Collision Alignment', () => {
    /**
     * **Validates: Requirements 1.1, 1.2, 1.3**
     * 
     * This property-based test uses a bounded approach for this deterministic bug.
     * We focus on the specific case that fails: img_bed configuration.
     * 
     * The test verifies the EXPECTED behavior (which will fail on unfixed code):
     * 1. displayWidth should be in range 2.0-2.5 (currently 1.6 - TOO SMALL)
     * 2. displayHeight should be in range 2.0-2.5 (currently 1.6 - TOO SMALL)
     * 3. Visual size should be greater than player size (currently barely larger)
     */
    
    // Get the current bed configuration
    const bedConfig = imageTiles['img_bed'];
    
    // Document current buggy state
    console.log('Current bed configuration:', {
      displayWidth: bedConfig.displayWidth,
      displayHeight: bedConfig.displayHeight,
      offsetY: bedConfig.offsetY,
    });
    
    // Calculate actual rendering sizes
    const bedRenderWidth = (bedConfig.displayWidth || 1) * TILE_SIZE * PIXEL_SIZE;
    const bedRenderHeight = (bedConfig.displayHeight || 1) * TILE_SIZE * PIXEL_SIZE;
    const playerRenderSize = PLAYER_SCALE * TILE_SIZE * PIXEL_SIZE;
    
    console.log('Rendering sizes:', {
      bedRenderWidth,
      bedRenderHeight,
      playerRenderSize,
      bedToPlayerRatio: bedRenderWidth / playerRenderSize,
    });
    
    // Property-based test: Generate test case for the bed configuration
    fc.assert(
      fc.property(
        // We use a constant arbitrary since this is a deterministic bug
        // focused on the specific img_bed configuration
        fc.constant('img_bed'),
        (tileId) => {
          const tile = imageTiles[tileId];
          
          // EXPECTED BEHAVIOR (will fail on unfixed code):
          
          // 1. displayWidth should be in range 2.0-2.5
          expect(
            tile.displayWidth,
            `displayWidth should be between 2.0 and 2.5, but got ${tile.displayWidth}`
          ).toBeGreaterThanOrEqual(2.0);
          
          expect(
            tile.displayWidth,
            `displayWidth should be between 2.0 and 2.5, but got ${tile.displayWidth}`
          ).toBeLessThanOrEqual(2.5);
          
          // 2. displayHeight should be in range 2.0-2.5
          expect(
            tile.displayHeight,
            `displayHeight should be between 2.0 and 2.5, but got ${tile.displayHeight}`
          ).toBeGreaterThanOrEqual(2.0);
          
          expect(
            tile.displayHeight,
            `displayHeight should be between 2.0 and 2.5, but got ${tile.displayHeight}`
          ).toBeLessThanOrEqual(2.5);
          
          // 3. Visual size should be greater than player scale * tileSize
          const visualWidth = (tile.displayWidth || 1) * TILE_SIZE * PIXEL_SIZE;
          const visualHeight = (tile.displayHeight || 1) * TILE_SIZE * PIXEL_SIZE;
          
          expect(
            visualWidth,
            `Bed visual width (${visualWidth}) should be greater than player size (${playerRenderSize})`
          ).toBeGreaterThan(playerRenderSize);
          
          expect(
            visualHeight,
            `Bed visual height (${visualHeight}) should be greater than player size (${playerRenderSize})`
          ).toBeGreaterThan(playerRenderSize);
          
          // Additional check: bed should be significantly larger than player
          // (at least 33% larger for furniture proportions)
          const minExpectedRatio = 1.33;
          const actualRatio = visualWidth / playerRenderSize;
          
          expect(
            actualRatio,
            `Bed should be at least ${minExpectedRatio}x player size, but is only ${actualRatio.toFixed(2)}x`
          ).toBeGreaterThanOrEqual(minExpectedRatio);
        }
      ),
      {
        numRuns: 1, // Single run since this is a deterministic bug
        verbose: true,
      }
    );
  });
});

/**
 * Preservation Property Tests
 * 
 * **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**
 * 
 * These tests verify that the bugfix does NOT break existing functionality.
 * They capture the current working behavior of other objects and bed interactions,
 * which must remain unchanged after the fix.
 * 
 * IMPORTANT: These tests should PASS on unfixed code (documenting current behavior)
 * and continue to PASS after the fix (confirming no regressions).
 */
describe('Preservation Property Tests: Other Objects and Bed Interactions', () => {
  
  it('Property 2.1: Other Objects Preserve Their Configurations', () => {
    /**
     * **Validates: Requirements 3.3**
     * 
     * Verifies that objects OTHER than img_bed maintain their exact configurations.
     * This includes img_stone, img_bush, img_sign, and img_window.
     */
    
    // Define expected configurations for other objects (observed from unfixed code)
    const expectedConfigs = {
      img_stone: {
        solid: true,
        interactable: false,
        layer: 'object',
        groundTile: 'img_dirt',
        scaleVariation: [0.7, 1.2],
      },
      img_bush: {
        solid: true,
        interactable: false,
        layer: 'object',
        groundTile: 'img_grass',
        scaleVariation: [0.8, 1.3],
      },
      img_sign: {
        solid: true,
        interactable: true,
        interactionType: 'dialogue',
        interactionData: 'sign_welcome',
        layer: 'object',
        groundTile: 'img_grass',
        displayWidth: 1.3,
        displayHeight: 1.3,
      },
      img_window: {
        solid: true,
        interactable: false,
        layer: 'object',
        groundTile: 'img_wall',
      },
    };
    
    // Property-based test: verify each object maintains its configuration
    fc.assert(
      fc.property(
        fc.constantFrom('img_stone', 'img_bush', 'img_sign', 'img_window'),
        (tileId) => {
          const tile = imageTiles[tileId];
          const expected = expectedConfigs[tileId as keyof typeof expectedConfigs];
          
          // Verify all expected properties match
          expect(tile.solid).toBe(expected.solid);
          expect(tile.interactable).toBe(expected.interactable);
          expect(tile.layer).toBe(expected.layer);
          expect(tile.groundTile).toBe(expected.groundTile);
          
          if ('interactionType' in expected) {
            expect(tile.interactionType).toBe(expected.interactionType);
          }
          
          if ('interactionData' in expected) {
            expect(tile.interactionData).toBe(expected.interactionData);
          }
          
          if ('displayWidth' in expected) {
            expect(tile.displayWidth).toBe(expected.displayWidth);
          }
          
          if ('displayHeight' in expected) {
            expect(tile.displayHeight).toBe(expected.displayHeight);
          }
          
          if ('scaleVariation' in expected) {
            expect(tile.scaleVariation).toEqual(expected.scaleVariation);
          }
        }
      ),
      {
        numRuns: 100, // Test multiple times to ensure consistency
      }
    );
  });
  
  it('Property 2.2: Bed Interaction Preservation', () => {
    /**
     * **Validates: Requirements 3.1**
     * 
     * Verifies that the bed's interaction functionality remains unchanged.
     * The bed should continue to be interactable with the 'bed_rest' dialogue.
     */
    
    const bedConfig = imageTiles['img_bed'];
    
    // Verify interaction properties are preserved
    expect(bedConfig.interactable).toBe(true);
    expect(bedConfig.interactionType).toBe('dialogue');
    expect(bedConfig.interactionData).toBe('bed_rest');
    
    // Property-based test: verify interaction properties across multiple checks
    fc.assert(
      fc.property(
        fc.constant('img_bed'),
        (tileId) => {
          const tile = imageTiles[tileId];
          
          // These properties must remain unchanged
          expect(tile.interactable).toBe(true);
          expect(tile.interactionType).toBe('dialogue');
          expect(tile.interactionData).toBe('bed_rest');
        }
      ),
      {
        numRuns: 50,
      }
    );
  });
  
  it('Property 2.3: Ground Tile Preservation', () => {
    /**
     * **Validates: Requirements 3.2**
     * 
     * Verifies that the bed's groundTile (img_wood_floor) is preserved.
     * This ensures the wood floor continues to render correctly beneath the bed.
     */
    
    const bedConfig = imageTiles['img_bed'];
    
    // Verify groundTile is preserved
    expect(bedConfig.groundTile).toBe('img_wood_floor');
    
    // Property-based test: verify groundTile across multiple checks
    fc.assert(
      fc.property(
        fc.constant('img_bed'),
        (tileId) => {
          const tile = imageTiles[tileId];
          
          // groundTile must remain unchanged
          expect(tile.groundTile).toBe('img_wood_floor');
        }
      ),
      {
        numRuns: 50,
      }
    );
  });
  
  it('Property 2.4: Solid Property Preservation', () => {
    /**
     * **Validates: Requirements 3.4**
     * 
     * Verifies that the bed's solid property remains true.
     * This ensures the bed continues to block player movement.
     */
    
    const bedConfig = imageTiles['img_bed'];
    
    // Verify solid property is preserved
    expect(bedConfig.solid).toBe(true);
    
    // Property-based test: verify solid property across multiple checks
    fc.assert(
      fc.property(
        fc.constant('img_bed'),
        (tileId) => {
          const tile = imageTiles[tileId];
          
          // solid must remain true
          expect(tile.solid).toBe(true);
        }
      ),
      {
        numRuns: 50,
      }
    );
  });
  
  it('Property 2.5: Layer Property Preservation', () => {
    /**
     * **Validates: Requirements 3.5**
     * 
     * Verifies that the bed's layer property remains 'object'.
     * This ensures the bed continues to render above ground tiles.
     */
    
    const bedConfig = imageTiles['img_bed'];
    
    // Verify layer property is preserved
    expect(bedConfig.layer).toBe('object');
    
    // Property-based test: verify layer property across multiple checks
    fc.assert(
      fc.property(
        fc.constant('img_bed'),
        (tileId) => {
          const tile = imageTiles[tileId];
          
          // layer must remain 'object'
          expect(tile.layer).toBe('object');
        }
      ),
      {
        numRuns: 50,
      }
    );
  });
  
  it('Property 2.6: All Non-Size Bed Properties Preserved', () => {
    /**
     * **Validates: Requirements 3.1, 3.2, 3.4, 3.5**
     * 
     * Comprehensive test verifying that ALL bed properties except displayWidth,
     * displayHeight, and offsetY remain unchanged. This is a catch-all preservation test.
     */
    
    // Expected bed configuration (excluding size properties that will change)
    const expectedBedConfig = {
      id: 'img_bed',
      solid: true,
      interactable: true,
      interactionType: 'dialogue' as const,
      interactionData: 'bed_rest',
      layer: 'object' as const,
      groundTile: 'img_wood_floor',
    };
    
    fc.assert(
      fc.property(
        fc.constant('img_bed'),
        (tileId) => {
          const tile = imageTiles[tileId];
          
          // Verify all non-size properties
          expect(tile.id).toBe(expectedBedConfig.id);
          expect(tile.solid).toBe(expectedBedConfig.solid);
          expect(tile.interactable).toBe(expectedBedConfig.interactable);
          expect(tile.interactionType).toBe(expectedBedConfig.interactionType);
          expect(tile.interactionData).toBe(expectedBedConfig.interactionData);
          expect(tile.layer).toBe(expectedBedConfig.layer);
          expect(tile.groundTile).toBe(expectedBedConfig.groundTile);
          
          // Verify src exists (we don't check exact value as it's an import)
          expect(tile.src).toBeDefined();
          expect(typeof tile.src).toBe('string');
        }
      ),
      {
        numRuns: 100,
      }
    );
  });
});
