const { Comment } = require('../models');
const { AuthenticationError } = require('../utils/errors');

const commentController = {
  // // GET all comments
  // async getAllComments(req, res) {
  //   try {
  //     const comments = await Comment.find()
  //       .populate('author', 'username email') // Only populate necessary fields
  //       .sort('-createdAt');

  //     res.json(comments);
  //   } catch (error) {
  //     console.error('Error fetching comments:', error);
  //     res.status(500).json({ message: 'Error fetching comments' });
  //   }
  // },

  // GET all comments
  async getAllComments(req, res) {
    try {
      const comments = await Comment.find()
        .populate('author', 'username') // Only include the username
        .sort('-createdAt');

      // Sanitize the response
      const sanitizedComments = comments.map(comment => ({
        _id: comment._id,
        content: comment.content,
        pageId: comment.pageId,
        createdAt: comment.createdAt,
        updatedAt: comment.updatedAt,
        author: {
          username: comment.author.username // Only return username
        }
      }));

      res.json(sanitizedComments);
    } catch (error) {
      console.error('Error fetching comments:', error);
      res.status(500).json({ message: 'Error fetching comments' });
    }
  },

  // // GET comments for a specific page
  // async getPageComments(req, res) {
  //   try {
  //     const comments = await Comment.find({ pageId: req.params.pageId })
  //       .populate('author', 'username') // Only populate necessary fields
  //       .sort('-createdAt');

  //     res.json(comments);
  //   } catch (error) {
  //     console.error('Error fetching comments:', error);
  //     res.status(500).json({ message: 'Error fetching comments' });
  //   }
  // },

  // GET comments for a specific page
  async getPageComments(req, res) {
    try {
      const comments = await Comment.find({ pageId: req.params.pageId })
        .populate('author', 'username isModerator') // Include both username and isModerator fields
        .sort('-createdAt');
  
      // Sanitize the response
      const sanitizedComments = comments.map(comment => ({
        _id: comment._id,
        content: comment.content,
        pageId: comment.pageId,
        createdAt: comment.createdAt,
        updatedAt: comment.updatedAt,
        author: {
          username: comment.author.username,
          isModerator: comment.author.isModerator // Include moderator status
        }
      }));
  
      res.json(sanitizedComments);
    } catch (error) {
      console.error('Error fetching comments:', error);
      res.status(500).json({ message: 'Error fetching comments' });
    }
  },  

  // GET comments by user
  async getUserComments(req, res) {
    try {
      const userComments = await Comment.find({ author: req.user._id })
        .populate('author', 'username email')
        .sort('-createdAt');

      res.json(userComments);
    } catch (error) {
      console.error('Error fetching user comments:', error);
      res.status(500).json({ message: 'Error fetching user comments' });
    }
  },

  // // POST a new comment
  // async createComment(req, res) {
  //   try {
  //     // Ensure user is authenticated
  //     if (!req.user) {
  //       throw new AuthenticationError('Must be logged in to comment');
  //     }

  //     const { pageId, content } = req.body;

  //     // Validate required fields
  //     if (!pageId || !content) {
  //       return res.status(400).json({ message: 'PageId and content are required' });
  //     }

  //     const newComment = await Comment.create({
  //       pageId,
  //       content,
  //       author: req.user._id
  //     });

  //     // Populate author details before sending response
  //     const populatedComment = await Comment.findById(newComment._id)
  //       .populate('author', 'username');
  //     // .populate('author', 'username email');

  //     res.status(201).json(populatedComment);
  //   } catch (error) {
  //     console.error('Error creating comment:', error);
  //     if (error instanceof AuthenticationError) {
  //       return res.status(401).json({ message: error.message });
  //     }
  //     res.status(400).json({ message: 'Error posting comment' });
  //   }
  // },

  // POST a new comment
  async createComment(req, res) {
    try {
      // Ensure user is authenticated
      if (!req.user) {
        throw new AuthenticationError('Must be logged in to comment');
      }
  
      const { pageId, content } = req.body;
  
      // Validate required fields
      if (!pageId || !content) {
        return res.status(400).json({ message: 'PageId and content are required' });
      }
  
      const newComment = await Comment.create({
        pageId,
        content,
        author: req.user._id
      });
  
      // Populate author details with both username and isModerator
      const populatedComment = await Comment.findById(newComment._id)
        .populate('author', 'username isModerator');
  
      // Sanitize response
      const sanitizedComment = {
        _id: populatedComment._id,
        content: populatedComment.content,
        pageId: populatedComment.pageId,
        author: {
          username: populatedComment.author.username,
          isModerator: populatedComment.author.isModerator // Include isModerator status
        },
        createdAt: populatedComment.createdAt,
        updatedAt: populatedComment.updatedAt,
      };
  
      res.status(201).json(sanitizedComment);
    } catch (error) {
      console.error('Error creating comment:', error);
      if (error instanceof AuthenticationError) {
        return res.status(401).json({ message: error.message });
      }
      res.status(400).json({ message: 'Error posting comment' });
    }
  },  

  // // UPDATE a comment
  // async updateComment(req, res) {
  //   try {
  //     if (!req.user) {
  //       throw new AuthenticationError('Must be logged in to update comment');
  //     }

  //     const { commentId } = req.params;
  //     const { content } = req.body;

  //     // Find comment and check ownership
  //     const comment = await Comment.findById(commentId);
  //     if (!comment) {
  //       return res.status(404).json({ message: 'Comment not found' });
  //     }

  //     if (comment.author.toString() !== req.user._id.toString()) {
  //       return res.status(403).json({ message: 'Not authorized to update this comment' });
  //     }

  //     // Update the comment
  //     comment.content = content;
  //     comment.updatedAt = Date.now();
  //     await comment.save();

  //     const updatedComment = await Comment.findById(commentId)
  //       .populate('author', 'username');
  //     // .populate('author', 'username email');

  //     res.json(updatedComment);
  //   } catch (error) {
  //     console.error('Error updating comment:', error);
  //     if (error instanceof AuthenticationError) {
  //       return res.status(401).json({ message: error.message });
  //     }
  //     res.status(400).json({ message: 'Error updating comment' });
  //   }
  // },

  // UPDATE a comment
// In your comment controller, update the updateComment method
async updateComment(req, res) {
  try {
    if (!req.user) {
      throw new AuthenticationError('Must be logged in to update comment');
    }

    console.log('Update request from user:', req.user); // Debug log

    const { commentId } = req.params;
    const { content } = req.body;

    // Find comment
    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    console.log('Comment permissions check:', { // Debug log
      commentAuthorId: comment.author.toString(),
      requestUserId: req.user._id.toString(),
      userIsModerator: req.user.isModerator
    });

    // Check if user is either the comment author or a moderator
    const isAuthor = comment.author.toString() === req.user._id.toString();
    const isModerator = req.user.isModerator === true;

    if (!isAuthor && !isModerator) {
      console.log('Permission denied:', { isAuthor, isModerator }); // Debug log
      return res.status(403).json({ message: 'Not authorized to update this comment' });
    }

    // Update the comment
    comment.content = content;
    comment.updatedAt = Date.now();
    
    // Add moderation info if a moderator is making the change
    if (isModerator && !isAuthor) {
      comment.moderated = true;
      comment.moderatedBy = req.user._id;
      comment.moderatedAt = Date.now();
    }

    await comment.save();

    // Populate the updated comment
    const updatedComment = await Comment.findById(commentId)
      .populate('author', 'username isModerator')
      .populate('moderatedBy', 'username');

    const response = {
      _id: updatedComment._id,
      content: updatedComment.content,
      pageId: updatedComment.pageId,
      author: {
        username: updatedComment.author.username,
        isModerator: updatedComment.author.isModerator
      },
      createdAt: updatedComment.createdAt,
      updatedAt: updatedComment.updatedAt,
      moderated: updatedComment.moderated,
      moderatedBy: updatedComment.moderatedBy ? {
        username: updatedComment.moderatedBy.username
      } : null,
      moderatedAt: updatedComment.moderatedAt
    };

    console.log('Sending response:', response); // Debug log
    res.json(response);

  } catch (error) {
    console.error('Error updating comment:', error);
    if (error instanceof AuthenticationError) {
      return res.status(401).json({ message: error.message });
    }
    res.status(400).json({ message: 'Error updating comment' });
  }
},

  // DELETE a comment
  async deleteComment(req, res) {
    try {
      if (!req.user) {
        throw new AuthenticationError('Must be logged in to delete comment');
      }

      const { commentId } = req.params;

      // Find comment
      const comment = await Comment.findById(commentId);
      if (!comment) {
        return res.status(404).json({ message: 'Comment not found' });
      }

      // Check if user is either the comment author or a moderator
      if (comment.author.toString() !== req.user._id.toString() && !req.user.isModerator) {
        return res.status(403).json({ message: 'Not authorized to delete this comment' });
      }

      await Comment.findByIdAndDelete(commentId);
      res.json({ message: 'Comment deleted successfully' });
    } catch (error) {
      console.error('Error deleting comment:', error);
      if (error instanceof AuthenticationError) {
        return res.status(401).json({ message: error.message });
      }
      res.status(400).json({ message: 'Error deleting comment' });
    }
  },

  // GET moderated comments
  async getModeratedComments(req, res) {
    try {
      if (!req.user.isModerator) {
        throw new AuthenticationError('Must be a moderator to view moderated comments');
      }

      const comments = await Comment.find({ moderated: true })
        .populate('author', 'username')
        .populate('moderatedBy', 'username')
        .sort('-moderatedAt');

      const sanitizedComments = comments.map(comment => ({
        _id: comment._id,
        content: comment.content,
        pageId: comment.pageId,
        author: {
          username: comment.author.username
        },
        createdAt: comment.createdAt,
        updatedAt: comment.updatedAt,
        moderated: comment.moderated,
        moderatedBy: comment.moderatedBy ? {
          username: comment.moderatedBy.username
        } : null,
        moderatedAt: comment.moderatedAt
      }));

      res.json(sanitizedComments);
    } catch (error) {
      console.error('Error fetching moderated comments:', error);
      if (error instanceof AuthenticationError) {
        return res.status(401).json({ message: error.message });
      }
      res.status(500).json({ message: 'Error fetching moderated comments' });
    }
  }
};

module.exports = commentController;