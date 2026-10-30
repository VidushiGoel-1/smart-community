const nodemailer = require("nodemailer");

const sendEmail = async ({ to, subject, htmlContent, textContent }) => {
  const brevoApiKey = process.env.BREVO_API_KEY ? process.env.BREVO_API_KEY.trim() : null;
  const brevoSenderEmail = process.env.BREVO_SENDER_EMAIL ? process.env.BREVO_SENDER_EMAIL.trim() : null;
  const senderName = (process.env.BREVO_SENDER_NAME || "Smart Community").trim();

  // 1. Try Brevo API first if credentials are present
  if (brevoApiKey && brevoSenderEmail) {
    try {
      const response = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          accept: "application/json",
          "api-key": brevoApiKey,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          sender: {
            name: senderName,
            email: brevoSenderEmail,
          },
          to: [{ email: to }],
          subject,
          ...(htmlContent ? { htmlContent } : {}),
          ...(textContent ? { textContent } : {}),
        }),
      });

      const result = await response.json().catch(() => ({}));

      if (response.ok) {
        console.log("Email accepted by Brevo:", result.messageId || "Success");
        return { provider: "brevo", messageId: result.messageId };
      }

      console.warn("Brevo API returned error status:", response.status, result);
    } catch (brevoError) {
      console.warn("Brevo email send failed, attempting Gmail fallback:", brevoError.message);
    }
  }

  // 2. Fallback to Gmail via nodemailer if Brevo is not configured or failed
  const emailUser = process.env.EMAIL_USER ? process.env.EMAIL_USER.trim() : null;
  const emailPass = process.env.EMAIL_PASS ? process.env.EMAIL_PASS.trim() : null;

  if (emailUser && emailPass) {
    try {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: emailUser,
          pass: emailPass,
        },
      });

      const info = await transporter.sendMail({
        from: `"${senderName}" <${emailUser}>`,
        to,
        subject,
        text: textContent,
        html: htmlContent,
      });

      console.log("Email sent via Gmail SMTP:", info.messageId);
      return { provider: "gmail", messageId: info.messageId };
    } catch (gmailError) {
      console.error("Gmail email send failed:", gmailError.message);
      throw new Error(`Email delivery failed via both Brevo and Gmail: ${gmailError.message}`);
    }
  }

  throw new Error("Email configuration is missing (neither Brevo API key nor Gmail credentials configured).");
};

module.exports = sendEmail;
