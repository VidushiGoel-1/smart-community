const message = require('../models/message');

const sendmessage = async (req, res) => {
    try {
        const { sender, content, channel, receiver, replyto } = req.body;

        if (!sender || !content || (!channel && !receiver)) {
            return res.status(400).json({
                message: 'sender, content, and either channel or receiver are required'
            });
        }

        if (channel && receiver) {
            return res.status(400).json({
                message: 'A message cannot have both channel and receiver'
            });
        }

        const newmessage = await message.create({
            sender,
            content,
            channel: channel || null,
            receiver: receiver || null,
            replyto: replyto || null
        });

        return res.status(201).json({
            message: 'Message sent successfully',
            data: newmessage
        });
    } catch (error) {
        return res.status(500).json({
            message: 'Failed to send message',
            error: error.message
        });
    }
};

const getmessages = async (req, res) => {
    try {
        const messages = await message.find().sort({ createdAt: -1 });

        return res.status(200).json({
            count: messages.length,
            data: messages
        });
    } catch (error) {
        return res.status(500).json({
            message: 'Failed to fetch messages',
            error: error.message
        });
    }
};

const editmessage = async (req, res) => {
    try {
        const { content } = req.body;

        if (typeof content !== 'string' || !content.trim()) {
            return res.status(400).json({
                message: 'Message content is required'
            });
        }

        if (content.length > 2000) {
            return res.status(400).json({
                message: 'Message cannot exceed 2000 characters'
            });
        }

        const updatedmessage = await message.findByIdAndUpdate(
            req.params.id,
            {
                content: content.trim(),
                isedited: true
            },
            {
                returnDocument: 'after',
                runValidators: true
            }
        );

        if (!updatedmessage) {
            return res.status(404).json({
                message: 'Message not found'
            });
        }

        return res.status(200).json({
            message: 'Message updated successfully',
            data: updatedmessage
        });
    } catch (error) {
        if (error.name === 'CastError') {
            return res.status(400).json({
                message: 'Invalid message ID'
            });
        }

        return res.status(500).json({
            message: 'Failed to update message',
            error: error.message
        });
    }
};

const deletemessage = async (req, res) => {
    try {
        const deletedmessage = await message.findByIdAndDelete(
            req.params.id
        );

        if (!deletedmessage) {
            return res.status(404).json({
                message: 'Message not found'
            });
        }

        return res.status(200).json({
            message: 'Message deleted successfully',
            data: deletedmessage
        });
    } catch (error) {
        if (error.name === 'CastError') {
            return res.status(400).json({
                message: 'Invalid message ID'
            });
        }

        return res.status(500).json({
            message: 'Failed to delete message',
            error: error.message
        });
    }
};

const addreaction = async (req, res) => {
    try {
        const { user, emoji } = req.body;

        if (!user || !emoji || !emoji.trim()) {
            return res.status(400).json({
                message: 'user and emoji are required'
            });
        }

        const existingmessage = await message.findById(req.params.id);

        if (!existingmessage) {
            return res.status(404).json({
                message: 'Message not found'
            });
        }

        const existingreaction = existingmessage.reactions.find(
            (reaction) => reaction.user.toString() === user
        );

        if (existingreaction) {
            existingreaction.emoji = emoji.trim();
        } else {
            existingmessage.reactions.push({
                user,
                emoji: emoji.trim()
            });
        }

        await existingmessage.save();

        return res.status(200).json({
            message: 'Reaction added successfully',
            data: existingmessage
        });
    } catch (error) {
        if (error.name === 'CastError') {
            return res.status(400).json({
                message: 'Invalid message or user ID'
            });
        }

        return res.status(500).json({
            message: 'Failed to add reaction',
            error: error.message
        });
    }
};

module.exports = {
    sendmessage,
    getmessages,
    editmessage,
    deletemessage,
    addreaction
};
