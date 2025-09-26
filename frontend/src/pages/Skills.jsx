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
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 20,
    offset: 0,
    hasMore: false
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({
    proficient: '',
    skill_type: '',
    visible: ''
  });
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');

  useEffect(() => {
    fetchData();
  }, [currentPage, filters, sortBy, sortOrder]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const offset = (currentPage - 1) * pagination.limit;
      
      // Build query parameters
      const queryParams = {
        limit: pagination.limit,
        offset,
        sort: sortBy,
        order: sortOrder
      };
      
      // Add filters if they have values
      if (filters.proficient !== '') {
        queryParams.proficient = filters.proficient;
      }
      if (filters.skill_type !== '') {
        queryParams.skill_type = filters.skill_type;
      }
      if (filters.visible !== '') {
        queryParams.visible = filters.visible;
      }
      
      const [skillsRes, typesRes] = await Promise.all([
        skillsAPI.getAll(queryParams),
        skillTypesAPI.getAll()
      ]);
      
      setSkills(skillsRes.data.data || []);
      setSkillTypes(typesRes.data.data || []);
      
      if (skillsRes.data.pagination) {
        setPagination(skillsRes.data.pagination);
      }
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
      setCurrentPage(1); // Reset to first page after creating/updating
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
      setCurrentPage(1); // Reset to first page after deleting
    } catch (err) {
      setError('Failed to delete skill');
      console.error('Error deleting skill:', err);
    }
  };

  const getSkillTypeLabel = (code) => {
    const type = skillTypes.find(t => t.code === code);
    return type ? type.label : code || 'N/A';
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
    setCurrentPage(1); // Reset to first page when filtering
  };

  const handleSortChange = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
    setCurrentPage(1); // Reset to first page when sorting
  };

  const clearFilters = () => {
    setFilters({
      proficient: '',
      skill_type: '',
      visible: ''
    });
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(pagination.total / pagination.limit);

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

      {/* Filters and Sort */}
      <div className="filters-section">
        <div className="filters-row">
          <div className="filter-group">
            <label htmlFor="proficient-filter">Proficiency:</label>
            <select 
              id="proficient-filter"
              value={filters.proficient}
              onChange={(e) => handleFilterChange('proficient', e.target.value)}
              className="filter-select"
            >
              <option value="">All</option>
              <option value="true">Proficient</option>
              <option value="false">Not Proficient</option>
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="skill-type-filter">Skill Type:</label>
            <select 
              id="skill-type-filter"
              value={filters.skill_type}
              onChange={(e) => handleFilterChange('skill_type', e.target.value)}
              className="filter-select"
            >
              <option value="">All Types</option>
              {skillTypes.map(type => (
                <option key={type._id} value={type.code}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="visible-filter">Visibility:</label>
            <select 
              id="visible-filter"
              value={filters.visible}
              onChange={(e) => handleFilterChange('visible', e.target.value)}
              className="filter-select"
            >
              <option value="">All</option>
              <option value="true">Visible in App Details</option>
              <option value="false">Hidden in App Details</option>
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="sort-select">Sort by:</label>
            <select 
              id="sort-select"
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split('-');
                setSortBy(field);
                setSortOrder(order);
                setCurrentPage(1);
              }}
              className="filter-select"
            >
              <option value="name-asc">Name (A-Z)</option>
              <option value="name-desc">Name (Z-A)</option>
              <option value="code-asc">Code (A-Z)</option>
              <option value="code-desc">Code (Z-A)</option>
            </select>
          </div>

          <button className="btn btn-secondary" onClick={clearFilters}>
            Clear Filters
          </button>
        </div>
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
            </div>
          </div>
        ))}
      </div>

      {skills.length === 0 && !loading && (
        <div className="empty-state">
          <p>No skills found. Create your first skill!</p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <button 
            className="btn btn-secondary" 
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Previous
          </button>
          
          <div className="pagination-info">
            Page {currentPage} of {totalPages} ({pagination.total} total skills)
          </div>
          
          <button 
            className="btn btn-secondary" 
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      )}

      {showModal && (
        <SkillModal
          skill={editingSkill}
          skillTypes={skillTypes}
          onSave={handleSave}
          onClose={() => setShowModal(false)}
          onDelete={handleDelete}
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
