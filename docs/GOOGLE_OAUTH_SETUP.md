# Google OAuth Login Setup Guide

> **Last Updated:** February 2026  
> **Status:** Implementation ready, needs configuration

---

## Overview

Google OAuth is already implemented in the codebase but currently **disabled** (commented out). This guide will help you enable and configure it.

---

## Step 1: Setup Google Cloud Console

### 1.1 Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click **"Select a project"** → **"New Project"**
3. Enter project name: `Carper Platform` (or your preferred name)
4. Click **"Create"**

### 1.2 Enable Google+ API

1. In Google Cloud Console, go to **"APIs & Services"** → **"Library"**
2. Search for **"Google+ API"** or **"Google Identity"**
3. Click **"Enable"**

### 1.3 Create OAuth 2.0 Credentials

1. Go to **"APIs & Services"** → **"Credentials"**
2. Click **"Create Credentials"** → **"OAuth client ID"**
3. If prompted, configure OAuth consent screen first:
   - **User Type:** External (for public users)
   - **App name:** Carper Platform
   - **User support email:** your-email@example.com
   - **Developer contact:** your-email@example.com
   - Click **"Save and Continue"**
   - **Scopes:** Add `email` and `profile`
   - **Test users:** Add your test email (optional for testing)
   - Click **"Save and Continue"**

4. Back to **"Create OAuth client ID"**:
   - **Application type:** Web application
   - **Name:** Carper Backend
   - **Authorized JavaScript origins:**
     - `http://localhost:3000` (for development)
     - `https://your-production-domain.com` (for production)
   - **Authorized redirect URIs:**
     - `http://localhost:3000/api/v1/auth/google/callback` (development)
     - `https://your-api-domain.com/api/v1/auth/google/callback` (production)
   - Click **"Create"**

