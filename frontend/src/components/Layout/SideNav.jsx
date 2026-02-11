import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { applicationsAPI } from '../../config/api';
import './SideNav.css';

const SideNav = ({ onItemClick, isAdminMode }) => {
  const location = useLocation();
  const [vectorizing, setVectorizing] = useState(false);

  const allNavItems = [
    { path: '/', label: 'Home', icon: 'home' },
    { path: '/applications', label: 'Applications', icon: 'apps' },
    { path: '/skills', label: 'Skills', icon: 'code' },
    { path: '/skill-types', label: 'Skill Types', icon: 'category', adminOnly: true },
    { path: '/support-status', label: 'Support Status', icon: 'support_agent', adminOnly: true },
  ];

  const navItems = allNavItems.filter(item => !item.adminOnly || isAdminMode);

  const handleItemClick = () => {
    if (onItemClick) {
      onItemClick();
    }
  };

  const handleVectorize = async () => {
    if (vectorizing) return;
    setVectorizing(true);
    try {
      const response = await applicationsAPI.vectorize();
      const { total, processed, failed } = response.data;
      alert(`Vectorization complete: ${processed}/${total} processed, ${failed} failed`);
    } catch (error) {
      alert('Vectorization failed: ' + (error.response?.data?.error || error.message));
    } finally {
      setVectorizing(false);
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
              <span className="material-icons nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </Link>
          </li>
        ))}
        {isAdminMode && (
          <li className="nav-item">
            <button
              className="nav-link nav-action"
              onClick={handleVectorize}
              disabled={vectorizing}
            >
              <span className="material-icons nav-icon">memory</span>
              <span className="nav-label">{vectorizing ? 'Vectorizing...' : 'Vectorize Applications'}</span>
            </button>
          </li>
        )}
      </ul>
    </nav>
  );
};

export default SideNav;
