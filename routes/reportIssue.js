import express from "express";
import multer from "multer";
import { Readable } from "stream";
import Issues from "../models/Issues.js";
import protect from "../middleware/protect.js";
import cloudinary from "../config/cloudinary.js"; // ✅ use configured instance

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
    // Upload to Cloudinary
    const result = await streamUpload(req.file.buffer);
  

    // Save to DB
    const issue = new Issues({
      title,
      category,
      videoUrl: result.secure_url,
      location: {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
      },
      createdBy: req.user ? req.user.id : null,
    });

    await issue.save();

    res.status(201).json({
      message: "Issue reported successfully",
      issue,
    });
  } catch (err) {
    console.error("Error uploading video:", err);
    res.status(500).json({ message: "Report submission failed" });
  }
});

export default router;
