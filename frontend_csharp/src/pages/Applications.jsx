import { useState, useEffect, useCallback } from 'react';
import { applicationsAPI, supportStatusAPI, skillsAPI } from '../config/api';
import ApplicationModal from '../components/Applications/ApplicationModal';
import DeleteModal from '../components/Common/DeleteModal';
import SkeletonGrid from '../components/Common/SkeletonGrid';
import { useAdmin } from '../components/Layout/Layout';
import { getApplicationImageUrl } from '../config/images';
import './Applications.css';

const Applications = () => {
  const { isAdminMode } = useAdmin();
  const [applications, setApplications] = useState([]);
  const [supportStatuses, setSupportStatuses] = useState([]);
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [editingApplication, setEditingApplication] = useState(null);
  const [expandedDescriptions, setExpandedDescriptions] = useState(new Set());

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [appsRes, supportRes, skillsRes] = await Promise.all([
        applicationsAPI.getAll({ sort: 'is_featured', order: 'desc' }), // Featured first, then by publish date desc
        supportStatusAPI.getAll({ sort: 'label', order: 'asc' }), // Sort support statuses by label asc
        skillsAPI.getAll({ limit: 1000, offset: 0 }) // Fetch all skills for modal
      ]);
      
      setApplications(appsRes.data.data || []);
      setSupportStatuses(supportRes.data.data || []);
      setSkills(skillsRes.data.data || []);
    } catch (err) {
      setError('Failed to fetch data');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreate = () => {
    setEditingApplication(null);
    setShowModal(true);
  };

  const handleEdit = (application) => {
    setEditingApplication(application);
    setShowModal(true);
  };

  const handleDelete = (application) => {
    setSelectedApplication(application);
    setShowDeleteModal(true);
  };

  const handleSave = async (applicationData) => {
    try {
      if (editingApplication) {
        await applicationsAPI.update(editingApplication.id, applicationData);
      } else {
        await applicationsAPI.create(applicationData);
      }
      setShowModal(false);
      fetchData();
    } catch (err) {
      setError('Failed to save application');
      console.error('Error saving application:', err);
    }
  };

  const handleConfirmDelete = async () => {
    try {
      await applicationsAPI.delete(selectedApplication.id);
      setShowDeleteModal(false);
      setSelectedApplication(null);
      fetchData();
    } catch (err) {
      setError('Failed to delete application');
      console.error('Error deleting application:', err);
    }
  };

  const getSupportStatusLabel = (code) => {
    const status = supportStatuses.find(s => s.code === code);
    return status ? status.label : code || 'N/A';
  };

  const getSkillLabels = (codes) => {
    if (!codes || codes.length === 0) return 'None';
    return codes.map(code => {
      const skill = skills.find(s => s.code === code);
      return skill ? skill.name : code;
    }).join(', ');
  };

  const toggleDescription = (appId) => {
    setExpandedDescriptions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(appId)) {
        newSet.delete(appId);
      } else {
        newSet.add(appId);
      }
      return newSet;
    });
  };

  if (loading) {
    return (
      <div className="applications">
        <div className="page-header">
          <h1>Applications</h1>
          {isAdminMode && (
            <button className="btn btn-primary" disabled>
              + Add Application
            </button>
          )}
        </div>
        <SkeletonGrid type="application" count={6} />
      </div>
    );
  }

  return (
    <div className="applications page-container">
      <div className="page-header">
        <h1>Applications</h1>
        {isAdminMode && (
          <button className="btn btn-primary" onClick={handleCreate}>
            + Add Application
          </button>
        )}
      </div>

      {error && (
        <div className="error-message">
          {error}
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      <div className="applications-grid grid grid-auto-fill-large">
        {applications.map((app) => (
          <div key={app.id} className="application-card card">
            <div className="card-image">
              <img 
                src={getApplicationImageUrl(app.imageUrlRelative)}
                alt={app.title || 'Application'}
                onError={(e) => {
                  // Prevent infinite loop by checking if we're already showing a placeholder
                  if (!e.target.src.includes('via.placeholder.com')) {
                    e.target.src = 'https://via.placeholder.com/300x200?text=No+Image';
                  }
                }}
              />
            </div>
            
            <div className="card-header">
              <h3>{app.title || 'Untitled Application'}</h3>
            </div>
            
            <div className="card-content">
              <div className="description-container">
                <p className={`description ${expandedDescriptions.has(app.id) ? 'expanded' : ''}`}>
                  {app.description || 'No description provided'}
                </p>
                {app.description && app.description.length > 100 && (
                  <button 
                    className="expand-button"
                    onClick={() => toggleDescription(app.id)}
                  >
                    {expandedDescriptions.has(app.id) ? 'Show less' : 'Show more'}
                  </button>
                )}
              </div>
              
              <div className="app-info detail-group">
                <div className="app-detail detail-item">
                  <span className="detail-label">Published:</span>
                  <span className="detail-value">{app.publishDate ? new Date(app.publishDate).toLocaleDateString() : 'Not set'}</span>
                </div>
                <div className="app-detail detail-item">
                  <span className="detail-label">Status:</span>
                  <span className="detail-value">{getSupportStatusLabel(app.supportStatusCode)}</span>
                </div>
                <div className="app-detail detail-item">
                  <span className="detail-label">Featured:</span>
                  <span className={`detail-value ${app.isFeatured ? 'featured' : 'not-featured'}`}>
                    {app.isFeatured ? 'Yes' : 'No'}
                  </span>
                </div>
                <div className="app-detail detail-item">
                  <span className="detail-label">Deployed:</span>
                  <span className={`detail-value ${app.deployedLink ? 'deployed' : 'not-deployed'}`}>
                    {app.deployedLink ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>
            </div>

            {isAdminMode && (
              <div className="card-actions">
                <button className="btn btn-secondary" onClick={() => handleEdit(app)}>
                  <span className="material-icons">edit</span>
                  Edit
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {applications.length === 0 && (
        <div className="empty-state">
          <p>No applications found. Create your first application!</p>
        </div>
      )}

      {showModal && (
        <ApplicationModal
          application={editingApplication}
          supportStatuses={supportStatuses}
          skills={skills}
          onSave={handleSave}
          onClose={() => setShowModal(false)}
          onDelete={handleDelete}
        />
      )}

      {showDeleteModal && (
        <DeleteModal
          item={selectedApplication}
          itemType="application"
          onConfirm={handleConfirmDelete}
          onClose={() => setShowDeleteModal(false)}
        />
      )}
    </div>
  );
};

export default Applications;
