import { Link, useLocation } from 'react-router-dom';
import './SideNav.css';

const SideNav = ({ onItemClick, isAdminMode }) => {
  const location = useLocation();

  const allNavItems = [
    { path: '/', label: 'Applications', icon: '📱' },
    { path: '/skills', label: 'Skills', icon: '💻' },
    { path: '/skill-types', label: 'Skill Types', icon: '🏷️', adminOnly: true },
    { path: '/support-status', label: 'Support Status', icon: '🔧', adminOnly: true },
  ];

  const navItems = allNavItems.filter(item => !item.adminOnly || isAdminMode);

  const handleItemClick = () => {
    if (onItemClick) {
      onItemClick();
    }
  };

  return (
    <nav className="sidenav">
      <ul className="nav-list">
        {navItems.map((item) => (
          <li key={item.path} className="nav-item">
            <Link
              to={item.path}
              className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
              onClick={handleItemClick}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default SideNav;
