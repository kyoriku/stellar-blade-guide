import React, { useState, useEffect } from 'react';
import DOMPurify from 'dompurify';
import Auth from '../utils/auth';
import { commentApi } from '../utils/API/comments';
import { formatDateDisplay } from '../utils/formatDate';
import AuthModal from './AuthModal';
import DeleteModal from './DeleteModal';
import { Shield, MessageCircle, Reply, Edit2, Trash2, Crown } from 'lucide-react';
import '../styles/CommentSection.css';

const CommentReply = ({ comment, onReply, canModerate, onEdit, onDelete }) => {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitReply = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onReply(comment._id, replyContent);
      setReplyContent('');
      setShowReplyForm(false);
    } catch (error) {
      console.error('Error submitting reply:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const replyCount = comment.replies?.length || 0;

  return (
    <div className="">
      {showReplyForm ? (
        <form onSubmit={handleSubmitReply} className=" mt-2">
          <textarea
            className="form-control mb-2"
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            placeholder="Write a reply..."
            rows="2"
          />
          <div className="d-flex justify-content-between align-items-center">
            <small className="text-muted">{replyContent.length}/1000</small>
            <div>
              <button
                type="submit"
                className="btn btn-primary btn-sm me-2"
                disabled={isSubmitting || replyContent.trim().length === 0}
              >
                {isSubmitting ? 'Posting...' : 'Post Reply'}
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setShowReplyForm(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      ) : (
        <div className="d-flex justify-content-end align-items-center gap-3">
          {replyCount > 0 && (
            <span className="d-inline-flex align-items-center" style={{ color: '#64748b' }}>
              <MessageCircle size={14} className="me-1" fill="#64748b" strokeWidth={1.5} />
              {replyCount} {replyCount === 1 ? 'reply' : 'replies'}
            </span>
          )}
          <button
            className="btn btn-subtle d-inline-flex align-items-center gap-1 px-2 py-1"
            onClick={() => setShowReplyForm(true)}
            style={{
              background: '#f8fafc',
              border: '1px solid #3b82f6',
              borderRadius: '6px',
              color: '#3b82f6',
              transition: 'all 0.2s ease',
              transform: 'scale(1)',
              boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#dbeafe'; // Slightly darker blue background
              e.currentTarget.style.borderColor = '#2563eb';
              e.currentTarget.style.color = '#2563eb';
              e.currentTarget.style.transform = 'scale(1.02)'; // Slight scale effect
              e.currentTarget.style.boxShadow = '0 4px 6px rgba(59, 130, 246, 0.15)'; // Blue-tinted shadow
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#f8fafc';
              e.currentTarget.style.borderColor = '#3b82f6';
              e.currentTarget.style.color = '#3b82f6';
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.05)';
            }}
          >
            <Reply size={14} className="me-1" />
            Reply
          </button>
        </div>
      )}
    </div>
  );
};

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
    if (!currentUser || !comment || !comment.author) return false;
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

    // Find the comment or reply being edited
    const targetComment = comments.find(c => c._id === commentId);
    const parentComment = comments.find(c => c.replies?.some(r => r._id === commentId));
    const targetReply = parentComment?.replies?.find(r => r._id === commentId);

    const commentToEdit = targetComment || targetReply;

    if (!commentToEdit || !canModerateComment(commentToEdit)) {
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

      // Update state handling both comments and replies
      setComments(prevComments =>
        prevComments.map(c => {
          // If this is the main comment being edited
          if (c._id === commentId) {
            return { ...c, content: sanitizedContent };
          }
          // If this comment contains the reply being edited
          if (c.replies?.some(r => r._id === commentId)) {
            return {
              ...c,
              replies: c.replies.map(reply =>
                reply._id === commentId
                  ? { ...reply, content: sanitizedContent }
                  : reply
              )
            };
          }
          return c;
        })
      );

      setIsEditing(null);
      showToast('Comment updated successfully');
    } catch (error) {
      console.error('Error updating comment:', error);
      showToast('Failed to update comment', 'danger');
    }
  };

  const handleDelete = async (commentId) => {
    // Refresh user data before deleting
    await fetchCurrentUser();

    // Find the comment or reply being deleted
    const comment = comments.find(c => c._id === commentId) ||
      comments.flatMap(c => c.replies || []).find(r => r._id === commentId);

    if (!comment || !canModerateComment(comment)) {
      showToast('You no longer have permission to delete this comment', 'danger');
      setShowDeleteModal(false);
      return;
    }

    try {
      await commentApi.deleteComment(commentId);

      // Update state for both comments and replies
      setComments(prevComments =>
        prevComments.map(c => {
          // If this is the main comment being deleted
          if (c._id === commentId) {
            return null;
          }
          // If this is a reply being deleted
          if (c.replies) {
            return {
              ...c,
              replies: c.replies.filter(reply => reply._id !== commentId)
            };
          }
          return c;
        }).filter(Boolean) // Remove null entries (deleted main comments)
      );

      await fetchCurrentUser();
      showToast('Comment deleted successfully');
    } catch (error) {
      showToast('Failed to delete comment', 'danger');
    }
  };

  const handleDeleteClick = async (commentId) => {
    // Refresh user data to ensure permissions are up-to-date
    await fetchCurrentUser();

    // Find the comment or reply being deleted
    const comment = comments.find(c => c._id === commentId) ||
      comments.flatMap(c => c.replies || []).find(r => r._id === commentId);

    // Check if the user still has permission before opening the modal
    if (!comment || !canModerateComment(comment)) {
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

  const handleReply = async (commentId, content) => {
    try {
      const sanitizedContent = DOMPurify.sanitize(content.trim());
      if (sanitizedContent.length < 1 || sanitizedContent.length > 1000) {
        showToast('Reply must be between 1 and 1000 characters', 'danger');
        return;
      }

      // Pass pageId to createReply
      const reply = await commentApi.createReply(commentId, sanitizedContent, pageId);

      // Update the comments state to include the new reply
      setComments(prevComments =>
        prevComments.map(comment =>
          comment._id === commentId
            ? { ...comment, replies: [...(comment.replies || []), reply] }
            : comment
        )
      );

      showToast('Reply posted successfully');
    } catch (error) {
      console.error('Error posting reply:', error);
      showToast('Failed to post reply', 'danger');
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
          {Auth.loggedIn() ? (
            <form onSubmit={handleSubmit} className="">
              <div className="mb-2">
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
            <div className="alert alert-info text-center mb-2">
              Please <button onClick={() => setShowAuthModal(true)} className="btn btn-link p-0 pb-1">login</button> to post comments
            </div>
          )}

          <div className="comment-list">
            {comments.map((comment) => (
              <div key={comment._id}>
                <div className="card bg-light mb-2">
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
                          <div className="d-flex flex-column flex-md-row align-items-start align-items-md-center">
                            <h6 className="mb-0 d-inline-flex align-items-center">
                              {comment.author.username}
                              {comment.author.isAdmin && (
                                <span className="badge ms-2 d-flex align-items-center p-1" style={{ backgroundColor: '#553C9A' }}>
                                  <Crown size={14} className="me-1" fill="white" />
                                  <span>ADMIN</span>
                                </span>
                              )}
                              {comment.author.isModerator && (
                                <span className="badge bg-success ms-2 d-flex align-items-center p-1">
                                  <Shield size={14} className="me-1" fill="white" />
                                  <span>MOD</span>
                                </span>
                              )}
                            </h6>
                            <span
                              className="text-muted mt-1 mt-sm-0 ms-md-2"
                              style={{ fontSize: '0.875rem', fontWeight: 'normal' }}
                            >
                              <span className="d-none d-md-inline">•</span>{' '}
                              {formatDateDisplay(comment.createdAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                      {canModerateComment(comment) && !isEditing && (
                        <div className="ms-auto">
                          <button
                            className="btn btn-link btn-sm p-1 icon-button"
                            onClick={() => handleEditClick(comment)}
                            title="Edit"
                            style={{ backgroundColor: 'transparent' }}
                          >
                            <Edit2
                              size={16}
                              className="edit-icon"
                              stroke="#3B82F6" // Outline color stays constant
                              style={{
                                transition: 'fill 0.2s ease',
                                fill: '#93C5FD' // Default fill color
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.fill = '#3B82F6'; // Hover fill color
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.fill = '#93C5FD'; // Back to default fill color
                              }}
                            />
                          </button>
                          <button
                            className="btn btn-link btn-sm p-1 icon-button"
                            onClick={() => handleDeleteClick(comment._id)}
                            title="Delete"
                            style={{ backgroundColor: 'transparent' }}
                          >
                            <Trash2
                              size={16}
                              className="delete-icon"
                              stroke="#DC2626" // Outline color stays constant
                              style={{
                                transition: 'fill 0.2s ease',
                                fill: '#FCA5A5' // Default fill color
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.fill = '#EF4444'; // Hover fill color
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.fill = '#FCA5A5'; // Back to default fill color
                              }}
                            />
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
                      <>
                        <p className="mb-0" style={{ whiteSpace: 'pre-wrap' }}>{comment.content}</p>

                        {Auth.loggedIn() && !isEditing && (
                          <CommentReply
                            comment={comment}
                            onReply={handleReply}
                            canModerate={canModerateComment}
                          />
                        )}

                        {comment.replies && comment.replies.length > 0 && (
                          <div className="mt-2" style={{ marginLeft: '-0.5rem', marginRight: '-0.5rem', marginBottom: '-1rem' }}>
                            {comment.replies.map(reply => (
                              <div key={reply._id} className="card " style={{ marginBottom: '0.5rem', backgroundColor: 'rgb(233, 236, 239)' }}>
                                <div className="card-body py-2 px-3">
                                  <div className="d-flex justify-content-between align-items-start">
                                    <div className="d-flex align-items-center">
                                      <div
                                        className="rounded-circle bg-secondary text-white d-flex align-items-center justify-content-center"
                                        style={{ width: '32px', height: '32px' }}
                                      >
                                        {reply.author.username[0].toUpperCase()}
                                      </div>
                                      <div className="ms-2">
                                        <div className="d-flex flex-column flex-md-row align-items-start align-items-md-center">
                                          <h6 className="mb-0 d-inline-flex align-items-center">
                                            {reply.author.username}
                                            {reply.author.isAdmin && (
                                              <span className="badge ms-2 d-flex align-items-center p-1" style={{ backgroundColor: '#553C9A' }}>
                                                <Crown size={14} className="me-1" fill="white" />
                                                <span>ADMIN</span>
                                              </span>
                                            )}
                                            {reply.author.isModerator && (
                                              <span className="badge bg-success ms-2 d-flex align-items-center p-1">
                                                <Shield size={14} className="me-1" fill="white" />
                                                <span>MOD</span>
                                              </span>
                                            )}
                                          </h6>
                                          <span
                                            className="text-muted mt-1 mt-sm-0 ms-md-2"
                                            style={{ fontSize: '0.875rem', fontWeight: 'normal' }}
                                          >
                                            <span className="d-none d-md-inline">•</span>{' '}
                                            {formatDateDisplay(reply.createdAt)}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                    {canModerateComment(reply) && !isEditing && (
                                      <div className="ms-auto">
                                        <button
                                          className="btn btn-link btn-sm p-1 icon-button"
                                          onClick={() => handleEditClick(reply)}
                                          title="Edit"
                                          style={{ backgroundColor: 'transparent' }} // Ensure button background stays transparent
                                        >
                                          <Edit2
                                            size={16}
                                            className="edit-icon"
                                            stroke="#3B82F6" // Outline color stays constant
                                            style={{
                                              transition: 'fill 0.2s ease',
                                              fill: '#93C5FD' // Default fill color
                                            }}
                                            onMouseEnter={(e) => {
                                              e.currentTarget.style.fill = '#3B82F6'; // Hover fill color
                                            }}
                                            onMouseLeave={(e) => {
                                              e.currentTarget.style.fill = '#93C5FD'; // Back to default fill color
                                            }}
                                          />
                                        </button>

                                        <button
                                          className="btn btn-link btn-sm p-1 icon-button"
                                          onClick={() => handleDeleteClick(reply._id)}
                                          title="Delete"
                                          style={{ backgroundColor: 'transparent' }}
                                        >
                                          <Trash2
                                            size={16}
                                            className="delete-icon"
                                            stroke="#DC2626" // Outline color stays constant
                                            style={{
                                              transition: 'fill 0.2s ease',
                                              fill: '#FCA5A5' // Default fill color
                                            }}
                                            onMouseEnter={(e) => {
                                              e.currentTarget.style.fill = '#EF4444'; // Hover fill color
                                            }}
                                            onMouseLeave={(e) => {
                                              e.currentTarget.style.fill = '#FCA5A5'; // Back to default fill color
                                            }}
                                          />
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                  {isEditing === reply._id ? (
                                    <div className="mt-2">
                                      <textarea
                                        className="form-control mb-2"
                                        value={editContent}
                                        onChange={(e) => setEditContent(e.target.value)}
                                        maxLength={1000}
                                      />
                                      <div className="d-flex justify-content-between align-items-center">
                                        <small className="text-muted">
                                          {editContent.length}/1000
                                        </small>
                                        <div>
                                          <button
                                            className="btn btn-success btn-sm me-2"
                                            onClick={() => handleEditSubmit(reply._id)}
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
                                    <p className="mb-0 mt-2" style={{ whiteSpace: 'pre-wrap' }}>
                                      {reply.content}
                                    </p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
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
