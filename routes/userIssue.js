// routes/userIssues.js
import express from "express";
import protect from "../middleware/protect.js";
import Issues from "../models/Issues.js";
import User from "../models/User.js";

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


router.get("/other-issues", protect, async (req, res) => {
  try {
    const issues = await Issues.find({
      visibleTo: req.user.id,          // visible to logged-in user
      createdBy: { $ne: req.user.id }  // exclude their own issues
    })
      .populate("createdBy", "name email picture");

    res.json(issues);
  } catch (err) {
    console.error("Error fetching my-issues:", err);
    res.status(500).json({ message: "Failed to fetch issues" });
  }
});




router.patch("/set-location", protect, async (req, res) => {
  try {
    const { lat, lng } = req.body;
    if (lat == null || lng == null) {
      return res.status(400).json({ message: "Latitude and longitude are required" });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.location = { lat, lng };
    user.firstTime = false; // mark first login as completed
    await user.save();

    res.json({ message: "Location updated successfully", location: user.location });
  } catch (err) {
    console.error("Error updating location:", err);
    res.status(500).json({ message: "Server error" });
  }
});


// Update location after first setup
router.patch("/update-location", protect, async (req, res) => {
  console.log(req.body)
  try {
    const { lat, lng } = req.body;

    if (lat == null || lng == null) {
      return res.status(400).json({ message: "Latitude and longitude are required" });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Only update location (do not touch firstTime)
    user.location = { lat, lng };
    await user.save();

    res.json({ message: "Location updated successfully", location: user.location });
  } catch (err) {
    console.error("Error updating location:", err);
    res.status(500).json({ message: "Server error" });
  }
});


//Verify Other user Issues
router.post("/verify-issues", async (req, res) => {
  try {
    const { id, type, userId } = req.body; // id = issueId, type = "real"/"fake", userId = verifier

    if (!["real", "fake"].includes(type)) {
      return res.status(400).json({ error: "Invalid verification type" });
    }

    const issue = await Issues.findById(id);
    if (!issue) {
      return res.status(404).json({ error: "Issue not found" });
    }

    // ✅ prevent duplicate verification
    if (
      issue.verifications.real.includes(userId) ||
      issue.verifications.fake.includes(userId)
    ) {
      return res.status(400).json({ error: "User already verified this issue" });
    }

    // ✅ add userId to chosen type
    issue.verifications[type].push(userId);

    // ✅ update verified progress only if real > 5
    if (issue.verifications.real.length > 5) {
      issue.progress.verified.completed = true;
      issue.progress.verified.date = new Date();
    }

    await issue.save();

    res.status(200).json({
      message: `Verification recorded as ${type}`,
      verifications: {
        real: issue.verifications.real.length,
        fake: issue.verifications.fake.length,
      },
      progress: issue.progress,
    });
  } catch (error) {
    console.error("Error verifying issue:", error);
    res.status(500).json({ error: "Server error" });
  }
});






export default router;
