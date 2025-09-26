// routes/thumbnail.js
import express from "express";
const router = express.Router();

router.get("/thumbnail", (req, res) => {
  const videoUrl = req.query.videoUrl;
  if (!videoUrl) {
    return res.status(400).json({ error: "videoUrl is required" });
  }

  try {
    // convert Cloudinary video URL -> thumbnail URL
    const thumbnailUrl = videoUrl
      .replace("/upload/", "/upload/so_1/") // grab frame at 1s
      .replace(/\.(mp4|webm|mov)$/, ".jpg"); // force image format

    res.json({ thumbnailUrl });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to generate thumbnail URL" });
  }
});

export default router;
