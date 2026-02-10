import React, { useEffect } from 'react';
import { RPGGame } from '@/components/minigames/rpg/RPGGame';
import { useNavigate } from 'react-router-dom';

const RPGPage: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Bloquear scroll pero asegurar que el cursor sea visible
    document.body.style.overflow = 'hidden';
    document.body.style.margin = '0';
    document.body.style.height = '100dvh';
    
    // IMPORTANTE: Asegurar que el cursor sea visible a nivel global
    document.body.style.cursor = 'default';

    return () => {
      document.body.style.overflow = '';
      document.body.style.margin = '';
      document.body.style.height = '';
      document.body.style.cursor = '';
    };
  }, []);

  return (
    // Agregamos 'cursor-default' explícitamente y un fondo sólido
    <div className="fixed inset-0 w-full h-[100dvh] bg-black z-[9999] overflow-hidden flex items-center justify-center cursor-default">
      <div className="w-full h-full pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]">
        <RPGGame onClose={() => navigate('/')} isFullPage />
      </div>
    </div>
  );
};

export default RPGPage;