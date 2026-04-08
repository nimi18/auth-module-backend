// src/services/mailer.service.js
/**
 * Mailer Service
 * --------------
 * Auth-specific transactional email logic lives here.
 *
 * Responsibilities:
 * - Build reset-password email content
 * - Generate frontend reset link
 * - Send through Brevo
 * - Never break the auth flow if email provider fails
 *
 * Security notes:
 * - Reset token must never be logged in production
 * - Email delivery errors should be logged, but not exposed to users
 */

const logger = require("../config/logger");
const { APP_FRONTEND_URL, NODE_ENV } = require("../config/env");
const { sendBrevoEmail, isBrevoConfigured } = require("../config/brevoMailer");

function buildResetPasswordUrl({ email, resetToken }) {
  const safeBase = String(APP_FRONTEND_URL || "http://localhost:5173").replace(
    /\/+$/,
    ""
  );

  const url = new URL("/reset-password", safeBase);
  url.searchParams.set("token", resetToken);
  url.searchParams.set("email", email);

  return url.toString();
}

function buildResetPasswordSubject() {
  return "Reset your password";
}

function buildResetPasswordText({ name, resetUrl }) {
  return [
    `Hi ${name || "there"},`,
    "",
    "We received a request to reset your password.",
    "Use the link below to set a new password:",
    resetUrl,
    "",
    "If you did not request this, you can safely ignore this email.",
    "",
    "This link will expire soon for security reasons.",
  ].join("\n");
}

function buildResetPasswordHtml({ name, resetUrl }) {
  const safeName = name || "there";

  return `
    <div style="font-family: Arial, sans-serif; color: #0f172a; line-height: 1.6;">
      <h2 style="margin-bottom: 12px;">Reset your password</h2>

      <p>Hi ${safeName},</p>

      <p>We received a request to reset your password.</p>

      <p>
        Click the button below to set a new password:
      </p>

      <p style="margin: 24px 0;">
        <a
          href="${resetUrl}"
          style="
            display: inline-block;
            background: #4f46e5;
            color: #ffffff;
            text-decoration: none;
            padding: 12px 18px;
            border-radius: 8px;
            font-weight: 600;
          "
        >
          Reset Password
        </a>
      </p>

      <p style="word-break: break-all;">
        If the button does not work, use this link:<br />
        <a href="${resetUrl}">${resetUrl}</a>
      </p>

      <p>If you did not request this, you can safely ignore this email.</p>

      <p>This link will expire soon for security reasons.</p>
    </div>
  `;
}

async function sendPasswordResetEmail({ to, name, resetToken }) {
  if (!to || !resetToken) {
    logger.warn("sendPasswordResetEmail called with incomplete payload", {
      hasTo: Boolean(to),
      hasResetToken: Boolean(resetToken),
    });
    return;
  }

  const resetUrl = buildResetPasswordUrl({
    email: to,
    resetToken,
  });

  const subject = buildResetPasswordSubject();
  const textContent = buildResetPasswordText({ name, resetUrl });
  const htmlContent = buildResetPasswordHtml({ name, resetUrl });

  if (NODE_ENV === "test") {
    return {
      skipped: true,
      reason: "Email sending disabled in test mode",
      resetUrl,
    };
  }

  if (!isBrevoConfigured()) {
    logger.warn("Brevo not configured. Skipping password reset email.", {
      to,
    });
    return {
      skipped: true,
      reason: "Brevo not configured",
      resetUrl,
    };
  }

  try {
    const response = await sendBrevoEmail({
      to,
      toName: name,
      subject,
      htmlContent,
      textContent,
    });

    logger.info("Password reset email sent", {
      to,
      provider: "brevo",
      messageId: response?.messageId,
    });

    return {
      sent: true,
      provider: "brevo",
      messageId: response?.messageId,
      resetUrl,
    };
  } catch (error) {
    console.error("BREVO EMAIL ERROR");
    console.error("Status:", error?.response?.status);
    console.error("Response:", error?.response?.data);
    console.error("Message:", error?.message);
    // logger.error("Failed to send password reset email via Brevo", {
    //   to,
    //   provider: "brevo",
    //   status: error?.response?.status,
    //   responseData: error?.response?.data,
    //   message: error?.message,
    // });

    return {
      sent: false,
      provider: "brevo",
      resetUrl,
    };
  }
}

module.exports = {
  buildResetPasswordUrl,
  sendPasswordResetEmail,
};