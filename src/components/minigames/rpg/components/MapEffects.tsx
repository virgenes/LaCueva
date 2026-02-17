import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface MapEffectsProps {
  mapId: string;
  width: number;
  height: number;
  tileSize: number;
  /** 0 = midnight, 0.5 = noon, 1 = midnight */
  timeOfDay: number;
}

// ============ FALLING LEAVES ============
interface Leaf {
  id: number;
  x: number;
  startY: number;
  size: number;
  duration: number;
  delay: number;
  rotation: number;
  color: string;
  swayAmount: number;
}

const LEAF_COLORS = ['#4ade80', '#22c55e', '#16a34a', '#86efac', '#a3e635', '#65a30d', '#fbbf24', '#f97316'];

const FallingLeaves: React.FC<{ count: number; width: number; height: number }> = React.memo(({ count, width, height }) => {
  const leaves = useMemo<Leaf[]>(() => 
    Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * width,
      startY: -20 - Math.random() * 40,
      size: 3 + Math.random() * 5,
      duration: 6 + Math.random() * 8,
      delay: Math.random() * 10,
      rotation: Math.random() * 360,
      color: LEAF_COLORS[Math.floor(Math.random() * LEAF_COLORS.length)],
      swayAmount: 20 + Math.random() * 40,
    })), [count, width, height]
  );

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 50 }}>
      {leaves.map(leaf => (
        <motion.div
          key={leaf.id}
          className="absolute"
          style={{
            left: leaf.x,
            top: leaf.startY,
            width: leaf.size,
            height: leaf.size * 0.7,
            backgroundColor: leaf.color,
            borderRadius: '0 50% 50% 50%',
            opacity: 0.8,
          }}
          animate={{
            y: [0, height + 40],
            x: [0, leaf.swayAmount, -leaf.swayAmount, leaf.swayAmount * 0.5, 0],
            rotate: [0, leaf.rotation + 720],
            opacity: [0, 0.8, 0.8, 0.6, 0],
          }}
          transition={{
            duration: leaf.duration,
            delay: leaf.delay,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      ))}
    </div>
  );
});

// ============ FOG EFFECT ============
const FogEffect: React.FC<{ intensity: number; width: number; height: number }> = React.memo(({ intensity, width, height }) => (
  <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 45 }}>
    {[0, 1, 2].map(i => (
      <motion.div
        key={i}
        className="absolute"
        style={{
          width: width * 1.5,
          height: height * 0.4,
          top: height * (0.2 + i * 0.25),
          left: -width * 0.25,
          background: `radial-gradient(ellipse at center, rgba(200,220,200,${intensity * 0.15}) 0%, transparent 70%)`,
          filter: 'blur(20px)',
        }}
        animate={{
          x: [-width * 0.2, width * 0.3, -width * 0.2],
          opacity: [intensity * 0.3, intensity * 0.6, intensity * 0.3],
        }}
        transition={{
          duration: 12 + i * 4,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: i * 3,
        }}
      />
    ))}
  </div>
));

// ============ WATER SHADER ============
const WaterShader: React.FC<{ width: number; height: number }> = React.memo(({ width, height }) => (
  <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 3, mixBlendMode: 'overlay' }}>
    <motion.div
      className="absolute inset-0"
      style={{
        background: `repeating-linear-gradient(
          90deg,
          transparent,
          rgba(100,200,255,0.03) 4px,
          transparent 8px
        )`,
      }}
      animate={{ backgroundPositionX: ['0px', '16px'] }}
      transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
    />
    <motion.div
      className="absolute inset-0"
      style={{
        background: `repeating-linear-gradient(
          0deg,
          transparent,
          rgba(100,200,255,0.02) 4px,
          transparent 8px
        )`,
      }}
      animate={{ backgroundPositionY: ['0px', '12px'] }}
      transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
    />
  </div>
));

