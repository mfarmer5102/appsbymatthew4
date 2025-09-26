import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import './SkillTypeModal.css';

const SkillTypeModal = ({ skillType, onSave, onClose, onDelete }) => {
  const { register, handleSubmit, formState: { errors }, setValue } = useForm();

  const isEditing = !!skillType;

  useEffect(() => {
    if (skillType) {
      setValue('code', skillType.code || '');
      setValue('label', skillType.label || '');
    }
  }, [skillType, setValue]);

  const onSubmit = (data) => {
    onSave(data);
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
            <label htmlFor="code">Code</label>
            <input
              type="text"
              id="code"
              {...register('code')}
              placeholder="Unique skill type code"
            />
          </div>

          <div className="form-group">
            <label htmlFor="label">Label</label>
            <input
              type="text"
              id="label"
              {...register('label')}
              placeholder="Skill type label"
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
