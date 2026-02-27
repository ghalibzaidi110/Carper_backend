# Google OAuth Flow Explanation & Error Fix

> **Last Updated:** February 2026  
> **Status:** ✅ Fixed and Enhanced

---

## 🔴 Error Explanation

### The Error
```
Error: Unknown authentication strategy "google"
```

### What Happened
1. **Problem:** The `GoogleStrategy` was conditionally registered in `auth.module.ts` based on environment variables
2. **Issue:** The check `process.env.GOOGLE_CLIENT_ID` happened at module load time, before environment variables were fully loaded
3. **Result:** Strategy wasn't registered, causing Passport to throw "Unknown authentication strategy"

### What I Fixed

1. **Always Register Strategy:**
   - Removed conditional registration
   - Strategy is now always registered in `auth.module.ts`

2. **Added Credential Check Guard:**
   - Created `GoogleAuthCheckGuard` that verifies credentials exist before authentication
   - Throws clear error if credentials are missing

3. **Updated Routes:**
   - Added `GoogleAuthCheckGuard` before `GoogleAuthGuard` in controller
   - Routes now check credentials first, then authenticate

---

## ✅ New Google OAuth Flow

### Flow for Existing Users (Login)

```
1. User clicks "Continue with Google"
   ↓
2. Frontend redirects to: GET /api/v1/auth/google
   ↓
3. Backend redirects to Google login
   ↓
4. User authenticates with Google
   ↓
5. Google redirects to: GET /api/v1/auth/google/callback
   ↓
6. Backend checks if user exists:
   - If exists → Generate tokens
   - If new → Redirect to signup page
   ↓
7. Existing user → Redirect to frontend:
   /auth/callback?accessToken=...&refreshToken=...
   ↓
8. Frontend stores tokens and redirects to dashboard
```

### Flow for New Users (Signup)

```
1. User clicks "Continue with Google"
   ↓
2. Frontend redirects to: GET /api/v1/auth/google
   ↓
3. Backend redirects to Google login
   ↓
4. User authenticates with Google
   ↓
5. Google redirects to: GET /api/v1/auth/google/callback
   ↓
6. Backend checks if user exists:
   - User NOT found → Redirect to signup page
   ↓
7. Redirect to frontend signup page:
   /auth/signup?google=true&data={encoded_google_data}
   ↓
8. Frontend extracts Google data:
   - email (pre-filled)
   - fullName (pre-filled)
   - avatarUrl (pre-filled)
   - googleId (hidden, for submission)
   ↓
9. User fills remaining required fields:
   - phoneNumber
   - city
   - address
   - accountType (INDIVIDUAL or CAR_RENTAL)
   - businessName (if CAR_RENTAL)
   ↓
10. Frontend submits to: POST /api/v1/auth/google/complete-signup
    ↓
11. Backend creates user with Google data + additional info
    ↓
12. Backend returns tokens
    ↓
13. Frontend stores tokens and redirects to dashboard
```

---

## 📋 API Endpoints

### 1. Initiate Google OAuth
```
GET /api/v1/auth/google
```
**Response:** Redirects to Google login

---

### 2. Google OAuth Callback
```
GET /api/v1/auth/google/callback
```
**Response:**
- **Existing user:** Redirects to `/auth/callback?accessToken=...&refreshToken=...`
- **New user:** Redirects to `/auth/signup?google=true&data={encoded_json}`

**Google Data (encoded in URL):**
```json
{
  "googleId": "123456789",
  "email": "user@gmail.com",
  "fullName": "John Doe",
  "avatarUrl": "https://..."
}
```

---

### 3. Complete Google Signup
```
POST /api/v1/auth/google/complete-signup
```

**Request Body:**
```json
{
  "googleId": "123456789",
  "email": "user@gmail.com",
  "fullName": "John Doe",
  "avatarUrl": "https://...",
  "phoneNumber": "+923001234567",
  "city": "Karachi",
  "address": "House 123, Street 5, DHA Phase 6",
  "accountType": "INDIVIDUAL",
  "businessName": "Optional for CAR_RENTAL",
  "businessLicense": "Optional for CAR_RENTAL"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Registration successful",
    "user": { ... },
    "accessToken": "...",
    "refreshToken": "..."
  }
}
```

---

## 🔧 Frontend Implementation

### 1. Handle OAuth Callback

**For Existing Users:**
```typescript
// /auth/callback page
const params = new URLSearchParams(window.location.search);
const accessToken = params.get('accessToken');
const refreshToken = params.get('refreshToken');

if (accessToken && refreshToken) {
  // Store tokens
  localStorage.setItem('accessToken', accessToken);
  localStorage.setItem('refreshToken', refreshToken);
  router.push('/dashboard');
}
```

**For New Users:**
```typescript
// /auth/signup page
const params = new URLSearchParams(window.location.search);
const isGoogle = params.get('google') === 'true';
const googleDataStr = params.get('data');

if (isGoogle && googleDataStr) {
  const googleData = JSON.parse(decodeURIComponent(googleDataStr));
  
  // Pre-fill form with Google data
  setFormData({
    email: googleData.email,
    fullName: googleData.fullName,
    avatarUrl: googleData.avatarUrl,
    googleId: googleData.googleId, // Hidden field
    // User fills: phoneNumber, city, address, accountType
  });
}
```

### 2. Submit Complete Signup

```typescript
const handleGoogleSignup = async () => {
  const response = await axios.post('/api/v1/auth/google/complete-signup', {
    ...formData, // Includes Google data + user input
  });

  // Store tokens
  localStorage.setItem('accessToken', response.data.data.accessToken);
  localStorage.setItem('refreshToken', response.data.data.refreshToken);
  
  router.push('/dashboard');
};
```

---

## 🎯 Key Changes Made

### 1. Modified `auth.service.ts`
- `googleLogin()` now returns `{ isNewUser: true, googleData: {...} }` for new users
- Added `completeGoogleSignup()` method to create user with Google data + additional fields

### 2. Modified `auth.controller.ts`
- Updated `googleAuthCallback()` to check `isNewUser` flag
- Redirects new users to signup page with Google data
- Added `POST /auth/google/complete-signup` endpoint

### 3. Added `CompleteGoogleSignupDto`
- New DTO for completing Google signup
- Includes Google data + required registration fields

### 4. Fixed Strategy Registration
- Always register `GoogleStrategy` (no conditional)
- Added `GoogleAuthCheckGuard` to verify credentials before use

---

## ✅ Benefits

1. **Better UX:** Users can sign up with Google without creating incomplete accounts
2. **Data Collection:** Still collects all required fields (phone, city, address, account type)
3. **Flexible:** Works for both login and signup flows
4. **Secure:** Validates all data before creating account

---

## 🧪 Testing

### Test Existing User Login:
1. User with Google account exists
2. Click "Continue with Google"
3. Should redirect to dashboard with tokens

### Test New User Signup:
1. New Google account (not in database)
2. Click "Continue with Google"
3. Should redirect to signup page with pre-filled email/name
4. Fill remaining fields
5. Submit → Should create account and redirect to dashboard

---

**Last Updated:** February 2026  
**Status:** ✅ Ready to use

