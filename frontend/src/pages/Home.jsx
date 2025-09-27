import { useState, useEffect } from 'react';
import { applicationsAPI, supportStatusAPI } from '../config/api';
import { getApplicationImageUrl } from '../config/images';
import SkeletonGrid from '../components/Common/SkeletonGrid';
import './Home.css';

const Home = () => {
  const [applications, setApplications] = useState([]);
  const [supportStatuses, setSupportStatuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [appsRes, supportRes] = await Promise.all([
        applicationsAPI.getAll(),
        supportStatusAPI.getAll()
      ]);
      
      setApplications(appsRes.data.data || []);
      setSupportStatuses(supportRes.data.data || []);
    } catch (err) {
      setError('Failed to fetch data');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const getSupportStatusLabel = (code) => {
    const status = supportStatuses.find(s => s.code === code);
    return status ? status.label : code || 'N/A';
  };

  const nextSlide = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === applications.length - 1 ? 0 : prevIndex + 1
    );
  };

  const prevSlide = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? applications.length - 1 : prevIndex - 1
    );
  };

  const goToSlide = (index) => {
    setCurrentIndex(index);
  };

  if (loading) {
    return (
      <div className="home">
        <div className="home-header">
          <h1>Welcome to My Portfolio</h1>
        </div>
        <SkeletonGrid type="application" count={3} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="home">
        <div className="home-header">
          <h1>Welcome to My Portfolio</h1>
        </div>
        <div className="error-message">
          {error}
          <button onClick={() => setError(null)}>×</button>
        </div>
      </div>
    );
  }

  if (applications.length === 0) {
    return (
      <div className="home">
        <div className="home-header">
          <h1>Welcome to My Portfolio</h1>
        </div>
        <div className="empty-state">
          <p>No applications to display yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="home">
      <div className="home-header">
        <h1>Welcome to My Portfolio</h1>
        <p className="home-subtitle">Explore my featured applications</p>
      </div>

      <div className="carousel-container">
        <div className="carousel-wrapper">
          <button className="carousel-btn prev-btn" onClick={prevSlide}>
            <span className="material-icons">chevron_left</span>
          </button>
          
          <div className="carousel">
            <div className="carousel-track">
              {applications.map((app, index) => {
                const isActive = index === currentIndex;
                const isPrev = index === currentIndex - 1;
                const isNext = index === currentIndex + 1;
                const isPrevPrev = index === currentIndex - 2;
                const isNextNext = index === currentIndex + 2;
                
                // Handle circular navigation
                const prevIndex = currentIndex === 0 ? applications.length - 1 : currentIndex - 1;
                const nextIndex = currentIndex === applications.length - 1 ? 0 : currentIndex + 1;
                const prevPrevIndex = currentIndex <= 1 ? applications.length - 2 + currentIndex : currentIndex - 2;
                const nextNextIndex = currentIndex >= applications.length - 2 ? currentIndex - applications.length + 2 : currentIndex + 2;
                
                const isVisible = isActive || 
                  index === prevIndex || 
                  index === nextIndex || 
                  index === prevPrevIndex || 
                  index === nextNextIndex;
                
                if (!isVisible) return null;
                
                let position = 'hidden';
                if (isActive) position = 'active';
                else if (index === prevIndex) position = 'prev';
                else if (index === nextIndex) position = 'next';
                else if (index === prevPrevIndex) position = 'prev-prev';
                else if (index === nextNextIndex) position = 'next-next';
                
                return (
                  <div 
                    key={app._id} 
                    className={`carousel-item ${position}`}
                  >
                    <div className="app-card">
                      <div className="app-cover">
                        <img 
                          src={getApplicationImageUrl(app.image_url_relative)}
                          alt={app.title || 'Application'}
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/300x300?text=No+Image';
                          }}
                        />
                        <div className="app-overlay">
                          <div className="app-title">{app.title || 'Untitled Application'}</div>
                          <div className="app-status">{getSupportStatusLabel(app.support_status_code)}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          <button className="carousel-btn next-btn" onClick={nextSlide}>
            <span className="material-icons">chevron_right</span>
          </button>
        </div>
        
        <div className="carousel-info">
          <div className="current-app-name">
            {applications[currentIndex]?.title || 'Untitled Application'}
          </div>
          <div className="carousel-indicators">
            {applications.map((_, index) => (
              <button
                key={index}
                className={`indicator ${index === currentIndex ? 'active' : ''}`}
                onClick={() => goToSlide(index)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
