const User = require("../models/user");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

// Import the configured passport instance (strategies already registered)
const { passport } = require("../config/passport");

const generateOTP = require("../utils/generateOTP");
const sendEmail = require("../utils/sendEmail");

const {
    generateAccessToken,
    generateRefreshToken
} = require("../utils/generateTokens");

// In-memory store for single-use authorization exchange codes (60s TTL)
const oauthCodeStore = new Map();

// Periodic cleanup of expired OAuth exchange codes
setInterval(() => {
    const now = Date.now();
    for (const [code, entry] of oauthCodeStore.entries()) {
        if (entry.expiresAt < now) {
            oauthCodeStore.delete(code);
        }
    }
}, 2 * 60 * 1000).unref();

// Helper functions

const normalizeEmail = (email) => email.trim().toLowerCase();

const hashToken = (token) => {
    return crypto.createHash("sha256").update(token).digest("hex");
};

const verifyRefreshToken = (token) => {
    return jwt.verify(token, process.env.REFRESH_TOKEN_SECRET, {
        algorithms: ["HS256"],
        issuer: "smart-community",
        audience: "smart-community-client"
    });
};

const isJWTError = (error) => {
    return [
        "TokenExpiredError",
        "JsonWebTokenError",
        "NotBeforeError"
    ].includes(error.name);
};

const findSessionUser = async (decoded) => {
    const user = await User.findById(decoded.sub).select(
        "+refreshTokenHash +refreshTokenSessionId"
    );

    if (
        !user ||
        !user.isVerified ||
        user.refreshTokenSessionId !== decoded.sid
    ) {
        return null;
    }

    return user;
};

