const passport = require('passport');
const User = require('../models/User');

if (
  process.env.GOOGLE_CLIENT_ID &&
  process.env.GOOGLE_CLIENT_ID !== 'your_google_client_id.apps.googleusercontent.com' &&
  process.env.GOOGLE_CLIENT_SECRET &&
  process.env.GOOGLE_CLIENT_SECRET !== 'your_google_client_secret'
) {
  const { Strategy: GoogleStrategy } = require('passport-google-oauth20');

  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
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
  console.log('⚠️  Google OAuth skipped — credentials not set');
}

module.exports = passport;