# Google OAuth Verification Checklist

> **Last Updated:** February 2026  
> **Status:** Verification Guide

---

## ✅ Quick Verification Steps

### 1. Check Environment Variables

Verify these are set in your `.env` file:

```env
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/api/v1/auth/google/callback
FRONTEND_URL=http://localhost:3001
```

**Check:**
- ✅ All 4 variables are set
- ✅ No extra spaces or quotes
- ✅ Callback URL matches exactly (including `/api/v1/auth/google/callback`)

---

### 2. Verify Code Configuration

#### ✅ Routes Enabled
Check `src/auth/auth.controller.ts` - lines 69-88 should be **uncommented**:

```typescript
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
  res.redirect(
    `${frontendUrl}/auth/callback?accessToken=${result.accessToken}&refreshToken=${result.refreshToken}`,
  );
}
```

#### ✅ Strategy Registered
Check `src/auth/auth.module.ts` - should include:
```typescript
...(hasGoogleOAuth ? [GoogleStrategy] : []),
```

#### ✅ Service Method Exists
Check `src/auth/auth.service.ts` - should have:
```typescript
async googleLogin(googleUser: {...}) { ... }
```

---

### 3. Test Server Startup

Start your server:
```bash
npm run start:dev
```

**Expected:** Server starts without errors

**If you see errors:**
- ❌ "OAuth2Strategy requires a clientID" → Check `GOOGLE_CLIENT_ID` in `.env`
- ❌ "Cannot find module" → Run `npm install`
- ❌ Other errors → Check server logs

---

### 4. Test OAuth Endpoints

#### Test 1: Initiate OAuth
Open in browser:
```
http://localhost:3000/api/v1/auth/google
```

**Expected:**
- ✅ Redirects to Google login page
- ✅ URL shows `accounts.google.com`

**If error:**
- ❌ "redirect_uri_mismatch" → Check Google Console redirect URI matches exactly
- ❌ "invalid_client" → Check Client ID and Secret are correct
- ❌ 404 Not Found → Routes might still be commented

#### Test 2: Complete OAuth Flow
1. Click "Login with Google" (or navigate to `/api/v1/auth/google`)
2. Select Google account
3. Grant permissions
4. Should redirect to: `http://localhost:3001/auth/callback?accessToken=...&refreshToken=...`

**Expected:**
- ✅ Redirects to frontend with tokens
- ✅ Tokens are valid JWT strings

**If error:**
- ❌ Stuck on Google page → Check callback URL in Google Console
- ❌ Error after login → Check server logs
- ❌ No redirect → Check `FRONTEND_URL` in `.env`

---

### 5. Verify Google Cloud Console

#### ✅ OAuth Consent Screen
- [ ] Configured (External or Internal)
- [ ] App name set
- [ ] Support email set
- [ ] Scopes: `email`, `profile` added

#### ✅ OAuth 2.0 Credentials
- [ ] Client ID created
- [ ] Client Secret copied
- [ ] Authorized JavaScript origins:
  - `http://localhost:3000` (dev)
  - `https://your-domain.com` (prod)
- [ ] Authorized redirect URIs:
  - `http://localhost:3000/api/v1/auth/google/callback` (dev)
  - `https://api.your-domain.com/api/v1/auth/google/callback` (prod)

**Important:** Redirect URI must match **exactly** (including protocol, port, and path)

---

### 6. Check Database

After successful login, verify user was created:

```sql
SELECT id, email, "fullName", "googleId", "accountType" 
FROM users 
WHERE "googleId" IS NOT NULL;
```

**Expected:**
- ✅ User record exists
- ✅ `googleId` is set
- ✅ `email` matches Google account
- ✅ `accountType` is `INDIVIDUAL` (default)

---

## 🐛 Common Issues & Solutions

### Issue 1: "redirect_uri_mismatch"

**Error Message:**
```
Error 400: redirect_uri_mismatch
```

**Solution:**
1. Go to Google Cloud Console → Credentials
2. Edit your OAuth 2.0 Client ID
3. Check "Authorized redirect URIs"
4. Ensure it **exactly** matches `GOOGLE_CALLBACK_URL` in `.env`
5. No trailing slashes, correct protocol (http/https), correct port

**Example:**
- ✅ Correct: `http://localhost:3000/api/v1/auth/google/callback`
- ❌ Wrong: `http://localhost:3000/api/v1/auth/google/callback/` (trailing slash)
- ❌ Wrong: `https://localhost:3000/api/v1/auth/google/callback` (wrong protocol)

---

### Issue 2: "invalid_client"

**Error Message:**
```
Error 401: invalid_client
```

**Solution:**
1. Verify `GOOGLE_CLIENT_ID` in `.env` matches Google Console
2. Verify `GOOGLE_CLIENT_SECRET` is correct
3. Check for extra spaces or quotes in `.env`
4. Restart server after changing `.env`

---

### Issue 3: Routes Not Working (404)

**Error:** `GET /api/v1/auth/google` returns 404

**Solution:**
1. Check routes are uncommented in `auth.controller.ts`
2. Restart server
3. Verify route path: `/api/v1/auth/google` (not `/auth/google`)

---

### Issue 4: Server Won't Start

**Error:** "OAuth2Strategy requires a clientID"

**Solution:**
1. Check `.env` file exists
2. Verify `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set
3. No quotes around values in `.env`
4. Restart server

---

### Issue 5: No Redirect After Login

**Issue:** Login succeeds but doesn't redirect to frontend

**Solution:**
1. Check `FRONTEND_URL` in `.env`
2. Verify frontend callback page exists: `/auth/callback`
3. Check server logs for errors
4. Verify `res.redirect()` is being called

---

## ✅ Success Indicators

If everything is working, you should see:

1. ✅ Server starts without errors
2. ✅ `/api/v1/auth/google` redirects to Google
3. ✅ After Google login, redirects to frontend with tokens
4. ✅ User created in database with `googleId`
5. ✅ Tokens are valid and can be used for API calls

---

## 🧪 Manual Test Flow

1. **Start Server:**
   ```bash
   npm run start:dev
   ```

2. **Open Browser:**
   ```
   http://localhost:3000/api/v1/auth/google
   ```

3. **Login with Google:**
   - Select account
   - Grant permissions

4. **Verify Redirect:**
   - Should redirect to: `http://localhost:3001/auth/callback?accessToken=...&refreshToken=...`
   - Copy the tokens

5. **Test Token:**
   ```bash
   curl http://localhost:3000/api/v1/auth/me \
     -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
   ```

6. **Check Database:**
   - User should exist with `googleId` set

---

## 📝 Checklist Summary

- [ ] Environment variables set in `.env`
- [ ] Routes uncommented in `auth.controller.ts`
- [ ] Server starts without errors
- [ ] `/api/v1/auth/google` redirects to Google
- [ ] Google login completes successfully
- [ ] Redirects to frontend with tokens
- [ ] User created in database
- [ ] Tokens work for API calls

---

**Last Updated:** February 2026  
**If all checks pass, Google OAuth is working! 🎉**

