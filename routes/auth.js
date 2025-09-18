import express from "express";
import passport from "passport";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { checkNotLoggedIn } from "../middleware/checkNotLoggedIn.js";
import protect from "../middleware/protect.js";

const router = express.Router();

// 1️⃣ Start Google OAuth
router.get(
  "/google",
  checkNotLoggedIn,
  passport.authenticate("google", { scope: ["profile", "email"] })
);

// 2️⃣ Google OAuth callback
router.get(
  "/google/callback",
  checkNotLoggedIn,
  passport.authenticate("google", { session: false, failureRedirect: "/" }),
  async (req, res) => {
    const user = req.user;

    let existingUser = await User.findOne({ googleId: user.googleId });
    if (!existingUser) {
      existingUser = new User({
        googleId: user.googleId,
        name: user.name,
        email: user.email,
        picture: user.avatar,
      });
    } else {
      existingUser.name = user.name;
      existingUser.picture = user.avatar;
    }
    await existingUser.save();

    const token = jwt.sign(
      { id: existingUser._id, email: existingUser.email },
      process.env.JWT_SECRET,
      { expiresIn: "3h" }
    );

    // ✅ Send cookie (cross-site safe in prod)
    res.cookie("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
      maxAge: 1000 * 60 * 60 * 3,
    });

    // ✅ Redirect to frontend dashboard
    const DASHBOARD_URL = `${process.env.FRONTEND_URL}/user/dashboard`;
    res.redirect(DASHBOARD_URL);
  }
);

// 3️⃣ Get logged-in user
router.get("/me", protect, async (req, res) => {
  const token = req.cookies["auth-token"];
  if (!token) return res.status(401).json({ message: "Not logged in" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-__v");
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({ user });
  } catch (err) {
    res.status(401).json({ message: "Invalid or expired token" });
  }
});

// 4️⃣ Logout
router.get("/logout", (req, res) => {
  res.clearCookie("auth-token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
  });
  res.json({ message: "Logged out" });
});

export default router;
