import express from "express";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";

import { generateCaption } from "../services/hfService.js";
import { generateImage } from "../services/imageService.js";

import Campaign from "../models/Campaign.js";
import ActivityLog from "../models/ActivityLog.js";

import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


/* ===============================
   📂 MULTER SETUP
=================================*/

const storage = multer.diskStorage({

  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../uploads"));
  },

  filename: (req, file, cb) => {
    cb(
      null,
      `logo-${Date.now()}${path.extname(file.originalname)}`
    );
  }

});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});


/* ===============================
   🎨 GENERATE POSTER (PROTECTED)
=================================*/

router.post("/", protect, upload.single("logo"), async (req, res) => {

  try {

    const { prompt, size, tone } = req.body;

    if (!prompt) {
      return res.status(400).json({
        error: "Prompt is required"
      });
    }

    /* GENERATE CAPTION */

    const caption = await generateCaption(

      tone
        ? `Write a ${tone} marketing caption for: ${prompt}`
        : prompt

    );


    /* LOGO PATH */

    const logoPath = req.file
      ? req.file.path
      : null;


    /* GENERATE IMAGE */

    const imageUrl = await generateImage(
      prompt,
      caption,
      size,
      logoPath
    );


    /* SAVE CAMPAIGN */

    const campaign = await Campaign.create({

      user: req.user.id,
      prompt,
      caption,
      imageUrl

    });


    /* SAVE ACTIVITY LOG */

    await ActivityLog.create({

      user: req.user.id,
      action: "generate_ad",
      details: prompt,
      ip: req.ip

    });


    res.json(campaign);


  } catch (error) {

    console.error("GENERATE ERROR:", error);

    res.status(500).json({
      error: "Poster generation failed"
    });

  }

});


/* ===============================
   📜 GET USER HISTORY
=================================*/

router.get("/history", protect, async (req, res) => {

  try {

    const campaigns = await Campaign
      .find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .limit(20);

    res.json(campaigns);

  } catch (error) {

    console.error("HISTORY ERROR:", error);

    res.status(500).json({
      error: "Failed to fetch history"
    });

  }

});


/* ===============================
   🗑️ DELETE CAMPAIGN
=================================*/

router.delete("/campaign/:id", protect, async (req, res) => {

  try {

    const campaign = await Campaign.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!campaign) {
      return res.status(404).json({
        error: "Campaign not found"
      });
    }

    await campaign.deleteOne();

    res.json({
      message: "Campaign deleted successfully"
    });

  } catch (error) {

    console.error("DELETE CAMPAIGN ERROR:", error);

    res.status(500).json({
      error: "Failed to delete campaign"
    });

  }

});

/* ===============================
   📜 GET SINGLE CAMPAIGN
=================================*/

router.get("/campaign/:id", protect, async (req, res) => {

  try {

    const campaign = await Campaign.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!campaign) {
      return res.status(404).json({
        error: "Campaign not found"
      });
    }

    res.json(campaign);

  } catch (error) {

    res.status(500).json({
      error: "Failed to load campaign"
    });

  }

});


/* ===============================
   ⬇️ DOWNLOAD POSTER
=================================*/

router.get("/download/:filename", async (req, res) => {

  try {

    const filePath = path.join(
      __dirname,
      "../uploads",
      req.params.filename
    );

    res.download(filePath);

  } catch (error) {

    console.error("DOWNLOAD ERROR:", error);

    res.status(500).json({
      error: "Download failed"
    });

  }

});


export default router;