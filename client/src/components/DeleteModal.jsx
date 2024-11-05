import React from 'react';
import { Modal } from 'react-bootstrap';

const DeleteConfirmationModal = ({ show, onClose, onConfirm }) => {
  return (
    <Modal
      size="md"
      show={show}
      onHide={onClose}
      aria-labelledby="delete-confirmation-modal"
    >
      <Modal.Header closeButton>
        <Modal.Title id="delete-confirmation-modal">
          Confirm Delete
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>Are you sure you want to delete this comment?</p>
      </Modal.Body>
      <Modal.Footer>
        <button type="button" className="btn btn-secondary" onClick={onClose}>
          Cancel
        </button>
        <button type="button" className="btn btn-danger" onClick={onConfirm}>
          Delete
        </button>
      </Modal.Footer>
    </Modal>
  );
};

export default DeleteConfirmationModal;
