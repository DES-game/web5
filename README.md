# FormGuard 🛡️ — Server-Side Form Validation Demo

FormGuard is a responsive, production-ready Express.js web application engineered to demonstrate pure, defensive **server-side form validation and sanitization** using `express-validator` and EJS templates.

Browser-level validation is intentionally bypassed with `novalidate` to demonstrate that server validation works unconditionally, even when client scripts or browser checks are manipulated or absent.

---

## Key Features

- **Strict Server-Side Validation**: Every input is validated and sanitized on the server with `express-validator`.
- **Zero-Trust Security**:
  - Passwords are **never logged**, **never echoed** back into HTML markup, and never retained.
  - No database storage: submitted data is processed strictly in-memory for the demo response.
  - Protected with **Helmet** for HTTP security headers and Content Security Policy.
  - Modest **rate limiting** (`express-rate-limit`) on the registration route against abuse.
- **Accessible & Responsive UI**:
  - Dark ink / navy palette (`#0b0f19`) with warm surfaces, restrained mint (`#10b981`) and amber accents.
  - `aria-live="polite"` region for immediate screen reader feedback.
  - `aria-invalid` and `aria-describedby` linking input fields directly to descriptive error messages.
  - Fluid mobile-friendly responsive layout.
- **Preserved Non-Sensitive Input**: Safe inputs (name, email, age) are preserved on HTTP 422 re-renders to minimize friction, while passwords are automatically cleared.
- **Clean Architecture**: Separation of concerns between routing (`src/routes`), validation rules (`src/validators`), application configuration (`src/app.js`), and server entrypoint (`src/server.js`).
- **Comprehensive Test Suite**: Automated tests written with Node.js’s built-in test runner (`node:test`) and `supertest`.

---

## Form Fields & Server-Side Validation Rules

| Field | Server-Side Rules | Behavior on Invalid Submission |
| :--- | :--- | :--- |
| **Full Name** | Required, trimmed whitespace, 2–60 characters. | HTTP 422, field error message, value preserved. |
| **Email** | Required, valid email format (`isEmail()`), normalized. | HTTP 422, field error message, value preserved. |
| **Age** | Required integer, 18 through 120 (`isInt({ min: 18, max: 120 })`). | HTTP 422, field error message, value preserved. |
| **Password** | Required, min 8 characters, at least 1 letter and 1 number (`/^(?=.*[A-Za-z])(?=.*\d)/`). | HTTP 422, field error message, **never preserved or echoed**. |
| **Confirm Password** | Required, must match `password` identically. | HTTP 422, field error message, **never preserved or echoed**. |
| **Terms of Service** | Must be checked (`'on'` or `'true'`). | HTTP 422, error message. |

---

## Routes

| Method | Route | Description |
| :--- | :--- | :--- |
| `GET` | `/` | Renders the registration form with `novalidate`. |
| `POST` | `/register` | Validates and sanitizes inputs. Returns HTTP 422 with field-specific errors if invalid, or HTTP 200 with sanitized non-sensitive summary on success. |
| `GET` | `/health` | Returns a JSON health-check response with server uptime and ISO timestamp. |
| `*` | Any undefined route | Custom 404 handler returning styled `404.ejs` template. |

---

## Prerequisites

- [Node.js](https://nodejs.org/) v18.0.0 or later (v20+ / v22+ / v24+ recommended).
- [npm](https://www.npmjs.com/) v9.0.0 or later.

---

## Installation & Local Setup

1. **Clone or navigate to the project directory**:
   ```bash
   cd "c:\Users\Acer\Documents\Web tech\web5"
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables (optional)**:
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   *Default port is `3000`.*

4. **Start the application**:
   ```bash
   npm start
   ```
   The application will bind to `0.0.0.0:3000`. Open your browser at [http://localhost:3000](http://localhost:3000).

---

## Running Automated Tests

Run the test suite using Node's native test runner and Supertest:

```bash
npm test
```

### Test Coverage Highlights
- `GET /health`: asserts 200 JSON with status and uptime.
- `GET /`: asserts form rendering and `novalidate` attribute.
- `POST /register (Valid)`: asserts 200 OK, success confirmation banner, safe summary, and confirms password is not echoed.
- `POST /register (Missing Fields)`: asserts 422 Unprocessable Entity and all individual required error messages.
- `POST /register (Name < 2 chars)`: asserts 422 and name length error.
- `POST /register (Invalid Email)`: asserts 422 and invalid email format error.
- `POST /register (Age < 18 or > 120 or decimal)`: asserts 422 and age bounds error.
- `POST /register (Weak Password)`: asserts 422 and password length/character requirements.
- `POST /register (Password Mismatch)`: asserts 422 and mismatch error.
- `POST /register (Unchecked Terms)`: asserts 422 and terms acceptance error.
- `GET /non-existent`: asserts custom 404 error page.

---

## Deployment Guide: Render Web Service

FormGuard is configured to deploy directly to [Render](https://render.com) as a Node.js Web Service.

### Deployment Configuration
- **Environment**: `Node`
- **Build Command**:
  ```bash
  npm install
  ```
- **Start Command**:
  ```bash
  npm start
  ```
- **Environment Variables**:
  - `NODE_ENV`: `production`
  - `PORT`: *Set automatically by Render (FormGuard defaults to `process.env.PORT || 3000` and binds to `0.0.0.0`)*.

### Step-by-Step Render Deployment
1. **Initialize Git Repository** (if not already done):
   ```bash
   git init
   git add .
   git commit -m "feat: initial FormGuard release"
   ```
2. **Push to GitHub / GitLab / Bitbucket**:
   ```bash
   git remote add origin https://github.com/<your-username>/<your-repo-name>.git
   git branch -M main
   git push -u origin main
   ```
3. **Create a New Web Service on Render**:
   - Log in to your dashboard at [dashboard.render.com](https://dashboard.render.com).
   - Click **New +** and select **Web Service**.
   - Connect your Git repository.
   - Set the following fields:
     - **Name**: `formguard` (or your choice)
     - **Region**: Choose closest to your audience (e.g., Oregon, Frankfurt, Singapore)
     - **Branch**: `main`
     - **Runtime**: `Node`
     - **Build Command**: `npm install`
     - **Start Command**: `npm start`
     - **Instance Type**: `Free`
   - In **Advanced Settings / Environment Variables**, add:
     - `NODE_ENV` = `production`
   - Click **Create Web Service**.
4. **Verification**:
   - Render will build and deploy the app.
   - Navigate to `https://<your-service-name>.onrender.com` to verify the registration form.
   - Check `https://<your-service-name>.onrender.com/health` to confirm the health endpoint.
