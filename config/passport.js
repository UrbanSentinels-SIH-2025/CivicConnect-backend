// config/passport.js
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import dotenv from "dotenv";

dotenv.config(); // Load environment variables from .env file

// Determine callback URL based on environment
const GOOGLE_CALLBACK_URL =
  process.env.NODE_ENV === "production"
    ? "https://civicconnect-backend-hxms.onrender.com/auth/google/callback"
    : "http://localhost:5000/auth/google/callback";

// ✅ Configure Google OAuth2 strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,      // Google Client ID from console
      clientSecret: process.env.GOOGLE_CLIENT_SECRET, // Google Client Secret
      callbackURL: GOOGLE_CALLBACK_URL,           // Use environment-aware callback
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Runs AFTER Google verifies the user
        // 'profile' contains user info from Google
        // Normally, save user in DB here

        const user = {
          googleId: profile.id,
          name: profile.displayName,
          email: profile.emails?.[0]?.value,
          avatar: profile.photos?.[0]?.value,
        };

        return done(null, user); // Pass user object forward
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

// Optional: serialize/deserialize for sessions if you’re using them
passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));
