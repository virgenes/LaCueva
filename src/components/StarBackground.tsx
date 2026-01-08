import React from 'react';

interface StarParticle {
  id: number;
  x: number;
  y: number;
  size: number;
  delay: number;
  duration: number;
  color: 'cyan' | 'pink' | 'gold';
}

const generateStars = (count: number): StarParticle[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 3 + 1,
    delay: Math.random() * 5,
    duration: Math.random() * 3 + 2,
    color: (['cyan', 'pink', 'gold'] as const)[Math.floor(Math.random() * 3)],
  }));
};

const stars = generateStars(50);

export const StarBackground: React.FC = () => {
  const colorClasses = {
    cyan: 'bg-neon-cyan',
    pink: 'bg-neon-pink',
    gold: 'bg-star-gold',
  };

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {stars.map((star) => (
        <div
          key={star.id}
          className={`absolute rounded-full animate-sparkle ${colorClasses[star.color]}`}
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: `${star.size}px`,
            height: `${star.size}px`,
            animationDelay: `${star.delay}s`,
            animationDuration: `${star.duration}s`,
            opacity: 0.6,
          }}
        />
      ))}
      
      {/* Larger decorative stars */}
      <div className="absolute top-20 left-10 text-3xl animate-float opacity-30">✦</div>
      <div className="absolute top-40 right-20 text-2xl animate-float opacity-40" style={{ animationDelay: '1s' }}>✧</div>
      <div className="absolute bottom-40 left-1/4 text-4xl animate-sparkle opacity-20" style={{ animationDelay: '2s' }}>★</div>
      <div className="absolute bottom-20 right-1/3 text-2xl animate-float opacity-30" style={{ animationDelay: '0.5s' }}>✦</div>
    </div>
  );
};
