# Auth Module Backend (Enterprise-Grade)

A **production-ready authentication microservice** built with **Node.js, Express, and MongoDB**, following **enterprise architecture**, **secure auth practices**, and **clean code standards**.

Ideal for:
- Freelance project delivery (plug-and-play auth microservice)
- SaaS / startup backend foundations
- Personal GitHub portfolio
- Any frontend (Web / Mobile) needing authentication APIs

---

## Features

### Authentication (Local)
- Signup with **name + email + password**
- Login with email + password
- JWT-based session token
- Protected `/me` endpoint

### Password Management
- Forgot password (generic response — prevents user enumeration)
- Reset password using **hashed token**
- Token expiry & reuse protection

### Social Authentication
- Google OAuth login
- Facebook OAuth login
- Provider linking to existing accounts (no duplicate users)

### Security
- Password hashing (bcrypt)
- JWT signing + verification
- Auth rate limiting
- Helmet + CORS enabled
- Reset token hashing (never store raw tokens)

### Testing
- Integration tests (Mocha + Chai + Supertest)
- MongoDB Memory Server (isolated test DB)
- Google/Facebook APIs fully mocked (Sinon + Nock)

---

## Tech Stack

- Node.js
- Express
- MongoDB + Mongoose
- JWT (jsonwebtoken)
- bcryptjs
- Mocha / Chai / Supertest
- MongoDB Memory Server
- Sinon & Nock
- Helmet / CORS / express-rate-limit
- Pino logger

---

## Project Structure

```txt
src/
├── app.js
├── index.js
├── config/
│   ├── db.js
│   ├── env.js
│   ├── logger.js
│   └── brevoMailer.js
├── constants/
│   └── errorCodes.js
├── controllers/
│   ├── auth.controller.js
│   └── socialAuth.controller.js
├── middleware/
│   ├── auth.middleware.js
│   ├── async.middleware.js
│   ├── error.middleware.js
│   └── rateLimit.middleware.js
├── models/
│   ├── user.model.js
│   └── passwordResetToken.model.js
├── repositories/
│   ├── user.repo.js
│   └── resetToken.repo.js
├── routes/
│   └── auth.routes.js
├── services/
│   ├── auth.service.js
│   ├── socialAuth.service.js
│   └── mailer.service.js
└── utils/
    ├── appError.js
    ├── jwt.util.js
    ├── password.util.js
    └── crypto.util.js

test/
├── 00.bootstrap.test.js
├── auth.signup.test.js
├── auth.login.test.js
├── auth.me.test.js
├── auth.forgot-reset.test.js
├── auth.social.test.js
└── helpers/
    ├── db.js
    └── factories.js
```
---

## API Endpoints

All endpoints are prefixed with:

```txt
/api/auth
```
---

### Authentication (Local)

| Method | Endpoint | Description | Auth Required |
|------|--------|------------|--------------|
| POST | `/signup` | Create a new user account | ❌ |
| POST | `/login` | Login with email & password | ❌ |
| GET | `/me` | Get current authenticated user | ✅ |

---

### Password Management

| Method | Endpoint | Description | Auth Required |
|------|--------|------------|--------------|
| POST | `/forgot-password` | Request password reset email | ❌ |
| POST | `/reset-password` | Reset password using token | ❌ |

---

### Social Authentication

| Method | Endpoint | Description | Auth Required |
|------|--------|------------|--------------|
| POST | `/social/google` | Login / Signup using Google OAuth | ❌ |
| POST | `/social/facebook` | Login / Signup using Facebook OAuth | ❌ |

---

### Health Check

| Method | Endpoint | Description |
|------|--------|------------|
| GET | `/health` | Service health check |

---

## API Response Format

This authentication service supports **two response formats** to balance  
**enterprise API standards** and **existing automated test compatibility**.

---

### Default Response Format (Test-Compatible)

This format is enabled by default and is required for automated test stability.

#### Success Response
```json
{
  "user": {
    "id": "user_id",
    "name": "User Name",
    "email": "user@example.com"
  },
  "token": "jwt_access_token"
}
```

#### Error Response
```json
{
  "message": "Human readable error message",
  "code": "ERROR_CODE"
}
```

---
## Enterprise Response Envelope (Optional, Disabled by Default)

