# Authentication API

## 🔐 Authentication Endpoints

CodeFode provides comprehensive authentication APIs supporting email/password, OAuth, and two-factor authentication.

## 📍 Base URL
```
Development: http://localhost:3000/api/auth
Production: https://your-domain.com/api/auth
```

## 🔑 Authentication Methods

### 1. Credential-based Authentication

#### Register User

**Endpoint:** `POST /api/register`

**Description:** Creates a new user account with email verification.

**Request Body:**
```json
{
  "name": "string (required, 2-50 chars)",
  "email": "string (required, valid email)",
  "password": "string (required, min 8 chars)",
  "confirmPassword": "string (required, must match password)"
}
```

**Validation Rules:**
- Name: 2-50 characters, alphanumeric and spaces only
- Email: Valid email format, unique in database
- Password: Minimum 8 characters, must contain uppercase, lowercase, number, and special character
- Confirm Password: Must exactly match password

**Success Response (201 Created):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "user": {
    "id": "string",
    "name": "string",
    "email": "string",
    "verified": false,
    "createdAt": "2024-01-01T00:00:00.000Z"
  },
  "verificationRequired": true
}
```

**Error Responses:**
```json
// 400 Bad Request - Validation Error
{
  "error": "Validation failed",
  "details": {
    "email": "Email already exists",
    "password": "Password must contain at least one uppercase letter"
  }
}

// 409 Conflict - User Exists
{
  "error": "User already exists",
  "message": "An account with this email already exists"
}
```

#### Login User

**Endpoint:** `POST /api/auth/signin`

**Description:** Authenticates user with email and password.

**Request Body:**
```json
{
  "email": "string (required)",
  "password": "string (required)",
  "remember": "boolean (optional, default: false)"
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "user": {
    "id": "string",
    "name": "string",
    "email": "string",
    "verified": true,
    "avatar": "string (optional)",
    "preferences": {
      "theme": "dark|light",
      "fontSize": 14,
      "language": "en"
    }
  },
  "session": {
    "token": "jwt_token_string",
    "expiresAt": "2024-01-01T00:00:00.000Z"
  },
  "twoFactorRequired": false
}
```

**Two-Factor Authentication Response (200 OK):**
```json
{
  "success": true,
  "twoFactorRequired": true,
  "tempToken": "temporary_token_for_2fa",
  "message": "Please enter your 2FA code"
}
```

**Error Responses:**
```json
// 401 Unauthorized - Invalid Credentials
{
  "error": "Invalid credentials",
  "message": "Email or password is incorrect"
}

// 423 Locked - Account Locked
{
  "error": "Account locked",
  "message": "Account temporarily locked due to too many failed attempts",
  "lockoutExpires": "2024-01-01T00:00:00.000Z"
}

