import { Link } from 'react-router-dom';
import './Header.css';

const Header = ({ isMobile, onMenuClick }) => {
  return (
    <header className="header">
      <div className="header-content">
        <Link to="/" className="logo">
          Portfolio Admin
        </Link>
        
        {isMobile && (
          <button className="menu-button" onClick={onMenuClick}>
            <span className="hamburger"></span>
            <span className="hamburger"></span>
            <span className="hamburger"></span>
          </button>
        )}
      </div>
    </header>
  );
};

export default Header;
