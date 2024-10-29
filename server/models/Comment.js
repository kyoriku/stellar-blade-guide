// const { Schema, model } = require('mongoose');

// const CommentSchema = new Schema ({
//   pageId: { type: String, required: true },
//   content: { type: String, required: true },
//   author: {
//     name: { type: String, required: true },
//     avatar: { type: String }
//   },
//   createdAt: { type: Date, default: Date.now }
// });

// const Comment = model('Comment', CommentSchema);

// module.exports = Comment;

const { Schema, model } = require('mongoose');

const commentSchema = new Schema(
  {
    content: {
      type: String,
      required: true,
      trim: true
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
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    toJSON: {
      virtuals: true,
      // Include virtual properties when document is converted to JSON
      transform: function(doc, ret) {
        delete ret.__v;
        return ret;
      }
    }
  }
);

// Virtual for getting author details
commentSchema.virtual('authorDetails', {
  ref: 'User',
  localField: 'author',
  foreignField: '_id',
  justOne: true
});

const Comment = model('Comment', commentSchema);

module.exports = Comment;