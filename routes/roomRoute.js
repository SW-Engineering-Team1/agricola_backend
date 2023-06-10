const express = require('express');
const router = express.Router();

const roomController = require('../controllers/roomController');

router.post('/', roomController.createRoom);
router.post('/join', roomController.joinRoom);
router.post('/exit', roomController.exitRoom);

router.get('/', roomController.getRooms);
router.delete('/:roomId', roomController.deleteRoom);

module.exports = router;