// 1. Register a new user
const registerUser = async (req, res) => {
    try {
        let { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "Name, email and password are required"
            });
        }

        name = name.trim();
        email = normalizeEmail(email);

        if (!name) {
            return res.status(400).json({
                success: false,
                message: "Name cannot be empty"
            });
        }

        if (password.length < 8) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 8 characters long"
            });
        }

        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "An account with this email already exists"
            });
        }

        const passwordHash = await bcrypt.hash(password, 12);

        const otp = generateOTP();
        const otpHash = await bcrypt.hash(otp, 10);

        const user = await User.create({
            name,
            email,
            passwordHash,
            isVerified: false,
            otpHash,
            otpExpiryAt: new Date(Date.now() + 5 * 60 * 1000),
            otpAttempts: 0,
            otpResendCount: 0,
            authProvider: ["local"]
        });

        try {
            await sendEmail({
                to: email,
                subject: "Verify your Smart Community account",
                textContent: `Your OTP is ${otp}. It expires in 5 minutes.`,
                htmlContent: `<h2>Smart Community</h2><p>Your email verification OTP is:</p><h1>${otp}</h1><p>This OTP expires in 5 minutes.</p><p>Do not share this code with anyone.</p>`
            });
        } catch (error) {
            // Remove the account if the verification email cannot be sent
            await User.findByIdAndDelete(user._id);

            console.error("OTP email error:", error.message);

            return res.status(500).json({
                success: false,
                message: "Could not send verification email. Please try again."
            });
        }

        return res.status(201).json({
            success: true,
            message: "Registration successful. Please verify your email using the OTP."
        });

    } catch (error) {
        console.error("Registration error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

// 2. Verify OTP
const verifyOTP = async (req, res) => {
    try {
        let { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({
                success: false,
                message: "Email and OTP are required"
            });
        }

        email = normalizeEmail(email);
        otp = String(otp).trim();

        const user = await User.findOne({ email }).select(
            "+otpHash +otpExpiryAt +otpAttempts"
        );

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        if (user.isVerified) {
            return res.status(400).json({
                success: false,
                message: "Email is already verified"
            });
        }

        if (!user.otpHash || !user.otpExpiryAt) {
            return res.status(400).json({
                success: false,
                message: "No active OTP found. Please request a new OTP."
            });
        }

        if (user.otpExpiryAt < new Date()) {
            user.otpHash = undefined;
            user.otpExpiryAt = undefined;
            user.otpAttempts = 0;

            await user.save();

            return res.status(400).json({
                success: false,
                message: "OTP has expired. Please request a new one."
            });
        }

        if (user.otpAttempts >= 3) {
            return res.status(429).json({
                success: false,
                message: "Too many incorrect attempts. Please request a new OTP."
            });
        }

        const isCorrectOTP = await bcrypt.compare(otp, user.otpHash);

        if (!isCorrectOTP) {
            user.otpAttempts += 1;
            await user.save();

            return res.status(400).json({
                success: false,
                message: "Invalid OTP"
            });
        }

        user.isVerified = true;
        user.otpHash = undefined;
        user.otpExpiryAt = undefined;
        user.otpAttempts = 0;

        await user.save();

        return res.status(200).json({
            success: true,
            message: "Email verified successfully. You can now log in."
        });

    } catch (error) {
        console.error("OTP verification error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

// 3. Resend OTP
const resendOTP = async (req, res) => {
    try {
        let { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Email is required"
            });
        }

        email = normalizeEmail(email);

        const user = await User.findOne({ email }).select(
            "+otpHash +otpExpiryAt +otpAttempts +otpResendCount"
        );

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        if (user.isVerified) {
            return res.status(400).json({
                success: false,
                message: "Email is already verified"
            });
        }

        if (user.otpResendCount >= 3) {
            return res.status(429).json({
                success: false,
                message: "OTP resend limit reached"
            });
        }

        const otp = generateOTP();
        const otpHash = await bcrypt.hash(otp, 10);

        user.otpHash = otpHash;
        user.otpExpiryAt = new Date(Date.now() + 5 * 60 * 1000);
        user.otpAttempts = 0;
        user.otpResendCount += 1;

        await user.save();

        try {
            await sendEmail({
                to: email,
                subject: "Your new Smart Community verification OTP",
                textContent: `Your new OTP is ${otp}. It expires in 5 minutes.`,
                htmlContent: `<h2>Smart Community</h2><p>Your new email verification OTP is:</p><h1>${otp}</h1><p>This OTP expires in 5 minutes.</p><p>Do not share this code with anyone.</p>`
            });
        } catch (error) {
            console.error("Resend OTP email error:", error.message);

            return res.status(500).json({
                success: false,
                message: "Could not send OTP email. Please try again."
            });
        }

        return res.status(200).json({
            success: true,
            message: "A new OTP has been sent to your email"
        });

    } catch (error) {
        console.error("Resend OTP error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

// 4. Login user
const loginUser = async (req, res) => {
    try {
        let { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required"
            });
        }

        email = normalizeEmail(email);

        const user = await User.findOne({ email }).select("+passwordHash");

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        // Check if user has a password set (e.g. if they only signed up via OAuth)
        if (!user.passwordHash) {
            return res.status(400).json({
                success: false,
                message: "This account was registered using an OAuth provider (Google or GitHub). Please sign in using that provider or use Forgot Password to set a password."
            });
        }

        const isPasswordCorrect = await bcrypt.compare(
            password,
            user.passwordHash
        );

        if (!isPasswordCorrect) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        if (!user.isVerified) {
            return res.status(403).json({
                success: false,
                message: "Please verify your email before logging in"
            });
        }

        const sessionId = crypto.randomUUID();

        const accessToken = generateAccessToken(user._id);
        const refreshToken = generateRefreshToken(user._id, sessionId);

        user.refreshTokenHash = hashToken(refreshToken);
        user.refreshTokenSessionId = sessionId;

        await user.save();

        return res.status(200).json({
            success: true,
            message: "Login successful",
            accessToken,
            refreshToken,
            tokenType: "Bearer",
            expiresIn: 900
        });

    } catch (error) {
        console.error("Login error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

// 5. Refresh access token
const refreshAccessToken = async (req, res) => {
    try {
        const refreshToken = req.body.refreshToken || req.cookies?.refreshToken;

        if (!refreshToken) {
            return res.status(401).json({
                success: false,
                message: "Refresh token is required"
            });
        }

        const decoded = verifyRefreshToken(refreshToken);

        if (
            decoded.tokenType !== "refresh" ||
            !decoded.sub ||
            !decoded.sid
        ) {
            return res.status(401).json({
                success: false,
                message: "Invalid refresh token"
            });
        }

        const user = await findSessionUser(decoded);

        if (!user || user.refreshTokenHash !== hashToken(refreshToken)) {
            return res.status(401).json({
                success: false,
                message: "Invalid refresh session"
            });
        }

        const accessToken = generateAccessToken(user._id);

        // Rotate the refresh token so the old one cannot be reused
        const newRefreshToken = generateRefreshToken(user._id, decoded.sid);

        user.refreshTokenHash = hashToken(newRefreshToken);

        await user.save();

        return res.status(200).json({
            success: true,
            message: "Tokens refreshed successfully",
            accessToken,
            refreshToken: newRefreshToken,
            tokenType: "Bearer",
            expiresIn: 900
        });

    } catch (error) {
        if (isJWTError(error)) {
            return res.status(401).json({
                success: false,
                message: "Invalid or expired refresh token"
            });
        }

        console.error("Refresh token error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

// 6. Logout user
const logoutUser = async (req, res) => {
    try {
        const refreshToken = req.body.refreshToken || req.cookies?.refreshToken;

        if (!refreshToken) {
            return res.status(400).json({
                success: false,
                message: "Refresh token is required"
            });
        }

        const decoded = verifyRefreshToken(refreshToken);

        if (
            decoded.tokenType !== "refresh" ||
            !decoded.sub ||
            !decoded.sid
        ) {
            return res.status(401).json({
                success: false,
                message: "Invalid refresh token"
            });
        }

        const user = await findSessionUser(decoded);

        if (!user || user.refreshTokenHash !== hashToken(refreshToken)) {
            return res.status(401).json({
                success: false,
                message: "Invalid refresh session"
            });
        }

        user.refreshTokenHash = undefined;
        user.refreshTokenSessionId = undefined;

        await user.save();

        res.clearCookie("refreshToken");

        return res.status(200).json({
            success: true,
            message: "Logout successful"
        });

    } catch (error) {
        if (isJWTError(error)) {
            return res.status(401).json({
                success: false,
                message: "Invalid or expired refresh token"
            });
        }

        console.error("Logout error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

// 7. Forgot password
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email || typeof email !== "string") {
            return res.status(400).json({
                success: false,
                message: "Email is required.",
            });
        }

        const normalizedEmail = normalizeEmail(email);

        const user = await User.findOne({
            email: normalizedEmail,
        });

        // Always return generic message to prevent email enumeration
        const response = {
            success: true,
            message:
                "If an account exists with this email, a password reset link will be sent.",
        };

        if (!user) {
            return res.status(200).json(response);
        }

        // Generate a secure 32-byte random token
        const resetToken = crypto.randomBytes(32).toString("hex");

        // Store only the SHA-256 hash in MongoDB
        const resetTokenHash = crypto
            .createHash("sha256")
            .update(resetToken)
            .digest("hex");

        user.passwordResetTokenHash = resetTokenHash;
        user.passwordResetExpiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

        await user.save();

        const rawFrontendUrl = process.env.FRONTEND_URL || "https://smart-community-zeta.vercel.app";
        const frontendUrl = rawFrontendUrl.trim().replace(/\/$/, "");

        const resetLink = `${frontendUrl}/reset-password?token=${resetToken}`;

        if (process.env.NODE_ENV !== "production") {
            console.log(`[DEV INFO] Password reset link for ${user.email}: ${resetLink}`);
        }

        try {
            await sendEmail({
                to: user.email,
                subject: "Reset Your Smart Community Password",
                textContent: `Reset your password using this link: ${resetLink}. This link expires in 15 minutes.`,
                htmlContent: `
                    <h2>Password Reset</h2>
                    <p>Click the link below to reset your password:</p>
                    <p><a href="${resetLink}" style="padding: 10px 18px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 4px; display: inline-block;">Reset Password</a></p>
                    <p>Or copy and paste this link into your browser:</p>
                    <p>${resetLink}</p>
                    <p>This link expires in 15 minutes. If you did not request this, please ignore this email.</p>
                `
            });
        } catch (emailError) {
            console.error("Failed to send reset email:", emailError.message);
            return res.status(500).json({
                success: false,
                message: "Unable to send password reset email. Please try again later."
            });
        }

        return res.status(200).json(response);
    } catch (error) {
        console.error("Forgot password error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to process the password reset request.",
        });
    }
};

// 8. Reset password
const resetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        if (
            typeof token !== "string" ||
            !token.trim() ||
            typeof newPassword !== "string"
        ) {
            return res.status(400).json({
                success: false,
                message: "Token and new password are required.",
            });
        }

        if (newPassword.length < 8) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 8 characters long.",
            });
        }

        if (Buffer.byteLength(newPassword, "utf8") > 72) {
            return res.status(400).json({
                success: false,
                message: "Password must not exceed 72 UTF-8 bytes.",
            });
        }

        // Hash the submitted token with SHA-256 to compare with stored hash
        const resetTokenHash = crypto
            .createHash("sha256")
            .update(token.trim())
            .digest("hex");

        const user = await User.findOne({
            passwordResetTokenHash: resetTokenHash,
            passwordResetExpiresAt: {
                $gt: new Date(),
            },
        }).select(
            "+passwordResetTokenHash +passwordResetExpiresAt"
        );

        if (!user) {
            return res.status(400).json({
                success: false,
                message: "Password reset link is invalid or has expired.",
            });
        }

        // Hash the new password before storing it
        const passwordHash = await bcrypt.hash(newPassword, 12);

        user.passwordHash = passwordHash;

        // Invalidate the reset token so it cannot be reused
        user.passwordResetTokenHash = undefined;
        user.passwordResetExpiresAt = undefined;

        // Invalidate existing refresh tokens and active sessions
        user.refreshTokenHash = undefined;
        user.refreshTokenSessionId = undefined;

        // Mark user verified and ensure "local" auth provider is listed
        user.isVerified = true;
        if (!Array.isArray(user.authProvider)) {
            user.authProvider = ["local"];
        } else if (!user.authProvider.includes("local")) {
            user.authProvider.push("local");
        }

        await user.save();

        return res.status(200).json({
            success: true,
            message: "Password reset successful. Please log in with your new password.",
        });
    } catch (error) {
        console.error("Reset password error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to reset password.",
        });
    }
};

// -------------------------------------------------------------
// OAuth Helpers & Controllers
// -------------------------------------------------------------

/**
 * Common completion handler after successful OAuth verification.
 * Generates JWTs, sets an HttpOnly cookie, creates a one-time exchange code,
 * and securely handoffs to frontend without placing JWTs in URL query params.
 */
const finishOAuthLogin = async (user, req, res) => {
    try {
        const sessionId = crypto.randomUUID();
        const accessToken = generateAccessToken(user._id);
        const refreshToken = generateRefreshToken(user._id, sessionId);

        user.refreshTokenHash = hashToken(refreshToken);
        user.refreshTokenSessionId = sessionId;
        await user.save();

        // 1. Set HttpOnly cookie for refresh token
        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        // 2. Generate short-lived single-use authorization code (60-second TTL)
        const exchangeCode = crypto.randomBytes(32).toString("hex");
        oauthCodeStore.set(exchangeCode, {
            accessToken,
            refreshToken,
            expiresIn: 900,
            tokenType: "Bearer",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                authProvider: user.authProvider
            },
            expiresAt: Date.now() + 60 * 1000
        });

        // If client specifically requests JSON (e.g. Postman testing or format=json)
        const wantsJson =
            req.query.format === "json" ||
            (req.headers.accept && req.headers.accept.includes("application/json") && !req.headers.accept.includes("text/html"));

        if (wantsJson) {
            return res.status(200).json({
                success: true,
                message: "OAuth authentication successful",
                code: exchangeCode,
                accessToken,
                refreshToken,
                tokenType: "Bearer",
                expiresIn: 900,
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    authProvider: user.authProvider
                }
            });
        }

        // 3. Browser redirect to frontend callback page with single-use code only
        const rawFrontendUrl = process.env.FRONTEND_URL || "https://smart-community-zeta.vercel.app";
        const frontendUrl = rawFrontendUrl.trim().replace(/\/$/, "");

        return res.redirect(`${frontendUrl}/auth/callback?code=${exchangeCode}`);
    } catch (error) {
        console.error("OAuth completion error:", error.message);
        const rawFrontendUrl = process.env.FRONTEND_URL || "https://smart-community-zeta.vercel.app";
        const frontendUrl = rawFrontendUrl.trim().replace(/\/$/, "");
        return res.redirect(`${frontendUrl}/login?error=${encodeURIComponent("Authentication failed during token generation")}`);
    }
};

// 9. Initiate Google OAuth
const initiateGoogleAuth = (req, res, next) => {
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
        return res.status(503).json({
            success: false,
            message: "Google OAuth is not configured on this server. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET."
        });
    }

    const state = crypto.randomBytes(24).toString("hex");
    res.cookie("oauth_state", state, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 10 * 60 * 1000 // 10 minutes
    });

    passport.authenticate("google", {
        session: false,
        scope: ["profile", "email"],
        state,
        prompt: "select_account"
    })(req, res, next);
};

