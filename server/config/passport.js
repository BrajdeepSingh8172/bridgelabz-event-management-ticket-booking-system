const passport = require('passport');
const User = require('../models/User');

// Validate environment variables
const validateGoogleOAuthConfig = () => {
  const required = ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'GOOGLE_CALLBACK_URL'];
  const missing = required.filter(key => 
    !process.env[key] || 
    process.env[key].includes('your_') || 
    process.env[key].includes('localhost')
  );
  
  if (missing.length > 0) {
    console.warn(`⚠️  Google OAuth will not work. Missing or invalid config: ${missing.join(', ')}`);
    return false;
  }
  return true;
};

if (validateGoogleOAuthConfig()) {
  const { Strategy: GoogleStrategy } = require('passport-google-oauth20');

  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        // ✅ Use full production callback URL from environment
        // Example: https://bridgelabz-event-management-ticket-n409.onrender.com/api/auth/google/callback
        callbackURL: process.env.GOOGLE_CALLBACK_URL,
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const email =
            profile.emails && profile.emails[0]
              ? profile.emails[0].value.toLowerCase()
              : null;

          const avatar =
            profile.photos && profile.photos[0]
              ? profile.photos[0].value
              : undefined;

          let user = await User.findOne({ googleId: profile.id });

          if (!user && email) {
            user = await User.findOne({ email });
            if (user) {
              user.googleId = profile.id;
              if (!user.avatar && avatar) user.avatar = avatar;
              user.isVerified = true;
              await user.save();
            }
          }

          if (!user) {
            user = await User.create({
              googleId: profile.id,
              name: profile.displayName,
              email,
              avatar,
              isVerified: true,
            });
          }

          return done(null, user);
        } catch (err) {
          return done(err, null);
        }
      }
    )
  );

  console.log('✅ Google OAuth strategy loaded');
} else {
  console.log('⚠️  Google OAuth skipped — credentials not set or invalid');
}

module.exports = passport;