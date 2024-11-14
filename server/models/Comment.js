const { Schema, model } = require('mongoose');

const commentSchema = new Schema(
  {
    content: {
      type: String,
      required: true,
      trim: true,
      maxLength: 1000
    },
    pageId: {
      type: String,
      required: true
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    // Fields for handling replies
    parentId: {
      type: Schema.Types.ObjectId,
      ref: 'Comment',
      default: null
    },
    replies: [{
      type: Schema.Types.ObjectId,
      ref: 'Comment'
    }],
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    },
    moderated: {
      type: Boolean,
      default: false
    },
    moderatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    moderatedAt: {
      type: Date
    }
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function(doc, ret) {
        delete ret.__v;
        return ret;
      }
    }
  }
);

// Add index for better query performance
commentSchema.index({ pageId: 1, parentId: 1 });
commentSchema.index({ parentId: 1, createdAt: 1 });

const Comment = model('Comment', commentSchema);

module.exports = Comment;