import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import Campaign from "../models/Campaign.js";

const router = express.Router();

/* ==========================
   GET USER CAMPAIGNS
========================== */

router.get("/my-campaigns",protect,async(req,res)=>{

  try{

    const campaigns = await Campaign.find({
      user:req.user.id
    }).sort({createdAt:-1});

    res.json(campaigns);

  }catch(err){

    res.status(500).json({
      error:"Failed to fetch campaigns"
    });

  }

});

export default router;