import { useState, useEffect } from 'react';
import { supportStatusAPI } from '../config/api';
import SupportStatusModal from '../components/SupportStatus/SupportStatusModal';
import DeleteModal from '../components/Common/DeleteModal';
import './SupportStatus.css';

const SupportStatus = () => {
  const [supportStatuses, setSupportStatuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedSupportStatus, setSelectedSupportStatus] = useState(null);
  const [editingSupportStatus, setEditingSupportStatus] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await supportStatusAPI.getAll();
      setSupportStatuses(response.data.data || []);
    } catch (err) {
      setError('Failed to fetch support statuses');
      console.error('Error fetching support statuses:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingSupportStatus(null);
    setShowModal(true);
  };

  const handleEdit = (supportStatus) => {
    setEditingSupportStatus(supportStatus);
    setShowModal(true);
  };

  const handleDelete = (supportStatus) => {
    setSelectedSupportStatus(supportStatus);
    setShowDeleteModal(true);
  };

  const handleSave = async (supportStatusData) => {
    try {
      if (editingSupportStatus) {
        await supportStatusAPI.update(editingSupportStatus._id, supportStatusData);
      } else {
        await supportStatusAPI.create(supportStatusData);
      }
      setShowModal(false);
      fetchData();
    } catch (err) {
      setError('Failed to save support status');
      console.error('Error saving support status:', err);
    }
  };

  const handleConfirmDelete = async () => {
    try {
      await supportStatusAPI.delete(selectedSupportStatus._id);
      setShowDeleteModal(false);
      setSelectedSupportStatus(null);
      fetchData();
    } catch (err) {
      setError('Failed to delete support status');
      console.error('Error deleting support status:', err);
    }
  };

  if (loading) {
    return <div className="loading">Loading support statuses...</div>;
  }

  return (
    <div className="support-status">
      <div className="page-header">
        <h1>Support Status</h1>
        <button className="btn btn-primary" onClick={handleCreate}>
          + Add Support Status
        </button>
      </div>

      {error && (
        <div className="error-message">
          {error}
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      <div className="support-status-grid">
        {supportStatuses.map((status) => (
          <div key={status._id} className="support-status-card">
            <div className="card-header">
              <h3>{status.label || 'Unnamed Status'}</h3>
            </div>
            
            <div className="card-content">
              <div className="support-status-details">
                <div className="detail-item">
                  <strong>Code:</strong> {status.code || 'N/A'}
                </div>
                <div className="detail-item">
                  <strong>Label:</strong> {status.label || 'N/A'}
                </div>
              </div>
            </div>

            <div className="card-actions">
              <button className="btn btn-secondary" onClick={() => handleEdit(status)}>
                Edit
              </button>
            </div>
          </div>
        ))}
      </div>

      {supportStatuses.length === 0 && (
        <div className="empty-state">
          <p>No support statuses found. Create your first support status!</p>
        </div>
      )}

      {showModal && (
        <SupportStatusModal
          supportStatus={editingSupportStatus}
          onSave={handleSave}
          onClose={() => setShowModal(false)}
          onDelete={handleDelete}
        />
      )}

      {showDeleteModal && (
        <DeleteModal
          item={selectedSupportStatus}
          itemType="support status"
          onConfirm={handleConfirmDelete}
          onClose={() => setShowDeleteModal(false)}
        />
      )}
    </div>
  );
};

export default SupportStatus;
