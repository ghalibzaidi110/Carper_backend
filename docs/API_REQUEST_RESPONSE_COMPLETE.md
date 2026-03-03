# Complete API Request/Response & Error Reference

> **Last Updated:** February 2026  
> **Purpose:** Complete reference for all request bodies, responses, and field-specific errors

---

## 📋 Table of Contents

1. [Email/Password Registration](#1-emailpassword-registration)
2. [Google OAuth Registration](#2-google-oauth-registration)
3. [Login](#3-login)
4. [Token Refresh](#4-token-refresh)
5. [Logout](#5-logout)

---

## 1. Email/Password Registration

### Endpoint
```
POST /api/v1/auth/register
```

### Request Body

**For INDIVIDUAL Account:**
```json
{
  "email": "john@example.com",
  "password": "StrongPass123!",
  "fullName": "John Doe",
  "phoneNumber": "+923001234567",
  "city": "Karachi",
  "address": "House 123, Street 5, DHA Phase 6",
  "accountType": "INDIVIDUAL",
  "country": "Pakistan"
}
```

**For CAR_RENTAL Account:**
```json
{
  "email": "business@example.com",
  "password": "StrongPass123!",
  "fullName": "Ahmed Khan",
  "phoneNumber": "+923001234567",
  "city": "Lahore",
  "address": "Shop 45, Main Street",
  "accountType": "CAR_RENTAL",
  "businessName": "Elite Car Rentals",
  "businessLicense": "BL-12345",
  "country": "Pakistan"
}
```

### Success Response (201 Created)

```json
{
  "success": true,
  "data": {
    "message": "Registration successful",
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "john@example.com",
      "fullName": "John Doe",
      "accountType": "INDIVIDUAL",
      "phoneNumber": "+923001234567",
      "city": "Karachi",
      "address": "House 123, Street 5, DHA Phase 6",
      "country": "Pakistan",
      "isVerified": false,
      "accountStatus": "ACTIVE",
      "createdAt": "2026-02-28T02:00:00.000Z"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "timestamp": "2026-02-28T02:00:00.000Z"
}
```

### Error Responses

#### 400 Bad Request - Validation Errors

**Error Format:**
```json
{
  "success": false,
  "statusCode": 400,
  "message": [
    {
      "property": "email",
      "value": "invalid-email",
      "constraints": {
        "isEmail": "Please provide a valid email address"
      }
    }
  ],
  "timestamp": "2026-02-28T02:00:00.000Z",
  "path": "/api/v1/auth/register"
}
```

**All Possible Field Errors:**

**1. Email Errors:**
```json
// Missing email
{
  "statusCode": 400,
  "message": [
    {
      "property": "email",
      "constraints": {
        "isNotEmpty": "Email is required"
      }
    }
  ]
}

// Invalid email format
{
  "statusCode": 400,
  "message": [
    {
      "property": "email",
      "value": "notanemail",
      "constraints": {
        "isEmail": "Please provide a valid email address"
      }
    }
  ]
}
```

**2. Password Errors:**
```json
// Missing password
{
  "statusCode": 400,
  "message": [
    {
      "property": "password",
      "constraints": {
        "isNotEmpty": "Password is required"
      }
    }
  ]
}

// Password too short
{
  "statusCode": 400,
  "message": [
    {
      "property": "password",
      "value": "Short1!",
      "constraints": {
        "minLength": "Password must be at least 8 characters long"
      }
    }
  ]
}

// Password too long
{
  "statusCode": 400,
  "message": [
    {
      "property": "password",
      "constraints": {
        "maxLength": "Password must not exceed 50 characters"
      }
    }
  ]
}

// Password missing requirements
{
  "statusCode": 400,
  "message": [
    {
      "property": "password",
      "value": "weakpassword",
      "constraints": {
        "matches": "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&#)"
      }
    }
  ]
}
```

**3. Full Name Errors:**
```json
// Missing fullName
{
  "statusCode": 400,
  "message": [
    {
      "property": "fullName",
      "constraints": {
        "isNotEmpty": "Full name is required"
      }
    }
  ]
}

// Too short
{
  "statusCode": 400,
  "message": [
    {
      "property": "fullName",
      "value": "A",
      "constraints": {
        "minLength": "Full name must be at least 2 characters"
      }
    }
  ]
}

// Too long
{
  "statusCode": 400,
  "message": [
    {
      "property": "fullName",
      "constraints": {
        "maxLength": "Full name must not exceed 100 characters"
      }
    }
  ]
}
```

**4. Phone Number Errors:**
```json
// Missing phoneNumber
{
  "statusCode": 400,
  "message": [
    {
      "property": "phoneNumber",
      "constraints": {
        "isNotEmpty": "Phone number is required"
      }
    }
  ]
}

// Invalid format
{
  "statusCode": 400,
  "message": [
    {
      "property": "phoneNumber",
      "value": "123456",
      "constraints": {
        "matches": "Please provide a valid phone number with country code (e.g., +923001234567)"
      }
    }
  ]
}
```

**5. City Errors:**
```json
// Missing city
{
  "statusCode": 400,
  "message": [
    {
      "property": "city",
      "constraints": {
        "isNotEmpty": "City is required"
      }
    }
  ]
}

// Too short
{
  "statusCode": 400,
  "message": [
    {
      "property": "city",
      "value": "K",
      "constraints": {
        "minLength": "City must be at least 2 characters"
      }
    }
  ]
}
```

**6. Address Errors:**
```json
// Missing address
{
  "statusCode": 400,
  "message": [
    {
      "property": "address",
      "constraints": {
        "isNotEmpty": "Address is required"
      }
    }
  ]
}

// Too short
{
  "statusCode": 400,
  "message": [
    {
      "property": "address",
      "value": "Short",
      "constraints": {
        "minLength": "Please provide a complete address (minimum 10 characters)"
      }
    }
  ]
}
```

**7. Account Type Errors:**
```json
// Missing accountType
{
  "statusCode": 400,
  "message": [
    {
      "property": "accountType",
      "constraints": {
        "isNotEmpty": "Account type is required"
      }
    }
  ]
}

// Invalid value
{
  "statusCode": 400,
  "message": [
    {
      "property": "accountType",
      "value": "INVALID",
      "constraints": {
        "isEnum": "Account type must be either INDIVIDUAL or CAR_RENTAL"
      }
    }
  ]
}
```

**8. Business Name Error (CAR_RENTAL only):**
```json
// Missing businessName for CAR_RENTAL
{
  "statusCode": 400,
  "message": "Business name is required and must be at least 3 characters for CAR_RENTAL accounts"
}

// Too short
{
  "statusCode": 400,
  "message": "Business name is required and must be at least 3 characters for CAR_RENTAL accounts"
}
```

**9. Unknown Property Error:**
```json
// Extra field not in DTO
{
  "statusCode": 400,
  "message": [
    {
      "property": "extraField",
      "constraints": {
        "whitelistValidation": "property extraField should not exist"
      }
    }
  ]
}
```

#### 409 Conflict - Duplicate Data

**Email Already Exists:**
```json
{
  "success": false,
  "statusCode": 409,
  "message": "Email address is already registered",
  "timestamp": "2026-02-28T02:00:00.000Z",
  "path": "/api/v1/auth/register"
}
```

**Phone Number Already Exists:**
```json
{
  "success": false,
  "statusCode": 409,
  "message": "Phone number is already registered",
  "timestamp": "2026-02-28T02:00:00.000Z",
  "path": "/api/v1/auth/register"
}
```

---

## 2. Google OAuth Registration

### Step 1: Initiate OAuth
**Endpoint:** `GET /api/v1/auth/google`

**Request:** None (redirect)

**Response:** HTTP 302 redirect to Google

---

### Step 2: OAuth Callback - Existing User
**Endpoint:** `GET /api/v1/auth/google/callback`

**Response:** HTTP 302 redirect
```
http://localhost:3001/auth/callback?accessToken=...&refreshToken=...
```

---

### Step 3: OAuth Callback - New User
**Endpoint:** `GET /api/v1/auth/google/callback`

**Response:** HTTP 302 redirect
```
http://localhost:3001/auth/signup?google=true&data=%7B%22googleId%22%3A%22123%22%2C%22email%22%3A%22user%40gmail.com%22%2C%22fullName%22%3A%22John%20Doe%22%2C%22avatarUrl%22%3A%22https%3A%2F%2F...%22%7D
```

**Decoded data:**
```json
{
  "googleId": "123456789",
  "email": "user@gmail.com",
  "fullName": "John Doe",
  "avatarUrl": "https://..."
}
```

---

### Step 4: Complete Google Signup
**Endpoint:** `POST /api/v1/auth/google/complete-signup`

### Request Body

**For INDIVIDUAL Account:**
```json
{
  "googleId": "123456789",
  "email": "user@gmail.com",
  "fullName": "John Doe",
  "avatarUrl": "https://lh3.googleusercontent.com/...",
  "phoneNumber": "+923001234567",
  "city": "Karachi",
  "address": "House 123, Street 5, DHA Phase 6",
  "accountType": "INDIVIDUAL"
}
```

**For CAR_RENTAL Account:**
```json
{
  "googleId": "123456789",
  "email": "business@gmail.com",
  "fullName": "Ahmed Khan",
  "avatarUrl": "https://lh3.googleusercontent.com/...",
  "phoneNumber": "+923001234567",
  "city": "Lahore",
  "address": "Shop 45, Main Street",
  "accountType": "CAR_RENTAL",
  "businessName": "Elite Car Rentals",
  "businessLicense": "BL-12345"
}
```

### Success Response (201 Created)

```json
{
  "success": true,
  "data": {
    "message": "Registration successful",
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "user@gmail.com",
      "fullName": "John Doe",
      "accountType": "INDIVIDUAL",
      "phoneNumber": "+923001234567",
      "city": "Karachi",
      "isVerified": false,
      "googleId": "123456789",
      "avatarUrl": "https://..."
    },
    "accessToken": "eyJhbGci...",
    "refreshToken": "eyJhbGci..."
  },
  "timestamp": "2026-02-28T02:00:00.000Z"
}
```

### Error Responses

#### 400 Bad Request - Validation Errors

**All field errors are the same as Email/Password registration, plus:**

**1. Google ID Errors:**
```json
// Missing googleId
{
  "statusCode": 400,
  "message": [
    {
      "property": "googleId",
      "constraints": {
        "isNotEmpty": "googleId should not be empty"
      }
    }
  ]
}
```

**2. Email Errors (same as registration)**

**3. Full Name Errors (same as registration)**

**4. Phone Number Errors (same as registration)**

**5. City Errors (same as registration)**

**6. Address Errors (same as registration)**

**7. Account Type Errors (same as registration)**

**8. Business Name Error (CAR_RENTAL only - same as registration)**

#### 409 Conflict - Duplicate Data

**User Already Exists:**
```json
{
  "success": false,
  "statusCode": 409,
  "message": "User already exists. Please login instead.",
  "timestamp": "2026-02-28T02:00:00.000Z",
  "path": "/api/v1/auth/google/complete-signup"
}
```

**Email Already Exists:**
```json
{
  "success": false,
  "statusCode": 409,
  "message": "Email address is already registered",
  "timestamp": "2026-02-28T02:00:00.000Z",
  "path": "/api/v1/auth/google/complete-signup"
}
```

**Phone Number Already Exists:**
```json
{
  "success": false,
  "statusCode": 409,
  "message": "Phone number is already registered",
  "timestamp": "2026-02-28T02:00:00.000Z",
  "path": "/api/v1/auth/google/complete-signup"
}
```

#### 400 Bad Request - OAuth Not Configured

**If Google OAuth credentials are missing:**
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Google OAuth is not configured. Please set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_CALLBACK_URL in environment variables.",
  "timestamp": "2026-02-28T02:00:00.000Z",
  "path": "/api/v1/auth/google"
}
```

---

## 3. Login

### Endpoint
```
POST /api/v1/auth/login
```

### Request Body

```json
{
  "email": "john@example.com",
  "password": "StrongPass123!"
}
```

### Success Response (200 OK)

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "john@example.com",
      "fullName": "John Doe",
      "accountType": "INDIVIDUAL",
      "isVerified": false,
      "accountStatus": "ACTIVE"
    },
    "accessToken": "eyJhbGci...",
    "refreshToken": "eyJhbGci..."
  },
  "timestamp": "2026-02-28T02:00:00.000Z"
}
```

### Error Responses

#### 400 Bad Request - Validation Errors

**1. Email Errors:**
```json
// Missing email
{
  "statusCode": 400,
  "message": [
    {
      "property": "email",
      "constraints": {
        "isEmail": "email must be an email"
      }
    }
  ]
}

// Invalid email format
{
  "statusCode": 400,
  "message": [
    {
      "property": "email",
      "value": "notanemail",
      "constraints": {
        "isEmail": "email must be an email"
      }
    }
  ]
}
```

**2. Password Errors:**
```json
// Missing password
{
  "statusCode": 400,
  "message": [
    {
      "property": "password",
      "constraints": {
        "isString": "password must be a string"
      }
    }
  ]
}
```

#### 401 Unauthorized - Authentication Failed

**Invalid Email or Password:**
```json
{
  "success": false,
  "statusCode": 401,
  "message": "Invalid email or password",
  "timestamp": "2026-02-28T02:00:00.000Z",
  "path": "/api/v1/auth/login"
}
```

**Account Suspended:**
```json
{
  "success": false,
  "statusCode": 401,
  "message": "Account is suspended or deleted",
  "timestamp": "2026-02-28T02:00:00.000Z",
  "path": "/api/v1/auth/login"
}
```

**OAuth-Only Account (no password):**
```json
{
  "success": false,
  "statusCode": 401,
  "message": "Invalid email or password",
  "timestamp": "2026-02-28T02:00:00.000Z",
  "path": "/api/v1/auth/login"
}
```

---

## 4. Token Refresh

### Endpoint
```
POST /api/v1/auth/refresh
```

### Request Body

```json
{
  "refreshToken": "eyJhbGci..."
}
```

### Success Response (200 OK)

```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGci...",
    "refreshToken": "eyJhbGci..."
  },
  "timestamp": "2026-02-28T02:00:00.000Z"
}
```

### Error Responses

#### 400 Bad Request - Validation Errors

**Missing refreshToken:**
```json
{
  "statusCode": 400,
  "message": [
    {
      "property": "refreshToken",
      "constraints": {
        "isNotEmpty": "refreshToken should not be empty"
      }
    }
  ]
}
```

#### 401 Unauthorized

**Invalid Refresh Token:**
```json
{
  "success": false,
  "statusCode": 401,
  "message": "Unauthorized",
  "timestamp": "2026-02-28T02:00:00.000Z",
  "path": "/api/v1/auth/refresh"
}
```

---

## 5. Logout

### Endpoint
```
POST /api/v1/auth/logout
```

### Request Headers
```
Authorization: Bearer <accessToken>
```

### Request Body
None

### Success Response (200 OK)

```json
{
  "success": true,
  "data": {
    "message": "Logged out successfully"
  },
  "timestamp": "2026-02-28T02:00:00.000Z"
}
```

### Error Responses

#### 401 Unauthorized

**Missing Token:**
```json
{
  "success": false,
  "statusCode": 401,
  "message": "Unauthorized",
  "timestamp": "2026-02-28T02:00:00.000Z",
  "path": "/api/v1/auth/logout"
}
```

**Invalid Token:**
```json
{
  "success": false,
  "statusCode": 401,
  "message": "Unauthorized",
  "timestamp": "2026-02-28T02:00:00.000Z",
  "path": "/api/v1/auth/logout"
}
```

---

## 📝 Error Response Format Summary

### Validation Errors (400)
```json
{
  "success": false,
  "statusCode": 400,
  "message": [
    {
      "property": "fieldName",
      "value": "invalidValue",
      "constraints": {
        "constraintName": "Error message for this field only"
      }
    }
  ],
  "timestamp": "2026-02-28T02:00:00.000Z",
  "path": "/api/v1/auth/register"
}
```

**Note:** Each field error is separate. If multiple fields fail, all errors are in the array.

### Business Logic Errors (400/409/401)
```json
{
  "success": false,
  "statusCode": 400/409/401,
  "message": "Single error message string",
  "timestamp": "2026-02-28T02:00:00.000Z",
  "path": "/api/v1/auth/register"
}
```

---

## 🔍 Field Validation Rules Summary

| Field | Required | Min Length | Max Length | Format/Pattern | Special Rules |
|-------|----------|------------|------------|----------------|---------------|
| email | ✅ | - | - | Valid email | Unique in DB |
| password | ✅ | 8 | 50 | Uppercase, lowercase, number, special char | - |
| fullName | ✅ | 2 | 100 | String | - |
| phoneNumber | ✅ | - | - | `^\+?[1-9]\d{1,14}$` | Unique in DB |
| city | ✅ | 2 | - | String | - |
| address | ✅ | 10 | - | String | - |
| accountType | ✅ | - | - | INDIVIDUAL or CAR_RENTAL | - |
| country | ❌ | - | - | String | Defaults to "Pakistan" |
| businessName | ⚠️ | 3 | - | String | Required if CAR_RENTAL |
| businessLicense | ❌ | - | - | String | - |
| googleId | ✅ (Google) | - | - | String | - |
| avatarUrl | ❌ | - | - | URL string | - |

---

**Last Updated:** February 2026

