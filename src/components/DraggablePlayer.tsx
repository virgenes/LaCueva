import { useEffect, useRef, useState } from 'react';
import { useYouTubeMusic } from '@/contexts/YouTubeMusicContext';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { 
  Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, 
  Minimize2, Maximize2, Music, X, GripVertical, ChevronDown
} from 'lucide-react';
import { cn } from '@/lib/utils';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

const PLAYER_CONTAINER_ID = 'youtube-audio-player';

export const DraggablePlayer = () => {
  const { 
    currentTrack, isPlaying, volume, 
    setIsPlaying, setVolume, 
    nextTrack, prevTrack, togglePlay,
  } = useYouTubeMusic();
  const { playClick, playHover } = useSoundEffects();
  
  const playerRef = useRef<any>(null);
  const playerContainerRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<HTMLDivElement | null>(null);
  
  const [isMinimized, setIsMinimized] = useState(true);
  const [isHidden, setIsHidden] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  
  // Dragging state
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, posX: 0, posY: 0 });

  // Initialize position (bottom right)
  useEffect(() => {
    const savedPos = localStorage.getItem('player-position');
    if (savedPos) {
      try {
        setPosition(JSON.parse(savedPos));
      } catch {}
    }
  }, []);

  // Save position
  useEffect(() => {
    if (position.x !== 0 || position.y !== 0) {
      localStorage.setItem('player-position', JSON.stringify(position));
    }
  }, [position]);

  // Drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button, input')) return;
    
    setIsDragging(true);
    dragStart.current = {
      x: e.clientX,
      y: e.clientY,
      posX: position.x,
      posY: position.y,
    };
    e.preventDefault();
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if ((e.target as HTMLElement).closest('button, input')) return;
    
    const touch = e.touches[0];
    setIsDragging(true);
    dragStart.current = {
      x: touch.clientX,
      y: touch.clientY,
      posX: position.x,
      posY: position.y,
    };
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const dx = e.clientX - dragStart.current.x;
      const dy = e.clientY - dragStart.current.y;
      
      setPosition({
        x: Math.max(-window.innerWidth + 100, Math.min(0, dragStart.current.posX + dx)),
        y: Math.max(-window.innerHeight + 100, Math.min(0, dragStart.current.posY + dy)),
      });
    };

    const handleTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      const dx = touch.clientX - dragStart.current.x;
      const dy = touch.clientY - dragStart.current.y;
      
      setPosition({
        x: Math.max(-window.innerWidth + 100, Math.min(0, dragStart.current.posX + dx)),
        y: Math.max(-window.innerHeight + 100, Math.min(0, dragStart.current.posY + dy)),
      });
    };

    const handleEnd = () => setIsDragging(false);

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleEnd);
    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('touchend', handleEnd);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [isDragging]);

  // Create persistent container
  useEffect(() => {
    let container = document.getElementById(PLAYER_CONTAINER_ID) as HTMLDivElement;
    if (!container) {
      container = document.createElement('div');
      container.id = PLAYER_CONTAINER_ID;
      container.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;overflow:hidden;';
      document.body.appendChild(container);
    }
    playerContainerRef.current = container;
  }, []);

  // Load YouTube API
  useEffect(() => {
    if (window.YT && window.YT.Player) {
      setIsReady(true);
      return;
    }

    if (document.querySelector('script[src*="youtube.com/iframe_api"]')) {
      const checkReady = setInterval(() => {
        if (window.YT && window.YT.Player) {
          setIsReady(true);
          clearInterval(checkReady);
        }
      }, 100);
      return () => clearInterval(checkReady);
    }

    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(tag);

    window.onYouTubeIframeAPIReady = () => {
      setIsReady(true);
    };
  }, []);

  // Initialize player
  useEffect(() => {
    if (!isReady || !currentTrack || !playerContainerRef.current) return;

    setIsVisible(true);
    setIsHidden(false);

    if (playerRef.current?.loadVideoById) {
      try {
        playerRef.current.loadVideoById(currentTrack.videoId);
        if (isPlaying) playerRef.current.playVideo();
      } catch (e) {
        console.error('Error loading video:', e);
      }
      return;
    }

    let innerDiv = playerContainerRef.current.querySelector('#yt-inner-player') as HTMLDivElement;
    if (!innerDiv) {
      innerDiv = document.createElement('div');
      innerDiv.id = 'yt-inner-player';
      playerContainerRef.current.appendChild(innerDiv);
    }

    try {
      playerRef.current = new window.YT.Player('yt-inner-player', {
        height: '1',
        width: '1',
        videoId: currentTrack.videoId,
        playerVars: { autoplay: isPlaying ? 1 : 0, controls: 0, disablekb: 1, fs: 0, modestbranding: 1, rel: 0 },
        events: {
          onReady: (event: any) => {
            event.target.setVolume(volume);
            if (isPlaying) event.target.playVideo();
          },
          onStateChange: (event: any) => {
            if (event.data === window.YT.PlayerState.ENDED) nextTrack();
          },
          onError: (event: any) => console.error('YouTube player error:', event.data),
        },
      });
    } catch (e) {
      console.error('Error creating YouTube player:', e);
    }
  }, [currentTrack?.videoId, isReady]);

  // Handle play/pause
  useEffect(() => {
    if (!playerRef.current?.playVideo) return;
    try {
      if (isPlaying) playerRef.current.playVideo();
      else playerRef.current.pauseVideo();
    } catch (e) {}
  }, [isPlaying]);

  // Handle volume
  useEffect(() => {
    if (playerRef.current?.setVolume) {
      try { playerRef.current.setVolume(isMuted ? 0 : volume); } catch (e) {}
    }
  }, [volume, isMuted]);

  const handleToggleMute = () => { playClick(); setIsMuted(!isMuted); };
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseInt(e.target.value);
    setVolume(newVolume);
    if (isMuted && newVolume > 0) setIsMuted(false);
  };

  const handleClose = () => {
    playClick();
    setIsPlaying(false);
    setIsVisible(false);
    if (playerRef.current?.stopVideo) try { playerRef.current.stopVideo(); } catch (e) {}
  };

  const handleHide = () => {
    playClick();
    setIsHidden(true);
  };

  const handleShow = () => {
    playClick();
    setIsHidden(false);
  };

  if (!currentTrack || !isVisible) return null;

  // Hidden mode - show only small floating button
  if (isHidden) {
    return (
      <button
        onClick={handleShow}
        className="fixed bottom-20 md:bottom-4 right-4 z-[150] w-12 h-12 rounded-full 
          bg-gradient-to-br from-neon-pink to-neon-cyan shadow-neon 
          flex items-center justify-center hover:scale-110 transition-transform animate-pulse"
      >
        <Music size={20} className="text-night-deep" />
      </button>
    );
  }

  return (
    <div 
      ref={dragRef}
      className={cn(
        "fixed z-[150] transition-all select-none",
        isMinimized ? 'w-72' : 'w-80 md:w-96',
        isDragging ? 'cursor-grabbing' : 'cursor-grab'
      )}
      style={{
        bottom: `calc(5rem + ${-position.y}px)`,
        right: `calc(1rem + ${-position.x}px)`,
      }}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
    >
      <div className={cn(
        "bg-night-deep/95 backdrop-blur-sm border-2 rounded-lg shadow-neon overflow-hidden transition-all",
        isDragging ? 'border-star-gold scale-[1.02]' : 'border-neon-cyan'
      )}>
        {/* Header - Drag handle */}
        <div className="flex items-center justify-between p-2 bg-gradient-to-r from-neon-pink/20 to-neon-cyan/20 border-b border-border">
          <div className="flex items-center gap-2">
            <GripVertical size={14} className="text-muted-foreground" />
            <Music size={14} className="text-neon-pink animate-pulse" />
            <span className="font-pixel text-[8px] text-accent">REPRODUCTOR</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => { playClick(); setIsMinimized(!isMinimized); }}
              onMouseEnter={playHover}
              className="p-1 rounded hover:bg-muted/50 transition-colors"
            >
              {isMinimized ? <Maximize2 size={12} className="text-muted-foreground" /> : <Minimize2 size={12} className="text-muted-foreground" />}
            </button>
            <button
              onClick={handleHide}
              onMouseEnter={playHover}
              className="p-1 rounded hover:bg-star-gold/30 transition-colors"
              title="Ocultar reproductor"
            >
              <ChevronDown size={12} className="text-star-gold" />
            </button>
            <button
              onClick={handleClose}
              onMouseEnter={playHover}
              className="p-1 rounded hover:bg-neon-pink/30 transition-colors"
            >
              <X size={12} className="text-neon-pink" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-3">
          {/* Thumbnail and Info */}
          <div className="flex items-center gap-3 mb-3">
            <div className="relative w-12 h-12 rounded overflow-hidden border border-border flex-shrink-0">
              <img src={currentTrack.thumbnail} alt={currentTrack.title} className="w-full h-full object-cover" />
              {isPlaying && (
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                  <div className="flex gap-0.5">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="w-1 bg-neon-cyan" style={{ height: '12px', animation: `pulse 0.5s ease-in-out ${i * 0.1}s infinite alternate` }} />
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-pixel text-[9px] text-accent truncate">{currentTrack.title}</p>
              <p className="font-retro text-xs text-muted-foreground truncate">{currentTrack.artist}</p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-2 mb-3">
            <button onClick={() => { playClick(); prevTrack(); }} onMouseEnter={playHover}
              className="w-8 h-8 rounded-full bg-muted/50 border border-border flex items-center justify-center hover:border-neon-cyan hover:shadow-neon transition-all">
              <SkipBack size={14} className="text-primary" />
            </button>
            <button onClick={() => { playClick(); togglePlay(); }} onMouseEnter={playHover}
              className="w-10 h-10 rounded-full bg-gradient-to-br from-neon-pink to-neon-cyan flex items-center justify-center shadow-neon hover:scale-105 transition-transform">
              {isPlaying ? <Pause size={18} className="text-night-deep" /> : <Play size={18} className="text-night-deep ml-0.5" />}
            </button>
            <button onClick={() => { playClick(); nextTrack(); }} onMouseEnter={playHover}
              className="w-8 h-8 rounded-full bg-muted/50 border border-border flex items-center justify-center hover:border-neon-cyan hover:shadow-neon transition-all">
              <SkipForward size={14} className="text-primary" />
            </button>
          </div>

          {/* Volume (expanded only) */}
          {!isMinimized && (
            <div className="flex items-center gap-2 pt-2 border-t border-border">
              <button onClick={handleToggleMute} onMouseEnter={playHover} className="p-1 rounded hover:bg-muted/50 transition-colors">
                {isMuted || volume === 0 ? <VolumeX size={14} className="text-muted-foreground" /> : <Volume2 size={14} className="text-neon-cyan" />}
              </button>
              <input type="range" min="0" max="100" value={isMuted ? 0 : volume} onChange={handleVolumeChange}
                className="flex-1 h-1 bg-muted rounded-full appearance-none cursor-pointer
                  [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 
                  [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full 
                  [&::-webkit-slider-thumb]:bg-neon-cyan [&::-webkit-slider-thumb]:shadow-neon" />
              <span className="font-retro text-xs text-muted-foreground w-8 text-right">{isMuted ? 0 : volume}%</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
