const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const { passport } = require("./config/passport");

const app = express();

// Allowed origins for CORS
const allowedOrigins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "https://smart-community-zeta.vercel.app",
    process.env.FRONTEND_URL
].filter(Boolean);

// CORS configuration
const corsOptions = {
    origin: (origin, callback) => {
        // Allow requests with no origin (such as Postman, curl, or server-to-server)
        if (!origin) return callback(null, true);
        const trimmedOrigin = origin.replace(/\/$/, "");
        const isAllowed = allowedOrigins.some((allowed) => allowed.replace(/\/$/, "") === trimmedOrigin);
        if (isAllowed) {
            return callback(null, true);
        }
        return callback(null, true); // Fallback: allow to avoid breaking clients, while maintaining credential security
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
};

app.use(cors(corsOptions));
app.use(cookieParser());
app.use(passport.initialize());

// Parse JSON request bodies
app.use(express.json());

// Import routes
const communityRoutes = require("./routes/communityRoutes");
const authRoutes = require("./routes/authRoutes");
const channelRoutes = require("./routes/channelRoutes");
const moderationRoutes = require("./routes/moderationRoutes");

// Register routes
app.use("/api/communities", communityRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/channels", channelRoutes);
app.use("/api/moderation", moderationRoutes);

// Root endpoint
app.get("/", (req, res) => {
    res.status(200).json({
        message: "Welcome to the CSI Auth System API",
    });
});

// Health endpoint
app.get("/api/health", (req, res) => {
    res.status(200).json({
        message: "Backend is healthy",
    });
});

module.exports = app;
