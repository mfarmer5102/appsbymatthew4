import { useState, useEffect } from 'react';
import { supportStatusAPI } from '../config/api';
import SupportStatusModal from '../components/SupportStatus/SupportStatusModal';
import DeleteModal from '../components/Common/DeleteModal';
import SkeletonGrid from '../components/Common/SkeletonGrid';
import { useAdmin } from '../components/Layout/Layout';
import './SupportStatus.css';

const SupportStatus = () => {
  const { isAdminMode } = useAdmin();
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
        await supportStatusAPI.update(editingSupportStatus.id, supportStatusData);
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
      await supportStatusAPI.delete(selectedSupportStatus.id);
      setShowDeleteModal(false);
      setSelectedSupportStatus(null);
      fetchData();
    } catch (err) {
      setError('Failed to delete support status');
      console.error('Error deleting support status:', err);
    }
  };

  if (loading) {
    return (
      <div className="support-status">
        <div className="page-header">
          <h1>Support Status</h1>
          {isAdminMode && (
            <button className="btn btn-primary" disabled>
              + Add Support Status
            </button>
          )}
        </div>
        <SkeletonGrid type="support-status" count={4} />
      </div>
    );
  }

  return (
    <div className="support-status page-container">
      <div className="page-header">
        <h1>Support Status</h1>
        {isAdminMode && (
          <button className="btn btn-primary" onClick={handleCreate}>
            + Add Support Status
          </button>
        )}
      </div>

      {error && (
        <div className="error-message">
          {error}
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      <div className="support-status-grid grid grid-auto-fill">
        {supportStatuses.map((status) => {
          const getStatusIcon = (code) => {
            switch (code?.toLowerCase()) {
              case 'active': return 'check_circle';
              case 'inactive': return 'cancel';
              case 'deprecated': return 'warning';
              case 'maintenance': return 'build';
              case 'discontinued': return 'block';
              default: return 'help';
            }
          };

          const getStatusColor = (code) => {
            switch (code?.toLowerCase()) {
              case 'active': return '#10b981';
              case 'inactive': return '#6b7280';
              case 'deprecated': return '#f59e0b';
              case 'maintenance': return '#3b82f6';
              case 'discontinued': return '#ef4444';
              default: return '#8b5cf6';
            }
          };

          return (
            <div key={status.id} className="support-status-card card">
              <div className="card-header">
                <div className="status-indicator indicator" style={{ backgroundColor: getStatusColor(status.code) }}>
                  <span className="material-icons">{getStatusIcon(status.code)}</span>
                </div>
                <div className="header-content">
                  <h3>{status.label || 'Unnamed Status'}</h3>
                </div>
              </div>
              
              <div className="card-content">
                <div className="status-code">{status.code || 'N/A'}</div>
              </div>

              {isAdminMode && (
                <div className="card-actions">
                  <button className="btn btn-secondary" onClick={() => handleEdit(status)}>
                    <span className="material-icons">edit</span>
                    Edit
                  </button>
                </div>
              )}
            </div>
          );
        })}
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
