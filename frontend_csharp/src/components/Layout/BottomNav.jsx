import { Link, useLocation } from 'react-router-dom';
import './BottomNav.css';

const BottomNav = ({ isAdminMode }) => {
  const location = useLocation();

  const allNavItems = [
    { path: '/', label: 'Home', icon: 'home' },
    { path: '/applications', label: 'Apps', icon: 'apps' },
    { path: '/skills', label: 'Skills', icon: 'code' },
    { path: '/skill-types', label: 'Types', icon: 'category', adminOnly: true },
    { path: '/support-status', label: 'Support', icon: 'support_agent', adminOnly: true },
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
          <span className="material-icons bottom-nav-icon">{item.icon}</span>
          <span className="bottom-nav-label">{item.label}</span>
        </Link>
      ))}
    </nav>
  );
};

export default BottomNav;
