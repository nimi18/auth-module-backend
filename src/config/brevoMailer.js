// src/config/brevoMailer.js
/**
 * Brevo Mail Client
 * -----------------
 * Thin integration wrapper around Brevo's transactional email API.
 *
 * Official endpoint:
 *   POST https://api.brevo.com/v3/smtp/email
 *
 * Auth:
 *   Header: api-key: <BREVO_API_KEY>
 *
 * Notes:
 * - Sender email must be configured and verified in Brevo
 * - This file does not contain auth-flow-specific logic
 * - It only knows how to send a generic transactional email
 */

const axios = require("axios");
const {
  BREVO_API_KEY,
  BREVO_SENDER_EMAIL,
  BREVO_SENDER_NAME,
} = require("./env");

const BREVO_SEND_EMAIL_URL = "https://api.brevo.com/v3/smtp/email";

function isBrevoConfigured() {
  return Boolean(BREVO_API_KEY && BREVO_SENDER_EMAIL);
}

async function sendBrevoEmail({ to, toName, subject, htmlContent, textContent }) {
  if (!isBrevoConfigured()) {
    throw new Error(
      "Brevo is not configured. Missing BREVO_API_KEY and/or BREVO_SENDER_EMAIL."
    );
  }

  if (!to || !subject || (!htmlContent && !textContent)) {
    throw new Error("Brevo email payload is incomplete.");
  }

  const payload = {
    sender: {
      email: BREVO_SENDER_EMAIL,
      name: BREVO_SENDER_NAME,
    },
    to: [
      {
        email: to,
        name: toName || undefined,
      },
    ],
    subject,
    htmlContent: htmlContent || undefined,
    textContent: textContent || undefined,
  };

  const response = await axios.post(BREVO_SEND_EMAIL_URL, payload, {
    headers: {
      "api-key": BREVO_API_KEY,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    timeout: 15000,
  });

  return response.data;
}

module.exports = {
  isBrevoConfigured,
  sendBrevoEmail,
};