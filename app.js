import express from "express";
import connectDB from "./config/db.js";
import "./config/passport.js"; // just runs the strategy setup
import passport from "passport";
import cookieParser from "cookie-parser";
import cors from "cors";

import authRoutes from "./routes/auth.js";
import reportIssueRoutes from "./routes/reportIssue.js";
import userIssueRoutes from "./routes/userIssue.js"
const app = express();

// 🔹 Connect to MongoDB
connectDB();

// 🔹 Middleware
app.use(express.json());
app.use(cookieParser());


const allowedOrigins = [
  "http://localhost:5173", // React local dev
  "https://civicconnecturbansentinels.netlify.app", // Netlify prod
];

// Allow frontend to call backend
app.use(
  cors({
    origin: (origin, callback) => {
      // allow requests with no origin (like mobile apps or curl)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("❌ Not allowed by CORS"));
      }
    },
    credentials: true, // ✅ allow cookies
  })
);

// 🔹 Initialize passport
app.use(passport.initialize());

// 🔹 Routes
app.use("/auth", authRoutes);
app.use("/report-issue", reportIssueRoutes);
app.use("/user-issue",userIssueRoutes);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

export default app;
