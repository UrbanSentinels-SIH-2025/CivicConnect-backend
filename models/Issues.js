import mongoose from "mongoose";

const ProgressSchema = new mongoose.Schema(
  {
    reported: {
      date: { type: Date, default: Date.now },
      completed: { type: Boolean, default: false },
    },
    verified: {
      date: { type: Date, default: null },
      completed: { type: Boolean, default: false },
    },
    inProgress: {
      date: { type: Date, default: null },
      completed: { type: Boolean, default: false },
    },
    resolved: {
      date: { type: Date, default: null },
      completed: { type: Boolean, default: false },
    },
  },
  { _id: false }
);

const IssueSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    category: {
      type: String,
      required: true,
      enum: ["Road", "Water", "Street", "Electricity", "Sanitation", "Other"],
    },
    videoUrl: { type: String, required: true },
    thumbnail: {
      type: String,
      default: "https://i.imgur.com/7S7qz6g.jpeg", // default thumbnail
    },
    location: {
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true },
    },
    verifications: { type: Number, default: 0 },
    progress: { type: ProgressSchema, default: () => ({}) },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Issue", IssueSchema);
