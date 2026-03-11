const { body, validationResult, sanitizeBody } = require('express-validator');

exports.signupValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }).trim().escape(),
  body('fullName').notEmpty().trim().escape(),
  body('contact').notEmpty().trim().escape(),
  // add other fields as needed
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ success: false, errors: errors.array() });
    }
    next();
  }
];

exports.loginValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty().trim().escape(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ success: false, errors: errors.array() });
    }
    next();
  }
];
