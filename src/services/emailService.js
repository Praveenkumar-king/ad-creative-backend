// src/services/emailService.js
import axios from "axios";

const SIB_API = "https://api.sendinblue.com/v3/smtp/email";

/**
 * Send a transactional email via Sendinblue/Brevo.
 * If BREVO_API_KEY is not set, function returns {sent:false, demo:true, rawToken}
 */
async function sendEmail({ toEmail, subject, htmlContent }) {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL || "ad-creative-project@outlook.com";
  const senderName = process.env.BREVO_SENDER_NAME || "AdVantage Gen";

  if (!apiKey) {
    // demo mode (no real email). Caller can choose to return token to UI.
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
    // bubble up
    return { sent: false, error: err.response?.data || err.message || err };
  }
}

/** Send verification email — rawToken is plaintext token (not hashed) */
export async function sendVerificationEmail(toEmail, rawToken) {
  const frontend = process.env.FRONTEND_URL || "http://localhost:5173";
  const link = `${frontend}/verify/${rawToken}`;

  const html = `
    <div style="font-family: Arial, sans-serif; color: #222;">
      <h2>Verify your email</h2>
      <p>Thanks for signing up. Please verify your email by clicking the button below:</p>
      <p><a href="${link}" style="display:inline-block;padding:12px 18px;background:#1abc9c;color:#fff;border-radius:6px;text-decoration:none;">Click here to verify your email</a></p>
      <p>If the button doesn't work, copy-paste this URL into your browser:</p>
      <p><a href="${link}">${link}</a></p>
      <small>This link expires in 24 hours.</small>
    </div>
  `;

  return sendEmail({ toEmail, subject: "Verify your email", htmlContent: html });
}

/** Send reset password email — rawToken is plaintext token */
export async function sendResetEmail(toEmail, rawToken) {
  const frontend = process.env.FRONTEND_URL || "http://localhost:5173";
  const link = `${frontend}/reset-password/${rawToken}`;

  const html = `
    <div style="font-family: Arial, sans-serif; color: #222;">
      <h2>Password Reset Request</h2>
      <p>You requested a password reset. Click the button below to reset your password:</p>
      <p><a href="${link}" style="display:inline-block;padding:12px 18px;background:#1abc9c;color:#fff;border-radius:6px;text-decoration:none;">Click here to reset password</a></p>
      <p>If the button doesn't work, copy-paste this URL into your browser:</p>
      <p><a href="${link}">${link}</a></p>
      <small>This link expires in 10 minutes.</small>
    </div>
  `;

  return sendEmail({ toEmail, subject: "Password Reset Request", htmlContent: html });
}