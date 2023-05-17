const express = require('express');
const router = express.Router();

const roomController = require('../controllers/roomController');

router.post('/', roomController.createRoom);
router.get('/', roomController.getRooms);
router.delete('/:roomId', roomController.deleteRoom);

module.exports = router;