const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');

// Set test environment so rate limiter doesn't throttle automated tests
process.env.NODE_ENV = 'test';
const app = require('../src/app');

describe('FormGuard - Route & Server Validation Suite', () => {

  describe('GET /health', () => {
    test('returns 200 OK with status and uptime', async () => {
      const res = await request(app)
        .get('/health')
        .expect(200);

      assert.equal(res.headers['content-type'].includes('application/json'), true);
      assert.equal(res.body.status, 'ok');
      assert.equal(typeof res.body.uptime, 'number');
      assert.ok(res.body.timestamp);
    });
  });

  describe('GET /', () => {
    test('renders registration form with novalidate and expected fields', async () => {
      const res = await request(app)
        .get('/')
        .expect('Content-Type', /html/)
        .expect(200);

      assert.ok(res.text.includes('FormGuard'));
      assert.ok(res.text.includes('novalidate'));
      assert.ok(res.text.includes('name="fullName"'));
      assert.ok(res.text.includes('name="email"'));
      assert.ok(res.text.includes('name="age"'));
      assert.ok(res.text.includes('name="password"'));
      assert.ok(res.text.includes('name="confirmPassword"'));
      assert.ok(res.text.includes('name="terms"'));
    });
  });

  describe('POST /register - Validation Cases', () => {
    test('successful submission with valid inputs renders 200 and safe summary', async () => {
      const validPayload = {
        fullName: '  Alice Johnson  ',
        email: 'alice@example.com',
        age: '29',
        password: 'SecurePassword123',
        confirmPassword: 'SecurePassword123',
        terms: 'on'
      };

      const res = await request(app)
        .post('/register')
        .type('form')
        .send(validPayload)
        .expect(200);

      // Confirm success message
      assert.ok(res.text.includes('Registration Succeeded!'));
      // Confirm safe fields are shown
      assert.ok(res.text.includes('Alice Johnson'));
      assert.ok(res.text.includes('alice@example.com'));
      assert.ok(res.text.includes('29'));
      // CRITICAL: Ensure password is NEVER echoed back
      assert.ok(!res.text.includes('SecurePassword123'));
    });

    test('rejects missing fields with 422 and renders field-specific error messages', async () => {
      const res = await request(app)
        .post('/register')
        .type('form')
        .send({})
        .expect(422);

      assert.ok(res.text.includes('Full name is required.'));
      assert.ok(res.text.includes('Email address is required.'));
      assert.ok(res.text.includes('Age is required.'));
      assert.ok(res.text.includes('Password is required.'));
      assert.ok(res.text.includes('Please confirm your password.'));
      assert.ok(res.text.includes('You must accept the Terms of Service and Privacy Policy to continue.'));
    });

    test('rejects full name that is too short (< 2 chars)', async () => {
      const res = await request(app)
        .post('/register')
        .type('form')
        .send({
          fullName: 'A',
          email: 'valid@example.com',
          age: '25',
          password: 'Password1',
          confirmPassword: 'Password1',
          terms: 'on'
        })
        .expect(422);

      assert.ok(res.text.includes('Full name must be between 2 and 60 characters.'));
    });

    test('rejects invalid email format', async () => {
      const res = await request(app)
        .post('/register')
        .type('form')
        .send({
          fullName: 'Bob Smith',
          email: 'not-an-email',
          age: '30',
          password: 'Password1',
          confirmPassword: 'Password1',
          terms: 'on'
        })
        .expect(422);

      assert.ok(res.text.includes('Please provide a valid email address.'));
      // Safe values should be preserved
      assert.ok(res.text.includes('Bob Smith'));
      assert.ok(res.text.includes('not-an-email'));
    });

    test('rejects age below 18', async () => {
      const res = await request(app)
        .post('/register')
        .type('form')
        .send({
          fullName: 'Young Person',
          email: 'young@example.com',
          age: '17',
          password: 'Password1',
          confirmPassword: 'Password1',
          terms: 'on'
        })
        .expect(422);

      assert.ok(res.text.includes('Age must be a whole number between 18 and 120.'));
    });

    test('rejects age above 120', async () => {
      const res = await request(app)
        .post('/register')
        .type('form')
        .send({
          fullName: 'Old Person',
          email: 'old@example.com',
          age: '121',
          password: 'Password1',
          confirmPassword: 'Password1',
          terms: 'on'
        })
        .expect(422);

      assert.ok(res.text.includes('Age must be a whole number between 18 and 120.'));
    });

    test('rejects non-integer age', async () => {
      const res = await request(app)
        .post('/register')
        .type('form')
        .send({
          fullName: 'Test Person',
          email: 'test@example.com',
          age: '25.5',
          password: 'Password1',
          confirmPassword: 'Password1',
          terms: 'on'
        })
        .expect(422);

      assert.ok(res.text.includes('Age must be a whole number between 18 and 120.'));
    });

    test('rejects weak password (less than 8 characters)', async () => {
      const res = await request(app)
        .post('/register')
        .type('form')
        .send({
          fullName: 'Test Person',
          email: 'test@example.com',
          age: '25',
          password: 'Pass1',
          confirmPassword: 'Pass1',
          terms: 'on'
        })
        .expect(422);

      assert.ok(res.text.includes('Password must be at least 8 characters long.'));
      // Password must NEVER be echoed into response
      assert.ok(!res.text.includes('value="Pass1"'));
    });

    test('rejects password without numbers (letters only)', async () => {
      const res = await request(app)
        .post('/register')
        .type('form')
        .send({
          fullName: 'Test Person',
          email: 'test@example.com',
          age: '25',
          password: 'OnlyLettersPassword',
          confirmPassword: 'OnlyLettersPassword',
          terms: 'on'
        })
        .expect(422);

      assert.ok(res.text.includes('Password must contain at least one letter and one number.'));
      assert.ok(!res.text.includes('OnlyLettersPassword'));
    });

    test('rejects password without letters (numbers only)', async () => {
      const res = await request(app)
        .post('/register')
        .type('form')
        .send({
          fullName: 'Test Person',
          email: 'test@example.com',
          age: '25',
          password: '1234567890',
          confirmPassword: '1234567890',
          terms: 'on'
        })
        .expect(422);

      assert.ok(res.text.includes('Password must contain at least one letter and one number.'));
      assert.ok(!res.text.includes('1234567890'));
    });

    test('rejects password mismatch between password and confirmPassword', async () => {
      const res = await request(app)
        .post('/register')
        .type('form')
        .send({
          fullName: 'Test Person',
          email: 'test@example.com',
          age: '25',
          password: 'ValidPassword1',
          confirmPassword: 'DifferentPassword2',
          terms: 'on'
        })
        .expect(422);

      assert.ok(res.text.includes('Passwords do not match.'));
      // Neither password value must be echoed
      assert.ok(!res.text.includes('ValidPassword1'));
      assert.ok(!res.text.includes('DifferentPassword2'));
    });

    test('rejects unaccepted terms', async () => {
      const res = await request(app)
        .post('/register')
        .type('form')
        .send({
          fullName: 'Test Person',
          email: 'test@example.com',
          age: '25',
          password: 'ValidPassword1',
          confirmPassword: 'ValidPassword1'
          // terms omitted
        })
        .expect(422);

      assert.ok(res.text.includes('You must accept the Terms of Service and Privacy Policy to continue.'));
    });
  });

  describe('404 & Error Handling', () => {
    test('returns 404 custom page for undefined routes', async () => {
      const res = await request(app)
        .get('/some-nonexistent-page')
        .expect(404);

      assert.ok(res.text.includes('404'));
      assert.ok(res.text.includes('Page Not Found'));
    });
  });
});
