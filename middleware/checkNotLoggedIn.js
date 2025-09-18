import jwt from "jsonwebtoken";

export const checkNotLoggedIn = (req, res, next) => {
  const token = req.cookies?.["auth-token"];

  if (token) {
    try {
      jwt.verify(token, process.env.JWT_SECRET);

      const FRONTEND_URL = process.env.FRONTEND_URL;
      if (!FRONTEND_URL) {
        console.warn("FRONTEND_URL is not set!");
      }

      const DASHBOARD_URL = (FRONTEND_URL || "http://localhost:5173") + "/user/dashboard";
      console.log("Redirecting to:", DASHBOARD_URL);

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
