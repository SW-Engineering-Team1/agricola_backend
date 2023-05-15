const express = require('express');
const router = express.Router();

const roomController = require('../controllers/roomController');

router.post('/create-room', roomController.createRoom);
router.get('/get-rooms', roomController.getRooms);
router.delete('/delete-room', roomController.deleteRoom);
module.exports = router;