import { Link } from 'react-router-dom';
import './Home.css';

const Home = () => {
  return (
    <div className="home">
      <div className="home-header">
        <h1>Portfolio Admin Dashboard</h1>
        <p>Manage your portfolio data with full CRUD operations</p>
      </div>

      <div className="home-grid">
        <div className="home-card">
          <div className="card-icon">📱</div>
          <h3>Applications</h3>
          <p>Manage your portfolio applications, including titles, descriptions, and deployment links.</p>
          <Link to="/applications" className="card-button">
            Manage Applications
          </Link>
        </div>

        <div className="home-card">
          <div className="card-icon">💻</div>
          <h3>Skills</h3>
          <p>Organize your technical skills with proficiency levels and visibility settings.</p>
          <Link to="/skills" className="card-button">
            Manage Skills
          </Link>
        </div>

        <div className="home-card">
          <div className="card-icon">🏷️</div>
          <h3>Skill Types</h3>
          <p>Categorize your skills into different types like programming languages, frameworks, etc.</p>
          <Link to="/skill-types" className="card-button">
            Manage Skill Types
          </Link>
        </div>

        <div className="home-card">
          <div className="card-icon">🔧</div>
          <h3>Support Status</h3>
          <p>Track the support status of your applications and projects.</p>
          <Link to="/support-status" className="card-button">
            Manage Support Status
          </Link>
        </div>
      </div>

      <div className="home-info">
        <h2>Features</h2>
        <ul>
          <li>✅ Full CRUD operations for all data models</li>
          <li>✅ Responsive design for desktop and mobile</li>
          <li>✅ Modern UI with smooth animations</li>
          <li>✅ All fields are nullable for flexible data entry</li>
          <li>✅ Real-time data synchronization with backend</li>
        </ul>
      </div>
    </div>
  );
};

export default Home;
