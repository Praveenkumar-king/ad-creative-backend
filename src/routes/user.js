import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import User from "../models/User.js";

const router = express.Router();

/* ======================
   GET USER PROFILE
====================== */

router.get("/profile", protect, async (req,res)=>{

  try{

    const user = await User.findById(req.user._id).select("-password");

    res.json(user);

  }catch(err){

    console.error(err);

    res.status(500).json({
      error:"Failed to fetch profile"
    });

  }

});

export default router;