// 10. Handle Google OAuth Callback
const handleGoogleCallback = (req, res, next) => {
    const expectedState = req.cookies?.oauth_state;
    const returnedState = req.query?.state;

    if (expectedState && returnedState && expectedState !== returnedState) {
        res.clearCookie("oauth_state");
        return res.status(400).json({
            success: false,
            message: "Invalid OAuth state parameter. Possible CSRF attack detected."
        });
    }
    res.clearCookie("oauth_state");

    passport.authenticate("google", { session: false }, (err, user, info) => {
        if (err || !user) {
            console.error("Google authentication error:", err || info);
            const msg = info?.message || err?.message || "Google authentication failed";
            if (req.query.format === "json" || (req.headers.accept && req.headers.accept.includes("application/json") && !req.headers.accept.includes("text/html"))) {
                return res.status(401).json({ success: false, message: msg });
            }
            const rawFrontendUrl = process.env.FRONTEND_URL || "https://smart-community-zeta.vercel.app";
            const frontendUrl = rawFrontendUrl.trim().replace(/\/$/, "");
            return res.redirect(`${frontendUrl}/login?error=${encodeURIComponent(msg)}`);
        }
        return finishOAuthLogin(user, req, res);
    })(req, res, next);
};

// 11. Initiate GitHub OAuth
const initiateGitHubAuth = (req, res, next) => {
    if (!process.env.GITHUB_CLIENT_ID || !process.env.GITHUB_CLIENT_SECRET) {
        return res.status(503).json({
            success: false,
            message: "GitHub OAuth is not configured on this server. Please set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET."
        });
    }

    const state = crypto.randomBytes(24).toString("hex");
    res.cookie("oauth_state", state, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 10 * 60 * 1000
    });

    passport.authenticate("github", {
        session: false,
        scope: ["user:email"],
        state
    })(req, res, next);
};

