// src/models/User.js

import mongoose from "mongoose";

const userSchema = new mongoose.Schema({

  /* ======================
     BASIC USER INFO
  ====================== */

  name:{
    type:String
  },

  email:{
    type:String,
    required:true,
    unique:true,
    lowercase:true
  },

  password:{
    type:String,
    required:true
  },

  role:{
    type:String,
    default:"user"
  },

  isVerified:{
    type:Boolean,
    default:false
  },


  /* ======================
     USER CREDITS SYSTEM
  ====================== */

  credits:{
    type:Number,
    default:30
  },


  /* ======================
     SUBSCRIPTION PLAN
  ====================== */

  plan:{
    type:String,
    default:"Free"
  },

  planExpire:{
    type:Date
  },


  /* ======================
     PROFILE PICTURE
  ====================== */

  avatar:{
    type:String,
    default:""
  },


  /* ======================
     EMAIL VERIFICATION
  ====================== */

  verificationToken:String,
  verificationExpire:Date,


  /* ======================
     PASSWORD RESET / OTP
  ====================== */

  resetPasswordToken:String,
  resetPasswordExpire:Date,

  otpAttempts:{
    type:Number,
    default:0
  },


  /* ======================
     LOGIN SECURITY
  ====================== */

  failedLoginAttempts:{
    type:Number,
    default:0
  },

  lockUntil:Date,


  /* ======================
     ACCOUNT CREATED DATE
  ====================== */

  createdAt:{
    type:Date,
    default:Date.now
  }

});

export default mongoose.model("User",userSchema);