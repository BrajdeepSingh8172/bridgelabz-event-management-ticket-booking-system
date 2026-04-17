# 🔐 Frontend OAuth Callback Setup - Complete Guide

## ✅ Components in Place

### 1. **React Router Configuration** (App.jsx)
✅ Route already defined:
```jsx
<Route path="/auth/callback" element={<AuthCallback />} />
```

### 2. **AuthCallback Component** (pages/auth/AuthCallback.jsx)
✅ Handles OAuth token callback with complete flow:
- Extracts token from URL parameters: `?token=JWT`
- Stores token in Redux auth state
- Fetches user profile from backend
- Handles success and error scenarios
- Displays loading spinner during processing
- Includes comprehensive logging for debugging

### 3. **React Router Setup** (main.jsx)
✅ BrowserRouter properly wrapping the app:
```jsx
<BrowserRouter>
  <App />
  <Toaster />
</BrowserRouter>
```

### 4. **SPA Routing Configuration Files**

#### ✅ `_redirects` (Netlify/Vercel compatibility)
- Routes all requests to `/index.html`
- Allows React Router to handle client-side routing
- Required for production deployment

#### ✅ `vercel.json` (Production deployment config)
- Specifies build command and output directory
- Rewrites all routes to `/index.html` (SPA routing)
- Caching headers for assets
- No-cache headers for API calls

---

## 🔄 Complete OAuth Flow

```
+─────────────────────────────────────────────────────────────────+
│ 1. USER CLICKS "SIGN IN WITH GOOGLE"                            │
│    Frontend: /login page → Button href={`${API_URL}/api/auth/google`} │
+─────────────────────────────────────────────────────────────────+
                              ↓
+─────────────────────────────────────────────────────────────────+
│ 2. GOOGLE OAUTH FLOW                                            │
│    Backend: GET /api/auth/google                                │
│    → Redirects to Google consent screen                         │
│    → User logs in with Google                                   │
│    → Google redirects to callback URL                           │
+─────────────────────────────────────────────────────────────────+
                              ↓
+─────────────────────────────────────────────────────────────────+
│ 3. BACKEND CALLBACK PROCESSING                                  │
│    Backend: GET /api/auth/google/callback                       │
│    → Passport authenticates user                                │
│    → Issues JWT access token                                    │
│    → Redirects to frontend: /auth/callback?token=JWT            │
+─────────────────────────────────────────────────────────────────+
                              ↓
+─────────────────────────────────────────────────────────────────+
│ 4. FRONTEND CALLBACK HANDLING                                   │
│    Frontend: GET /auth/callback?token=JWT                       │
│    → Vercel rewrites to /index.html                             │
│    → React Router renders <AuthCallback />                      │
│    → Component extracts token from URL                          │
│    → Stores token in Redux                                      │
│    → Fetches user profile                                       │
│    → Stores user in Redux                                       │
│    → Redirects to /                                             │
+─────────────────────────────────────────────────────────────────+
                              ↓
+─────────────────────────────────────────────────────────────────+
│ 5. AUTHENTICATED HOME PAGE                                      │
│    User is now logged in and authenticated ✅                   │
+─────────────────────────────────────────────────────────────────+
```

---

## 🛠️ Key Implementation Details

### Token Flow
```javascript
// AuthCallback.jsx extracts token from URL
const params = new URLSearchParams(window.location.search);
const token = params.get('token');  // ?token=JWT_TOKEN

// Store in Redux
dispatch(setCredentials({ accessToken: token }));

// axiosClient automatically includes in Authorization header
// (configured in api/axiosClient.js)
```

### Error Handling
✅ Handles multiple failure scenarios:
- No token in URL → Redirect to login with error
- User profile fetch fails → Clear token and redirect
- Unexpected error → Show toast and redirect
- Network errors → Show error message

### Loading State
✅ Shows `<FullPageSpinner />` during:
- Token extraction
- User profile fetching
- State updates
- Navigation

---

## 🚀 Production Deployment Steps

### For Vercel:
1. ✅ `vercel.json` configured with SPA rewrites
2. ✅ Build command: `npm run build`
3. ✅ Output directory: `dist`
4. Deploy to Vercel

### For Render:
1. Frontend deployed on Vercel (recommended)
2. Backend deployed on Render
3. `VITE_API_URL` environment variable points to Render backend
4. `CLIENT_URL` in backend `.env` points to Vercel frontend

---

## 🧪 Testing the OAuth Flow

### Local Testing (localhost):
1. Start backend: `npm run dev` (port 5000)
2. Start frontend: `npm run dev` (port 5173)
3. Click "Sign In with Google"
4. Login with Google account
5. Backend redirects to: `http://localhost:5173/auth/callback?token=XYZ`
6. Frontend captures token and redirects to home

### Production Testing:
1. Frontend: `https://your-frontend.vercel.app`
2. Backend: `https://your-backend.onrender.com`
3. Google OAuth app must have production URLs registered
4. Click "Sign In with Google"
5. Backend redirects to: `https://your-frontend.vercel.app/auth/callback?token=XYZ`
6. Frontend captures token and redirects to home

---

## ⚠️ Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| "Not Found" at /auth/callback | SPA routing not configured | Add `vercel.json` rewrites or `_redirects` |
| Token not captured | URL params not parsed correctly | Check URL has `?token=` parameter |
| Profile fetch fails | Backend API unreachable | Verify `VITE_API_URL` is correct |
| Redirect to login endless loop | Bad token or invalid credentials | Check JWT secret matches backend |
| CORS errors | Frontend/Backend origin mismatch | Verify backend CORS config includes frontend URL |

---

## 📋 Checklist for Production

- [ ] `vercel.json` has SPA rewrites configured
- [ ] `_redirects` file exists in public folder
- [ ] `AuthCallback` component handles all error cases
- [ ] Redux auth state is properly initialized
- [ ] `axiosClient` includes Authorization header
- [ ] Backend redirects to correct `CLIENT_URL`
- [ ] `VITE_API_URL` points to production backend
- [ ] Google OAuth app has production URLs registered
- [ ] Frontend and backend environment variables are set
- [ ] Test end-to-end OAuth flow in production

---

## 📁 File Structure

```
client/
├── public/
│   ├── _redirects          ✅ SPA routing for Vercel
│   └── favicon.svg
├── src/
│   ├── App.jsx             ✅ Route: /auth/callback
│   ├── main.jsx            ✅ BrowserRouter setup
│   ├── pages/
│   │   └── auth/
│   │       └── AuthCallback.jsx  ✅ OAuth callback handler
│   ├── api/
│   │   └── axiosClient.js  ✅ Auto-includes JWT in Authorization
│   ├── features/
│   │   └── auth/
│   │       └── authSlice.js  ✅ Redux auth state
│   └── ...
├── vercel.json             ✅ Production config
└── vite.config.js          ✅ Dev server proxy setup
```

---

## 🔗 Related Files

- Backend: [server/config/passport.js](../server/config/passport.js)
- Backend: [server/controllers/authController.js](../server/controllers/authController.js)
- Backend: [server/routes/authRoutes.js](../server/routes/authRoutes.js)
- Frontend: [client/src/features/auth/authSlice.js](auth/authSlice.js)
- Frontend: [client/src/api/axiosClient.js](../api/axiosClient.js)
