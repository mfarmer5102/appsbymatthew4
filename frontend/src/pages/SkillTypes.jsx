import { useState, useEffect } from 'react';
import { skillTypesAPI } from '../config/api';
import SkillTypeModal from '../components/SkillTypes/SkillTypeModal';
import DeleteModal from '../components/Common/DeleteModal';
import SkeletonGrid from '../components/Common/SkeletonGrid';
import { useAdmin } from '../components/Layout/Layout';
import './SkillTypes.css';

const SkillTypes = () => {
  const { isAdminMode } = useAdmin();
  const [skillTypes, setSkillTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedSkillType, setSelectedSkillType] = useState(null);
  const [editingSkillType, setEditingSkillType] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await skillTypesAPI.getAll();
      setSkillTypes(response.data.data || []);
    } catch (err) {
      setError('Failed to fetch skill types');
      console.error('Error fetching skill types:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingSkillType(null);
    setShowModal(true);
  };

  const handleEdit = (skillType) => {
    setEditingSkillType(skillType);
    setShowModal(true);
  };

  const handleDelete = (skillType) => {
    setSelectedSkillType(skillType);
    setShowDeleteModal(true);
  };

  const handleSave = async (skillTypeData) => {
    try {
      if (editingSkillType) {
        await skillTypesAPI.update(editingSkillType._id, skillTypeData);
      } else {
        await skillTypesAPI.create(skillTypeData);
      }
      setShowModal(false);
      fetchData();
    } catch (err) {
      setError('Failed to save skill type');
      console.error('Error saving skill type:', err);
    }
  };

  const handleConfirmDelete = async () => {
    try {
      await skillTypesAPI.delete(selectedSkillType._id);
      setShowDeleteModal(false);
      setSelectedSkillType(null);
      fetchData();
    } catch (err) {
      setError('Failed to delete skill type');
      console.error('Error deleting skill type:', err);
    }
  };

  if (loading) {
    return (
      <div className="skill-types">
        <div className="page-header">
          <h1>Skill Types</h1>
          {isAdminMode && (
            <button className="btn btn-primary" disabled>
              + Add Skill Type
            </button>
          )}
        </div>
        <SkeletonGrid type="skill-type" count={4} />
      </div>
    );
  }

  return (
    <div className="skill-types">
      <div className="page-header">
        <h1>Skill Types</h1>
        {isAdminMode && (
          <button className="btn btn-primary" onClick={handleCreate}>
            + Add Skill Type
          </button>
        )}
      </div>

      {error && (
        <div className="error-message">
          {error}
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      <div className="skill-types-grid">
        {skillTypes.map((skillType) => {
          const getCategoryIcon = (code) => {
            switch (code?.toLowerCase()) {
              case 'frontend': return 'web';
              case 'backend': return 'storage';
              case 'database': return 'database';
              case 'mobile': return 'phone_android';
              case 'devops': return 'settings';
              case 'design': return 'palette';
              case 'testing': return 'bug_report';
              case 'tools': return 'build';
              default: return 'category';
            }
          };

          const getCategoryColor = (code) => {
            switch (code?.toLowerCase()) {
              case 'frontend': return '#3b82f6';
              case 'backend': return '#10b981';
              case 'database': return '#f59e0b';
              case 'mobile': return '#8b5cf6';
              case 'devops': return '#ef4444';
              case 'design': return '#ec4899';
              case 'testing': return '#06b6d4';
              case 'tools': return '#6b7280';
              default: return '#8b5cf6';
            }
          };

          return (
            <div key={skillType._id} className="skill-type-card">
              <div className="card-header">
                <div className="category-indicator" style={{ backgroundColor: getCategoryColor(skillType.code) }}>
                  <span className="material-icons">{getCategoryIcon(skillType.code)}</span>
                </div>
                <div className="header-content">
                  <h3>{skillType.label || 'Unnamed Skill Type'}</h3>
                </div>
              </div>
              
              <div className="card-content">
                <div className="category-code">{skillType.code || 'N/A'}</div>
              </div>

              {isAdminMode && (
                <div className="card-actions">
                  <button className="btn btn-secondary" onClick={() => handleEdit(skillType)}>
                    <span className="material-icons">edit</span>
                    Edit
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {skillTypes.length === 0 && (
        <div className="empty-state">
          <p>No skill types found. Create your first skill type!</p>
        </div>
      )}

      {showModal && (
        <SkillTypeModal
          skillType={editingSkillType}
          onSave={handleSave}
          onClose={() => setShowModal(false)}
          onDelete={handleDelete}
        />
      )}

      {showDeleteModal && (
        <DeleteModal
          item={selectedSkillType}
          itemType="skill type"
          onConfirm={handleConfirmDelete}
          onClose={() => setShowDeleteModal(false)}
        />
      )}
    </div>
  );
};

export default SkillTypes;
