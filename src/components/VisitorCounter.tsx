import React, { useEffect, useState } from 'react';

// Cambio a CountAPI.it - Alternativa estable a la antigua .xyz
const NAMESPACE = 'la-cueva-virgenes';
const KEY = 'unique-visitors-v1';

export const VisitorCounter: React.FC = () => {
  const [count, setCount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const countVisitor = async () => {
      try {
        const hasVisited = sessionStorage.getItem('visitor-counted');
        
        // URL base actualizada a .it
        let url = `https://api.countapi.it/hit/${NAMESPACE}/${KEY}`;
        
        if (hasVisited) {
          // Si ya se contó en esta sesión, solo obtenemos el valor actual
          url = `https://api.countapi.it/get/${NAMESPACE}/${KEY}`;
        }

        const response = await fetch(url);
        
        if (!response.ok) throw new Error('Network response was not ok');
        
        const data = await response.json();
        
        if (data.value !== undefined) {
          setCount(data.value);
          if (!hasVisited) {
            sessionStorage.setItem('visitor-counted', 'true');
            // Guardamos en localStorage como backup por si el servicio cae en el futuro
            localStorage.setItem('fallback-visitor-count', data.value.toString());
          }
        }
      } catch (error) {
        console.warn('CountAPI.it no disponible, usando fallback local.');
        // Recuperamos el último conteo exitoso guardado o un número base
        const localCount = parseInt(localStorage.getItem('fallback-visitor-count') || '1234');
        setCount(localCount);
      } finally {
        setIsLoading(false);
      }
    };

    countVisitor();
  }, []);

  const formatCount = (num: number | null): string[] => {
    if (num === null) return ['0', '0', '0', '0', '0'];
    const str = num.toString().padStart(5, '0');
    return str.split('');
  };

  const digits = formatCount(count);

  return (
    <div className="game-card px-4 py-2 flex items-center gap-2">
      <span className="font-retro text-lg text-muted-foreground">visitantes únicos:</span>
      <div className="flex gap-1">
        {digits.map((digit, i) => (
          <span 
            key={i}
            className={`w-6 h-8 bg-night-deep border border-neon-cyan flex items-center justify-center 
              font-pixel text-sm text-neon-cyan transition-all duration-300
              ${isLoading ? 'animate-pulse' : 'animate-none'}`}
            style={{
              animationDelay: `${i * 100}ms`
            }}
          >
            {isLoading ? '?' : digit}
          </span>
        ))}
      </div>
      {!isLoading && count !== null && (
        <span className="text-star-gold animate-sparkle ml-1">⭐</span>
      )}
    </div>
  );
};