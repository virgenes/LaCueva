import React, { useMemo } from 'react';

interface MapEffectsProps {
  mapId: string;
  width: number;
  height: number;
  tileSize: number;
  timeOfDay: number;
  isMobile?: boolean;
  /** When true, suppress day/night overlay (e.g. when menu is open) */
  suppressOverlay?: boolean;
}

// CSS-based falling leaves (no framer-motion = better on old Android)
const FallingLeaves: React.FC<{ count: number; w: number; h: number }> = React.memo(({ count, w, h }) => {
  const leaves = useMemo(() =>
    Array.from({ length: count }, (_, i) => ({
      left: `${(i * 37 + 5) % 100}%`,
      size: 3 + (i % 3) * 2,
      dur: 6 + (i % 5) * 2,
      delay: (i * 1.3) % 8,
      color: ['#4ade80', '#22c55e', '#86efac', '#a3e635', '#65a30d', '#fbbf24'][i % 6],
    })), [count]);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 50 }}>
      {leaves.map((l, i) => (
        <div key={i} className="absolute" style={{
          left: l.left,
          top: '-10px',
          width: l.size,
          height: l.size * 0.7,
          backgroundColor: l.color,
          borderRadius: '0 50% 50% 50%',
          opacity: 0.7,
          animation: `leaf-fall ${l.dur}s linear ${l.delay}s infinite`,
        }} />
      ))}
      <style>{`
        @keyframes leaf-fall {
          0% { transform: translateY(-10px) rotate(0deg); opacity: 0; }
          10% { opacity: 0.7; }
          90% { opacity: 0.5; }
          100% { transform: translateY(${h}px) rotate(720deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
});

// CSS-based fog
const FogEffect: React.FC<{ intensity: number; w: number; h: number }> = React.memo(({ intensity, w, h }) => (
  <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 45 }}>
    {[0, 1].map(i => (
      <div key={i} className="absolute" style={{
        width: w * 1.3,
        height: h * 0.35,
        top: `${30 + i * 25}%`,
        left: '-15%',
        background: `radial-gradient(ellipse at center, rgba(200,220,200,${intensity * 0.12}) 0%, transparent 70%)`,
        filter: 'blur(15px)',
        animation: `fog-drift ${14 + i * 6}s ease-in-out ${i * 4}s infinite alternate`,
        opacity: intensity * 0.5,
      }} />
    ))}
    <style>{`
      @keyframes fog-drift {
        0% { transform: translateX(-5%); }
        100% { transform: translateX(10%); }
      }
    `}</style>
  </div>
));

// Water shimmer (CSS only)
const WaterShader: React.FC = React.memo(() => (
  <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 3, mixBlendMode: 'overlay' }}>
    <div className="absolute inset-0" style={{
      background: 'repeating-linear-gradient(90deg, transparent, rgba(100,200,255,0.03) 4px, transparent 8px)',
      animation: 'water-shift 2s linear infinite',
    }} />
    <style>{`
      @keyframes water-shift { 0% { background-position-x: 0; } 100% { background-position-x: 16px; } }
    `}</style>
  </div>
));

// Day/Night overlay (NOT rendered when suppressOverlay=true)
const DayNightOverlay: React.FC<{ timeOfDay: number; w: number; h: number }> = React.memo(({ timeOfDay, w, h }) => {
  const { overlayColor, sunMoonX, sunMoonY, isSun, celestialColor, celestialGlow } = useMemo(() => {
    const t = timeOfDay;
    let color: string;
    let isSunVal: boolean;

    if (t < 0.2 || t > 0.8) {
      color = 'rgba(10,10,40,0.5)';
      isSunVal = false;
    } else if (t < 0.3) {
      const p = (t - 0.2) / 0.1;
      color = `rgba(${Math.floor(200 * p)},${Math.floor(80 * p)},${Math.floor(40 * (1 - p))},${0.35 * (1 - p)})`;
      isSunVal = true;
    } else if (t < 0.7) {
      color = 'rgba(255,255,200,0.02)';
      isSunVal = true;
    } else {
      const p = (t - 0.7) / 0.1;
      color = `rgba(${Math.floor(180 - 130 * p)},${Math.floor(60 * (1 - p))},${Math.floor(20 + 25 * p)},${0.08 + 0.32 * p})`;
      isSunVal = p < 0.5;
    }

    const angle = Math.PI * (1 - timeOfDay * 2);
    const cx = w / 2 + Math.cos(angle) * w * 0.35;
    const cy = h * 0.6 - Math.sin(angle) * h * 0.5;

    return {
      overlayColor: color,
      sunMoonX: cx,
      sunMoonY: Math.max(5, cy),
      isSun: isSunVal,
      celestialColor: isSunVal ? '#fbbf24' : '#e0e7ff',
      celestialGlow: isSunVal ? 'rgba(251,191,36,0.3)' : 'rgba(200,210,255,0.2)',
    };
  }, [timeOfDay, w, h]);

  const isNight = timeOfDay < 0.2 || timeOfDay > 0.8;

  return (
    <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 55 }}>
      <div className="absolute inset-0" style={{ background: overlayColor, transition: 'background 2s' }} />
      {sunMoonY < h && (
        <div className="absolute rounded-full" style={{
          left: sunMoonX - (isSun ? 10 : 7),
          top: sunMoonY - (isSun ? 10 : 7),
          width: isSun ? 20 : 14,
          height: isSun ? 20 : 14,
          backgroundColor: celestialColor,
          opacity: 0.8,
          boxShadow: `0 0 ${isSun ? 20 : 10}px 6px ${celestialGlow}`,
          transition: 'all 2s',
        }} />
      )}
      {isNight && Array.from({ length: 12 }, (_, i) => (
        <div key={i} className="absolute rounded-full bg-white" style={{
          left: `${(i * 37 + 13) % 100}%`,
          top: `${(i * 23 + 7) % 35}%`,
          width: i % 3 === 0 ? 2 : 1,
          height: i % 3 === 0 ? 2 : 1,
          opacity: 0.3 + (i % 5) * 0.1,
          animation: `star-twinkle ${1.5 + (i % 3)}s ease-in-out ${i * 0.4}s infinite alternate`,
        }} />
      ))}
      <style>{`
        @keyframes star-twinkle { 0% { opacity: 0.2; } 100% { opacity: 0.8; } }
      `}</style>
    </div>
  );
});

// Fireflies (CSS)
const Fireflies: React.FC<{ count: number; w: number; h: number }> = React.memo(({ count, w, h }) => (
  <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 48 }}>
    {Array.from({ length: count }, (_, i) => (
      <div key={i} className="absolute rounded-full" style={{
        width: 3, height: 3,
        backgroundColor: '#fbbf24',
        boxShadow: '0 0 6px 2px rgba(251,191,36,0.5)',
        left: `${(i * 29 + 10) % 90}%`,
        top: `${(i * 37 + 20) % 70}%`,
        animation: `firefly-float ${5 + i * 2}s ease-in-out ${i * 1.2}s infinite alternate`,
      }} />
    ))}
    <style>{`
      @keyframes firefly-float {
        0% { transform: translate(0, 0); opacity: 0; }
        20% { opacity: 0.7; }
        50% { transform: translate(${Math.round(w * 0.1)}px, -${Math.round(h * 0.15)}px); opacity: 0.3; }
        80% { opacity: 0.6; }
        100% { transform: translate(-${Math.round(w * 0.05)}px, ${Math.round(h * 0.05)}px); opacity: 0; }
      }
    `}</style>
  </div>
));

// Dust (CSS)
const DustParticles: React.FC<{ w: number; h: number }> = React.memo(({ w, h }) => (
  <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 46 }}>
    {Array.from({ length: 8 }, (_, i) => (
      <div key={i} className="absolute rounded-full" style={{
        width: 2, height: 2,
        backgroundColor: 'rgba(255,255,200,0.3)',
        left: `${(i * 31 + 5) % 95}%`,
        top: `${(i * 23 + 10) % 80}%`,
        animation: `dust-float ${8 + i * 3}s ease-in-out ${i * 1.5}s infinite`,
      }} />
    ))}
    <style>{`
      @keyframes dust-float {
        0%, 100% { transform: translate(0, 0); opacity: 0; }
        50% { transform: translate(${Math.round(w * 0.05)}px, -${Math.round(h * 0.1)}px); opacity: 0.4; }
      }
    `}</style>
  </div>
));

export const MapEffects: React.FC<MapEffectsProps> = React.memo(({
  mapId, width, height, tileSize, timeOfDay, isMobile = false, suppressOverlay = false,
}) => {
  const pw = width * tileSize;
  const ph = height * tileSize;
  const isForest = mapId === 'memory_garden' || mapId === 'forest';
  const isCave = mapId === 'cave';
  const isNight = timeOfDay < 0.2 || timeOfDay > 0.8;

  // Reduce effects on mobile
  const leafCount = isMobile ? 8 : 18;
  const fireflyCount = isMobile ? 4 : 8;

  return (
    <>
      {isForest && <FallingLeaves count={leafCount} w={pw} h={ph} />}
      {isForest && <FogEffect intensity={isNight ? 0.6 : 0.25} w={pw} h={ph} />}
      {isCave && <FogEffect intensity={0.7} w={pw} h={ph} />}
      <WaterShader />
      {/* Only show day/night overlay on the game canvas, not when menus are open */}
      {!suppressOverlay && <DayNightOverlay timeOfDay={timeOfDay} w={pw} h={ph} />}
      {isForest && isNight && <Fireflies count={fireflyCount} w={pw} h={ph} />}
      {!isMobile && <DustParticles w={pw} h={ph} />}
    </>
  );
});

MapEffects.displayName = 'MapEffects';