// ============ DAY/NIGHT CYCLE ============
const DayNightOverlay: React.FC<{ timeOfDay: number; width: number; height: number }> = React.memo(({ timeOfDay, width, height }) => {
  // timeOfDay: 0-1 where 0=midnight, 0.25=sunrise, 0.5=noon, 0.75=sunset
  const { overlayColor, overlayOpacity, sunMoonX, sunMoonY, isSun, celestialColor, celestialGlow } = useMemo(() => {
    const t = timeOfDay;
    let color: string;
    let opacity: number;
    let isSunVal: boolean;

    if (t < 0.2 || t > 0.8) {
      // Night
      color = 'rgba(10,10,40,0.55)';
      opacity = 1;
      isSunVal = false;
    } else if (t < 0.3) {
      // Sunrise
      const p = (t - 0.2) / 0.1;
      color = `rgba(${Math.floor(255 * p)},${Math.floor(100 * p)},${Math.floor(50 * (1 - p))},${0.4 * (1 - p)})`;
      opacity = 1;
      isSunVal = true;
    } else if (t < 0.7) {
      // Day
      color = 'rgba(255,255,200,0.03)';
      opacity = 1;
      isSunVal = true;
    } else {
      // Sunset
      const p = (t - 0.7) / 0.1;
      color = `rgba(${Math.floor(200 - 150 * p)},${Math.floor(80 * (1 - p))},${Math.floor(20 + 30 * p)},${0.1 + 0.35 * p})`;
      opacity = 1;
      isSunVal = p < 0.5;
    }

    // Celestial body arc
    const angle = Math.PI * (1 - timeOfDay * 2);
    const cx = width / 2 + Math.cos(angle) * width * 0.35;
    const cy = height * 0.6 - Math.sin(angle) * height * 0.5;

    return {
      overlayColor: color,
      overlayOpacity: opacity,
      sunMoonX: cx,
      sunMoonY: Math.max(5, cy),
      isSun: isSunVal,
      celestialColor: isSunVal ? '#fbbf24' : '#e0e7ff',
      celestialGlow: isSunVal ? 'rgba(251,191,36,0.3)' : 'rgba(200,210,255,0.2)',
    };
  }, [timeOfDay, width, height]);

  return (
    <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 55 }}>
      {/* Sky tint */}
      <div className="absolute inset-0 transition-colors duration-1000" style={{ background: overlayColor, opacity: overlayOpacity }} />

      {/* Sun or Moon */}
      {sunMoonY < height && (
        <motion.div
          className="absolute rounded-full"
          animate={{
            boxShadow: isSun 
              ? [`0 0 20px 8px ${celestialGlow}`, `0 0 30px 12px ${celestialGlow}`, `0 0 20px 8px ${celestialGlow}`]
              : [`0 0 10px 4px ${celestialGlow}`, `0 0 15px 6px ${celestialGlow}`, `0 0 10px 4px ${celestialGlow}`],
          }}
          transition={{ duration: 3, repeat: Infinity }}
          style={{
            left: sunMoonX - (isSun ? 12 : 8),
            top: sunMoonY - (isSun ? 12 : 8),
            width: isSun ? 24 : 16,
            height: isSun ? 24 : 16,
            backgroundColor: celestialColor,
            opacity: 0.9,
          }}
        />
      )}

      {/* Stars at night */}
      {(timeOfDay < 0.2 || timeOfDay > 0.8) && (
        <div className="absolute inset-0">
          {Array.from({ length: 20 }, (_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full bg-white"
              style={{
                left: `${(i * 37 + 13) % 100}%`,
                top: `${(i * 23 + 7) % 40}%`,
                width: i % 3 === 0 ? 2 : 1,
                height: i % 3 === 0 ? 2 : 1,
              }}
              animate={{ opacity: [0.3, 0.9, 0.3] }}
              transition={{ duration: 1.5 + (i % 4), repeat: Infinity, delay: i * 0.3 }}
            />
          ))}
        </div>
      )}
    </div>
  );
});

// ============ FIREFLIES (night) ============
const Fireflies: React.FC<{ count: number; width: number; height: number; visible: boolean }> = React.memo(({ count, width, height, visible }) => {
  if (!visible) return null;
  return (
    <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 48 }}>
      {Array.from({ length: count }, (_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: 3,
            height: 3,
            backgroundColor: '#fbbf24',
            boxShadow: '0 0 6px 2px rgba(251,191,36,0.6)',
          }}
          animate={{
            x: [
              Math.random() * width,
              Math.random() * width,
              Math.random() * width,
            ],
            y: [
              Math.random() * height,
              Math.random() * height,
              Math.random() * height,
            ],
            opacity: [0, 0.8, 0, 0.6, 0],
          }}
          transition={{
            duration: 6 + Math.random() * 6,
            repeat: Infinity,
            delay: Math.random() * 5,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
});

// ============ PARTICLE DUST ============
const DustParticles: React.FC<{ width: number; height: number }> = React.memo(({ width, height }) => (
  <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 46 }}>
    {Array.from({ length: 15 }, (_, i) => (
      <motion.div
        key={i}
        className="absolute rounded-full"
        style={{
          width: 2,
          height: 2,
          backgroundColor: 'rgba(255,255,200,0.4)',
        }}
        animate={{
          x: [Math.random() * width, Math.random() * width],
          y: [Math.random() * height, Math.random() * height],
          opacity: [0, 0.5, 0],
          scale: [0.5, 1, 0.5],
        }}
        transition={{
          duration: 8 + Math.random() * 8,
          repeat: Infinity,
          delay: Math.random() * 6,
        }}
      />
    ))}
  </div>
));

// ============ MAIN COMPONENT ============
export const MapEffects: React.FC<MapEffectsProps> = React.memo(({
  mapId,
  width,
  height,
  tileSize,
  timeOfDay,
}) => {
  const pixelWidth = width * tileSize;
  const pixelHeight = height * tileSize;

  const isForest = mapId === 'memory_garden' || mapId === 'forest';
  const isCave = mapId === 'cave';
  const isNight = timeOfDay < 0.2 || timeOfDay > 0.8;

  return (
    <>
      {/* Falling leaves in forest maps */}
      {isForest && <FallingLeaves count={25} width={pixelWidth} height={pixelHeight} />}

      {/* Fog in forest */}
      {isForest && <FogEffect intensity={isNight ? 0.7 : 0.3} width={pixelWidth} height={pixelHeight} />}

      {/* Cave fog is thicker */}
      {isCave && <FogEffect intensity={0.8} width={pixelWidth} height={pixelHeight} />}

      {/* Water shimmer */}
      <WaterShader width={pixelWidth} height={pixelHeight} />

      {/* Day/night cycle */}
      <DayNightOverlay timeOfDay={timeOfDay} width={pixelWidth} height={pixelHeight} />

      {/* Fireflies at night in forests */}
      {isForest && <Fireflies count={12} width={pixelWidth} height={pixelHeight} visible={isNight} />}

      {/* Floating dust particles */}
      <DustParticles width={pixelWidth} height={pixelHeight} />
    </>
  );
});

MapEffects.displayName = 'MapEffects';
