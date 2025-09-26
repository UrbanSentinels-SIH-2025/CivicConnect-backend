// routes/userIssues.js
import express from "express";
import { Readable } from "stream";

import multer from "multer";
import protect from "../middleware/protect.js";
import Issues from "../models/Issues.js";
import User from "../models/User.js";
import mongoose from "mongoose";
const router = express.Router();
import cloudinary from "../config/cloudinary.js"; // ✅ use configured instance
const upload = multer({ limits: { fileSize: 50 * 1024 * 1024 } }); // 50 MB


// Helper to stream upload to Cloudinary
const streamUpload = (fileBuffer) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: "video",
        folder: "report-videos",
      },
      (error, result) => {
        if (result) resolve(result);
        else reject(error);
      }
    );
    Readable.from(fileBuffer).pipe(stream);
  });
};

// GET /api/user-issues
// Returns all issues created by the logged-in user with user details populated
router.get("/", protect, async (req, res) => {
  try {
    const userId = req.user.id;

    // Fetch issues without populate first to see the raw data
    const userIssues = await Issues.find({ createdBy: userId })
      .sort({ createdAt: -1 });

    console.log("Raw user issues:", JSON.stringify(userIssues[0]?.verifications, null, 2));

    // If verifications.real exists but is empty in response, it might be a schema issue
    const modifiedIssues = userIssues.map(issue => ({
      ...issue._doc,
      verifications: {
        real: issue.verifications?.real || [],
        fake: issue.verifications?.fake || []
      }
    }));
     
    res.status(200).json({
      message: "User issues fetched successfully",
      issues: modifiedIssues,
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

router.get("/issue/:id",  async (req, res) => {
  try {
    const issueId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(issueId)) {
      return res.status(400).json({ message: "Invalid issue ID" });
    }
    const issue = await Issues.findById(issueId).populate("createdBy", "name email picture");
    if (!issue) {
      return res.status(404).json({ message: "Issue not found" });
    }
    res.json(issue);
  } catch (err) {
    console.error("Error fetching issue:", err);
    res.status(500).json({ message: "Failed to fetch issue" });
  }
});


router.get("/other-issues", protect, async (req, res) => {
  try {
    const issues = await Issues.find({
      visibleTo: req.user.id,            // visible to logged-in user
      createdBy: { $ne: req.user.id },   // exclude their own issues
    // not in fake verifications
    }).populate("createdBy", "name email picture");

    res.json(issues);
   
  } catch (err) {
    console.error("Error fetching other-issues:", err);
    res.status(500).json({ message: "Failed to fetch issues" });
  }
});

// access url 
//user-issues/department-issues/:department
router.get("/department-issues/:department", async (req, res) => {
  try {
    const department = req.params.department;
 
   const issues = await Issues.find({
  category: department,
  "progress.verified.completed": true
}).populate("createdBy", "name email picture");

    res.json(issues);

  } catch (err) {
    console.error("Error fetching department-issues:", err);
    res.status(500).json({ message: "Failed to fetch issues" });
  }
});

router.patch("/department-issues/progress", upload.single("video"), async (req, res) => {
  try {
    const { id, progressStage, lat, lng } = req.body;
    console.log(req.body)
    if (!["inProgress", "resolved"].includes(progressStage)) {
      return res.status(400).json({ message: "Invalid progress stage" });
    }

    // Fields to update
    const updateFields = {
      [`progress.${progressStage}`]: { completed: true, date: new Date() },
    };

    let taskCompleteUrl = null;

    // Upload video and set taskCompleteUrl in DB if stage is resolved
    if (progressStage === "resolved" && req.file) {
      const result = await streamUpload(req.file.buffer);
      taskCompleteUrl = result.secure_url;
      updateFields.taskCompleteUrl = taskCompleteUrl; // ✅ saved in DB
    }

    // Save task completion location in DB if provided
    if (lat && lng) {
      updateFields.taskCompletelocation = {
        latitude: parseFloat(lat),
        longitude: parseFloat(lng),
      }; // ✅ saved in DB
    }

    // Update issue in MongoDB
    const updatedIssue = await Issues.findByIdAndUpdate(
      id,
      { $set: updateFields },
      { new: true }
    );

    if (!updatedIssue) return res.status(404).json({ message: "Issue not found" });

    res.json({
      message: "Issue progress updated",
      progress: updatedIssue.progress,
      taskCompleteUrl: updatedIssue.taskCompleteUrl,        // returned from DB
      taskCompletelocation: updatedIssue.taskCompletelocation, // returned from DB
    });
  } catch (err) {
    console.error("Error updating issue progress:", err);
    res.status(500).json({ message: "Failed to update issue progress" });
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

router.post("/verify-issues", protect, async (req, res) => {
  try {
    const { id, type } = req.body;

    if (!["real", "fake"].includes(type)) {
      return res.status(400).json({ error: "Invalid verification type" });
    }

    const issue = await Issues.findById(id);
    if (!issue) return res.status(404).json({ error: "Issue not found" });

   

    // Prevent duplicate verification
    const alreadyVerified = issue.verifications.real
      .concat(issue.verifications.fake)
      .some(id => id.toString() === req.user.id);

    if (alreadyVerified) {
      return res.status(400).json({ error: "User already verified this issue" });
    }

    issue.verifications[type].push(req.user.id);

    const VERIFIED_THRESHOLD = 5;
    if (issue.verifications.real.length > VERIFIED_THRESHOLD) {
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
