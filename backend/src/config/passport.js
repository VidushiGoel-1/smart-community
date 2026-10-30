
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const GitHubStrategy = require("passport-github2").Strategy;
const User = require("../models/user");

/**
 * Common account finding and safe linking logic for OAuth providers.
 * Avoids duplicate accounts by linking via verified email.
 */
const handleOAuthUser = async ({ provider, providerId, email, name }) => {
    const normalizedEmail = email ? email.trim().toLowerCase() : null;

    if (!normalizedEmail) {
        throw new Error(`Unable to obtain a verified email address from ${provider}.`);
    }

    // 1. Look up existing user by provider-specific ID
    const query = provider === "google" ? { googleId: providerId } : { githubId: providerId };
    let user = await User.findOne(query);

    if (user) {
        let updated = false;

        // Ensure authProvider array exists and contains this provider
        if (!Array.isArray(user.authProvider)) {
            user.authProvider = [provider];
            updated = true;
        } else if (!user.authProvider.includes(provider)) {
            user.authProvider.push(provider);
            updated = true;
        }

        // OAuth accounts have verified emails
        if (!user.isVerified) {
            user.isVerified = true;
            updated = true;
        }

        if (updated) {
            await user.save();
        }

        return user;
    }

    // 2. Safe Account Linking: Check if an account already exists with the same email
    user = await User.findOne({ email: normalizedEmail });

    if (user) {
        // Link this OAuth provider to the existing account
        if (provider === "google") {
            user.googleId = providerId;
        } else if (provider === "github") {
            user.githubId = providerId;
        }

        if (!Array.isArray(user.authProvider)) {
            user.authProvider = ["local", provider];
        } else if (!user.authProvider.includes(provider)) {
            user.authProvider.push(provider);
        }

        // Email verified by OAuth identity provider
        user.isVerified = true;

        await user.save();
        return user;
    }

    // 3. Register a new user via OAuth
    const displayName = (name && name.trim()) || (provider === "google" ? "Google User" : "GitHub User");

    user = await User.create({
        name: displayName,
        email: normalizedEmail,
        googleId: provider === "google" ? providerId : undefined,
        githubId: provider === "github" ? providerId : undefined,
        authProvider: [provider],
        isVerified: true
    });

    return user;
};

// -------------------------------------------------------------
// Google OAuth 2.0 Strategy
// -------------------------------------------------------------
const googleClientId = process.env.GOOGLE_CLIENT_ID ? process.env.GOOGLE_CLIENT_ID.trim() : null;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET ? process.env.GOOGLE_CLIENT_SECRET.trim() : null;
const googleCallbackUrl = process.env.GOOGLE_CALLBACK_URL
    ? process.env.GOOGLE_CALLBACK_URL.trim()
    : "/api/auth/google/callback";

if (googleClientId && googleClientSecret) {
    passport.use(
        new GoogleStrategy(
            {
                clientID: googleClientId,
                clientSecret: googleClientSecret,
                callbackURL: googleCallbackUrl,
                passReqToCallback: false
            },
            async (accessToken, refreshToken, profile, done) => {
                try {
                    const email = profile.emails && profile.emails[0]?.value;

                    if (!email) {
                        return done(new Error("No email found in Google account profile"), null);
                    }

                    const name =
                        profile.displayName ||
                        `${profile.name?.givenName || ""} ${profile.name?.familyName || ""}`.trim() ||
                        "Google User";

                    const user = await handleOAuthUser({
                        provider: "google",
                        providerId: profile.id,
                        email,
                        name
                    });

                    return done(null, user);
                } catch (error) {
                    return done(error, null);
                }
            }
        )
    );
} else {
    console.log("ℹ Google OAuth credentials not set. Google strategy not activated.");
}

// -------------------------------------------------------------
// GitHub OAuth Strategy
// -------------------------------------------------------------
const githubClientId = process.env.GITHUB_CLIENT_ID ? process.env.GITHUB_CLIENT_ID.trim() : null;
const githubClientSecret = process.env.GITHUB_CLIENT_SECRET ? process.env.GITHUB_CLIENT_SECRET.trim() : null;
const githubCallbackUrl = process.env.GITHUB_CALLBACK_URL
    ? process.env.GITHUB_CALLBACK_URL.trim()
    : "/api/auth/github/callback";

if (githubClientId && githubClientSecret) {
    passport.use(
        new GitHubStrategy(
            {
                clientID: githubClientId,
                clientSecret: githubClientSecret,
                callbackURL: githubCallbackUrl,
                scope: ["user:email"]
            },
            async (accessToken, refreshToken, profile, done) => {
                try {
                    let email = null;

                    // 1. Check profile.emails from passport
                    if (Array.isArray(profile.emails) && profile.emails.length > 0) {
                        const verifiedEmailObj = profile.emails.find((e) => e.verified || e.value);
                        if (verifiedEmailObj && verifiedEmailObj.value) {
                            email = verifiedEmailObj.value;
                        }
                    }

                    // 2. If email is private on GitHub, fetch directly from GitHub user emails API
                    if (!email && accessToken) {
                        try {
                            const emailsResponse = await fetch("https://api.github.com/user/emails", {
                                headers: {
                                    Authorization: `Bearer ${accessToken}`,
                                    "User-Agent": "CSI-Society-Smart-Community",
                                    Accept: "application/vnd.github.v3+json"
                                }
                            });

                            if (emailsResponse.ok) {
                                const emailsData = await emailsResponse.json();
                                if (Array.isArray(emailsData) && emailsData.length > 0) {
                                    const primaryVerified = emailsData.find((e) => e.primary && e.verified);
                                    const anyVerified = emailsData.find((e) => e.verified);
                                    const primary = emailsData.find((e) => e.primary);
                                    const selected = primaryVerified || anyVerified || primary || emailsData[0];
                                    if (selected && selected.email) {
                                        email = selected.email;
                                    }
                                }
                            }
                        } catch (err) {
                            console.error("Error fetching private GitHub email:", err.message);
                        }
                    }

                    // 3. Fallback to GitHub username noreply email if no public email exists
                    if (!email && profile.username) {
                        email = `${profile.username}@users.noreply.github.com`;
                    }

                    if (!email) {
                        return done(new Error("Unable to retrieve an email address from GitHub account"), null);
                    }

                    const name = profile.displayName || profile.username || "GitHub User";

                    const user = await handleOAuthUser({
                        provider: "github",
                        providerId: profile.id,
                        email,
                        name
                    });

                    return done(null, user);
                } catch (error) {
                    return done(error, null);
                }
            }
        )
    );
} else {
    console.log("ℹ GitHub OAuth credentials not set. GitHub strategy not activated.");
}

module.exports = {
    passport,
    handleOAuthUser
};

