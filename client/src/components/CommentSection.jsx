import React, { useState, useEffect } from 'react';
import DOMPurify from 'dompurify';
import Auth from '../utils/auth';
import { commentApi } from '../utils/API/comments';
import { formatDateDisplay } from '../utils/formatDate';
import AuthModal from './AuthModal';

const CommentSection = ({ pageId }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const isAuthenticated = Auth.loggedIn();
  const user = isAuthenticated ? Auth.getProfile() : null;
  const [toast, setToast] = useState({ show: false, message: '', type: '' });
  const [lastCommentTime, setLastCommentTime] = useState(0); 
  const COMMENT_COOLDOWN = 60000; // 1 minute

  useEffect(() => {
    fetchComments();
  }, [pageId]);

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
      setComments(fetchedComments);
    } catch (err) {
      showToast('Failed to load comments', 'danger');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }

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

  const handleEditClick = (comment) => {
    setIsEditing(comment._id);
    setEditContent(comment.content);
  };

  const handleEditSubmit = async (commentId) => {
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

      setIsEditing(null);
      showToast('Comment updated successfully');
    } catch (error) {
      showToast('Failed to update comment', 'danger');
    }
  };

  const handleDelete = async (commentId) => {
    try {
      await commentApi.deleteComment(commentId);
      setComments(prev => prev.filter(comment => comment._id !== commentId));
      showToast('Comment deleted successfully');
    } catch (err) {
      showToast('Failed to delete comment', 'danger');
    }
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
          {isAuthenticated ? (
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
                    disabled={isLoading}
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
                        {comment.author.username[0]}
                      </div>
                      <div className="ms-2">
                        <h6 className="mb-0">{comment.author.username}</h6>
                        <small className="text-muted">
                          {formatDateDisplay(comment.createdAt)}
                        </small>
                      </div>
                    </div>

                    <div className="ms-auto">
                      {/* {user?.data?._id === comment.author._id && !isEditing && ( */}
                      {user?.data?.username === comment.author.username && !isEditing && (
                        <>
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => handleEditClick(comment)}
                          >
                            Edit
                          </button>
                          <button
                            className="btn btn-danger btn-sm ms-2"
                            onClick={() => handleDelete(comment._id)}
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  {isEditing === comment._id ? (
                    <div>
                      <textarea
                        className="form-control mb-2"
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                      />
                      <div className="d-flex justify-content-end">
                        <button
                          className="btn btn-success btn-sm"
                          onClick={() => handleEditSubmit(comment._id)}
                        >
                          Save
                        </button>
                        <button
                          className="btn btn-secondary btn-sm ms-2"
                          onClick={() => setIsEditing(null)}
                        >
                          Cancel
                        </button>
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
    </div>
  );
};

export default CommentSection;
