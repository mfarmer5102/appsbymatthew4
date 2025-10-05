import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import './SupportStatusModal.css';

const SupportStatusModal = ({ supportStatus, onSave, onClose, onDelete }) => {
  const { register, handleSubmit, formState: { errors }, setValue } = useForm();

  const isEditing = !!supportStatus;

  useEffect(() => {
    if (supportStatus) {
      setValue('code', supportStatus.code || '');
      setValue('label', supportStatus.label || '');
    }
  }, [supportStatus, setValue]);

  const onSubmit = (data) => {
    onSave(data);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isEditing ? 'Edit Support Status' : 'Create Support Status'}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="modal-form">
          <div className="form-group">
            <label htmlFor="code">Code</label>
            <input
              type="text"
              id="code"
              {...register('code')}
              placeholder="Unique support status code"
            />
          </div>

          <div className="form-group">
            <label htmlFor="label">Label</label>
            <input
              type="text"
              id="label"
              {...register('label')}
              placeholder="Support status label"
            />
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            {isEditing && (
              <button type="button" onClick={() => onDelete(supportStatus)} className="btn btn-danger">
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

export default SupportStatusModal;
