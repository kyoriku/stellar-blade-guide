import React, { useState, useEffect } from 'react';
import DOMPurify from 'dompurify';
import Auth from '../utils/auth';
import { commentApi } from '../utils/API/comments';
import { formatDateDisplay } from '../utils/formatDate';
import AuthModal from './AuthModal';
import DeleteModal from './DeleteModal';
import { PersonFill, ShieldFill } from 'react-bootstrap-icons';

const CommentSection = ({ pageId }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });
  const [lastCommentTime, setLastCommentTime] = useState(0);
  const COMMENT_COOLDOWN = 60000; // 1 minute
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState(null);

  // Fetch current user data on component mount and whenever the page ID changes
  useEffect(() => {
    fetchCurrentUser();
  }, [pageId]);

  // Fetch current user data from the server
  const fetchCurrentUser = async () => {
    try {
      if (Auth.loggedIn()) {
        const token = Auth.getToken();
        const response = await fetch('/api/users/me', {
          headers: {
            'Authorization': `Bearer ${token}`,
          }
        });

        if (!response.ok) throw new Error('Failed to fetch user data');

        const userData = await response.json();

        // Check if moderator status has changed
        if (currentUser?.isModerator !== userData.isModerator) {
          console.log('Moderator status changed, refreshing comments...');
          // Refresh comments to update MOD badges
          await fetchComments();
        }

        setCurrentUser(userData);
      }
    } catch (error) {
      console.error('Error fetching current user:', error);
      setError('Failed to fetch user data');
    }
  };

  // Check if user is a moderator using current user data
  const isModerator = () => {
    return currentUser?.isModerator === true;
  };

  // Check if user can moderate a specific comment
  const canModerateComment = (comment) => {
    if (!currentUser) return false;
    return currentUser.username === comment.author.username || isModerator();
  };

  // Fetch comments
  useEffect(() => {
    fetchComments();
  }, [pageId]);

  // Toast management
  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => {
        setToast({ ...toast, show: false });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const showToast = (message, type = 'success') => {
    setToast({
      show: true,
      message,
      type
    });
  };

  const fetchComments = async () => {
    try {
      const fetchedComments = await commentApi.getComments(pageId);
      // Sort comments to maintain consistent order
      const sortedComments = fetchedComments.sort((a, b) =>
        new Date(b.createdAt) - new Date(a.createdAt)
      );
      setComments(sortedComments);
    } catch (err) {
      console.error('Error fetching comments:', err);
      showToast('Failed to load comments', 'danger');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!Auth.loggedIn()) {
      setShowAuthModal(true);
      return;
    }

    // Refresh user data before submitting
    await fetchCurrentUser();

    const now = Date.now();
    if (now - lastCommentTime < COMMENT_COOLDOWN) {
      showToast('Please wait a moment before posting again', 'danger');
      return;
    }

    if (!newComment.trim()) return;

    const sanitizedContent = DOMPurify.sanitize(newComment.trim());
    if (sanitizedContent.length < 1 || sanitizedContent.length > 1000) {
      showToast('Comment must be between 1 and 1000 characters', 'danger');
      return;
    }

    setIsLoading(true);
    try {
      const comment = await commentApi.createComment(pageId, sanitizedContent);
      setComments(prev => [comment, ...prev]);
      setNewComment('');
      setLastCommentTime(now);
      showToast('Comment posted successfully');
    } catch (err) {
      showToast('Failed to post comment', 'danger');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditClick = async (comment) => {
    // Refresh user data before editing
    await fetchCurrentUser();

    if (canModerateComment(comment)) {
      setIsEditing(comment._id);
      setEditContent(comment.content);
    } else {
      showToast('You no longer have permission to edit this comment', 'danger');
    }
  };

  const handleEditSubmit = async (commentId) => {
    // Refresh user data before submitting edit
    await fetchCurrentUser();

    const comment = comments.find(c => c._id === commentId);
    if (!canModerateComment(comment)) {
      showToast('You no longer have permission to edit this comment', 'danger');
      setIsEditing(null);
      return;
    }

    try {
      const sanitizedContent = DOMPurify.sanitize(editContent.trim());
      if (sanitizedContent.length < 1 || sanitizedContent.length > 1000) {
        showToast('Comment must be between 1 and 1000 characters', 'danger');
        return;
      }

      await commentApi.updateComment(commentId, sanitizedContent);
      setComments(prevComments =>
        prevComments.map(comment =>
          comment._id === commentId ? { ...comment, content: sanitizedContent } : comment
        )
      );
      await fetchCurrentUser();


      setIsEditing(null);
      showToast('Comment updated successfully');
    } catch (error) {
      showToast('Failed to update comment', 'danger');
    }
  };

  const handleDelete = async (commentId) => {
    // Refresh user data before deleting
    await fetchCurrentUser();

    const comment = comments.find(c => c._id === commentId);
    if (!canModerateComment(comment)) {
      showToast('You no longer have permission to delete this comment', 'danger');
      setShowDeleteModal(false);
      return;
    }

    try {
      await commentApi.deleteComment(commentId);
      setComments(prevComments => prevComments.filter(comment => comment._id !== commentId));
      await fetchCurrentUser();

      showToast('Comment deleted successfully');
    } catch (error) {
      showToast('Failed to delete comment', 'danger');
    }
  };

  const handleDeleteClick = async (commentId) => {
    // Refresh user data to ensure permissions are up-to-date
    await fetchCurrentUser();
    const comment = comments.find(c => c._id === commentId);

    // Check if the user still has permission before opening the modal
    if (!canModerateComment(comment)) {
      showToast('You no longer have permission to delete this comment', 'danger');
      return;
    }

    // If permission is confirmed, open the delete modal
    setCommentToDelete(commentId);
    setShowDeleteModal(true);
  };


  const handleConfirmDelete = async () => {
    if (commentToDelete) {
      await handleDelete(commentToDelete);
    }
    setCommentToDelete(null);
    setShowDeleteModal(false);
  };

  return (
    <div className="container mt-0 p-0 mb-5">
      {toast.show && (
        <div
          className={`position-fixed bottom-0 end-0 p-3 m-3 alert alert-${toast.type}`}
          style={{ zIndex: 1050 }}
          role="alert"
        >
          {toast.message}
        </div>
      )}
      <div className="card">
        <div className="card-header">
          <h2 className="h4 mb-0">Comments</h2>
        </div>
        <div className="card-body pt-2 px-2 pb-0">
          {Auth.loggedIn() ? (
            <form onSubmit={handleSubmit} className="mb-4">
              <div className="mb-3">
                <textarea
                  className="form-control"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Write a comment..."
                  maxLength={1000}
                  rows="3"
                />
                <div className="d-flex justify-content-between align-items-center mt-2">
                  <small className="text-muted">
                    {newComment.length}/1000
                  </small>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={isLoading || newComment.trim().length === 0}  // Disable button if loading or no comment
                  >
                    {isLoading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Posting...
                      </>
                    ) : (
                      'Post Comment'
                    )}
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <div className="alert alert-info text-center mb-4">
              Please <button onClick={() => setShowAuthModal(true)} className="btn btn-link p-0 pb-1">login</button> to post comments
            </div>
          )}

          <div className="comment-list">
            {comments.map((comment) => (
              <div key={comment._id} className="card bg-light mb-2">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div className="d-flex align-items-center">
                      <div
                        className="rounded-circle bg-secondary text-white d-flex align-items-center justify-content-center"
                        style={{ width: '40px', height: '40px' }}
                      >
                        {comment.author.username[0].toUpperCase()}
                      </div>
                      <div className="ms-2">
                        <h6 className="mb-0 d-inline-flex align-items-center">
                          {comment.author.username}
                          {comment.author.isModerator && (
                            <span className="badge bg-success ms-2 d-flex align-items-center p-1">
                              <ShieldFill className="me-1" style={{ marginBottom: '-1px' }} />
                              <span style={{ marginBottom: '-1px' }}>MOD</span>
                            </span>
                          )}
                        </h6>
                        {/* <h6 className="mb-0 d-inline-flex align-items-center">
                          {comment.author.username}
                          {comment.author.isModerator && (
                            <span className="badge bg-success ms-2 ">
                              <ShieldFill className="me-1 " />MOD
                            </span>
                          )}
                        </h6> */}
                        {/* <h6 className="mb-0 d-inline-flex align-items-center">
                          {comment.author.username}
                          {comment.author.isModerator && (
                            <span className="badge bg-light text-success ">
                              <ShieldFill className="me-1 " />MOD
                            </span>
                          )}
                        </h6> */}
                        {/* <h6 className="mb-0 d-inline-flex align-items-center">
                          {comment.author.username}
                          {comment.author.isModerator && (
                            <ShieldFill className="text-success ms-2" />
                          )}
                        </h6> */}
                        <div>
                          <small className="text-muted">
                            {formatDateDisplay(comment.createdAt)}
                          </small>
                        </div>
                      </div>
                    </div>
                    {canModerateComment(comment) && !isEditing && (
                      <div className="ms-auto">
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => handleEditClick(comment)}
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn-danger btn-sm ms-2"
                          onClick={() => handleDeleteClick(comment._id)}
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                  {isEditing === comment._id ? (
                    <div className="mt-2">
                      <textarea
                        className="form-control mb-2"
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                      />
                      <div className="d-flex justify-content-between align-items-center">
                        <small className="text-muted">
                          {editContent.length}/1000
                        </small>
                        <div>
                          <button
                            className="btn btn-success btn-sm me-2"
                            onClick={() => handleEditSubmit(comment._id)}
                          >
                            Save
                          </button>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => setIsEditing(null)}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="mb-0" style={{ whiteSpace: 'pre-wrap' }}>{comment.content}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <AuthModal
        show={showAuthModal}
        handleClose={() => setShowAuthModal(false)}
      />
      <DeleteModal
        show={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};

export default CommentSection;
