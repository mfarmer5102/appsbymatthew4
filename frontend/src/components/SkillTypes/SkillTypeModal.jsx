import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import './SkillTypeModal.css';

const SkillTypeModal = ({ skillType, onSave, onClose, onDelete }) => {
  const { register, handleSubmit, formState: { errors }, setValue } = useForm();

  const isEditing = !!skillType;

  useEffect(() => {
    if (skillType) {
      setValue('skill_type', skillType.skill_type || '');
    }
  }, [skillType, setValue]);

  const onSubmit = (data) => {
    // Updates are addressed by key, so carry it through on edit.
    onSave(isEditing ? { ...data, skill_type_key: skillType.skill_type_key } : data);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isEditing ? 'Edit Skill Type' : 'Create Skill Type'}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="modal-form">
          <div className="form-group">
            <label htmlFor="skill_type">Name</label>
            <input
              type="text"
              id="skill_type"
              {...register('skill_type')}
              placeholder="Skill type name"
            />
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            {isEditing && (
              <button type="button" onClick={() => onDelete(skillType)} className="btn btn-danger">
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

export default SkillTypeModal;
