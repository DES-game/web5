const { body } = require('express-validator');

/**
 * Server-side validation and sanitization rules for user registration.
 *
 * Rules:
 * - Full name: required, trimmed, 2-60 characters.
 * - Email: required, valid email format, normalized.
 * - Age: required integer from 18 through 120.
 * - Password: required, at least 8 characters, containing at least one letter and one number.
 * - Confirm password: required, must match password.
 * - Terms: user must accept the terms.
 */
const registrationValidationRules = [
  body('fullName')
    .trim()
    .notEmpty()
    .withMessage('Full name is required.')
    .bail()
    .isLength({ min: 2, max: 60 })
    .withMessage('Full name must be between 2 and 60 characters.'),

  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email address is required.')
    .bail()
    .isEmail()
    .withMessage('Please provide a valid email address.')
    .normalizeEmail(),

  body('age')
    .trim()
    .notEmpty()
    .withMessage('Age is required.')
    .bail()
    .isInt({ min: 18, max: 120 })
    .withMessage('Age must be a whole number between 18 and 120.'),

  body('password')
    .notEmpty()
    .withMessage('Password is required.')
    .bail()
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long.')
    .bail()
    .matches(/^(?=.*[A-Za-z])(?=.*\d)/)
    .withMessage('Password must contain at least one letter and one number.'),

  body('confirmPassword')
    .notEmpty()
    .withMessage('Please confirm your password.')
    .bail()
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Passwords do not match.');
      }
      return true;
    }),

  body('terms')
    .custom((value) => {
      if (value !== 'on' && value !== 'true' && value !== true) {
        throw new Error('You must accept the Terms of Service and Privacy Policy to continue.');
      }
      return true;
    })
];

module.exports = {
  registrationValidationRules
};
