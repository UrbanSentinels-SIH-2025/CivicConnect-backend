import jwt from "jsonwebtoken";

export const checkNotLoggedIn = (req, res, next) => {
  const token = req.cookies?.["auth-token"];

  if (token) {
    try {
      jwt.verify(token, process.env.JWT_SECRET);

      // Always use FRONTEND_URL from environment
      const DASHBOARD_URL = `${process.env.FRONTEND_URL}/user/dashboard`;

      return res.redirect(DASHBOARD_URL);
    } catch (err) {
      // Invalid token → clear cookie
      res.clearCookie("auth-token", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "none",
      });
    }
  }

  next();
};
