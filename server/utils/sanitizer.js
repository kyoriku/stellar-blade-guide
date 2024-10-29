const { body, validationResult } = require('express-validator');
const createDOMPurify = require('dompurify');
const { JSDOM } = require('jsdom');

const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

const sanitizeComment = [
  // Sanitize and validate content
  body('content')
    .trim()
    .notEmpty().withMessage('Comment content cannot be empty')
    .isLength({ max: 1000 }).withMessage('Comment must be less than 1000 characters')
    .customSanitizer(value => DOMPurify.sanitize(value))
    .custom(value => {
      if (value.length < 1) {
        throw new Error('Comment content cannot be empty after sanitization');
      }
      return true;
    }),

  // Sanitize and validate pageId
  body('pageId')
    .trim()
    .notEmpty().withMessage('Page ID is required')
    .isString().withMessage('Page ID must be a string')
    .escape(),

  // Validation result middleware
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];

module.exports = {
  sanitizeComment
};