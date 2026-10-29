
const mongoose = require('mongoose');

const messageschema = new mongoose.Schema(
    {
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            required: true
        },

        content: {
            type: String,
            required: true,
            trim: true,
            maxlength: 2000
        },

        channel: {
            type: mongoose.Schema.Types.ObjectId,
            default: null
        },

        receiver: {
            type: mongoose.Schema.Types.ObjectId,
            default: null
        },

        replyto: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Message',
            default: null
        },

        reactions: [
            {
                user: {
                    type: mongoose.Schema.Types.ObjectId,
                    required: true
                },

                emoji: {
                    type: String,
                    required: true
                }
            }
        ],

        isedited: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true
    }
);

const message = mongoose.model('Message', messageschema);

module.exports = message;