// 403 Forbidden - Email Not Verified
{
  "error": "Email not verified",
  "message": "Please verify your email before logging in"
}
```

### 2. OAuth Authentication

#### Google OAuth

**Endpoint:** `GET /api/auth/signin/google`

**Description:** Initiates Google OAuth flow.

**Query Parameters:**
- `callbackUrl` (optional): URL to redirect after authentication

**Flow:**
1. Client redirects to `/api/auth/signin/google`
2. User authenticates with Google
3. Google redirects back to `/api/auth/callback/google`
4. Server processes OAuth response
5. User is redirected to dashboard or specified callback URL

**Success Response:** Redirect to dashboard with session cookie set

**Error Response:** Redirect to login page with error query parameter

#### OAuth Callback

**Endpoint:** `GET /api/auth/callback/google`

**Description:** Handles OAuth provider callback.

**Automatic Processing:**
- Validates OAuth state parameter
- Exchanges authorization code for access token
- Retrieves user profile from Google
- Creates or links user account
- Establishes authenticated session

## 🔐 Two-Factor Authentication

### Verify 2FA Code

**Endpoint:** `POST /api/auth/verify-2fa`

**Description:** Verifies two-factor authentication code.

**Request Body:**
```json
{
  "tempToken": "string (required)",
  "code": "string (required, 6 digits)",
  "type": "otp|totp (required)"
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "user": {
    "id": "string",
    "name": "string",
    "email": "string",
    "verified": true
  },
  "session": {
    "token": "jwt_token_string",
    "expiresAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error Responses:**
```json
// 400 Bad Request - Invalid Code
{
  "error": "Invalid code",
  "message": "The verification code is incorrect",
  "attemptsRemaining": 2
}

// 410 Gone - Code Expired
{
  "error": "Code expired",
  "message": "The verification code has expired. Please request a new one."
}
```

### Enable 2FA

**Endpoint:** `POST /api/auth/enable-2fa`

**Description:** Enables two-factor authentication for user account.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "type": "otp|totp",
  "phoneNumber": "string (required for OTP)",
  "backupCodes": "boolean (optional, default: true)"
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "qrCode": "data:image/png;base64,... (for TOTP)",
  "secret": "string (for TOTP manual entry)",
  "backupCodes": ["code1", "code2", "..."],
  "message": "2FA enabled successfully"
}
```

## 📧 Password Reset

### Request Password Reset

**Endpoint:** `POST /api/auth/reset-password`

**Description:** Initiates password reset process.

**Request Body:**
```json
{
  "email": "string (required)"
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Password reset email sent",
  "emailSent": true
}
```

**Note:** Always returns success to prevent email enumeration attacks.

### Verify Reset Token

**Endpoint:** `GET /api/auth/reset-password/verify`

**Description:** Verifies password reset token validity.

**Query Parameters:**
- `token`: Reset token from email
- `email`: User's email address

**Success Response (200 OK):**
```json
{
  "success": true,
  "valid": true,
  "email": "user@example.com"
}
```

**Error Response (400 Bad Request):**
```json
{
  "success": false,
  "valid": false,
  "error": "Invalid or expired token"
}
```

### Complete Password Reset

**Endpoint:** `POST /api/auth/reset-password/complete`

**Description:** Completes password reset with new password.

**Request Body:**
```json
{
  "token": "string (required)",
  "email": "string (required)",
  "password": "string (required)",
  "confirmPassword": "string (required)"
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Password reset successfully"
}
```

## 🔄 Session Management

### Get Current Session

**Endpoint:** `GET /api/auth/session`

**Description:** Retrieves current user session information.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Success Response (200 OK):**
```json
{
  "user": {
    "id": "string",
    "name": "string",
    "email": "string",
    "verified": true,
    "avatar": "string (optional)",
    "preferences": "object",
    "lastActive": "2024-01-01T00:00:00.000Z"
  },
  "session": {
    "expiresAt": "2024-01-01T00:00:00.000Z",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error Response (401 Unauthorized):**
```json
{
  "error": "Unauthorized",
  "message": "Invalid or expired session"
}
```

### Logout

**Endpoint:** `POST /api/auth/signout`

**Description:** Terminates user session.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

### Refresh Session

**Endpoint:** `POST /api/auth/refresh`

**Description:** Refreshes JWT token before expiration.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "token": "new_jwt_token",
  "expiresAt": "2024-01-01T00:00:00.000Z"
}
```

## 📧 Email Verification

### Send Verification Email

**Endpoint:** `POST /api/otp/send-otp`

**Description:** Sends email verification code.

**Request Body:**
```json
{
  "email": "string (required)",
  "type": "verification|password_reset"
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Verification email sent",
  "expiresIn": 300
}
```

### Verify Email

**Endpoint:** `POST /api/otp/verify-otp`

**Description:** Verifies email with OTP code.

**Request Body:**
```json
{
  "email": "string (required)",
  "otp": "string (required, 6 digits)",
  "type": "verification|password_reset"
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Email verified successfully",
  "verified": true
}
```

## 🔒 Security Headers

All authentication endpoints include security headers:

```
Content-Security-Policy: default-src 'self'
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
```

## 🚦 Rate Limiting

Authentication endpoints have specific rate limits:

- **Login attempts**: 5 per minute per IP, 3 per minute per email
- **Registration**: 3 per hour per IP
- **Password reset**: 3 per hour per email
- **Email verification**: 5 per hour per email
- **2FA attempts**: 3 per minute per user

**Rate Limit Headers:**
```
X-RateLimit-Limit: 5
X-RateLimit-Remaining: 4
X-RateLimit-Reset: 1640995200
```

## 🧪 Testing Authentication

### Example Login Flow

```javascript
// 1. Register user
const registerResponse = await fetch('/api/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'John Doe',
    email: 'john@example.com',
    password: 'SecurePass123!',
    confirmPassword: 'SecurePass123!'
  })
});

// 2. Verify email (if required)
const verifyResponse = await fetch('/api/otp/verify-otp', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'john@example.com',
    otp: '123456',
    type: 'verification'
  })
});

// 3. Login
const loginResponse = await fetch('/api/auth/signin', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'john@example.com',
    password: 'SecurePass123!'
  })
});

const { user, session } = await loginResponse.json();
```

### NextAuth.js Integration

```javascript
import { signIn, signOut, useSession } from 'next-auth/react';

// Login with credentials
await signIn('credentials', {
  email: 'user@example.com',
  password: 'password',
  redirect: false
});

// Login with Google
await signIn('google', {
  callbackUrl: '/dashboard'
});

// Logout
await signOut({
  callbackUrl: '/login'
});

// Get session
const { data: session, status } = useSession();
```