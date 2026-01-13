import React from 'react';
import { Header } from '@/components/Header';
import { Sidebar } from '@/components/Sidebar';
import { AnnouncementCard } from '@/components/AnnouncementCard';
import { Newsfeed } from '@/components/Newsfeed';
import { ForYouSection } from '@/components/ForYouSection';
import { AboutSection } from '@/components/AboutSection';
import { SiteUpdates } from '@/components/SiteUpdates';
import { Footer } from '@/components/Footer';
import { StarBackground } from '@/components/StarBackground';
import { MusicPlayer } from '@/components/MusicPlayer';
import { MusicNotification } from '@/components/MusicNotification';

const Index = () => {
  return (
    <div className="min-h-screen relative">
      <StarBackground />
      
      <div className="relative z-10 max-w-6xl mx-auto px-4 py-6">
        <Header />

        <div className="flex flex-col lg:flex-row gap-6">
          <div className="lg:order-1 order-2 w-full lg:w-56 flex-shrink-0">
            <Sidebar />
            <MusicPlayer />
          </div>

          <main className="flex-1 lg:order-2 order-1">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2">
                <AnnouncementCard />
                <Newsfeed />
              </div>

              <div className="lg:col-span-1">
                <ForYouSection />
              </div>
            </div>

            <AboutSection />
            <SiteUpdates />
          </main>
        </div>

        <Footer />
      </div>

      <div className="fixed inset-0 pointer-events-none z-50 opacity-[0.03]">
        <div className="w-full h-full" style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.3) 2px, rgba(0,0,0,0.3) 4px)'
        }} />
      </div>

      {/* Music notification popup */}
      <MusicNotification />
    </div>
  );
};

export default Index;
