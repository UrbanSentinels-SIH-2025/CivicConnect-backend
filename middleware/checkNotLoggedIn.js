// middleware/checkNotLoggedIn.js
import jwt from "jsonwebtoken";

export const checkNotLoggedIn = (req, res, next) => {
  const token = req.cookies?.["auth-token"];

  if (token) {
    try {
      jwt.verify(token, process.env.JWT_SECRET);
      console.log(process.env.FRONTEND_URL)
      // Use FRONTEND_URL env variable
      const DASHBOARD_URL = (process.env.FRONTEND_URL || "http://localhost:5173") + "/user/dashboard";

      return res.redirect(DASHBOARD_URL);
    } catch (err) {
      res.clearCookie("auth-token", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "none",
      });
    }
  }

  next();
};