// 12. Handle GitHub OAuth Callback
const handleGitHubCallback = (req, res, next) => {
    const expectedState = req.cookies?.oauth_state;
    const returnedState = req.query?.state;

    if (expectedState && returnedState && expectedState !== returnedState) {
        res.clearCookie("oauth_state");
        return res.status(400).json({
            success: false,
            message: "Invalid OAuth state parameter. Possible CSRF attack detected."
        });
    }
    res.clearCookie("oauth_state");

    passport.authenticate("github", { session: false }, (err, user, info) => {
        if (err || !user) {
            console.error("GitHub authentication error:", err || info);
            const msg = info?.message || err?.message || "GitHub authentication failed";
            if (req.query.format === "json" || (req.headers.accept && req.headers.accept.includes("application/json") && !req.headers.accept.includes("text/html"))) {
                return res.status(401).json({ success: false, message: msg });
            }
            const rawFrontendUrl = process.env.FRONTEND_URL || "https://smart-community-zeta.vercel.app";
            const frontendUrl = rawFrontendUrl.trim().replace(/\/$/, "");
            return res.redirect(`${frontendUrl}/login?error=${encodeURIComponent(msg)}`);
        }
        return finishOAuthLogin(user, req, res);
    })(req, res, next);
};

// 13. Secure one-time OAuth authorization code exchange
const exchangeOAuthCode = async (req, res) => {
    try {
        const { code } = req.body;

        if (!code || typeof code !== "string") {
            return res.status(400).json({
                success: false,
                message: "Authorization code is required"
            });
        }

        const data = oauthCodeStore.get(code.trim());

        if (!data || data.expiresAt < Date.now()) {
            oauthCodeStore.delete(code.trim());
            return res.status(400).json({
                success: false,
                message: "Authorization code is invalid or has expired"
            });
        }

        // Single-use guarantee: burn the code immediately
        oauthCodeStore.delete(code.trim());

        return res.status(200).json({
            success: true,
            message: "Authentication successful",
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
            tokenType: data.tokenType,
            expiresIn: data.expiresIn,
            user: data.user
        });
    } catch (error) {
        console.error("OAuth code exchange error:", error.message);
        return res.status(500).json({
            success: false,
            message: "Internal server error during authorization exchange"
        });
    }
};

module.exports = {
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
};

