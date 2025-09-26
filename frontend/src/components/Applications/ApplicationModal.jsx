import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import './ApplicationModal.css';

const ApplicationModal = ({ application, supportStatuses, skills, onSave, onClose }) => {
  const [repositories, setRepositories] = useState([]);
  const [associatedSkills, setAssociatedSkills] = useState([]);
  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm();

  const isEditing = !!application;

  useEffect(() => {
    if (application) {
      setValue('title', application.title || '');
      setValue('description', application.description || '');
      setValue('publish_date', application.publish_date ? new Date(application.publish_date).toISOString().split('T')[0] : '');
      setValue('is_featured', application.is_featured || false);
      setValue('deployed_link', application.deployed_link || '');
      setValue('support_status_code', application.support_status_code || '');
      setValue('image_url_relative', application.image_url_relative || '');
      setRepositories(application.repositories || []);
      setAssociatedSkills(application.associated_skill_codes || []);
    } else {
      setRepositories([]);
      setAssociatedSkills([]);
    }
  }, [application, setValue]);

  const onSubmit = (data) => {
    const applicationData = {
      ...data,
      repositories,
      associated_skill_codes: associatedSkills,
      publish_date: data.publish_date ? new Date(data.publish_date) : null,
    };
    onSave(applicationData);
  };

  const addRepository = () => {
    setRepositories([...repositories, '']);
  };

  const updateRepository = (index, value) => {
    const updated = [...repositories];
    updated[index] = value;
    setRepositories(updated);
  };

  const removeRepository = (index) => {
    setRepositories(repositories.filter((_, i) => i !== index));
  };

  const toggleSkill = (skillCode) => {
    if (associatedSkills.includes(skillCode)) {
      setAssociatedSkills(associatedSkills.filter(code => code !== skillCode));
    } else {
      setAssociatedSkills([...associatedSkills, skillCode]);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isEditing ? 'Edit Application' : 'Create Application'}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="modal-form">
          <div className="form-group">
            <label htmlFor="title">Title</label>
            <input
              type="text"
              id="title"
              {...register('title')}
              placeholder="Application title"
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              {...register('description')}
              rows="4"
              placeholder="Application description"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="publish_date">Publish Date</label>
              <input
                type="date"
                id="publish_date"
                {...register('publish_date')}
              />
            </div>

            <div className="form-group">
              <label htmlFor="support_status_code">Support Status</label>
              <select id="support_status_code" {...register('support_status_code')}>
                <option value="">Select status</option>
                {supportStatuses.map((status) => (
                  <option key={status._id} value={status.code}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="deployed_link">Deployed Link</label>
            <input
              type="url"
              id="deployed_link"
              {...register('deployed_link')}
              placeholder="https://example.com"
            />
          </div>

          <div className="form-group">
            <label htmlFor="image_url_relative">Image URL</label>
            <input
              type="text"
              id="image_url_relative"
              {...register('image_url_relative')}
              placeholder="/images/app-image.jpg"
            />
          </div>

          <div className="form-group">
            <label>
              <input
                type="checkbox"
                {...register('is_featured')}
              />
              Featured Application
            </label>
          </div>

          <div className="form-group">
            <label>Repositories</label>
            {repositories.map((repo, index) => (
              <div key={index} className="repository-input">
                <input
                  type="url"
                  value={repo}
                  onChange={(e) => updateRepository(index, e.target.value)}
                  placeholder="https://github.com/username/repo"
                />
                <button type="button" onClick={() => removeRepository(index)}>
                  Remove
                </button>
              </div>
            ))}
            <button type="button" onClick={addRepository} className="btn btn-secondary">
              Add Repository
            </button>
          </div>

          <div className="form-group">
            <label>Associated Skills</label>
            <div className="skills-checkboxes">
              {skills.map((skill) => (
                <label key={skill._id} className="skill-checkbox">
                  <input
                    type="checkbox"
                    checked={associatedSkills.includes(skill.code)}
                    onChange={() => toggleSkill(skill.code)}
                  />
                  {skill.name}
                </label>
              ))}
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {isEditing ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ApplicationModal;
