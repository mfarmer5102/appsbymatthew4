import { useState, useEffect } from 'react';
import Header from './Header';
import SideNav from './SideNav';
import BottomNav from './BottomNav';
import './Layout.css';

const Layout = ({ children }) => {
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setSidebarOpen(false);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="layout">
      <Header isMobile={isMobile} onMenuClick={toggleSidebar} />
      
      <div className="layout-content">
        {!isMobile && <SideNav />}
        
        <main className={`main-content ${isMobile ? 'mobile' : ''}`}>
          {children}
        </main>
        
      </div>
      
      {isMobile && <BottomNav />}
    </div>
  );
};

export default Layout;
