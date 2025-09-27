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
      default: "https://i.imgur.com/7S7qz6g.jpeg",
    },
    location: {
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true },
    },
    taskCompleteUrl: { type: String }, // remove required: true
taskCompletelocation: {
  latitude: { type: Number },
  longitude: { type: Number },
},

    // ✅ Track real/fake verification counts + user IDs
   verifications: {
  real: {
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    default: [],
  },
  fake: {
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    default: [],
  },
},


    progress: { type: ProgressSchema, default: () => ({}) },

    visibleTo: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);



export default mongoose.model("Issue", IssueSchema);
