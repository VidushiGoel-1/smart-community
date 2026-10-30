
require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const messageroutes = require('./routes/message_routes');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.status(200).json({
        message: 'CSI Messaging Backend is running'
    });
});

app.use('/api/messages', messageroutes);

const port = process.env.PORT || 5000;

const startserver = async () => {
    try {
        if (!process.env.MONGO_URL) {
            throw new Error('MONGO_URL is missing from .env file');
        }

        await mongoose.connect(process.env.MONGO_URL);
        console.log('MongoDB connected successfully');

        app.listen(port, () => {
            console.log(`Server running on port ${port}`);
        });
    } catch (error) {
        console.error('Server startup failed:', error.message);
        process.exit(1);
    }
};

startserver();
