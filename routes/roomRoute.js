const express = require('express');
const router = express.Router();

const roomController = require('../controllers/roomController');

router.post('/create-room', roomController.createRoom);

module.exports = router;