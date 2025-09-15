// middleware/checkNotLoggedIn.js
import jwt from "jsonwebtoken";

export const checkNotLoggedIn = (req, res, next) => {
  const token = req.cookies?.["auth-token"];

  if (token) {
    try {
      jwt.verify(token, process.env.JWT_SECRET);
  
      // ✅ User already logged in → redirect to dashboard
      return res.redirect("http://localhost:5173/user/dashboard");
    } catch (err) {
      // ❌ Invalid token → clear cookie
      res.clearCookie("token");
    }
  }

  // Not logged in → continue with login flow
  next();
};
