const baseResponse = require('../config/baseResponseStatus');
const { response, errResponse } = require('../config/response');
const models = require('../models');
const GameRoom = models.gameroom;
let crypto = require('crypto');

module.exports = {
  createRoom: async (roomName, limitNum, hostId) => {
    try {
      await GameRoom.create({
        room_name: roomName,
        limit_num: limitNum,
        participant_num: 1,
        status: 'NOT_STARTED',
        host_id: hostId,
      });
      return response(baseResponse.SUCCESS);
    } catch (err) {
      // TODO: error handling
      console.log(err);
      return errResponse(baseResponse.DB_ERROR);
    }
  },
};
