# Auth Module Backend 

A **production-ready authentication microservice** built with **Node.js, Express, MongoDB, and Redis**, following **enterprise architecture**, **secure auth practices**, and **clean code standards**.

This service is designed to be **plug-and-play for any frontend** (Web / Mobile) and can be reused across multiple applications.

Ideal for:

- Freelance project delivery (plug-and-play auth microservice)
- SaaS / startup backend foundations
- Personal GitHub portfolio
- Any frontend (Web / Mobile) needing authentication APIs

---

## Why This Project Stands Out

Unlike basic auth systems, this service includes:

- JWT-based authentication with real logout (token revocation)
- Refresh token system (industry standard session handling)
- Redis-backed token blacklist
- Secure password reset with hashed tokens
- Fully test-covered authentication flows
- Enterprise-grade structure (controllers → services → repositories)

---

## Features

### Authentication (Local)
- Signup with **name + email + password**
- Login with **email + password**
- JWT-based access token
- Refresh token system (DB-backed)
- Protected `/me` endpoint (DB-validated user)

### Session Management
- Short-lived access tokens
- Long-lived refresh tokens (stored in DB)
- `/refresh-token` endpoint for silent session renewal

### Logout System (Advanced)
- Redis-backed token blacklist
- Access tokens invalidated after logout
- Refresh tokens deleted from DB
- TTL-based automatic cleanup

### Password Management
- Forgot password (generic response — prevents user enumeration)
- Secure reset token generation
- Token hashing before database storage
- One-time token usage
- Password reset email via **Brevo**

### Social Authentication
- Google OAuth login
- Facebook OAuth login
- Provider linking to existing accounts

### Security
- Password hashing (bcrypt)
- JWT signing and verification
- Redis-backed token revocation
- Rate limiting on auth endpoints
- Helmet security headers
- CORS protection
- Generic responses to prevent enumeration

### Testing
- Full integration test suite
- Mocha + Chai + Supertest
- MongoDB Memory Server
- External APIs mocked

---

## Tech Stack

| Layer | Technology |
|------|------------|
| Runtime | Node.js |
| Framework | Express |
| Database | MongoDB |
| Cache / Session | Redis |
| ODM | Mongoose |
| Auth | JWT |
| Password Hashing | bcrypt |
| API Documentation | Swagger |
| Email Service | Brevo Transactional Email |
| Testing | Mocha / Chai / Supertest |
| Logging | Pino |

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
|   ├── redis.js
|   ├── swagger.js
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
|   ├── User.js
|   ├── refreshToken.model.js
│   └── passwordResetToken.model.js
├── repositories/
│   ├── user.repo.js
|   ├── refreshToken.repo.js
│   └── resetToken.repo.js
├── routes/
│   └── auth.routes.js
├── services/
│   ├── auth.service.js
│   ├── socialAuth.service.js
|   ├── tokenBlacklist.service.js
│   └── mailer.service.js
└── utils/
    ├── appError.js
    ├── jwt.util.js
    ├── password.util.js
    ├── response.util.js
    └── crypto.util.js

test/
├── setup.js
├── 00.bootstrap.test.js
├── auth.signup.test.js
├── auth.login.test.js
├── auth.me.test.js
├── auth.forgot-reset.test.js
├── auth.social.test.js
└── helpers/
    ├── db.js
    ├── tokens.js
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
| POST | `/refresh-token` | Get new access token | ❌ |
| POST | `/logout` | Logout (invalidate tokens) | ✅ |
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

## Email Service (Brevo)

Password reset emails are delivered using Brevo Transactional Email API.

### Required Environment Variables
- `BREVO_API_KEY=your_api_key`
- `BREVO_SENDER_EMAIL=no-reply@example.com`
- `BREVO_SENDER_NAME=Auth Module`

### Reset Password Email Flow

1. User requests password reset
2. Backend generates reset token
3. Token is hashed and stored
4. Brevo sends reset email
5. User clicks reset link / button
6. Frontend loads reset page
7. Backend validates token and updates password

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

# REDIS
REDIS_ENABLED=boolean_value
REDIS_URL=your_redis_url
REDIS_PREFIX=your_redis_prefix
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
### Additionally
- Logout invalidation prevents toke reuse
- Refresh tokens reduce attack surface
- Redis ensures fast token revocation
- Secure-by-default configuration  
- Safe for public-facing production APIs  
- Auditable and testable security flows

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