// middleware/checkNotLoggedIn.js
import jwt from "jsonwebtoken";

export const checkNotLoggedIn = (req, res, next) => {
  const token = req.cookies?.["auth-token"];

  if (token) {
    try {
      jwt.verify(token, process.env.JWT_SECRET);

      // Determine frontend dashboard URL based on environment
      const DASHBOARD_URL =
        process.env.NODE_ENV === "production"
          ? "https://civicconnecturbansentinels.netlify.app/user/dashboard"
          : "http://localhost:5173/user/dashboard";

      // ✅ User already logged in → redirect to dashboard
      return res.redirect(DASHBOARD_URL);
    } catch (err) {
      // ❌ Invalid token → clear cookie
      res.clearCookie("auth-token");
    }
  }

  // Not logged in → continue with login flow
  next();
};
