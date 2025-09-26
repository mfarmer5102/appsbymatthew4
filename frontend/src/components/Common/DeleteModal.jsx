import './DeleteModal.css';

const DeleteModal = ({ item, itemType, onConfirm, onClose }) => {
  const handleConfirm = () => {
    onConfirm();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content delete-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Delete {itemType}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <p>Are you sure you want to delete this {itemType}?</p>
          {item && (
            <div className="item-preview">
              <strong>
                {item.title || item.name || item.label || item.code || 'Untitled'}
              </strong>
            </div>
          )}
          <p className="warning-text">This action cannot be undone.</p>
        </div>

        <div className="modal-actions">
          <button type="button" onClick={onClose} className="btn btn-secondary">
            Cancel
          </button>
          <button type="button" onClick={handleConfirm} className="btn btn-danger">
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteModal;
