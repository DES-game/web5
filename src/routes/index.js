const express = require('express');
const { validationResult } = require('express-validator');
const { registrationValidationRules } = require('../validators/registrationValidator');

const router = express.Router();

/**
 * GET /
 * Render the registration form.
 */
router.get('/', (req, res) => {
  res.render('register', {
    title: 'FormGuard — Server-Side Validation Demo',
    errors: {},
    values: {
      fullName: '',
      email: '',
      age: '',
      terms: false
    },
    successData: null
  });
});

/**
 * POST /register
 * Validate and sanitize submitted input on the server.
 * Never logs passwords or echoes them back to the user.
 * Does not store submitted form data.
 */
router.post('/register', registrationValidationRules, (req, res) => {
  const result = validationResult(req);

  // Preserve only non-sensitive form inputs for user convenience
  const safeValues = {
    fullName: req.body.fullName ? String(req.body.fullName) : '',
    email: req.body.email ? String(req.body.email) : '',
    age: req.body.age ? String(req.body.age) : '',
    terms: req.body.terms === 'on' || req.body.terms === 'true' || req.body.terms === true
  };

  if (!result.isEmpty()) {
    // Map field names to their specific error message (first error per field)
    const errorMap = {};
    for (const err of result.array()) {
      if (!errorMap[err.path]) {
        errorMap[err.path] = err.msg;
      }
    }

    return res.status(422).render('register', {
      title: 'FormGuard — Server-Side Validation Demo',
      errors: errorMap,
      values: safeValues,
      successData: null
    });
  }

  // Valid submission: Render success confirmation with sanitized, safe fields only
  return res.status(200).render('register', {
    title: 'FormGuard — Registration Succeeded',
    errors: {},
    values: {
      fullName: '',
      email: '',
      age: '',
      terms: false
    },
    successData: {
      fullName: safeValues.fullName,
      email: safeValues.email,
      age: safeValues.age,
      submittedAt: new Date().toISOString()
    }
  });
});

module.exports = router;
