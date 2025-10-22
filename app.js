import express from "express";
import connectDB from "./config/db.js";
import "./config/passport.js"; // just runs the strategy setup
import passport from "passport";
import cookieParser from "cookie-parser";
import cors from "cors";

import authRoutes from "./routes/auth.js";
import reportIssueRoutes from "./routes/reportIssue.js";
import userIssueRoutes from "./routes/userIssue.js"
import thumbnailsRoutes from "./routes/thumbnails.js";
import adminRoutes from "./routes/adminRoutes.js"
const app = express();

// 🔹 Connect to MongoDB
connectDB();

// 🔹 Middleware
app.use(express.json());
app.use(cookieParser());


const allowedOrigins = [
  "http://localhost:5173",
  "https://civicconnecturbansentinels.netlify.app",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

// 🔹 Initialize passport
app.use(passport.initialize());

// 🔹 Routes
app.use("/auth", authRoutes);
app.use("/report-issue", reportIssueRoutes);
app.use("/user-issue",userIssueRoutes);
app.use("/thumbnails", thumbnailsRoutes);
app.use("/admin",adminRoutes)
app.get("/", (req, res) => {
  res.send("Hello World!");
});

export default app;
