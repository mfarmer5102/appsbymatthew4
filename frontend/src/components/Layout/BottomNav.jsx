import { Link, useLocation } from 'react-router-dom';
import './BottomNav.css';

const BottomNav = ({ isAdminMode }) => {
  const location = useLocation();

  const allNavItems = [
    { path: '/', label: 'Apps', icon: '📱' },
    { path: '/skills', label: 'Skills', icon: '💻' },
    { path: '/skill-types', label: 'Types', icon: '🏷️', adminOnly: true },
    { path: '/support-status', label: 'Support', icon: '🔧', adminOnly: true },
  ];

  const navItems = allNavItems.filter(item => !item.adminOnly || isAdminMode);

  return (
    <nav className="bottom-nav">
      {navItems.map((item) => (
        <Link
          key={item.path}
          to={item.path}
          className={`bottom-nav-item ${location.pathname === item.path ? 'active' : ''}`}
        >
          <span className="bottom-nav-icon">{item.icon}</span>
          <span className="bottom-nav-label">{item.label}</span>
        </Link>
      ))}
    </nav>
  );
};

export default BottomNav;
