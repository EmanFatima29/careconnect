import nodemailer from "nodemailer";
import logger from "../../lib/logger.js";
import dotenv from "dotenv";
dotenv.config();

/**
 * Email transporter — configured via environment variables.
 * Falls back to "ethereal" test account if SMTP is not configured,
 * and logs the preview URL so developers can verify emails.
 */
let transporter = null;

async function getTransporter() {
  if (transporter) return transporter;

  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "587", 10),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    logger.log("[Email] Using configured SMTP transport");
  } else {
    // Create an Ethereal test account for development
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    logger.warn(
      "[Email] No SMTP configured — using Ethereal test account. Emails will NOT be delivered.",
    );
  }

  return transporter;
}

/**
 * Send a password reset email.
 * @param {string} to - recipient email
 * @param {string} resetUrl - full URL with token
 */
/**
 * Send an email verification link.
 * @param {string} to - recipient email
 * @param {string} verifyUrl - full URL with token
 */
export async function sendVerificationEmail(to, verifyUrl) {
  const transport = await getTransporter();

  const mailOptions = {
    from: process.env.SMTP_FROM || '"CareConnect" <noreply@careconnect.app>',
    to,
    subject: "Verify Your Email Address",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #2e7d32;">Welcome to CareConnect!</h2>
        <p>Please verify your email address to complete your registration.</p>
        <a href="${verifyUrl}" style="display:inline-block;padding:12px 24px;background:#2e7d32;color:#fff;text-decoration:none;border-radius:6px;margin:16px 0;">
          Verify Email
        </a>
        <p style="color:#666;font-size:13px;">This link expires in <strong>24 hours</strong>.</p>
        <p style="color:#666;font-size:13px;">If you didn't create an account, you can safely ignore this email.</p>
        <hr style="border:none;border-top:1px solid #eee;margin:24px 0;" />
        <p style="color:#999;font-size:12px;">CareConnect &mdash; connecting communities</p>
      </div>
    `,
  };

  const info = await transport.sendMail(mailOptions);
  logger.log("[Email] Verification email sent:", info.messageId);

  const previewUrl = nodemailer.getTestMessageUrl(info);
  if (previewUrl) {
    logger.log("[Email] Preview URL:", previewUrl);
  }

  return info;
}

export async function sendPasswordResetEmail(to, resetUrl) {
  const transport = await getTransporter();

  const mailOptions = {
    from: process.env.SMTP_FROM || '"CareConnect" <noreply@careconnect.app>',
    to,
    subject: "Password Reset Request",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #2e7d32;">Password Reset</h2>
        <p>You requested a password reset for your CareConnect account.</p>
        <p>Click the button below to set a new password. This link expires in <strong>1 hour</strong>.</p>
        <a href="${resetUrl}" style="display:inline-block;padding:12px 24px;background:#2e7d32;color:#fff;text-decoration:none;border-radius:6px;margin:16px 0;">
          Reset Password
        </a>
        <p style="color:#666;font-size:13px;">If you didn't request this, you can safely ignore this email.</p>
        <hr style="border:none;border-top:1px solid #eee;margin:24px 0;" />
        <p style="color:#999;font-size:12px;">CareConnect &mdash; connecting communities</p>
      </div>
    `,
  };

  const info = await transport.sendMail(mailOptions);
  logger.log("[Email] Password reset email sent:", info.messageId);

  // In dev, log the Ethereal preview URL
  const previewUrl = nodemailer.getTestMessageUrl(info);
  if (previewUrl) {
    logger.log("[Email] Preview URL:", previewUrl);
  }

  return info;
}
