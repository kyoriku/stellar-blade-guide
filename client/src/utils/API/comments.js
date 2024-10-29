import auth from '../auth';

const BASE_URL = import.meta.env.VITE_API_COMMENT_URL;

const headers = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${auth.getToken()}`
});

export const commentApi = {
  // Get all comments for a page
  getComments: async (pageId) => {
    const response = await fetch(`${BASE_URL}/${pageId}`);
    if (!response.ok) throw new Error('Failed to fetch comments');
    return response.json();
  },

  // Create a new comment
  createComment: async (pageId, content) => {
    const response = await fetch(BASE_URL, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ pageId, content })
    });
    if (!response.ok) throw new Error('Failed to create comment');
    return response.json();
  },

  // Update a comment
  updateComment: async (commentId, content) => {
    const response = await fetch(`${BASE_URL}/${commentId}`, {
      method: 'PUT',
      headers: headers(),
      body: JSON.stringify({ content })
    });
    if (!response.ok) throw new Error('Failed to update comment');
    return response.json();
  },

  // Delete a comment
  deleteComment: async (commentId) => {
    const response = await fetch(`${BASE_URL}/${commentId}`, {
      method: 'DELETE',
      headers: headers()
    });
    if (!response.ok) throw new Error('Failed to delete comment');
    return response.json();
  }
};