5. **Copy the Client ID and Client Secret** (you'll need these for `.env`)

---

## Step 2: Configure Environment Variables

Add these to your `.env` file:

```env
# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/api/v1/auth/google/callback

# Frontend URL (for redirect after login)
FRONTEND_URL=http://localhost:3001
```

**For Production:**
```env
GOOGLE_CLIENT_ID=your-production-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-production-client-secret
GOOGLE_CALLBACK_URL=https://api.yourdomain.com/api/v1/auth/google/callback
FRONTEND_URL=https://yourdomain.com
```

---

## Step 3: Enable Google OAuth Endpoints

Uncomment the Google OAuth routes in `src/auth/auth.controller.ts`:

```typescript
// src/auth/auth.controller.ts

// ─── GOOGLE OAUTH ─────────────────────────────────

@Public()
@Get('google')
@UseGuards(GoogleAuthGuard)
@ApiOperation({ summary: 'Initiate Google OAuth login' })
async googleAuth() {
  // Guard redirects to Google
}

@Public()
@Get('google/callback')
@UseGuards(GoogleAuthGuard)
@ApiOperation({ summary: 'Google OAuth callback' })
async googleAuthCallback(@Req() req: Request, @Res() res: Response) {
  const result = await this.authService.googleLogin(req.user as any);
  const frontendUrl = this.configService.get<string>('FRONTEND_URL');
  // Redirect to frontend with tokens as query params
  res.redirect(
    `${frontendUrl}/auth/callback?accessToken=${result.accessToken}&refreshToken=${result.refreshToken}`,
  );
}
```

---

## Step 4: Verify Google Login Method Exists

Check if `googleLogin` method exists in `src/auth/auth.service.ts`. If not, add it:

```typescript
// src/auth/auth.service.ts

async googleLogin(googleUser: any) {
  const { googleId, email, fullName, avatarUrl } = googleUser;

  // Check if user exists with this email
  let user = await this.prisma.user.findUnique({
    where: { email },
  });

  if (user) {
    // User exists - check if Google ID is linked
    if (!user.googleId) {
      // Link Google account to existing user
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: { googleId },
      });
    }
  } else {
    // New user - create account automatically
    user = await this.prisma.user.create({
      data: {
        email,
        fullName,
        avatarUrl,
        googleId,
        accountType: AccountType.INDIVIDUAL, // Default to INDIVIDUAL
        accountStatus: 'ACTIVE',
        // OAuth users don't have password
        passwordHash: null,
      },
    });
  }

  // Check account status
  if (user.accountStatus !== 'ACTIVE') {
    throw new UnauthorizedException('Account is suspended or deleted');
  }

  // Generate tokens
  const tokens = await this.generateTokens(user.id, user.email, user.accountType);
  await this.updateRefreshToken(user.id, tokens.refreshToken);

  return {
    user: this.sanitizeUser(user),
    ...tokens,
  };
}
```

---

## Step 5: Test the Flow

### 5.1 Backend Test

1. Start your backend server:
   ```bash
   npm run start:dev
   ```

2. Open browser and navigate to:
   ```
   http://localhost:3000/api/v1/auth/google
   ```

3. You should be redirected to Google login page

4. After login, you'll be redirected to:
   ```
   http://localhost:3001/auth/callback?accessToken=...&refreshToken=...
   ```

### 5.2 Frontend Integration

On your frontend, create a login button:

```typescript
// Frontend: Login button
const handleGoogleLogin = () => {
  window.location.href = 'http://localhost:3000/api/v1/auth/google';
};

// Frontend: Callback page handler
// /auth/callback page
useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  const accessToken = params.get('accessToken');
  const refreshToken = params.get('refreshToken');

  if (accessToken && refreshToken) {
    // Store tokens
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    
    // Redirect to dashboard
    router.push('/dashboard');
  }
}, []);
```

---

## Complete OAuth Flow Diagram

```
┌─────────────┐
│   Frontend  │
│  Login Page │
└──────┬──────┘
       │ User clicks "Login with Google"
       ▼
┌─────────────────────────────────────┐
│ GET /api/v1/auth/google             │
│ (Backend redirects to Google)      │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────┐
│   Google    │
│ Login Page  │
└──────┬──────┘
       │ User authenticates
       ▼
┌─────────────────────────────────────┐
│ GET /api/v1/auth/google/callback    │
│ (Google redirects back with code)   │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│ Backend exchanges code for tokens   │
│ Creates/updates user in database    │
│ Generates JWT access & refresh tokens│
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│ Redirect to Frontend:               │
│ /auth/callback?accessToken=...      │
│        &refreshToken=...            │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────┐
│  Frontend   │
│  Callback   │
│   Page      │
└──────┬──────┘
       │ Store tokens & redirect
       ▼
┌─────────────┐
│  Dashboard  │
└─────────────┘
```

---

## Troubleshooting

### Issue: "redirect_uri_mismatch"

**Solution:**
- Check that the redirect URI in Google Console **exactly matches** `GOOGLE_CALLBACK_URL` in your `.env`
- Include protocol (`http://` or `https://`)
- Include port number if using non-standard port
- No trailing slashes

### Issue: "invalid_client"

**Solution:**
- Verify `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are correct
- Check for extra spaces or quotes in `.env` file
- Restart your server after changing `.env`

### Issue: User not created

**Solution:**
- Check database connection
- Verify Prisma schema has `googleId` field in User model
- Check server logs for errors

### Issue: Redirect not working

**Solution:**
- Verify `FRONTEND_URL` in `.env` is correct
- Check CORS settings allow the frontend URL
- Ensure frontend callback page exists

---

## Security Considerations

1. **HTTPS in Production:** Always use HTTPS for OAuth in production
2. **State Parameter:** Consider adding state parameter for CSRF protection
3. **Token Storage:** Store refresh tokens securely (httpOnly cookies recommended)
4. **Account Linking:** Handle cases where email already exists with different provider

---

## Additional Configuration

### Optional: Request Additional Scopes

If you need more user information, modify `src/auth/strategies/google.strategy.ts`:

```typescript
super({
  // ... existing config
  scope: ['email', 'profile', 'openid'], // Add 'openid' for ID token
});
```

### Optional: Custom User Creation

Modify `googleLogin` method to collect additional info:

```typescript
// Prompt user for account type after first Google login
if (!user.phoneNumber) {
  // Redirect to complete profile page
  // Store temporary token
}
```

---

## Next Steps

1. ✅ Setup Google Cloud Console
2. ✅ Configure environment variables
3. ✅ Enable endpoints in controller
4. ✅ Test OAuth flow
5. ✅ Integrate with frontend
6. ✅ Test in production

---

**Last Updated:** February 2026  
**Status:** Ready to enable

