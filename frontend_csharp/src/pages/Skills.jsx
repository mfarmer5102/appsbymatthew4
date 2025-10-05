import { useState, useEffect, useMemo, useCallback } from 'react';
import { skillsAPI, skillTypesAPI } from '../config/api';
import SkillModal from '../components/Skills/SkillModal';
import DeleteModal from '../components/Common/DeleteModal';
import SkeletonGrid from '../components/Common/SkeletonGrid';
import { useAdmin } from '../components/Layout/Layout';
import './Skills.css';

const Skills = () => {
  const { isAdminMode } = useAdmin();
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
  const [pageSize, setPageSize] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({
    proficient: '',
    skill_type: '',
    visible: ''
  });
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [filtersVisible, setFiltersVisible] = useState(false);

  // Clear admin-only filters when not in admin mode
  useEffect(() => {
    if (!isAdminMode) {
      setFilters(prev => {
        // Only update if the values are actually different to prevent unnecessary re-renders
        if (prev.proficient !== '' || prev.visible !== '') {
          return {
            ...prev,
            proficient: '',
            visible: ''
          };
        }
        return prev;
      });
    }
  }, [isAdminMode]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const offset = (currentPage - 1) * pageSize;
      
      // Build query parameters
      const queryParams = {
        limit: pageSize,
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
  }, [currentPage, pageSize, filters, sortBy, sortOrder]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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

  const toggleFilters = () => {
    setFiltersVisible(!filtersVisible);
  };

  const totalPages = Math.ceil(pagination.total / pageSize);
  
  const handlePageSizeChange = (newPageSize) => {
    setPageSize(parseInt(newPageSize));
    setCurrentPage(1); // Reset to first page when changing page size
  };
  
  // Calculate visible range
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, pagination.total);

  if (loading) {
    return (
      <div className="skills">
        <div className="page-header">
          <h1>Skills</h1>
          {isAdminMode && (
            <button className="btn btn-primary" disabled>
              + Add Skill
            </button>
          )}
        </div>
        <SkeletonGrid type="skill" count={6} />
      </div>
    );
  }

  return (
    <div className="skills page-container">
      <div className="page-header">
        <h1>Skills</h1>
        {isAdminMode && (
          <button className="btn btn-primary" onClick={handleCreate}>
            + Add Skill
          </button>
        )}
      </div>

      {/* Filters and Sort */}
      <div className="filters-section">
        <div className="filters-header">
          <h3>Filters & Sort</h3>
          <button 
            className="filters-toggle" 
            onClick={toggleFilters}
            aria-label={filtersVisible ? 'Hide filters' : 'Show filters'}
          >
            {filtersVisible ? '−' : '+'}
          </button>
        </div>
        <div className={`filters-row ${filtersVisible ? 'visible' : ''}`}>
          {isAdminMode && (
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
          )}

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

          {isAdminMode && (
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
          )}

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

      <div className="skills-grid grid grid-auto-fill">
        {skills.map((skill) => {
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
            <div key={skill.id} className="skill-card card">
              <div className="card-header">
                <div className="category-indicator indicator" style={{ backgroundColor: getCategoryColor(skill.skillTypeCode) }}>
                  <span className="material-icons">code</span>
                </div>
                <div className="header-content">
                  <h3>{skill.name || 'Unnamed Skill'}</h3>
                </div>
              </div>
              
              <div className="card-content">
                <div className="skill-info detail-group">
                  <div className="skill-detail detail-item">
                    <span className="detail-label">Code:</span>
                    <span className="detail-value">{skill.code || 'N/A'}</span>
                  </div>
                  <div className="skill-detail detail-item">
                    <span className="detail-label">Type:</span>
                    <span className="detail-value">{skill.skillTypeCode || 'N/A'}</span>
                  </div>
                  {isAdminMode && (
                    <>
                      <div className="skill-detail detail-item">
                        <span className="detail-label">Proficient:</span>
                        <span className={`detail-value ${skill.isProficient ? 'proficient' : 'not-proficient'}`}>
                          {skill.isProficient ? 'Yes' : 'No'}
                        </span>
                      </div>
                      <div className="skill-detail detail-item">
                        <span className="detail-label">Visible:</span>
                        <span className={`detail-value ${skill.isVisibleInAppDetails ? 'visible' : 'hidden'}`}>
                          {skill.isVisibleInAppDetails ? 'Yes' : 'No'}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {isAdminMode && (
                <div className="card-actions">
                  <button className="btn btn-secondary" onClick={() => handleEdit(skill)}>
                    <span className="material-icons">edit</span>
                    Edit
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {skills.length === 0 && !loading && (
        <div className="empty-state">
          <p>No skills found. Create your first skill!</p>
        </div>
      )}

      {/* Pagination */}
      {pagination.total > 0 && (
        <div className="pagination">
          <div className="pagination-controls">
            <button 
              className="btn btn-secondary" 
              onClick={() => handlePageChange(1)}
              disabled={currentPage === 1}
              title="Go to first page"
            >
              First
            </button>
            
            <button 
              className="btn btn-secondary" 
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              title="Go to previous page"
            >
              Previous
            </button>
            
            <div className="pagination-info">
              Showing {startItem}-{endItem} of {pagination.total} skills
            </div>
            
            <button 
              className="btn btn-secondary" 
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              title="Go to next page"
            >
              Next
            </button>
            
            <button 
              className="btn btn-secondary" 
              onClick={() => handlePageChange(totalPages)}
              disabled={currentPage === totalPages}
              title="Go to last page"
            >
              Last
            </button>
          </div>
          
          <div className="pagination-settings">
            <label htmlFor="page-size">Items per page:</label>
            <select 
              id="page-size"
              value={pageSize} 
              onChange={(e) => handlePageSizeChange(e.target.value)}
              className="page-size-select"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
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
