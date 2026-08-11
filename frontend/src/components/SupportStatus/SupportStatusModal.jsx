import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import './SupportStatusModal.css';

const SupportStatusModal = ({ supportStatus, onSave, onClose, onDelete }) => {
  const { register, handleSubmit, formState: { errors }, setValue } = useForm();

  const isEditing = !!supportStatus;

  useEffect(() => {
    if (supportStatus) {
      setValue('support_status', supportStatus.support_status || '');
    }
  }, [supportStatus, setValue]);

  const onSubmit = (data) => {
    // Updates are addressed by key, so carry it through on edit.
    onSave(isEditing ? { ...data, support_status_key: supportStatus.support_status_key } : data);
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
            <label htmlFor="support_status">Name</label>
            <input
              type="text"
              id="support_status"
              {...register('support_status')}
              placeholder="Support status name"
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
