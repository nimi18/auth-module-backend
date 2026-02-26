// src/services/mailer.service.js
/**
 * Mailer Service (Enterprise abstraction)
 * --------------------------------------
 * - In NODE_ENV=test => NO-OP (tests should never hang or call external APIs)
 * - In production => safe placeholder (you can wire Brevo/Nodemailer here)
 *
 * Important enterprise rule:
 * - Auth flows must NOT fail because email sending failed.
 * - So this service should avoid throwing in most cases.
 */

const logger = require("../config/logger");

async function sendPasswordResetEmail({ to, name, resetToken }) {
  try {
    if (!to || !resetToken) {
      logger.warn("sendPasswordResetEmail missing fields", {
        to,
        hasToken: Boolean(resetToken),
      });
      return;
    }

    // Test mode = no external calls
    if (process.env.NODE_ENV === "test") return;

    /**
     * Production integration hook:
     * - If you use Brevo via src/config/brevoMailer.js, wire it here.
     * - NEVER log resetToken in production.
     *
     * Example:
     * const { sendBrevoEmail } = require("../config/brevoMailer");
     * await sendBrevoEmail({
     *   to,
     *   subject: "Reset your password",
     *   html: `<p>Hello ${name || "User"},</p><p>Token: ${resetToken}</p>`
     * });
     */

    logger.info("Password reset email requested", {
      to,
      name: name || "User",
    });
  } catch (err) {
    // Email should never crash auth workflows
    logger.warn("sendPasswordResetEmail failed (ignored)", {
      message: err?.message,
    });
  }
}

module.exports = {
  sendPasswordResetEmail,
};