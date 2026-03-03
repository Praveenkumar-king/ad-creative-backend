import express from "express";
import dotenv from "dotenv";
import { connectDB } from "./config/db.js";
import generateRoute from "./routes/generate.js";
import authRoutes from "./routes/auth.js";
import cors from "cors";

dotenv.config();
connectDB();

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Serve uploaded images
app.use("/uploads", express.static("src/uploads"));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/generate", generateRoute);

// Root
app.get("/", (req, res) => {
  res.send("Ad Creative Backend Running 🚀");
});

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});