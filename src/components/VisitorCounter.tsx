import React, { useEffect, useState } from 'react';

// Intentaremos conectar a esta API, pero si falla, la página seguirá funcionando
const NAMESPACE = 'la-cueva-virgenes';
const KEY = 'unique-visitors-v1';

export const VisitorCounter: React.FC = () => {
  // Inicializamos con el valor guardado o uno por defecto (1234)
  const [count, setCount] = useState<number>(() => {
    const saved = localStorage.getItem('fallback-visitor-count');
    return saved ? parseInt(saved) : 1234;
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const countVisitor = async () => {
      try {
        const hasVisited = sessionStorage.getItem('visitor-counted');
        const mode = hasVisited ? 'get' : 'up';
        
        // El bloque try-catch asegura que si esta línea falla, no rompa la página
        const response = await fetch(`https://counter.hygge.moe/${mode}/${NAMESPACE}-${KEY}`);
        
        if (response.ok) {
          const data = await response.json();
          if (data && typeof data.count === 'number') {
            setCount(data.count);
            localStorage.setItem('fallback-visitor-count', data.count.toString());
          }
        }
        
        if (!hasVisited) {
          sessionStorage.setItem('visitor-counted', 'true');
        }
      } catch (err) {
        console.warn("Error de red en el contador: Trabajando en modo local.");
      } finally {
        setIsLoading(false);
      }
    };

    countVisitor();
  }, []);

  // Función de formateo segura
  const digits = count.toString().padStart(5, '0').split('');

  return (
    <div className="game-card px-4 py-2 flex items-center gap-2">
      <span className="font-retro text-lg text-muted-foreground">visitantes únicos:</span>
      <div className="flex gap-1">
        {digits.map((digit, i) => (
          <span 
            key={i}
            className={`w-6 h-8 bg-night-deep border border-neon-cyan flex items-center justify-center 
              font-pixel text-sm text-neon-cyan transition-all duration-300
              ${isLoading ? 'animate-pulse' : ''}`}
          >
            {digit}
          </span>
        ))}
      </div>
      {!isLoading && <span className="text-star-gold animate-sparkle ml-1">⭐</span>}
    </div>
  );
};