const express = require('express');
const router = express.Router();

const {
    sendmessage,
    getmessages,
    editmessage,
    deletemessage,
    addreaction
} = require('../controllers/message_controller');

router.post('/', sendmessage);

router.get('/', getmessages);

router.patch('/:id', editmessage);

router.delete('/:id', deletemessage);

router.post('/:id/reactions', addreaction);

module.exports = router;

