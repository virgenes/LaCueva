import { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { useSoundEffects } from '@/hooks/useSoundEffects';

interface SearchBarProps {
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function SearchBar({ placeholder = "Buscar...", value, onChange, className = "" }: SearchBarProps) {
  const { playClick, playHover } = useSoundEffects();
  const [isFocused, setIsFocused] = useState(false);

  const handleClear = () => {
    playClick();
    onChange("");
  };

  return (
    <div 
      className={`relative flex items-center gap-2 ${className}`}
    >
      <div 
        className={`
          flex-1 flex items-center gap-2 px-3 py-2 
          bg-night-deep/80 rounded-sm border-2 
          transition-all duration-200
          ${isFocused 
            ? 'border-neon-cyan shadow-[0_0_15px_rgba(0,255,255,0.3)]' 
            : 'border-border hover:border-neon-cyan/50'
          }
        `}
      >
        <Search 
          size={16} 
          className={`flex-shrink-0 transition-colors ${isFocused ? 'text-neon-cyan' : 'text-muted-foreground'}`} 
        />
        
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          className="
            flex-1 bg-transparent outline-none 
            font-retro text-base text-foreground 
            placeholder:text-muted-foreground/60
          "
        />

        {value && (
          <button
            onClick={handleClear}
            onMouseEnter={playHover}
            className="
              flex-shrink-0 w-5 h-5 rounded-full 
              bg-muted/50 hover:bg-neon-pink/30 
              flex items-center justify-center 
              transition-colors
            "
          >
            <X size={12} className="text-muted-foreground" />
          </button>
        )}
      </div>
    </div>
  );
}
