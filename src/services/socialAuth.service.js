// src/services/socialAuth.service.js
/**
 * Social Auth Service (Enterprise-grade)
 * -------------------------------------
 * Providers supported:
 * - Google (ID token)
 * - Facebook (Access token)
 *
 * Behavior:
 * - If provider already linked -> returns that user
 * - Else if local user exists with same email -> links provider (no duplicate users)
 * - Else creates new user with provider
 */

const { OAuth2Client } = require("google-auth-library");
const axios = require("axios");

const userRepo = require("../repositories/user.repo");
const AppError = require("../utils/appError");
const errorCodes = require("../constants/errorCodes");
const { signToken } = require("../utils/jwt.util");

const { GOOGLE_CLIENT_ID, FACEBOOK_APP_ID, FACEBOOK_APP_SECRET } = require("../config/env");

const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function inferName({ name, email }) {
  const n = String(name || "").trim();
  if (n) return n;

  const e = normalizeEmail(email);
  if (e.includes("@")) {
    const prefix = e.split("@")[0];
    if (prefix) return prefix.slice(0, 60);
  }

  return "User";
}

async function findUserByEmail(email) {
  const res = await userRepo.findByEmail(email);
  if (!res) return null;
  if (Array.isArray(res)) return res[0] || null;
  return res;
}

/**
 * Upsert logic:
 * 1) If provider already linked -> return that user
 * 2) Else if a local user exists with same email -> link provider to it
 * 3) Else create new user with provider
 */
async function upsertUserFromSocial({ provider, providerId, email, name }) {
  const byProvider = await userRepo.findByProvider(provider, providerId);
  if (byProvider) return byProvider;

  const byEmail = await findUserByEmail(email);
  if (byEmail) {
    byEmail.providers = byEmail.providers || [];

    const alreadyLinked = byEmail.providers.some(
      (p) => p.provider === provider && p.providerId === providerId
    );

    if (!alreadyLinked) {
      byEmail.providers.push({ provider, providerId });
      await userRepo.saveUser(byEmail);
    }

    return byEmail;
  }

  const user = await userRepo.createUser({
    name: inferName({ name, email }),
    email,
    passwordHash: null,
    providers: [{ provider, providerId }],
  });

  return user;
}

async function handleGoogleLogin(idToken) {
  if (!idToken) {
    throw new AppError("Token is required", 400, "TOKEN_REQUIRED", true);
  }

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    const googleId = payload?.sub;
    const email = normalizeEmail(payload?.email);
    const emailVerified = payload?.email_verified;
    const name = payload?.name;

    if (!email) {
      throw new AppError(
        "Social sign-in failed: email not available",
        400,
        errorCodes.SOCIAL_EMAIL_REQUIRED,
        true
      );
    }

    if (!emailVerified) {
      throw new AppError(
        "Social sign-in failed: email not verified",
        400,
        errorCodes.SOCIAL_EMAIL_NOT_VERIFIED,
        true
      );
    }

    if (!googleId) {
      throw new AppError("Social sign-in failed", 400, errorCodes.SOCIAL_TOKEN_INVALID, true);
    }

    const user = await upsertUserFromSocial({
      provider: "google",
      providerId: googleId,
      email,
      name,
    });

    return { user, token: signToken(user) };
  } catch (err) {
    if (err?.code) throw err;
    throw new AppError("Social sign-in failed", 400, errorCodes.SOCIAL_TOKEN_INVALID, true);
  }
}

async function handleFacebookLogin(accessToken) {
  if (!accessToken) {
    throw new AppError("Token is required", 400, "TOKEN_REQUIRED", true);
  }

  const appAccessToken = `${FACEBOOK_APP_ID}|${FACEBOOK_APP_SECRET}`;

  try {
    const debugRes = await axios.get("https://graph.facebook.com/debug_token", {
      params: { input_token: accessToken, access_token: appAccessToken },
      timeout: 10000,
    });

    if (!debugRes?.data?.data?.is_valid) {
      throw new AppError("Social sign-in failed", 400, errorCodes.SOCIAL_TOKEN_INVALID, true);
    }

    const profileRes = await axios.get("https://graph.facebook.com/me", {
      params: { fields: "id,name,email", access_token: accessToken },
      timeout: 10000,
    });

    const facebookId = profileRes?.data?.id;
    const email = normalizeEmail(profileRes?.data?.email);
    const name = profileRes?.data?.name;

    if (!email) {
      throw new AppError(
        "Social sign-in failed: email not available",
        400,
        errorCodes.SOCIAL_EMAIL_REQUIRED,
        true
      );
    }

    if (!facebookId) {
      throw new AppError("Social sign-in failed", 400, errorCodes.SOCIAL_AUTH_FAILED, true);
    }

    const user = await upsertUserFromSocial({
      provider: "facebook",
      providerId: facebookId,
      email,
      name,
    });

    return { user, token: signToken(user) };
  } catch (err) {
    if (err?.code) throw err;
    throw new AppError("Social sign-in failed", 400, errorCodes.SOCIAL_AUTH_FAILED, true);
  }
}

module.exports = {
  handleGoogleLogin,
  handleFacebookLogin,
};