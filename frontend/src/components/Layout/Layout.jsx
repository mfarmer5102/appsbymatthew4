import { useState, useEffect, useMemo, createContext, useContext } from 'react';
import Header from './Header';
import SideNav from './SideNav';
import BottomNav from './BottomNav';
import Footer from './Footer';
import ChatPanel from '../Chat/ChatPanel';
import spriteImage from '../../assets/sprite.png';
import './Layout.css';

// Create Admin Context
export const AdminContext = createContext();

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
};

const Layout = ({ children }) => {
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [chatOpen, setChatOpen] = useState(() => window.innerWidth >= 768);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const stored = localStorage.getItem('darkMode');
    return stored === null ? true : stored === 'true';
  });

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

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
    localStorage.setItem('darkMode', isDarkMode);
  }, [isDarkMode]);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const toggleAdminMode = () => {
    setIsAdminMode(!isAdminMode);
  };

  const toggleDarkMode = () => {
    setIsDarkMode(prev => !prev);
  };

  const toggleChat = () => {
    setChatOpen(!chatOpen);
  };

  const dustParticles = useMemo(
    () =>
      Array.from({ length: 24 }, (_, i) => ({
        id: i,
        left: (i * 41 + 7) % 100,
        size: 2 + ((i * 7) % 4),
        duration: 14 + ((i * 5) % 12),
        delay: -((i * 3) % 16),
      })),
    []
  );

  return (
    <AdminContext.Provider value={{ isAdminMode, toggleAdminMode }}>
      <div className="layout">
        <div className="bg-decoration" aria-hidden="true">
          <div className="bg-blob bg-blob-1" />
          <div className="bg-blob bg-blob-2" />
          <div className="bg-blob bg-blob-3" />
          {dustParticles.map((p) => (
            <div
              key={p.id}
              className="dust-particle"
              style={{
                left: `${p.left}%`,
                width: `${p.size}px`,
                height: `${p.size}px`,
                animationDuration: `${p.duration}s`,
                animationDelay: `${p.delay}s`,
              }}
            />
          ))}
        </div>

        <Header
          isMobile={isMobile}
          onMenuClick={toggleSidebar}
          isAdminMode={isAdminMode}
          onToggleAdminMode={toggleAdminMode}
          isDarkMode={isDarkMode}
          onToggleDarkMode={toggleDarkMode}
        />
        
        <div className="layout-content">
          {!isMobile && <SideNav isAdminMode={isAdminMode} />}
          
          <main className={`main-content ${isMobile ? 'mobile' : ''}`}>
            {children}
          </main>
          
        </div>
        
        {isMobile && <BottomNav isAdminMode={isAdminMode} />}
        <Footer />

        {/* Decorative sprite image - now clickable to open chat */}
        <div className="sprite-decoration" onClick={toggleChat}>
          <img className="sprite-img" src={spriteImage} alt="Chat Assistant" />
        </div>

        {/* Chat Panel */}
        <ChatPanel isOpen={chatOpen} onClose={() => setChatOpen(false)} />
      </div>
    </AdminContext.Provider>
  );
};

export default Layout;
