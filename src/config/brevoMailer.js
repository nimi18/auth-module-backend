const axios = require("axios");
const {
    BREVO_API_KEY,
    BREVO_SENDER_EMAIL,
    BREVO_SENDER_NAME,
} = require("./env");

/**
 * Sends transactional email using Brevo API v3
 * Docs: POST https://api.brevo.com/v3/smtp/email
 */
function sendBrevoMail({ to, subject, html }) {

    const payload = {
        sender: {
            email: BREVO_SENDER_EMAIL,
            name: BREVO_SENDER_NAME,
        },
        to: [{email: to}],
        subject,
        htmlContent: html,
    };

    return axios.post("https://api.brevo.com/v3/smtp/email", payload, {
        headers: {
            "content-type": "application/json",
            "api-key": BREVO_API_KEY, //required by Brevo v3
        },
        timeout: 10000,
    });
}

module.exports = { sendBrevoMail };