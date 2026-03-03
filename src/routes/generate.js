import express from "express";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import { generateCaption } from "../services/hfService.js";
import { generateImage } from "../services/imageService.js";
import Campaign from "../models/Campaign.js";
import { protect } from "../middleware/authMiddleware.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

/* ===============================
   📂 Multer Setup
=================================*/
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../uploads"));
  },
  filename: (req, file, cb) => {
    cb(null, `logo-${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ storage });

/* ===============================
   🎨 Generate Poster (Protected)
=================================*/
router.post("/", protect, upload.single("logo"), async (req, res) => {
  try {
    const { prompt, size, tone } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    const caption = await generateCaption(
      tone
        ? `Write a ${tone} social media caption for: ${prompt}`
        : prompt
    );

    const logoPath = req.file ? req.file.path : null;

    const imageUrl = await generateImage(
      prompt,
      caption,
      size,
      logoPath
    );

    const campaign = await Campaign.create({
      user: req.user.id,
      prompt,
      caption,
      imageUrl
    });

    res.json(campaign);

  } catch (error) {
    console.error("FULL ERROR:", error);
    res.status(500).json({ error: error.message });
  }
});

/* ===============================
   📜 Get User History
=================================*/
router.get("/history", protect, async (req, res) => {
  try {
    const campaigns = await Campaign.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .limit(5);

    res.json(campaigns);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* ===============================
   ⬇️ Download Poster
=================================*/
router.get("/download/:filename", (req, res) => {
  try {
    const filePath = path.join(__dirname, "../uploads", req.params.filename);
    res.download(filePath);
  } catch (error) {
    res.status(500).json({ error: "Download failed" });
  }
});

export default router;