import { useState, useEffect } from 'react';
import { skillTypesAPI } from '../config/api';
import SkillTypeModal from '../components/SkillTypes/SkillTypeModal';
import DeleteModal from '../components/Common/DeleteModal';
import './SkillTypes.css';

const SkillTypes = () => {
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
    return <div className="loading">Loading skill types...</div>;
  }

  return (
    <div className="skill-types">
      <div className="page-header">
        <h1>Skill Types</h1>
        <button className="btn btn-primary" onClick={handleCreate}>
          + Add Skill Type
        </button>
      </div>

      {error && (
        <div className="error-message">
          {error}
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      <div className="skill-types-grid">
        {skillTypes.map((skillType) => (
          <div key={skillType._id} className="skill-type-card">
            <div className="card-header">
              <h3>{skillType.label || 'Unnamed Skill Type'}</h3>
            </div>
            
            <div className="card-content">
              <div className="skill-type-details">
                <div className="detail-item">
                  <strong>Code:</strong> {skillType.code || 'N/A'}
                </div>
                <div className="detail-item">
                  <strong>Label:</strong> {skillType.label || 'N/A'}
                </div>
              </div>
            </div>

            <div className="card-actions">
              <button className="btn btn-secondary" onClick={() => handleEdit(skillType)}>
                Edit
              </button>
            </div>
          </div>
        ))}
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
