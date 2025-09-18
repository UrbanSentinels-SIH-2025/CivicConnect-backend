// routes/auth.js
import express from "express";
import passport from "passport";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { checkNotLoggedIn } from "../middleware/checkNotLoggedIn.js";
import protect from "../middleware/protect.js";
const router = express.Router();

/**
 * 1️⃣ Start Google OAuth flow
 */
router.get(
  "/google",
  checkNotLoggedIn,
  passport.authenticate("google", { scope: ["profile", "email"] })
);

/**
 * 2️⃣ Google OAuth callback
 */
router.get(
  "/google/callback",
  checkNotLoggedIn,
  passport.authenticate("google", { failureRedirect: "/login", session: false }),
  async (req, res) => {
    const user = req.user; // comes from passport.js verify()

    // 🔹 Find or create user
    let existingUser = await User.findOne({ googleId: user.googleId });

    if (!existingUser) {
      // First-time login → create user
      existingUser = new User({
        googleId: user.googleId,
        name: user.name,
        email: user.email,
        picture: user.avatar,
      });
    } else {
      // Update user info in case Google profile changed
      existingUser.name = user.name;
      existingUser.picture = user.avatar;
    }

    await existingUser.save();

    // 3️⃣ Generate JWT
    const token = jwt.sign(
      { id: existingUser._id, email: existingUser.email },
      process.env.JWT_SECRET,
      { expiresIn: "3h" }
    );

    // 4️⃣ Send JWT in HTTP-only cookie
    res.cookie("auth-token", token, {
      httpOnly: true, // cookie not accessible via JS
      secure: false,  // true in production with HTTPS
      sameSite: "strict",
    });

    // 5️⃣ Redirect to frontend dashboard
 // 5️⃣ Redirect to frontend dashboard
const DASHBOARD_URL = `${process.env.FRONTEND_URL}/user/dashboard`;
res.redirect(DASHBOARD_URL);

  }
);

/**
 * 3️⃣ Get logged-in user details
 */
router.get("/me", protect,async (req, res) => {
  const token = req.cookies["auth-token"];
  if (!token) return res.status(401).json({ message: "Not logged in" });
   
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Fetch full user from DB (always latest info)
    const user = await User.findById(decoded.id).select("-__v");
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({ user });
  } catch (err) {
    console.error("JWT verification error:", err);
    res.status(401).json({ message: "Invalid or expired token" });
  }
});

/**
 * 4️⃣ Logout
 */
router.get("/logout", (req, res) => {
    console.log('logout called')
  res.clearCookie("auth-token"); // ✅ matches set cookie
  res.json({ message: "Logged out successfully" });
});

export default router;
