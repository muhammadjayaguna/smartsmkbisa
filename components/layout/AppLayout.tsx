import React from 'react';
import Navbar from './Navbar';
import MobileHeader from './MobileHeader';
import MobileNavbar from './MobileNavbar';
import { useIsMobile } from '@/hooks/use-mobile';
import BackgroundMusic from '../common/BackgroundMusic';

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const isMobile = useIsMobile();

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Navbar */}
      <div className="hidden md:block">
        <Navbar />
      </div>

      {/* Mobile Header */}
      <div className="md:hidden">
        <MobileHeader />
      </div>

      {/* Main Content */}
      <main className={isMobile ? "pb-20" : ""}>
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <MobileNavbar />

      {/* Background Music Player */}
      <BackgroundMusic />
    </div>
  );
};

export default AppLayout;
