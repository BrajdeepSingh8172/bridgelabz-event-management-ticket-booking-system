const passport = require('passport');
const { Strategy: GoogleStrategy } = require('passport-google-oauth20');
const User = require('../models/User');

/**
 * Stateless JWT flow — no session serialization needed.
 * The verify callback upserts the user document and passes it to done().
 * authController.googleCallback then issues JWT tokens.
 */
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

        // 1. Try to find by googleId
        let user = await User.findOne({ googleId: profile.id });

        if (!user && email) {
          // 2. Try to find by email and link googleId
          user = await User.findOne({ email });
          if (user) {
            user.googleId = profile.id;
            if (!user.avatar && avatar) user.avatar = avatar;
            user.isVerified = true;
            await user.save();
          }
        }

        if (!user) {
          // 3. Create brand-new user
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

// No session serialize/deserialize — we are stateless (JWT only)
module.exports = passport;
