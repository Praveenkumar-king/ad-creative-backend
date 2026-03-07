import express from "express";
import Razorpay from "razorpay";
import { protect } from "../middleware/authMiddleware.js";
import User from "../models/User.js";
import { sendSubscriptionSuccessEmail } from "../services/emailService.js";

const router = express.Router();

/* ==========================
   SAFE RAZORPAY INSTANCE
========================== */

let razorpay = null;

if(process.env.RAZORPAY_KEY && process.env.RAZORPAY_SECRET){

  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY,
    key_secret: process.env.RAZORPAY_SECRET
  });

}else{

  console.log("⚠ Razorpay keys not found. Payment disabled.");

}

/* ==========================
   SUBSCRIPTION PLANS
========================== */

const plans = {

  starter:{
    name:"Starter",
    price:19900,
    credits:100,
    duration:30
  },

  pro:{
    name:"Pro",
    price:49900,
    credits:300,
    duration:30
  },

  business:{
    name:"Business",
    price:99900,
    credits:800,
    duration:30
  }

};

/* ==========================
   CREATE ORDER
========================== */

router.post("/create-order",protect,async(req,res)=>{

  try{

    if(!razorpay){
      return res.status(500).json({
        error:"Razorpay not configured"
      });
    }

    const {planId} = req.body;

    const plan = plans[planId];

    if(!plan){
      return res.status(400).json({
        error:"Invalid plan"
      });
    }

    const order = await razorpay.orders.create({

      amount:plan.price,
      currency:"INR",
      receipt:`plan_${planId}_${Date.now()}`

    });

    res.json({
      orderId:order.id,
      amount:plan.price,
      plan
    });

  }catch(err){

    console.error(err);

    res.status(500).json({
      error:"Order creation failed"
    });

  }

});

/* ==========================
   VERIFY PAYMENT
========================== */

router.post("/verify-payment",protect,async(req,res)=>{

  try{

    const {planId} = req.body;

    const plan = plans[planId];

    if(!plan){
      return res.status(400).json({
        error:"Invalid plan"
      });
    }

    const user = await User.findById(req.user.id);

    /* ADD CREDITS */

    user.credits += plan.credits;

    /* PLAN EXPIRY */

    const expireDate = new Date();
    expireDate.setDate(expireDate.getDate()+plan.duration);

    user.plan = plan.name;
    user.planExpire = expireDate;

    await user.save();

    /* SEND EMAIL */

    await sendSubscriptionSuccessEmail(
      user.email,
      user.name,
      plan.name,
      expireDate
    );

    res.json({
      message:"Subscription activated"
    });

  }catch(err){

    console.error(err);

    res.status(500).json({
      error:"Payment verification failed"
    });

  }

});

export default router;