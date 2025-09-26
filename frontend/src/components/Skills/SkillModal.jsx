import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import './SkillModal.css';

const SkillModal = ({ skill, skillTypes, onSave, onClose }) => {
  const { register, handleSubmit, formState: { errors }, setValue } = useForm();

  const isEditing = !!skill;

  useEffect(() => {
    if (skill) {
      setValue('name', skill.name || '');
      setValue('code', skill.code || '');
      setValue('skill_type_code', skill.skill_type_code || '');
      setValue('is_proficient', skill.is_proficient || false);
      setValue('is_visible_in_app_details', skill.is_visible_in_app_details || false);
    }
  }, [skill, setValue]);

  const onSubmit = (data) => {
    onSave(data);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isEditing ? 'Edit Skill' : 'Create Skill'}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="modal-form">
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
                <option key={type._id} value={type.code}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>
              <input
                type="checkbox"
                {...register('is_proficient')}
              />
              Proficient
            </label>
          </div>

          <div className="form-group">
            <label>
              <input
                type="checkbox"
                {...register('is_visible_in_app_details')}
              />
              Visible in App Details
            </label>
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

export default SkillModal;