Enable via:

- Environment variable: `RESPONSE_ENVELOPE=1`
- OR request header: `x-response-envelope: 1`
- Automatically disabled when `NODE_ENV=test`

### Success Response
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_id",
      "name": "User Name",
      "email": "user@example.com"
    },
    "token": "jwt_access_token"
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message"
  }
}
```

---

## Environment Variables

Create a `.env` file using the provided `.env.example`.

```env
# Application
NODE_ENV=development
PORT=4000

# Database
MONGODB_URI=your_mongodb_connection_string

# JWT
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=1h

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id

# Facebook OAuth
FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret

# Email (Optional – Password Reset)
BREVO_API_KEY=optional
BREVO_SENDER_EMAIL=no-reply@example.com

# API Response Envelope (Optional)
RESPONSE_ENVELOPE=0
```

---

## Running Tests

This project includes a **full integration test suite** covering all critical authentication flows.

### Run all tests
```bash
npm test
```
---

## Running Locally

Follow these steps to run the auth service on your local machine.

### 1. Install dependencies
```bash
npm install
```

### 2. Create environment file
```bash
cp .env.example .env
```
Update the values as needed (MongoDB URI, JWT secret, OAuth keys).

### 3. Start the development server
```bash
npm run dev
```
The service will start on:
http://localhost:4000

### 4. Health check
Verify the service is running:

```http
GET /health
```

Expected response:
```json
{
  "status": "ok",
  "uptime": 123.45
}
```

---

## Deployment Checklist

This authentication service is production-ready and can be deployed without code changes on common platforms.

---

### Render

**Steps**
- Create a new Web Service
- Connect your GitHub repository
- Select branch: `main`

**Configuration**
```txt
Build Command: npm install
Start Command: npm start
Health Check Path: /health
```

**Environment Variables**
- Add all variables from `.env.example`
- Use a production MongoDB URI
- Set `NODE_ENV=production`

### Railway

**Steps**
- Create a new project
- Connect GitHub repository
- Attach MongoDB plugin OR provide external MongoDB URI

**Configuration**
```txt
PORT=4000
NODE_ENV=production
```
---

## Docker

This service is Docker-ready and can be containerized easily.

```bash
docker build -t auth-module-backend .
docker run -p 4000:4000 --env-file .env auth-module-backend
```

---

## Security Design Notes

This authentication service is designed with a **security-first mindset**, following industry best practices and OWASP guidelines.

---

### Password Security
- Passwords are **never stored in plain text**
- Hashed using **bcrypt** with configurable salt rounds
- Password strength validated at service level

---

### Authentication Tokens
- JWT tokens are:
  - Signed using a secret key
  - Time-bound (expiry enforced)
- Tokens are validated on every protected request
- `/me` endpoint is fully protected via auth middleware

---

### Password Reset Security
- Reset tokens are:
  - Cryptographically random
  - **Hashed before storing in database**
- Tokens have:
  - Expiry time
  - Single-use enforcement
- Token reuse is strictly blocked

---

### Enumeration Protection
- Forgot-password flow always returns a **generic response**
- Does not reveal whether an email exists in the system

---

### API Protection
- Rate limiting applied on:
  - Signup
  - Login
  - Forgot password
- Helmet enabled for secure HTTP headers
- CORS configured explicitly

---

### Error Handling
- Centralized error middleware
- Internal errors never leak stack traces
- Stable error codes returned for client handling

---

✔ Secure-by-default configuration  
✔ Safe for public-facing production APIs  
✔ Auditable and testable security flows

---

## API Docs (Swagger)

Swagger UI is available at:

- `GET /api/docs`

It is automatically **disabled in test mode** (`NODE_ENV=test`) to keep automated tests stable.

### Enable "Try it out" correctly
Set your public base URL (recommended for production deployments):

```bash
APP_BASE_URL=https://your-domain.com
```

### Local
```bash
npm run dev
# open: http://localhost:4000/api/docs
```

**1. Install deps:**
```bash
npm i swagger-jsdoc swagger-ui-express
```

**2. Create file:**
src/config/swagger.js

**3. Ensure src/config/env.js exports `PORT` and `NODE_ENV`**
**4. Run**
```bash
npm run dev
```