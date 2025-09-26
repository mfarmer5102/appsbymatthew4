import { useState, useEffect } from 'react';
import { applicationsAPI, supportStatusAPI, skillsAPI } from '../config/api';
import ApplicationModal from '../components/Applications/ApplicationModal';
import DeleteModal from '../components/Common/DeleteModal';
import SkeletonGrid from '../components/Common/SkeletonGrid';
import { useAdmin } from '../components/Layout/Layout';
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

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [appsRes, supportRes, skillsRes] = await Promise.all([
        applicationsAPI.getAll(),
        supportStatusAPI.getAll(),
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
  };

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
        await applicationsAPI.update(editingApplication._id, applicationData);
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
      await applicationsAPI.delete(selectedApplication._id);
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
    <div className="applications">
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

      <div className="applications-grid">
        {applications.map((app) => (
          <div key={app._id} className="application-card">
            <div className="card-image">
              <img 
                src={app.image_url_relative || 'https://via.placeholder.com/300x200?text=No+Image'}
                alt={app.title || 'Application'}
                onError={(e) => {
                  e.target.src = 'https://via.placeholder.com/300x200?text=No+Image';
                }}
              />
            </div>
            
            <div className="card-header">
              <h3>{app.title || 'Untitled Application'}</h3>
              {app.is_featured && <span className="featured-badge">Featured</span>}
            </div>
            
            <div className="card-content">
              <p className="description">
                {app.description || 'No description provided'}
              </p>
              
              <div className="app-details">
                <div className="detail-item">
                  <strong>Published:</strong> {app.publish_date ? new Date(app.publish_date).toLocaleDateString() : 'Not set'}
                </div>
                <div className="detail-item">
                  <strong>Support Status:</strong> {getSupportStatusLabel(app.support_status_code)}
                </div>
                <div className="detail-item">
                  <strong>Skills:</strong> {getSkillLabels(app.associated_skill_codes)}
                </div>
                {app.deployed_link && (
                  <div className="detail-item">
                    <strong>Deployed:</strong> 
                    <a href={app.deployed_link} target="_blank" rel="noopener noreferrer">
                      View Live
                    </a>
                  </div>
                )}
              </div>
            </div>

            {isAdminMode && (
              <div className="card-actions">
                <button className="btn btn-secondary" onClick={() => handleEdit(app)}>
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
