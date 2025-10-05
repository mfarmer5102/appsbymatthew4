import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import './SkillModal.css';

const SkillModal = ({ skill, skillTypes, onSave, onClose, onDelete }) => {
  const { register, handleSubmit, formState: { errors }, setValue } = useForm();

  const isEditing = !!skill;

  useEffect(() => {
    if (skill) {
      setValue('name', skill.name || '');
      setValue('code', skill.code || '');
      setValue('skill_type_code', skill.skillTypeCode || '');
      setValue('is_proficient', skill.isProficient || false);
      setValue('is_visible_in_app_details', skill.isVisibleInAppDetails || false);
    }
  }, [skill, setValue]);

  const onSubmit = (data) => {
    const skillData = {
      name: data.name,
      code: data.code,
      skillTypeCode: data.skill_type_code,
      isProficient: data.is_proficient || false,
      isVisibleInAppDetails: data.is_visible_in_app_details || false,
    };
    onSave(skillData);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isEditing ? 'Edit Skill' : 'Create Skill'}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <form id="skill-form" onSubmit={handleSubmit(onSubmit)} className="modal-form">
          <div className="form-group">
            <label htmlFor="name">Name</label>
            <input
              type="text"
              id="name"
              {...register('name')}
              placeholder="Skill name"
            />
          </div>

          <div className="form-group">
            <label htmlFor="code">Code</label>
            <input
              type="text"
              id="code"
              {...register('code')}
              placeholder="Unique skill code"
            />
          </div>

          <div className="form-group">
            <label htmlFor="skill_type_code">Skill Type</label>
            <select id="skill_type_code" {...register('skill_type_code')}>
              <option value="">Select skill type</option>
              {skillTypes.map((type) => (
                <option key={type.id} value={type.code}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Skill Options</label>
            <div className="checkbox-group">
              <div className="checkbox-item">
                <label htmlFor="is_proficient">
                  Proficient
                </label>
                <input
                  id="is_proficient"
                  type="checkbox"
                  {...register('is_proficient')}
                />
              </div>
              <div className="checkbox-item">
                <label htmlFor="is_visible_in_app_details">
                  Visible in App Details
                </label>
                <input
                  id="is_visible_in_app_details"
                  type="checkbox"
                  {...register('is_visible_in_app_details')}
                />
              </div>
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
              onDelete(skill);
              onClose();
            }} className="btn btn-danger">
              Delete
            </button>
          )}
          <button type="submit" form="skill-form" className="btn btn-primary">
            {isEditing ? 'Update' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SkillModal;
