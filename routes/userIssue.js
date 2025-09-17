// routes/userIssues.js
import express from "express";
import protect from "../middleware/protect.js";
import Issues from "../models/Issues.js";


const router = express.Router();

// GET /api/user-issues
// Returns all issues created by the logged-in user with user details populated
router.get("/", protect, async (req, res) => {
  try {
    // req.user is populated by protect middleware
    const userId = req.user.id;

    // Fetch issues created by this user and populate user data
    const userIssues = await Issues.find({ createdBy: userId })
      .sort({ createdAt: -1 })
     
    res.status(200).json({
      message: "User issues fetched successfully",
      issues: userIssues,
    });
  } catch (err) {
    console.error("Error fetching user issues:", err);
    res.status(500).json({ message: "Failed to fetch user issues" });
  }
});


/* ------------ issues of all users for the admin dashboard ----------------- */
router.get("/all-issue", async (req, res) => {
  try {
    const issues = await Issues.find().populate("createdBy", "name email"); 
    // optional: populate user info

    res.status(200).json({
      success: true,
      count: issues.length,
      issues,
    });
  } catch (err) {
    console.error("Error fetching issues:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch issues",
    });
  }
});


export default router;
