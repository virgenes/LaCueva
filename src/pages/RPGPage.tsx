import React, { useEffect } from 'react';
import { RPGGame } from '@/components/minigames/rpg/RPGGame';
import { useNavigate } from 'react-router-dom';

const RPGPage: React.FC = () => {
  const navigate = useNavigate();

  // Lock body scroll and set fullscreen-like mode
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    document.body.style.margin = '0';
    document.body.style.padding = '0';
    
    // Set meta viewport for mobile
    const viewport = document.querySelector('meta[name="viewport"]');
    const originalContent = viewport?.getAttribute('content') || '';
    viewport?.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');

    return () => {
      document.body.style.overflow = '';
      document.body.style.margin = '';
      document.body.style.padding = '';
      viewport?.setAttribute('content', originalContent);
    };
  }, []);

  return (
    <div className="fixed inset-0 w-screen h-screen bg-background z-[9999]">
      <RPGGame onClose={() => navigate('/')} isFullPage />
    </div>
  );
};

export default RPGPage;
