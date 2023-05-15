const baseResponse = require('../config/baseResponseStatus');
const { response, errResponse } = require('../config/response');
const roomService = require('../services/roomService');

module.exports = {
  createRoom: async function (req, res) {
    try {
      let roomName = req.body.roomName;
      let limitNum = req.body.limitNum;
      let hostId = req.body.hostId;
      let createResult = await roomService.createRoom(roomName, limitNum, hostId);
      res.send(createResult);
    } catch (err) {
      console.log(err);
      res.send(errResponse(baseResponse.SERVER_ERROR));
    }
  },
  getRooms: async function (req, res) {
    try {
      let getRoomsResult = await roomService.getRooms();
      res.send(getRoomsResult);
    } catch (err) {
      console.log(err);
      res.send(errResponse(baseResponse.SERVER_ERROR));
    }
  },
  deleteRoom: async function (req, res) {
    try {
      let roomId = req.body.roomId;
      let deleteRoomResult = await roomService.deleteRoom(roomId);
      res.send(deleteRoomResult);
    } catch (err) {
      console.log(err);
      res.send(errResponse(baseResponse.SERVER_ERROR));
    }
  }
};
