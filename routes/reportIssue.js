import express from "express";
import multer from "multer";
import { Readable } from "stream";
import Issues from "../models/Issues.js";
import protect from "../middleware/protect.js";
import cloudinary from "../config/cloudinary.js"; // ✅ use configured instance
import User from "../models/User.js";
const router = express.Router();
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

// POST /api/issues
router.post("/", protect, upload.single("video"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No video file provided" });
    }

    const { category, title, latitude, longitude } = req.body;
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    // Upload video
    const result = await streamUpload(req.file.buffer);

    // Get all users except reporter
    const allUsers = await User.find({ _id: { $ne: req.user.id } });

    // Haversine formula to calculate distance
    const toRadians = deg => (deg * Math.PI) / 180;
    const distance = (lat1, lon1, lat2, lon2) => {
      const R = 6371000; // radius of Earth in meters
      const dLat = toRadians(lat2 - lat1);
      const dLon = toRadians(lon2 - lon1);
      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRadians(lat1)) *
          Math.cos(toRadians(lat2)) *
          Math.sin(dLon / 2) ** 2;
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c; // distance in meters
    };

    // Filter nearby users within 500m
    const nearbyUsers = allUsers.filter(user => {
      if (!user.location?.lat || !user.location?.lng) return false;
      return distance(lat, lng, user.location.lat, user.location.lng) <= 500;
    });

    // Collect user IDs (nearby + reporter)
    const visibleUserIds = [
      ...nearbyUsers.map(u => u._id),
      req.user.id, // reporter should always see their issue
    ];

    // Save issue with visibleTo field
    const issue = new Issues({
      title,
      category,
      videoUrl: result.secure_url,
      location: { latitude: lat, longitude: lng },
      createdBy: req.user ? req.user.id : null,
      visibleTo: visibleUserIds,
    });
    await issue.save();

    res.status(201).json({
      message: "Issue reported successfully",
      issue,
      nearbyUsersCount: nearbyUsers.length,
    });
  } catch (err) {
    console.error("Error uploading video:", err);
    res.status(500).json({ message: "Report submission failed" });
  }
});




export default router;
