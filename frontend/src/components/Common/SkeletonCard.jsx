import './SkeletonCard.css';

const SkeletonCard = ({ type = 'default' }) => {
  const renderSkeleton = () => {
    switch (type) {
      case 'application':
        return (
          <div className="skeleton-card application-skeleton">
            <div className="skeleton-image"></div>
            <div className="skeleton-content">
              <div className="skeleton-header">
                <div className="skeleton-title"></div>
                <div className="skeleton-badges">
                  <div className="skeleton-badge"></div>
                  <div className="skeleton-badge"></div>
                </div>
              </div>
              <div className="skeleton-details">
                <div className="skeleton-detail-line"></div>
                <div className="skeleton-detail-line"></div>
                <div className="skeleton-detail-line short"></div>
              </div>
              <div className="skeleton-actions">
                <div className="skeleton-button"></div>
              </div>
            </div>
          </div>
        );
      
      case 'skill':
        return (
          <div className="skeleton-card skill-skeleton">
            <div className="skeleton-content">
              <div className="skeleton-header">
                <div className="skeleton-title"></div>
                <div className="skeleton-badges">
                  <div className="skeleton-badge"></div>
                  <div className="skeleton-badge"></div>
                </div>
              </div>
              <div className="skeleton-details">
                <div className="skeleton-detail-line"></div>
                <div className="skeleton-detail-line"></div>
                <div className="skeleton-detail-line"></div>
                <div className="skeleton-detail-line short"></div>
              </div>
              <div className="skeleton-actions">
                <div className="skeleton-button"></div>
              </div>
            </div>
          </div>
        );
      
      case 'skill-type':
        return (
          <div className="skeleton-card skill-type-skeleton">
            <div className="skeleton-content">
              <div className="skeleton-header">
                <div className="skeleton-title"></div>
              </div>
              <div className="skeleton-details">
                <div className="skeleton-detail-line"></div>
                <div className="skeleton-detail-line short"></div>
              </div>
              <div className="skeleton-actions">
                <div className="skeleton-button"></div>
              </div>
            </div>
          </div>
        );
      
      case 'support-status':
        return (
          <div className="skeleton-card support-status-skeleton">
            <div className="skeleton-content">
              <div className="skeleton-header">
                <div className="skeleton-title"></div>
              </div>
              <div className="skeleton-details">
                <div className="skeleton-detail-line"></div>
                <div className="skeleton-detail-line short"></div>
              </div>
              <div className="skeleton-actions">
                <div className="skeleton-button"></div>
              </div>
            </div>
          </div>
        );
      
      default:
        return (
          <div className="skeleton-card default-skeleton">
            <div className="skeleton-content">
              <div className="skeleton-title"></div>
              <div className="skeleton-text"></div>
              <div className="skeleton-text short"></div>
            </div>
          </div>
        );
    }
  };

  return renderSkeleton();
};

export default SkeletonCard;
