const express = require("express");
const router = express.Router();

const {
    registerUser,
    verifyOTP,
    resendOTP,
    loginUser,
    refreshAccessToken,
    logoutUser,
    forgotPassword,
    resetPassword,
    initiateGoogleAuth,
    handleGoogleCallback,
    initiateGitHubAuth,
    handleGitHubCallback,
    exchangeOAuthCode
} = require("../controllers/authController");

// Registration and OTP verification
router.post("/register", registerUser);
router.post("/verify-otp", verifyOTP);
router.post("/resend-otp", resendOTP);

// Login, token management, and logout
router.post("/login", loginUser);
router.post("/refresh-token", refreshAccessToken);
router.post("/logout", logoutUser);

// Password reset flow
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

// Google OAuth
router.get("/google", initiateGoogleAuth);
router.get("/google/callback", handleGoogleCallback);

// GitHub OAuth
router.get("/github", initiateGitHubAuth);
router.get("/github/callback", handleGitHubCallback);

// Secure single-use OAuth code exchange
router.post("/oauth/exchange", exchangeOAuthCode);

module.exports = router;
