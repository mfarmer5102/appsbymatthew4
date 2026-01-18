import { Link } from 'react-router-dom';
import logoImage from '../../assets/logo.png';
import './Header.css';

const Header = ({ isMobile, onMenuClick, isAdminMode, onToggleAdminMode }) => {
  // Only show admin toggle if the admin code exists in localStorage
  const hasAdminCode = localStorage.getItem('APPSBYMATTHEW_ADMIN_CODE');

  return (
    <header className="header">
      <div className="header-content">
        <Link to="/" className="logo">
          <img src={logoImage} alt="Logo" className="logo-image" />
          Apps by Matthew
        </Link>
        
        {hasAdminCode && (
          <div className="admin-toggle">
            <label className="toggle-label">
              <input
                type="checkbox"
                checked={isAdminMode}
                onChange={onToggleAdminMode}
                className="toggle-input"
              />
              <span className="toggle-slider"></span>
              <span className="toggle-text">Admin Mode</span>
            </label>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
