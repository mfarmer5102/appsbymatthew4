import { Link } from 'react-router-dom';
import logoImage from '../../assets/logo.png';
import './Header.css';

const Header = ({ isMobile, onMenuClick, isAdminMode, onToggleAdminMode, isDarkMode, onToggleDarkMode }) => {
  const hasAdminCode = localStorage.getItem('APPSBYMATTHEW_ADMIN_CODE');

  return (
    <header className="header">
      <div className="header-content">
        <Link to="/" className="logo">
          <img src={logoImage} alt="Logo" className="logo-image" />
          Apps by Matthew
        </Link>

        <div className="header-controls">
          <button
            className="dark-mode-toggle"
            onClick={onToggleDarkMode}
            aria-label="Toggle dark mode"
          >
            <span className="material-icons">
              {isDarkMode ? 'light_mode' : 'dark_mode'}
            </span>
          </button>

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
      </div>
    </header>
  );
};

export default Header;
