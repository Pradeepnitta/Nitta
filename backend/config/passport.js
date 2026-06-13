const passport = require("passport");

const GoogleStrategy =
  require("passport-google-oauth20").Strategy;

const User = require("../models/user");

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error);
  }
});

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID:
          process.env.GOOGLE_CLIENT_ID,

        clientSecret:
          process.env.GOOGLE_CLIENT_SECRET,

        callbackURL:
          "/api/auth/google/callback"
      },

      async (
        accessToken,
        refreshToken,
        profile,
        done
      ) => {
        try {
          const email = profile.emails[0].value.toLowerCase();

          // Search for user by googleId OR by email
          let user = await User.findOne({
            $or: [
              { googleId: profile.id },
              { email: email }
            ]
          });

          if (user) {
            // If user exists but googleId is not linked, link it now
            if (!user.googleId) {
              user.googleId = profile.id;
              // Make sure verified status is active since they signed in via Google
              user.isEmailVerified = true;
              user.isVerified = true;
              await user.save();
            }
          } else {
            // Create a new user since email/googleId not found
            user = await User.create({
              googleId: profile.id,
              name: profile.displayName,
              email: email,
              role: "user",
              isVerified: true,
              isEmailVerified: true
            });
          }

          done(null, user);
        } catch (error) {
          done(error);
        }
      }
    )
  );
} else {
  console.warn("Google OAuth is disabled because GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET are not set.");
}

module.exports = passport;