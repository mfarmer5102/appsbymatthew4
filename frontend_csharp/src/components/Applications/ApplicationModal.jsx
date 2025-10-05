import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { APPLICATION_IMAGE_BASE_URL, getApplicationImageUrl } from '../../config/images';
import './ApplicationModal.css';

const ApplicationModal = ({ application, supportStatuses, skills, onSave, onClose, onDelete }) => {
  const [repositories, setRepositories] = useState([]);
  const [associatedSkills, setAssociatedSkills] = useState([]);
  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm();

  const isEditing = !!application;

  useEffect(() => {
    if (application) {
      setValue('title', application.title || '');
      setValue('description', application.description || '');
      setValue('publish_date', application.publishDate ? new Date(application.publishDate).toISOString().split('T')[0] : '');
      setValue('is_featured', application.isFeatured || false);
      setValue('deployed_link', application.deployedLink || '');
      setValue('support_status_code', application.supportStatusCode || '');
      setValue('image_url_relative', application.imageUrlRelative || '');
      setRepositories(application.repositories || []);
      setAssociatedSkills(application.associatedSkillCodes || []);
    } else {
      setRepositories([]);
      setAssociatedSkills([]);
    }
  }, [application, setValue]);

  const onSubmit = (data) => {
    const applicationData = {
      title: data.title,
      description: data.description,
      publishDate: data.publish_date ? new Date(data.publish_date) : null,
      isFeatured: data.is_featured || false,
      deployedLink: data.deployed_link,
      repositories: repositories,
      supportStatusCode: data.support_status_code,
      associatedSkillCodes: associatedSkills,
      imageUrlRelative: data.image_url_relative,
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

        <div className="modal-body">
          <form id="application-form" onSubmit={handleSubmit(onSubmit)} className="modal-form">
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
                  <option key={status.id} value={status.code}>
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
              placeholder="app-image.jpg"
            />
            <small className="form-help">
              Enter just the filename (e.g., "app-image.jpg"). 
              The base URL will be automatically prepended: {APPLICATION_IMAGE_BASE_URL}
            </small>
            {watch('image_url_relative') && (
              <div className="image-preview">
                <strong>Full URL:</strong> {getApplicationImageUrl(watch('image_url_relative'))}
              </div>
            )}
          </div>

          <div className="form-group">
            <label>Application Options</label>
            <div className="checkbox-group">
              <div className="checkbox-item">
                <label htmlFor="is_featured">
                  Featured Application
                </label>
                <input
                  id="is_featured"
                  type="checkbox"
                  {...register('is_featured')}
                />
              </div>
            </div>
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
            <div className="checkbox-group">
              {skills.map((skill) => (
                <div key={skill.id} className="checkbox-item">
                  <label htmlFor={`skill-${skill.code}`}>
                    {skill.name}
                  </label>
                  <input
                    id={`skill-${skill.code}`}
                    type="checkbox"
                    checked={associatedSkills.includes(skill.code)}
                    onChange={() => toggleSkill(skill.code)}
                  />
                </div>
              ))}
            </div>
          </div>

          </form>
        </div>

        <div className="modal-footer">
          <button type="button" onClick={onClose} className="btn btn-secondary">
            Cancel
          </button>
          {isEditing && (
            <button type="button" onClick={() => {
              onDelete(application);
              onClose();
            }} className="btn btn-danger">
              Delete
            </button>
          )}
          <button type="submit" form="application-form" className="btn btn-primary">
            {isEditing ? 'Update' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApplicationModal;
