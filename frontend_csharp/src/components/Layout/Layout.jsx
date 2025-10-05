import { useState, useEffect, createContext, useContext } from 'react';
import Header from './Header';
import SideNav from './SideNav';
import BottomNav from './BottomNav';
import Footer from './Footer';
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
  const [isAdminMode, setIsAdminMode] = useState(() => {
    // Initialize admin mode from localStorage
    const savedAdminMode = localStorage.getItem('adminMode');
    return savedAdminMode === 'true';
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

  // Listen for localStorage changes to sync admin mode across tabs
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'adminMode') {
        const newAdminMode = e.newValue === 'true';
        setIsAdminMode(newAdminMode);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const toggleAdminMode = () => {
    const newAdminMode = !isAdminMode;
    setIsAdminMode(newAdminMode);
    // Persist admin mode state to localStorage
    localStorage.setItem('adminMode', newAdminMode.toString());
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
        
        {/* Decorative sprite image */}
        <div className="sprite-decoration">
          <img src={spriteImage} alt="Decorative sprite" />
        </div>
      </div>
    </AdminContext.Provider>
  );
};

export default Layout;
