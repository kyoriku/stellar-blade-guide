// client/src/utils/API/comments.js
import auth from '../auth';

const BASE_URL = import.meta.env.VITE_API_COMMENT_URL;

const headers = () => {
  const token = auth.getToken();
  console.log('Current token:', token); // Debug log
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`
  };
};

const handleResponse = async (response) => {
  const data = await response.json();
  console.log('API Response:', { 
    status: response.status,
    data 
  }); // Debug log
  
  if (!response.ok) {
    // Log detailed error information
    if (response.status === 403) {
      console.log('Permission denied. User data:', auth.getProfile()?.data);
    }
    throw new Error(data.message || 'API request failed');
  }
  
  return data;
};

export const commentApi = {
  // Get all comments for a page
  getComments: async (pageId) => {
    try {
      const response = await fetch(`${BASE_URL}/${pageId}`);
      return handleResponse(response);
    } catch (error) {
      console.error('Get comments error:', error);
      throw error;
    }
  },

  // Create a new comment
  createComment: async (pageId, content) => {
    try {
      const response = await fetch(BASE_URL, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({ pageId, content })
      });
      return handleResponse(response);
    } catch (error) {
      console.error('Create comment error:', error);
      throw error;
    }
  },

  // Update a comment
  updateComment: async (commentId, content) => {
    try {
      console.log('Updating comment:', { commentId, content }); // Debug log
      console.log('Current user:', auth.getProfile()?.data); // Debug log
      
      const response = await fetch(`${BASE_URL}/${commentId}`, {
        method: 'PUT',
        headers: headers(),
        body: JSON.stringify({ content })
      });
      return handleResponse(response);
    } catch (error) {
      console.error('Update comment error:', error);
      throw error;
    }
  },

  // Delete a comment
  deleteComment: async (commentId) => {
    try {
      console.log('Deleting comment:', commentId); // Debug log
      console.log('Current user:', auth.getProfile()?.data); // Debug log
      
      const response = await fetch(`${BASE_URL}/${commentId}`, {
        method: 'DELETE',
        headers: headers()
      });
      return handleResponse(response);
    } catch (error) {
      console.error('Delete comment error:', error);
      throw error;
    }
  },

  getCommentReplies: async (commentId) => {
    const response = await fetch(`/api/comments/${commentId}/replies`);
    if (!response.ok) throw new Error('Failed to fetch replies');
    return response.json();
  },

  createReply: async (commentId, content, pageId) => {
    const response = await fetch(`/api/comments/${commentId}/replies`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${auth.getToken()}`
      },
      body: JSON.stringify({ 
        content,
        pageId,
        parentId: commentId
      })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create reply');
    }
    
    return response.json();
  },

  // If you need to get replies separately
  getReplies: async (commentId) => {
    const response = await fetch(`/api/comments/${commentId}/replies`);
    if (!response.ok) {
      throw new Error('Failed to fetch replies');
    }
    return response.json();
  }
};