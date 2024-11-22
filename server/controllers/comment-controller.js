const { Comment } = require('../models');
const { AuthenticationError } = require('../utils/errors');

const commentController = {
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

  // GET comments for a specific page
  async getPageComments(req, res) {
    try {
      const comments = await Comment.find({ 
        pageId: req.params.pageId,
        parentId: null  // Only get top-level comments
      })
      .populate('author', 'username isModerator isAdmin')
      .populate({
        path: 'replies',
        options: { sort: { createdAt: 1 } }, // Sort replies chronologically
        populate: [{
          path: 'author',
          select: 'username isModerator isAdmin'
        }]
      })
      .sort('-createdAt');
  
      // Sanitize and structure the response
      const sanitizedComments = comments.map(comment => {
        const baseComment = {
          _id: comment._id,
          content: comment.content,
          pageId: comment.pageId,
          author: {
            username: comment.author.username,
            isModerator: comment.author.isModerator,
            isAdmin: comment.author.isAdmin
          },
          createdAt: comment.createdAt,
          updatedAt: comment.updatedAt,
          moderated: comment.moderated,
          replies: []
        };
  
        // Only add replies if they exist
        if (comment.replies && Array.isArray(comment.replies)) {
          baseComment.replies = comment.replies.map(reply => ({
            _id: reply._id,
            content: reply.content,
            pageId: reply.pageId,
            parentId: reply.parentId,
            author: {
              username: reply.author.username,
              isModerator: reply.author.isModerator,
              isAdmin: reply.author.isAdmin
            },
            createdAt: reply.createdAt,
            updatedAt: reply.updatedAt,
            moderated: reply.moderated
          }));
        }
  
        return baseComment;
      });
  
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

  // POST a new comment
  async createComment(req, res) {
    try {
      if (!req.user) {
        throw new AuthenticationError('Must be logged in to comment');
      }
  
      const { pageId, content, parentId } = req.body;
  
      // Validate required fields
      if (!pageId) {
        return res.status(400).json({ 
          errors: [{ 
            type: 'field',
            msg: 'Page ID is required',
            path: 'pageId'
          }]
        });
      }
  
      if (!content) {
        return res.status(400).json({ 
          errors: [{ 
            type: 'field',
            msg: 'Content is required',
            path: 'content'
          }]
        });
      }
  
      // Create the comment
      const newComment = await Comment.create({
        pageId,
        content,
        author: req.user._id,
        parentId: parentId || null
      });
  
      // If this is a reply, update the parent comment
      if (parentId) {
        await Comment.findByIdAndUpdate(parentId, {
          $push: { replies: newComment._id }
        });
      }
  
      // Populate author details
      const populatedComment = await Comment.findById(newComment._id)
        .populate('author', 'username isModerator isAdmin');
  
      // Sanitize response
      const sanitizedComment = {
        _id: populatedComment._id,
        content: populatedComment.content,
        pageId: populatedComment.pageId,
        parentId: populatedComment.parentId,
        author: {
          username: populatedComment.author.username,
          isModerator: populatedComment.author.isModerator,
          isAdmin: populatedComment.author.isAdmin
        },
        createdAt: populatedComment.createdAt,
        updatedAt: populatedComment.updatedAt,
        moderated: populatedComment.moderated,
        replies: []
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
        .populate('author', 'username isModerator isAdmin')
        .populate('moderatedBy', 'username');

      const response = {
        _id: updatedComment._id,
        content: updatedComment.content,
        pageId: updatedComment.pageId,
        author: {
          username: updatedComment.author.username,
          isModerator: updatedComment.author.isModerator,
          isAdmin: updatedComment.author.isAdmin
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
  },

    // Get replies for a specific comment
    async getCommentReplies(req, res) {
      try {
        const { commentId } = req.params;
        const replies = await Comment.find({ 
          parentId: commentId 
        })
        .populate('author', 'username isModerator isAdmin')
        .sort('createdAt');
    
        const sanitizedReplies = replies.map(reply => ({
          _id: reply._id,
          content: reply.content,
          pageId: reply.pageId,
          parentId: reply.parentId,
          author: {
            username: reply.author.username,
            isModerator: reply.author.isModerator,
            isAdmin: reply.author.isAdmin
          },
          createdAt: reply.createdAt,
          updatedAt: reply.updatedAt,
          moderated: reply.moderated
        }));
    
        res.json(sanitizedReplies);
      } catch (error) {
        console.error('Error fetching replies:', error);
        res.status(500).json({ message: 'Error fetching replies' });
      }
    },

  // Create a reply to a comment
  async createReply(req, res) {
    try {
      if (!req.user) {
        throw new AuthenticationError('Must be logged in to reply');
      }

      const { commentId } = req.params;
      const { content } = req.body;

      // Find parent comment
      const parentComment = await Comment.findById(commentId);
      if (!parentComment) {
        return res.status(404).json({ message: 'Parent comment not found' });
      }

      // Create reply
      const reply = await Comment.create({
        content,
        pageId: parentComment.pageId,
        author: req.user._id,
        parentId: commentId
      });

      // Add reply to parent comment's replies array
      parentComment.replies.push(reply._id);
      await parentComment.save();

      // Populate reply author details
      const populatedReply = await Comment.findById(reply._id)
        .populate('author', 'username isModerator isAdmin');

      const sanitizedReply = {
        _id: populatedReply._id,
        content: populatedReply.content,
        pageId: populatedReply.pageId,
        parentId: populatedReply.parentId,
        author: {
          username: populatedReply.author.username,
          isModerator: populatedReply.author.isModerator,
          isAdmin: populatedReply.author.isAdmin
        },
        createdAt: populatedReply.createdAt,
        updatedAt: populatedReply.updatedAt
      };

      res.status(201).json(sanitizedReply);
    } catch (error) {
      console.error('Error creating reply:', error);
      if (error instanceof AuthenticationError) {
        return res.status(401).json({ message: error.message });
      }
      res.status(400).json({ message: 'Error posting reply' });
    }
  },
};

module.exports = commentController;