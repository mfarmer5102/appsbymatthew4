import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import './SkillModal.css';

const SkillModal = ({ skill, skillTypes, onSave, onClose, onDelete }) => {
  const { register, handleSubmit, formState: { errors }, setValue } = useForm();

  const isEditing = !!skill;

  useEffect(() => {
    if (skill) {
      setValue('skill', skill.skill || '');
      setValue('skill_type_key', skill.skill_type_key ?? '');
      setValue('is_proficient', skill.is_proficient || false);
      setValue('is_visible_in_app_details', skill.is_visible_in_app_details || false);
      setValue('is_hidden', skill.is_hidden || false);
      setValue('provide_disclaimer', skill.provide_disclaimer || false);
    }
  }, [skill, setValue]);

  const onSubmit = (data) => {
    const skillData = {
      ...data,
      // A <select> always yields a string; the API expects the integer key.
      skill_type_key: data.skill_type_key === '' ? null : Number(data.skill_type_key),
    };

    // Updates are addressed by key, so carry it through on edit.
    if (isEditing) {
      skillData.skill_key = skill.skill_key;
    }

    onSave(skillData);
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
            <label htmlFor="skill">Name</label>
            <input
              type="text"
              id="skill"
              {...register('skill')}
              placeholder="Skill name"
            />
          </div>

          <div className="form-group">
            <label htmlFor="skill_type_key">Skill Type</label>
            <select id="skill_type_key" {...register('skill_type_key')}>
              <option value="">Select skill type</option>
              {skillTypes.map((type) => (
                <option key={type.skill_type_key} value={type.skill_type_key}>
                  {type.skill_type}
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

          <div className="form-group">
            <label>
              <input
                type="checkbox"
                {...register('is_hidden')}
              />
              Hidden
            </label>
            <small className="form-help">
              Hidden skills are left out of the public skills listing. They stay
              attached to any application that already references them.
            </small>
          </div>

          <div className="form-group">
            <label>
              <input
                type="checkbox"
                {...register('provide_disclaimer')}
              />
              Provide Disclaimer
            </label>
            <small className="form-help">
              Flags the skill as needing a caveat when it is shown.
            </small>
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            {isEditing && (
              <button type="button" onClick={() => onDelete(skill)} className="btn btn-danger">
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

export default SkillModal;
