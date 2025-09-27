import { Link } from 'react-router-dom';
import './Header.css';

const Header = ({ isMobile, onMenuClick, isAdminMode, onToggleAdminMode }) => {
  return (
    <header className="header">
      <div className="header-content">
        <Link to="/" className="logo">
          Apps by Matthew
        </Link>
        
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
      </div>
    </header>
  );
};

export default Header;
