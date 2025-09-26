import SkeletonCard from './SkeletonCard';
import './SkeletonCard.css';

const SkeletonGrid = ({ type = 'default', count = 6 }) => {
  return (
    <div className="skeleton-grid">
      {Array.from({ length: count }, (_, index) => (
        <SkeletonCard key={index} type={type} />
      ))}
    </div>
  );
};

export default SkeletonGrid;
