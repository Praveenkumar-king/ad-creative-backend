import SibApiV3Sdk from "sib-api-v3-sdk";

const client = SibApiV3Sdk.ApiClient.instance;
client.authentications["api-key"].apiKey = process.env.BREVO_API_KEY;

export const sendResetEmail = async (toEmail, resetToken) => {
  const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

  const resetLink = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

  const sendSmtpEmail = {
    sender: {
      email: process.env.BREVO_SENDER_EMAIL,
      name: process.env.BREVO_SENDER_NAME
    },
    to: [{ email: toEmail }],
    subject: "Password Reset Request",
    htmlContent: `
      <h2>Password Reset</h2>
      <p>You requested a password reset.</p>
      <p>Click below link to reset:</p>
      <a href="${resetLink}">${resetLink}</a>
      <p>This link expires in 10 minutes.</p>
    `
  };

  await apiInstance.sendTransacEmail(sendSmtpEmail);
};