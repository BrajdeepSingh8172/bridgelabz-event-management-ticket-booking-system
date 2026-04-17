# ═══════════════════════════════════════════════════════════════════════════════
# 🚀 PRODUCTION ENVIRONMENT CONFIGURATION FOR RENDER
# ═══════════════════════════════════════════════════════════════════════════════
#
# ⚠️  IMPORTANT: Do NOT commit actual secrets. Use Render's Environment Variables Dashboard.
#
# To set these in Render:
# 1. Go to your Render service dashboard
# 2. Settings → Environment → Environment Variables
# 3. Copy-paste each key=value pair below
#
# ═══════════════════════════════════════════════════════════════════════════════

# ─── Server Configuration ──────────────────────────────────────────────────────
# Render auto-assigns PORT, but explicitly set NODE_ENV
PORT=process.env.PORT
NODE_ENV=production

# ─── Database ──────────────────────────────────────────────────────────────────
MONGO_URI=mongodb://brajdeepsingh8172_db_user:Brajdeep123@ac-cpxjolr-shard-00-00.caxhweh.mongodb.net:27017,ac-cpxjolr-shard-00-01.caxhweh.mongodb.net:27017,ac-cpxjolr-shard-00-02.caxhweh.mongodb.net:27017/eventplatform?ssl=true&replicaSet=atlas-u0780e-shard-0&authSource=admin&appName=Cluster0

# ─── JWT Secrets (KEEP SECURE) ────────────────────────────────────────────────
# ⚠️  NEVER expose these publicly
JWT_ACCESS_SECRET=c28928c60acab8fde2fdc95fae880b9116a136f12354b41d610399b88b8512d65816d676090554a78e14360b3d401bfec7d2fe17b1bf524c0a400e5723524786
JWT_REFRESH_SECRET=5d327a2f86b925424bb936f499567444f34b1ce9a0e452c7be2ae5ff5cb06aea3cdef526fc5880e04ce14f85faedd2872effcc5af808abf4d573b4642a33c969
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d

# ─── Google OAuth (PRODUCTION) ────────────────────────────────────────────────
# ⚠️  Create separate OAuth credentials for production:
# 1. Go to https://console.cloud.google.com/
# 2. Create a new OAuth 2.0 Web Application
# 3. Add authorized JavaScript origins:
#    - https://your-production-backend-url.onrender.com
# 4. Add authorized redirect URIs:
#    - https://your-production-backend-url.onrender.com/api/auth/google/callback
#
# ✅ MUST use HTTPS in production (no localhost)
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_CALLBACK_URL=https://your-production-backend-url.onrender.com/api/auth/google/callback

# ─── Frontend URL (PRODUCTION) ────────────────────────────────────────────────
# ✅ MUST be HTTPS production frontend domain (NOT localhost)
# This is where users are redirected after successful Google login
CLIENT_URL=https://your-production-frontend-url.vercel.app

# ─── Cloudinary (Image Upload) ────────────────────────────────────────────────
CLOUDINARY_CLOUD_NAME=dxqar1ouc
CLOUDINARY_API_KEY=455692882912722
CLOUDINARY_API_SECRET=kDJbAoeLkcYnEnGgx1r4AYJ81bk

# ─── Redis (Optional for caching) ─────────────────────────────────────────────
# Leave empty to skip Redis (optional feature)
REDIS_URL=redis://localhost:6379

# ─── Email Configuration (SMTP) ───────────────────────────────────────────────
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_specific_password
EMAIL_FROM="Event Platform <your_email@gmail.com>"
ADMIN_EMAIL=admin@example.com

# ─── Payment Gateway (Razorpay) ────────────────────────────────────────────────
RAZORPAY_KEY_ID=rzp_live_your_production_key
RAZORPAY_KEY_SECRET=your_razorpay_secret

# ─── QR Code Ticket Validation ────────────────────────────────────────────────
QR_SECRET=your_secure_random_string
