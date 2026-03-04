import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

import { connectDB } from "./config/db.js";
import generateRoute from "./routes/generate.js";
import authRoutes from "./routes/auth.js";
import User from "./models/User.js";

dotenv.config();
connectDB();

const app = express();

/* ===============================
   MIDDLEWARE
=================================*/
app.use(express.json());
app.use(cors());

/* ===============================
   STATIC FILES (POSTER IMAGES)
=================================*/
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

/* ===============================
   ROUTES
=================================*/
app.use("/api/generate", generateRoute);
app.use("/api/auth", authRoutes);

/* ===============================
   ROOT ROUTE
=================================*/
app.get("/", (req, res) => {
  res.send("Ad Creative Backend Running 🚀");
});

/* ===============================
   CLEANUP EXPIRED TOKENS
=================================*/
setInterval(async () => {
  try {

    // remove expired reset tokens
    await User.updateMany(
      { resetPasswordExpire: { $lt: Date.now() } },
      {
        $unset: {
          resetPasswordToken: "",
          resetPasswordExpire: ""
        }
      }
    );

    // remove expired verification tokens
    await User.updateMany(
      { verificationExpire: { $lt: Date.now() } },
      {
        $unset: {
          verificationToken: "",
          verificationExpire: ""
        }
      }
    );

    console.log("Expired tokens cleaned");

  } catch (error) {
    console.error("Cleanup Job Error:", error.message);
  }
}, 1000 * 60 * 60); // every 1 hour

/* ===============================
   START SERVER
=================================*/
const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});