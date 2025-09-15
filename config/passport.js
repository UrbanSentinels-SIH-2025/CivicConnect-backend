// config/passport.js
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import dotenv from "dotenv";

dotenv.config(); // Load environment variables from .env file

// ✅ Configure Google OAuth2 strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,      // Google Client ID from console
      clientSecret: process.env.GOOGLE_CLIENT_SECRET, // Google Client Secret
      callbackURL: "/auth/google/callback",        // Redirect URL after Google login
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // This function runs AFTER Google verifies the user
        // 'profile' has user info from Google (id, name, email, picture, etc.)
        // Normally, you'd save user in DB here

        const user = {
          googleId: profile.id,
          name: profile.displayName,
          email: profile.emails?.[0]?.value,
          avatar: profile.photos?.[0]?.value,
        };

        // Pass user object forward
        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);
