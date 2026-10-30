const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            minlength: 2,
            maxlength: 100
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            maxlength: 254
        },

        passwordHash: {
            type: String,
            required: function () {
                return !this.googleId && !this.githubId;
            },
            select: false
        },

        // Smart-Community authorization
        role: {
            type: String,
            enum: ["user", "admin"],
            default: "user"
        },

        // checking Email verification
        isVerified: {
            type: Boolean,
            default: false
        },

        otpHash: {
            type: String,
            select: false
        },

        otpExpiryAt: {
            type: Date,
            select: false
        },

        otpAttempts: {
            type: Number,
            default: 0,
            select: false
        },

        otpResendCount: {
            type: Number,
            default: 0
        },

        refreshTokenHash: {
            type: String,
            select: false
        },

        refreshTokenSessionId: {
            type: String,
            select: false
        },

        passwordResetTokenHash: {
            type: String,
            select: false
        },

        passwordResetExpiresAt: {
            type: Date,
            select: false
        },

        googleId: {
            type: String,
            sparse: true,
            unique: true
        },

        githubId: {
            type: String,
            sparse: true,
            unique: true
        },

        authProvider: {
            type: [String],
            default: ["local"]
        }
    },
    {
        timestamps: true
    }
);

const User = mongoose.model("User", userSchema);

module.exports = User;
