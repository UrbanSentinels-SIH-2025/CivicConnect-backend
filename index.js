import dotenv from "dotenv";
dotenv.config();
import app from "./app.js";

console.log(process.env.GOOGLE_CLIENT_ID);

const PORT = 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
