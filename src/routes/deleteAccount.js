import express from "express";
import bcrypt from "bcryptjs";
import { protect } from "../middleware/authMiddleware.js";
import User from "../models/User.js";

const router = express.Router();

/* ==========================
   DELETE ACCOUNT (PASSWORD VERIFY)
========================== */

router.post("/delete-account", protect, async (req,res)=>{

  try{

    const {password} = req.body;

    if(!password){
      return res.status(400).json({
        error:"Password required"
      });
    }

    const user = await User.findById(req.user._id);

    if(!user){
      return res.status(404).json({
        error:"User not found"
      });
    }

    const match = await bcrypt.compare(
      password,
      user.password
    );

    if(!match){
      return res.status(401).json({
        error:"Incorrect password"
      });
    }

    await User.findByIdAndDelete(user._id);

    res.clearCookie("token");

    res.json({
      message:"Account deleted successfully"
    });

  }catch(err){

    console.error(err);

    res.status(500).json({
      error:"Delete account failed"
    });

  }

});

export default router;