

//const express = require("express");
//const cors = require("cors");
//
//const app = express();
//
//
//
//const allowedOrigins = [
//    "http://localhost:5173",
//    process.env.FRONTEND_URL,
//].filter(Boolean);
//
//// CORS configuration
//app.use(
//    cors({
//        origin: function (origin, callback) {
//            // Allow requests without an Origin header,
//            // such as Postman and server-to-server requests.
//            if (!origin) {
//                return callback(null, true);
//            }
//
//            if (allowedOrigins.includes(origin)) {
//                return callback(null, true);
//            }
//
//            return callback(new Error("Not allowed by CORS"));
//        },
//        methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
//        allowedHeaders: ["Content-Type", "Authorization"],
//    })
//);
//
//
//app.use(express.json());
//
//// Import routes
//const communityRoutes = require("./routes/communityRoutes");
//const authRoutes = require("./routes/authRoutes");
//const channelRoutes = require("./routes/channelRoutes");
//const moderationRoutes = require("./routes/moderationRoutes");
//
//// Register routes
//app.use("/api/communities", communityRoutes);
//app.use("/api/auth", authRoutes);
//app.use("/api/channels", channelRoutes);
//app.use("/api/moderation", moderationRoutes);
//
//// Root endpoint
//app.get("/", (req, res) => {
//    res.status(200).json({
//        message: "Welcome to the CSI Auth System API",
//    });
//});
//
//// Health endpoint
//app.get("/api/health", (req, res) => {
//    console.log("health ROUTE HIT");
//
//    res.status(200).json({
//        message: "Backend is healthy",
//    });
//});
//
//module.exports = app;
//

const express = require("express");
const cors = require("cors");

const app = express();

// CORS configuration
const corsOptions = {
    origin: "https://smart-community-zeta.vercel.app/",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
};

// Apply CORS middleware BEFORE registering routes
app.use(cors(corsOptions));

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
    console.log("health ROUTE HIT");

    res.status(200).json({
        message: "Backend is healthy",
    });
});

module.exports = app;

