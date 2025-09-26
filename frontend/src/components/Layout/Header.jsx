import { Link } from 'react-router-dom';
import './Header.css';

const Header = ({ isMobile, onMenuClick }) => {
  return (
    <header className="header">
      <div className="header-content">
        <Link to="/" className="logo">
          Portfolio Admin
        </Link>
        
      </div>
    </header>
  );
};

export default Header;
