import dotenv from "dotenv";
dotenv.config();
import app from "./app.js";

// ✅ Use Render’s provided PORT or fallback to 5000 for local dev
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
