import { useState, useEffect, createContext, useContext } from 'react';
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
  const [chatOpen, setChatOpen] = useState(true);

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

  const toggleAdminMode = () => {
    setIsAdminMode(!isAdminMode);
  };

  const toggleChat = () => {
    setChatOpen(!chatOpen);
  };

  return (
    <AdminContext.Provider value={{ isAdminMode, toggleAdminMode }}>
      <div className="layout">
        <Header 
          isMobile={isMobile} 
          onMenuClick={toggleSidebar}
          isAdminMode={isAdminMode}
          onToggleAdminMode={toggleAdminMode}
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
          <img src={spriteImage} alt="Chat Assistant" />
        </div>

        {/* Chat Panel */}
        <ChatPanel isOpen={chatOpen} onClose={() => setChatOpen(false)} />
      </div>
    </AdminContext.Provider>
  );
};

export default Layout;
