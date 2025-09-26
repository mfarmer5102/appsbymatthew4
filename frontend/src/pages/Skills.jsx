import { useState, useEffect } from 'react';
import { skillsAPI, skillTypesAPI } from '../config/api';
import SkillModal from '../components/Skills/SkillModal';
import DeleteModal from '../components/Common/DeleteModal';
import './Skills.css';

const Skills = () => {
  const [skills, setSkills] = useState([]);
  const [skillTypes, setSkillTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState(null);
  const [editingSkill, setEditingSkill] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [skillsRes, typesRes] = await Promise.all([
        skillsAPI.getAll(),
        skillTypesAPI.getAll()
      ]);
      
      setSkills(skillsRes.data.data || []);
      setSkillTypes(typesRes.data.data || []);
    } catch (err) {
      setError('Failed to fetch data');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingSkill(null);
    setShowModal(true);
  };

  const handleEdit = (skill) => {
    setEditingSkill(skill);
    setShowModal(true);
  };

  const handleDelete = (skill) => {
    setSelectedSkill(skill);
    setShowDeleteModal(true);
  };

  const handleSave = async (skillData) => {
    try {
      if (editingSkill) {
        await skillsAPI.update(editingSkill._id, skillData);
      } else {
        await skillsAPI.create(skillData);
      }
      setShowModal(false);
      fetchData();
    } catch (err) {
      setError('Failed to save skill');
      console.error('Error saving skill:', err);
    }
  };

  const handleConfirmDelete = async () => {
    try {
      await skillsAPI.delete(selectedSkill._id);
      setShowDeleteModal(false);
      setSelectedSkill(null);
      fetchData();
    } catch (err) {
      setError('Failed to delete skill');
      console.error('Error deleting skill:', err);
    }
  };

  const getSkillTypeLabel = (code) => {
    const type = skillTypes.find(t => t.code === code);
    return type ? type.label : code || 'N/A';
  };

  if (loading) {
    return <div className="loading">Loading skills...</div>;
  }

  return (
    <div className="skills">
      <div className="page-header">
        <h1>Skills</h1>
        <button className="btn btn-primary" onClick={handleCreate}>
          + Add Skill
        </button>
      </div>

      {error && (
        <div className="error-message">
          {error}
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      <div className="skills-grid">
        {skills.map((skill) => (
          <div key={skill._id} className="skill-card">
            <div className="card-header">
              <h3>{skill.name || 'Unnamed Skill'}</h3>
              <div className="skill-badges">
                {skill.is_proficient && <span className="proficient-badge">Proficient</span>}
                {skill.is_visible_in_app_details && <span className="visible-badge">Visible</span>}
              </div>
            </div>
            
            <div className="card-content">
              <div className="skill-details">
                <div className="detail-item">
                  <strong>Code:</strong> {skill.code || 'N/A'}
                </div>
                <div className="detail-item">
                  <strong>Type:</strong> {getSkillTypeLabel(skill.skill_type_code)}
                </div>
                <div className="detail-item">
                  <strong>Proficient:</strong> {skill.is_proficient ? 'Yes' : 'No'}
                </div>
                <div className="detail-item">
                  <strong>Visible in App Details:</strong> {skill.is_visible_in_app_details ? 'Yes' : 'No'}
                </div>
              </div>
            </div>

            <div className="card-actions">
              <button className="btn btn-secondary" onClick={() => handleEdit(skill)}>
                Edit
              </button>
              <button className="btn btn-danger" onClick={() => handleDelete(skill)}>
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {skills.length === 0 && (
        <div className="empty-state">
          <p>No skills found. Create your first skill!</p>
        </div>
      )}

      {showModal && (
        <SkillModal
          skill={editingSkill}
          skillTypes={skillTypes}
          onSave={handleSave}
          onClose={() => setShowModal(false)}
        />
      )}

      {showDeleteModal && (
        <DeleteModal
          item={selectedSkill}
          itemType="skill"
          onConfirm={handleConfirmDelete}
          onClose={() => setShowDeleteModal(false)}
        />
      )}
    </div>
  );
};

export default Skills;
