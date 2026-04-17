# 🔧 Fixing Google OAuth in Production - Setup Guide

## ✅ Changes Made to Backend

### 1. **authRoutes.js** - Dynamic OAuth Redirect
- ❌ **Old**: Used template literal at route definition time (static)
  ```js
  failureRedirect: `${process.env.CLIENT_URL}/login?error=oauth_failed`
  ```
- ✅ **New**: Added middleware that validates env vars and redirects dynamically
  ```js
  validateOAuthEnvironment, // Validates CLIENT_URL is set
  passport.authenticate('google', { session: false }),
  (req, res, next) => {
    if (!req.user) {
      const failureUrl = `${process.env.CLIENT_URL}/login?error=oauth_failed`;
      return res.redirect(failureUrl);
    }
    next();
  },
  googleCallback
  ```

### 2. **authController.js** - Enhanced Logging
- ✅ Added validation that `CLIENT_URL` is set
- ✅ Added logging to show redirect URL (without token)
- ✅ Clear comments explaining production vs development

### 3. **passport.js** - Configuration Validation
- ✅ New `validateGoogleOAuthConfig()` function that checks:
  - `GOOGLE_CLIENT_ID` is not a placeholder
  - `GOOGLE_CLIENT_SECRET` is not a placeholder
  - `GOOGLE_CALLBACK_URL` doesn't contain 'localhost'
- ✅ Better error messages for misconfiguration

### 4. **app.js** - Startup Validation
- ✅ New `validateOAuthConfig()` runs at server startup
- ✅ Logs the production URLs being used
- ✅ Warns if localhost URLs are used in production

## 🎯 OAuth Flow in Production

```
1. Frontend (https://bridgelabz-event-management-ticket-7f3p.onrender.com)
   ↓ User clicks "Sign in with Google"
   
2. GET /api/auth/google
   (Redirects to Google OAuth consent screen)
   ↓
   
3. User logs in with Google account
   ↓
   
4. Google redirects to callback URL
   (GOOGLE_CALLBACK_URL must match Google Console config)
   ↓
   
5. GET /api/auth/google/callback
   (Validates env vars and authenticates user)
   ↓
   
6. Redirects to frontend with token
   res.redirect(`${process.env.CLIENT_URL}/auth/callback?token=...`)
   (CLIENT_URL must be production frontend)
```

## ⚠️ Required Configuration in Render Dashboard

Set these environment variables in Render's Settings → Environment:

```
NODE_ENV=production
CLIENT_URL=https://your-production-frontend-url.vercel.app
GOOGLE_CALLBACK_URL=https://your-production-backend-url.onrender.com/api/auth/google/callback
GOOGLE_CLIENT_ID=your_google_client_id_from_cloud_console
GOOGLE_CLIENT_SECRET=your_google_client_secret_from_cloud_console
```

## 🔐 Google Cloud Console Configuration

Your Google OAuth app MUST have these registered:

### Authorized JavaScript Origins:
- ✅ `https://bridgelabz-event-management-ticket-n409.onrender.com`

### Authorized Redirect URIs:
- ✅ `https://bridgelabz-event-management-ticket-n409.onrender.com/api/auth/google/callback`

❌ Remove any localhost entries from Google Cloud Console

## 🧪 Testing the Flow

### 1. Check Server Logs
When your Render backend starts, you should see:
```
✅ Frontend URL: https://bridgelabz-event-management-ticket-booking-system-7l91.vercel.app
✅ OAuth Callback: https://bridgelabz-event-management-ticket-n409.onrender.com/api/auth/google/callback
✅ Google OAuth strategy loaded
```

### 2. Click Google Login
- Frontend → Backend `/api/auth/google`
- You should be redirected to Google's login page
- After login, you should be redirected **back to your production frontend**
- NOT to `http://localhost:5000`

### 3. Verify the Token
Frontend should receive: `?token=<jwt_access_token>`

## 📋 No Hardcoded localhost References

✅ **Verified clean:**
- ❌ No hardcoded `localhost:5000` in OAuth flows
- ❌ No hardcoded `localhost:5173` in redirects
- ✅ All redirects use `process.env.CLIENT_URL`
- ✅ All callbacks use `process.env.GOOGLE_CALLBACK_URL`

## 🚀 Production Checklist

- [ ] Render backend has `NODE_ENV=production`
- [ ] Render backend has correct `CLIENT_URL`
- [ ] Render backend has correct `GOOGLE_CALLBACK_URL`
- [ ] Google Cloud Console has production OAuth credentials
- [ ] Google Cloud Console has correct redirect URI
- [ ] Frontend .env has `VITE_API_URL` pointing to Render backend
- [ ] Test Google login from production frontend
- [ ] Verify no localhost appears in any redirects
