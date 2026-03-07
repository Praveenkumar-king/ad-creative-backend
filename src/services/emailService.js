// src/services/emailService.js
import axios from "axios";

const SIB_API = "https://api.sendinblue.com/v3/smtp/email";

async function sendEmail({ toEmail, subject, htmlContent }) {

  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL || "ad-creative-project@outlook.com";
  const senderName = process.env.BREVO_SENDER_NAME || "AdVantage Gen";

  if (!apiKey) {
    return { sent: false, demo: true };
  }

  try {

    const payload = {
      sender: { email: senderEmail, name: senderName },
      to: [{ email: toEmail }],
      subject,
      htmlContent
    };

    const res = await axios.post(SIB_API, payload, {
      headers: {
        "Content-Type": "application/json",
        "api-key": apiKey
      },
      timeout: 15000
    });

    if (res.status >= 200 && res.status < 300) {
      return { sent: true };
    } else {
      return { sent: false, error: res.data || res.statusText };
    }

  } catch (err) {

    return { sent: false, error: err.response?.data || err.message || err };

  }

}


/* ===============================
   EMAIL VERIFICATION
================================ */

export async function sendVerificationEmail(toEmail, rawToken, userName = "User") {

  const frontend = process.env.FRONTEND_URL || "http://localhost:5173";

  const link = `${frontend}/verify/${rawToken}`;

  const html = `

  <div style="font-family: Arial, sans-serif; background:#f7f7f7; padding:24px">

    <div style="max-width:680px;margin:auto;background:#0f172a;color:#fff;padding:28px;border-radius:12px">

      <h1>AdVantage Gen</h1>

      <h2 style="text-align:center">Verify your email</h2>

      <p style="text-align:center">
      Hi 👋 ${userName},<br/>
      Please verify your email to activate your account and start generating images.
      </p>

      <div style="text-align:center;margin:25px 0">
        <a href="${link}"
        style="padding:12px 24px;background:#06b6d4;color:white;border-radius:28px;text-decoration:none;font-weight:600">
        Verify Email
        </a>
      </div>

      <p style="color:#ff6b6b;text-align:center">
      Note: This link expires in 15 minutes
      </p>

      <p style="font-size:12px">
      Thanks,<br/>
      Team AdVantage Gen ❤️
      </p>

      <hr/>

      <p style="font-size:11px;text-align:center">
      © ${new Date().getFullYear()} AdVantage Gen. All rights reserved.
      </p>

    </div>

  </div>

  `;

  return sendEmail({
    toEmail,
    subject: `${userName} - Please verify your email address`,
    htmlContent: html
  });

}



/* ===============================
   RESET PASSWORD EMAIL
================================ */

export async function sendResetEmail(toEmail, rawToken, userName = "User") {

  const frontend = process.env.FRONTEND_URL || "http://localhost:5173";

  const link = `${frontend}/reset-password/${rawToken}`;

  const html = `

  <div style="font-family: Arial, sans-serif; background:#f7f7f7; padding:24px">

    <div style="max-width:680px;margin:auto;background:#0f172a;color:#fff;padding:28px;border-radius:12px">

      <h1>AdVantage Gen</h1>

      <h2 style="text-align:center">Reset Password</h2>

      <p style="text-align:center">
      Hi 👋 ${userName},<br/>
      You requested a password reset for your account.
      </p>

      <div style="text-align:center;margin:25px 0">
        <a href="${link}"
        style="padding:12px 24px;background:#06b6d4;color:white;border-radius:28px;text-decoration:none;font-weight:600">
        Reset Password
        </a>
      </div>

      <p style="color:#ff6b6b;text-align:center">
      Note: This link expires in 15 minutes
      </p>

      <p style="font-size:12px">
      Thanks,<br/>
      Team AdVantage Gen ❤️
      </p>

      <hr/>

      <p style="font-size:11px;text-align:center">
      © ${new Date().getFullYear()} AdVantage Gen. All rights reserved.
      </p>

    </div>

  </div>

  `;

  return sendEmail({
    toEmail,
    subject: `${userName} - You requested a password reset`,
    htmlContent: html
  });

}



/* ===============================
   CHANGE PASSWORD OTP EMAIL
================================ */

export async function sendPasswordOTPEmail(email, otp, name="User"){

const html = `

<div style="font-family:Arial;background:#f7f7f7;padding:24px">

<div style="max-width:600px;margin:auto;background:#0f172a;color:white;padding:30px;border-radius:12px">

<h1>AdVantage Gen</h1>

<h2>Password Change OTP</h2>

<p>Hello ${name}</p>

<p>Your OTP for password change is:</p>

<h1 style="text-align:center;color:#22c55e">${otp}</h1>

<p>This OTP expires in 10 minutes.</p>

</div>

</div>

`;

return sendEmail({
toEmail:email,
subject:`${name} - Your Password Change OTP`,
htmlContent:html
});

}



/* ===============================
   PASSWORD CHANGE ALERT
================================ */

export async function sendPasswordChangedAlert(email,name="User"){

const html = `

<div style="font-family:Arial;background:#f7f7f7;padding:24px">

<div style="max-width:600px;margin:auto;background:#0f172a;color:white;padding:30px;border-radius:12px">

<h2>Password Changed</h2>

<p>Hello ${name}</p>

<p>Your account password was changed successfully.</p>

<p>If this was not you please reset immediately.</p>

</div>

</div>

`;

return sendEmail({

toEmail:email,

subject:`Security Alert - Password Changed`,

htmlContent:html

});

}



/* ===============================
   SUBSCRIPTION SUCCESS EMAIL
================================ */

export async function sendSubscriptionSuccessEmail(
  email,
  name,
  planName,
  expireDate
){

  const hour = new Date().getHours();

  let greeting = "Good Evening";

  if(hour < 12) greeting = "Good Morning";
  else if(hour < 18) greeting = "Good Afternoon";

  const html = `

  <div style="font-family:Arial;background:#f7f7f7;padding:24px">

    <div style="max-width:700px;margin:auto;background:#0f172a;color:white;padding:30px;border-radius:12px">

      <h1 style="margin:0">Ad Creative</h1>

      <h2 style="margin-top:20px">
      ${name} - Congratulations 🎉
      </h2>

      <p>
      Hi 👋 ${name}, ${greeting}
      </p>

      <h3 style="color:#22c55e">
      🎉 Welcome to the ${planName} Plan
      </h3>

      <p>Your subscription has been successfully activated.</p>

      <p>
      <b>Your current plan ends on:</b><br/>
      ${new Date(expireDate).toDateString()}
      </p>

    </div>

  </div>

  `;

  return sendEmail({

    toEmail: email,

    subject: `${name} - Congratulations 🎉 Your Subscription Was Successful For ${planName} Plan`,

    htmlContent: html

  });

}