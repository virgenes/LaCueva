import React from 'react';
import { MobileNav } from './MobileNav';

interface MobileLayoutProps {
  children: React.ReactNode;
}

export const MobileLayout: React.FC<MobileLayoutProps> = ({ children }) => {
  return (
    <>
      <MobileNav />
      <div className="md:hidden pb-20">
        {children}
      </div>
    </>
  );
};
