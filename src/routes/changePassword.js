import express from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { protect } from "../middleware/authMiddleware.js";
import User from "../models/User.js";

import {
sendPasswordOTPEmail,
sendPasswordChangedAlert
} from "../services/emailService.js";

const router = express.Router();


/* ======================
   SEND OTP
====================== */

router.post("/send-otp",protect,async(req,res)=>{

try{

const user = await User.findById(req.user.id);

if(!user){
return res.status(404).json({error:"User not found"});
}


/* RESEND COOLDOWN */

if(user.resetPasswordExpire && user.resetPasswordExpire > Date.now()-60000){
return res.status(429).json({
error:"Please wait before requesting another OTP"
});
}


/* GENERATE OTP */

const otp = Math.floor(100000 + Math.random()*900000).toString();

const hashedOTP = crypto
.createHash("sha256")
.update(otp)
.digest("hex");

user.resetPasswordToken = hashedOTP;
user.resetPasswordExpire = Date.now() + 10*60*1000;

user.otpAttempts = 0;

await user.save();


/* SEND EMAIL */

const emailRes = await sendPasswordOTPEmail(
user.email,
otp,
user.name || "User"
);

if(!emailRes.sent){
throw new Error("Email send failed");
}

res.json({message:"OTP sent successfully"});

}catch(err){

console.error(err);

res.status(500).json({
error:"Failed to send OTP"
});

}

});



/* ======================
   VERIFY OTP
====================== */

router.post("/verify-otp",protect,async(req,res)=>{

try{

const {otp,newPassword} = req.body;

if(!otp || !newPassword){
return res.status(400).json({
error:"OTP and new password required"
});
}

const hashedOTP = crypto
.createHash("sha256")
.update(otp)
.digest("hex");

const user = await User.findById(req.user.id);

if(!user){
return res.status(404).json({
error:"User not found"
});
}


/* OTP ATTEMPT LIMIT */

if(user.otpAttempts >= 3){
return res.status(429).json({
error:"Too many OTP attempts"
});
}


/* OTP CHECK */

if(user.resetPasswordToken !== hashedOTP){

user.otpAttempts += 1;

await user.save();

return res.status(400).json({
error:"Invalid OTP"
});

}


/* OTP EXPIRY */

if(user.resetPasswordExpire < Date.now()){
return res.status(400).json({
error:"OTP expired"
});
}


/* UPDATE PASSWORD */

const hashedPassword = await bcrypt.hash(newPassword,10);

user.password = hashedPassword;

user.resetPasswordToken = undefined;
user.resetPasswordExpire = undefined;
user.otpAttempts = 0;

await user.save();


/* LOGOUT DEVICES */

res.clearCookie("token");


/* SECURITY ALERT */

await sendPasswordChangedAlert(
user.email,
user.name
);

res.json({
message:"Password updated successfully"
});

}catch(err){

console.error(err);

res.status(500).json({
error:"Password change failed"
});

}

});

export default router;