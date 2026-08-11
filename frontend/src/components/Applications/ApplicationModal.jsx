import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { APPLICATION_IMAGE_BASE_URL, getApplicationImageUrl } from '../../config/images';
import './ApplicationModal.css';

const ApplicationModal = ({ application, supportStatuses, skills, onSave, onClose, onDelete }) => {
  const [repositoryUrls, setRepositoryUrls] = useState([]);
  const [skillKeys, setSkillKeys] = useState([]);
  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm();

  const isEditing = !!application;

  useEffect(() => {
    if (application) {
      setValue('title', application.title || '');
      setValue('description', application.description || '');
      // The API returns publish_date as a plain 'YYYY-MM-DD' string, which is exactly
      // what <input type="date"> expects — no Date round-trip, so no timezone shift.
      setValue('publish_date', application.publish_date || '');
      setValue('is_featured', application.is_featured || false);
      setValue('deployed_url', application.deployed_url || '');
      setValue('support_status_key', application.support_status_key ?? '');
      setValue('image_filename', application.image_filename || '');
      setRepositoryUrls(application.repository_urls || []);
      setSkillKeys(application.skill_keys || []);
    } else {
      setRepositoryUrls([]);
      setSkillKeys([]);
    }
  }, [application, setValue]);

  const onSubmit = (data) => {
    const applicationData = {
      ...data,
      // A <select> always yields a string; the API expects the integer key.
      support_status_key: data.support_status_key === '' ? null : Number(data.support_status_key),
      repository_urls: repositoryUrls.filter((url) => url.trim() !== ''),
      skill_keys: skillKeys,
    };

    // Updates are addressed by key, so carry it through on edit.
    if (isEditing) {
      applicationData.application_key = application.application_key;
    }

    onSave(applicationData);
  };

  const addRepository = () => {
    setRepositoryUrls([...repositoryUrls, '']);
  };

  const updateRepository = (index, value) => {
    const updated = [...repositoryUrls];
    updated[index] = value;
    setRepositoryUrls(updated);
  };

  const removeRepository = (index) => {
    setRepositoryUrls(repositoryUrls.filter((_, i) => i !== index));
  };

  const toggleSkill = (skillKey) => {
    if (skillKeys.includes(skillKey)) {
      setSkillKeys(skillKeys.filter(key => key !== skillKey));
    } else {
      setSkillKeys([...skillKeys, skillKey]);
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
              <label htmlFor="support_status_key">Support Status</label>
              <select id="support_status_key" {...register('support_status_key')}>
                <option value="">Select status</option>
                {supportStatuses.map((status) => (
                  <option key={status.support_status_key} value={status.support_status_key}>
                    {status.support_status}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="deployed_url">Deployed Link</label>
            <input
              type="url"
              id="deployed_url"
              {...register('deployed_url')}
              placeholder="https://example.com"
            />
          </div>

          <div className="form-group">
            <label htmlFor="image_filename">Image URL</label>
            <input
              type="text"
              id="image_filename"
              {...register('image_filename')}
              placeholder="app-image.jpg"
            />
            <small className="form-help">
              Enter just the filename (e.g., "app-image.jpg").
              The base URL will be automatically prepended: {APPLICATION_IMAGE_BASE_URL}
            </small>
            {watch('image_filename') && (
              <div className="image-preview">
                <strong>Full URL:</strong> {getApplicationImageUrl(watch('image_filename'))}
              </div>
            )}
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
            {repositoryUrls.map((repo, index) => (
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
                <label key={skill.skill_key} className="skill-checkbox">
                  <input
                    type="checkbox"
                    checked={skillKeys.includes(skill.skill_key)}
                    onChange={() => toggleSkill(skill.skill_key)}
                  />
                  {skill.skill}
                </label>
              ))}
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            {isEditing && (
              <button type="button" onClick={() => onDelete(application)} className="btn btn-danger">
                Delete
              </button>
            )}
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
