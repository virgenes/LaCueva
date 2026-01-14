import React, { useEffect, useState } from 'react';

interface AchievementNotificationProps {
  show: boolean;
  onComplete: () => void;
  title?: string;
  description?: string;
}

export const AchievementNotification: React.FC<AchievementNotificationProps> = ({
  show,
  onComplete,
  title = "Logro Desbloqueado",
  description = "Stalker Profesional"
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (show) {
      setIsVisible(true);
      setIsAnimating(true);
      
      // Auto-hide after 4 seconds
      const timer = setTimeout(() => {
        setIsAnimating(false);
        setTimeout(() => {
          setIsVisible(false);
          onComplete();
        }, 500);
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  if (!isVisible) return null;

  return (
    <div 
      className={`fixed top-6 left-1/2 -translate-x-1/2 z-[9999] transition-all duration-500 ${
        isAnimating 
          ? 'opacity-100 translate-y-0' 
          : 'opacity-0 -translate-y-8'
      }`}
    >
      <div className="relative bg-gradient-to-r from-gray-900/95 via-gray-800/95 to-gray-900/95 backdrop-blur-sm rounded-lg border-2 border-gray-600/50 shadow-2xl px-6 py-4 min-w-[380px]">
        {/* Glow effect */}
        <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-amber-500/10 via-transparent to-cyan-500/10 animate-pulse" />
        
        <div className="relative flex items-center gap-5">
          {/* Trophy icon */}
          <div className="flex-shrink-0">
            <div className="text-4xl animate-bounce">🏆</div>
          </div>
          
          {/* Text content */}
          <div className="flex-grow">
            <h3 className="font-pixel text-sm text-gray-300 mb-1 tracking-wide">
              {title}
            </h3>
            <p className="font-retro text-lg text-white">
              {description}
            </p>
          </div>
          
          {/* Icon right side */}
          <div className="flex-shrink-0">
            <div className="text-3xl">🔭</div>
          </div>
        </div>

        {/* Shine animation */}
        <div 
          className="absolute inset-0 rounded-lg overflow-hidden pointer-events-none"
          style={{
            background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%)',
            animation: 'shine 2s ease-in-out infinite'
          }}
        />
      </div>

      <style>{`
        @keyframes shine {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
};
